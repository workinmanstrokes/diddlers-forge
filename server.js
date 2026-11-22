#!/usr/bin/env node
// @ts-check
/* App Creator Studio — local server. Zero dependencies: `node server.js` (Node 18+).
 * - Serves the studio to your PC and your phone (same Wi-Fi)
 * - Proxies to Ollama, so Ollama itself can stay on localhost
 * - Multi-file projects with deduplicated version snapshots, dev/staging/prod environments
 * - Each environment is served at /play/<id>/… as its own installable PWA
 * - Terminal (PC only, or with a PIN), library bundling, hardware monitor, logs */
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn, exec } = require('child_process');
const Build = require('./public/shared/build.js');
const Harness = require('./public/shared/harness.js');

const VERSION = '2.0.0';
const argv = process.argv.slice(2);
const arg = (/** @type {string} */ name, /** @type {string} */ def) => { const i = argv.indexOf('--' + name); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def; };
const flag = (/** @type {string} */ name) => argv.includes('--' + name);
const PORT = Number(arg('port', process.env.PORT || '4848'));
const HOST = arg('host', process.env.HOST || '0.0.0.0');
const PIN = arg('pin', process.env.STUDIO_PIN || '');
const PUBLIC = path.join(__dirname, 'public');
const DATA = path.resolve(arg('data', process.env.STUDIO_DATA || path.join(__dirname, 'data')));
const PROJ = path.join(DATA, 'projects');
const TRASH = path.join(DATA, 'trash');
const WORK = path.join(DATA, 'workspace');
const LOGS = path.join(DATA, 'logs');
const PIN_HASH = PIN ? crypto.createHash('sha256').update('acs:' + PIN).digest('hex').slice(0, 32) : '';
const IS_WIN = process.platform === 'win32';

const DEFAULT_SETTINGS = {
  ollamaUrl: arg('ollama', process.env.OLLAMA_URL || 'http://127.0.0.1:11434'),
  codeModel: '', fastModel: '', roles: { architect: '', coder: '', debugger: '', qa: '' },
  numCtx: 16384, temperature: 0.4, maxOutput: 8192, autoFix: 1, mode: 'smart', noThink: true, keepAlive: '15m', planFirst: true,
};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
};
const mimeOf = (/** @type {string} */ p) => /** @type {any} */ (MIME)[path.extname(p).toLowerCase()] || (Build.isText(p) ? 'text/plain; charset=utf-8' : 'application/octet-stream');

// ---------- helpers ----------
/** @param {http.ServerResponse} res @param {number} code @param {any} body @param {Record<string,string>} [headers] */
function send(res, code, body, headers) {
  const isBuf = Buffer.isBuffer(body);
  const data = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, Object.assign({
    'content-type': isBuf ? 'application/octet-stream' : typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
    'cache-control': 'no-store',
  }, headers || {}));
  res.end(data);
}
/** @param {http.IncomingMessage} req @returns {Promise<string>} */
function readBody(req, limit = 40e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('Body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const readJson = async (/** @type {http.IncomingMessage} */ req) => { const t = await readBody(req); return t ? JSON.parse(t) : {}; };
async function readJsonFile(/** @type {string} */ file, /** @type {any} */ def) { try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch (e) { return def; } }
async function writeFileAtomic(/** @type {string} */ file, /** @type {string|Buffer} */ data) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.' + process.pid + '.' + crypto.randomBytes(3).toString('hex') + '.tmp';
  await fsp.writeFile(tmp, data); await fsp.rename(tmp, file);
}
/** @type {Map<string, Promise<any>>} */
const locks = new Map();
function withLock(/** @type {string} */ key, /** @type {() => Promise<any>} */ fn) {
  const prev = locks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn); locks.set(key, next.catch(() => {})); return next;
}
const httpErr = (/** @type {number} */ code, /** @type {string} */ msg) => Object.assign(new Error(msg), { code });
const validId = (/** @type {string} */ id) => /^[a-z0-9-]{4,48}$/.test(id);
const pdir = (/** @type {string} */ id) => path.join(PROJ, id);
const sha1 = (/** @type {Buffer} */ b) => crypto.createHash('sha1').update(b).digest('hex');
const escapeHtml = (/** @type {string} */ s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] || c);
function cleanPath(/** @type {string} */ p) {
  const s = String(p || '').replace(/\\/g, '/').replace(/^\.?\/+/, '').trim();
  if (!s || s.length > 200 || s.split('/').some((x) => x === '..' || x === '' || x === '.') || /[\0<>:"|?*]/.test(s)) throw httpErr(400, 'Bad file path: ' + p);
  return s;
}
const isLocalReq = (/** @type {http.IncomingMessage} */ req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(String(req.socket.remoteAddress));

// ---------- logging ----------
let logBusy = Promise.resolve();
function log(/** @type {string} */ level, /** @type {string} */ msg) {
  const line = new Date().toISOString() + ' ' + level.toUpperCase().padEnd(5) + ' ' + String(msg).replace(/\s+/g, ' ').slice(0, 2000) + '\n';
  if (level === 'error') process.stderr.write(line);
  logBusy = logBusy.then(async () => {
    const f = path.join(LOGS, 'studio.log');
    await fsp.mkdir(LOGS, { recursive: true });
    try { const st = await fsp.stat(f); if (st.size > 1e6) await fsp.rename(f, f + '.1'); } catch (e) { /* new file */ }
    await fsp.appendFile(f, line);
  }).catch(() => {});
}

// ---------- settings ----------
let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
async function loadSettings() {
  const saved = await readJsonFile(path.join(DATA, 'settings.json'), {});
  settings = { ...DEFAULT_SETTINGS, ...saved, roles: { ...DEFAULT_SETTINGS.roles, ...(saved.roles || {}) } };
  if (arg('ollama', '')) settings.ollamaUrl = arg('ollama', settings.ollamaUrl);
}
const saveSettings = () => writeFileAtomic(path.join(DATA, 'settings.json'), JSON.stringify(settings, null, 2));
/** @type {Record<string,string>} */
let KITS = {};
async function loadKits() { const out = {}; for (const f of Build.KIT_FILES) out[f] = await fsp.readFile(path.join(PUBLIC, f), 'utf8'); KITS = out; }

// ---------- storage: blobs + version manifests ----------
/** small in-memory cache (blobs are immutable) */
const blobCache = new Map(); let blobCacheBytes = 0;
async function putBlob(/** @type {string} */ id, /** @type {Buffer} */ buf) {
  const h = sha1(buf); const f = path.join(pdir(id), 'blobs', h);
  try { await fsp.access(f); } catch (e) { await writeFileAtomic(f, buf); }
  return h;
}
async function getBlob(/** @type {string} */ id, /** @type {string} */ h) {
  const key = id + h;
  if (blobCache.has(key)) return blobCache.get(key);
  const b = await fsp.readFile(path.join(pdir(id), 'blobs', h));
  if (b.length < 2e6) { blobCache.set(key, b); blobCacheBytes += b.length; if (blobCacheBytes > 64e6) { blobCache.clear(); blobCacheBytes = 0; } }
  return b;
}
/** @returns {Promise<Record<string,string>|null>} path → blob hash */
async function manifest(/** @type {string} */ id, /** @type {number} */ n) {
  if (!n) return null;
  const j = await readJsonFile(path.join(pdir(id), 'v', n + '.json'), null);
  if (j) return j.files;
  try { // v1 projects stored one HTML file per version
    const legacy = await fsp.readFile(path.join(pdir(id), 'v', n + '.html'));
    return { 'index.html': await putBlob(id, legacy) };
  } catch (e) { return null; }
}
/** @returns {Promise<Map<string,Buffer>|null>} */
async function readFiles(/** @type {string} */ id, /** @type {number} */ n) {
  const m = await manifest(id, n); if (!m) return null;
  const out = new Map();
  for (const [p, h] of Object.entries(m)) out.set(p, await getBlob(id, h));
  return out;
}

async function getProject(/** @type {string} */ id) { return validId(id) ? readJsonFile(path.join(pdir(id), 'project.json'), null) : null; }
const saveProject = (/** @type {any} */ p) => { p.updated = Date.now(); return writeFileAtomic(path.join(pdir(p.id), 'project.json'), JSON.stringify(p)); };

function summary(/** @type {any} */ p) {
  const last = p.versions[p.versions.length - 1];
  return { id: p.id, name: p.name, emoji: p.emoji, color: p.color, type: p.type, orientation: p.orientation, created: p.created, updated: p.updated,
    versions: p.versions.length, envs: p.envs, hasIcon: !!p.hasIcon, tests: last && last.tests ? last.tests.summary : null, usage: p.usage };
}
function newProject(/** @type {any} */ b) {
  return {
    id: crypto.randomBytes(5).toString('hex').slice(0, 8), name: String(b.name || 'Untitled').slice(0, 60), emoji: b.emoji || (b.type === 'app' ? '✨' : '🎮'),
    color: b.color || '#7c5cff', type: b.type === 'app' ? 'app' : 'game', orientation: b.orientation || 'portrait', idea: String(b.idea || '').slice(0, 3000),
    created: Date.now(), updated: Date.now(), versions: [], envs: { dev: 0, staging: 0, prod: 0 }, envLog: [], chat: [], usage: { in: 0, out: 0, calls: 0, ms: 0 }, hasIcon: false,
  };
}

/** Create a version from a base snapshot plus changes. files: {path: text | {b64}}; deleted: [paths]. */
async function addVersion(/** @type {string} */ id, /** @type {any} */ body) {
  return withLock(id, async () => {
    const p = await getProject(id);
    if (!p) throw httpErr(404, 'Project not found');
    const baseN = body.replace ? 0 : Number(body.base || p.envs.dev || 0);
    const files = { ...((baseN && (await manifest(id, baseN))) || {}) };
    const incoming = { ...(body.files || {}) };
    if (typeof body.source === 'string') incoming['index.html'] = body.source;
    const changed = [];
    for (const [rawP, val] of Object.entries(incoming)) {
      const fp = cleanPath(rawP);
      const buf = typeof val === 'string' ? Buffer.from(val, 'utf8') : val && typeof val.b64 === 'string' ? Buffer.from(val.b64, 'base64') : null;
      if (!buf) continue;
      if (buf.length > 25e6) throw httpErr(413, fp + ' is larger than 25 MB');
      const h = await putBlob(id, buf);
      if (files[fp] !== h) changed.push(fp);
      files[fp] = h;
    }
    for (const d of body.deleted || []) { const fp = cleanPath(d); if (files[fp]) { delete files[fp]; changed.push('-' + fp); } }
    if (!Object.keys(files).length) throw httpErr(400, 'A version needs at least one file');
    if (baseN && !changed.length && !body.allowSame) throw httpErr(409, 'No changes to save');
    const n = (p.versions.length ? p.versions[p.versions.length - 1].n : 0) + 1;
    await writeFileAtomic(path.join(pdir(id), 'v', n + '.json'), JSON.stringify({ files }));
    if (files['index.html']) {
      const meta = Build.parseMeta((await getBlob(id, files['index.html'])).toString('utf8'));
      if (meta.name) p.name = String(meta.name).slice(0, 60);
      if (meta.emoji) p.emoji = String(meta.emoji).slice(0, 8);
      if (meta.color && /^#[0-9a-f]{3,8}$/i.test(meta.color)) p.color = meta.color;
      if (meta.orientation === 'landscape' || meta.orientation === 'portrait') p.orientation = meta.orientation;
    }
    let bytes = 0; for (const h of Object.values(files)) { try { bytes += (await fsp.stat(path.join(pdir(id), 'blobs', h))).size; } catch (e) { /* */ } }
    const v = { n, ts: Date.now(), message: String(body.message || 'Update').slice(0, 200), kind: body.kind || 'manual', model: body.model || '',
      tokens: body.tokens || null, tests: body.tests || null, bytes, files: Object.keys(files).length, changed: changed.slice(0, 30) };
    p.versions.push(v); p.envs.dev = n; p.envLog.push({ env: 'dev', n, ts: v.ts });
    if (p.envLog.length > 300) p.envLog = p.envLog.slice(-300);
    await saveProject(p);
    return { version: v, project: p };
  });
}

// ---------- usage + speed stats ----------
async function addUsage(/** @type {any} */ u) {
  return withLock('__usage', async () => {
    const file = path.join(DATA, 'usage.json');
    const all = await readJsonFile(file, { in: 0, out: 0, calls: 0, ms: 0, byModel: {}, byDay: {} });
    const add = (/** @type {any} */ t) => { t.in += u.in || 0; t.out += u.out || 0; t.calls += 1; t.ms += u.ms || 0; t.evalMs = (t.evalMs || 0) + (u.evalMs || 0); t.promptMs = (t.promptMs || 0) + (u.promptMs || 0); };
    add(all);
    const key = u.model || '?';
    add((all.byModel[key] = all.byModel[key] || { in: 0, out: 0, calls: 0, ms: 0 }));
    const day = new Date().toISOString().slice(0, 10);
    add((all.byDay[day] = all.byDay[day] || { in: 0, out: 0, calls: 0, ms: 0 }));
    const days = Object.keys(all.byDay).sort(); while (days.length > 60) delete all.byDay[days.shift() || ''];
    await writeFileAtomic(file, JSON.stringify(all));
    if (u.projectId && validId(u.projectId)) await withLock(u.projectId, async () => { const p = await getProject(u.projectId); if (p) { add(p.usage); await saveProject(p); } });
    return all;
  });
}

// ---------- Ollama proxy ----------
const OLLAMA_PATHS = new Set(['/api/chat', '/api/generate', '/api/tags', '/api/ps', '/api/pull', '/api/version', '/api/show']);
/** @param {http.IncomingMessage} req @param {http.ServerResponse} res @param {string} sub */
function proxyOllama(req, res, sub) {
  const u = new URL(req.url || '/', 'http://x');
  if (!OLLAMA_PATHS.has(sub)) return send(res, 404, { error: 'Not an allowed Ollama endpoint' });
  let target; try { target = new URL(sub + u.search, settings.ollamaUrl); } catch (e) { return send(res, 400, { error: 'Bad Ollama URL in settings' }); }
  const mod = target.protocol === 'https:' ? https : http;
  const preq = mod.request(target, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json', accept: '*/*' } }, (pres) => {
    res.writeHead(pres.statusCode || 502, { 'content-type': pres.headers['content-type'] || 'application/json', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
    pres.pipe(res);
  });
  preq.setTimeout(0);
  preq.on('error', (e) => { if (!res.headersSent) send(res, 502, { error: 'Ollama not reachable at ' + settings.ollamaUrl + ' (' + e.message + '). Is Ollama running?' }); else res.end(); });
  res.on('close', () => { if (!res.writableFinished) preq.destroy(); }); // Stop button → Ollama stops generating
  req.pipe(preq);
}
function ollamaGet(/** @type {string} */ p, /** @type {number} */ timeout = 2000) {
  return new Promise((resolve) => {
    let target; try { target = new URL(p, settings.ollamaUrl); } catch (e) { return resolve({ ok: false, error: 'Bad URL' }); }
    const r = (target.protocol === 'https:' ? https : http).get(target, { timeout }, (res) => {
      let t = ''; res.on('data', (c) => (t += c));
      res.on('end', () => { try { resolve({ ok: res.statusCode === 200, data: JSON.parse(t) }); } catch (e) { resolve({ ok: res.statusCode === 200 }); } });
    });
    r.on('timeout', () => { r.destroy(); resolve({ ok: false, error: 'Timed out' }); });
    r.on('error', (e) => resolve({ ok: false, error: e.message }));
  });
}
async function ollamaPing() { const r = /** @type {any} */ (await ollamaGet('/api/version')); return r.ok ? { ok: true, version: r.data && r.data.version } : { ok: false, error: r.error || 'Not reachable' }; }
function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const ni of list || []) if (ni.family === 'IPv4' && !ni.internal) out.push('http://' + ni.address + ':' + PORT);
  return out;
}

// ---------- hardware monitor ----------
let lastCpu = os.cpus().map((c) => c.times);
let dataSize = { bytes: 0, at: 0 };
async function dirSize(/** @type {string} */ dir, depth = 0) {
  let total = 0; if (depth > 8) return 0;
  let ents = []; try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch (e) { return 0; }
  for (const e of ents) { const f = path.join(dir, e.name); if (e.isDirectory()) total += await dirSize(f, depth + 1); else { try { total += (await fsp.stat(f)).size; } catch (er) { /* */ } } }
  return total;
}
async function systemInfo() {
  const now = os.cpus(); let idle = 0, tot = 0;
  now.forEach((c, i) => { const a = lastCpu[i] || c.times; const t = c.times; const d = (k) => /** @type {any} */ (t)[k] - /** @type {any} */ (a)[k];
    const sum = d('user') + d('nice') + d('sys') + d('idle') + d('irq'); tot += sum; idle += d('idle'); });
  lastCpu = now.map((c) => c.times);
  if (Date.now() - dataSize.at > 30000) dataSize = { bytes: await dirSize(DATA), at: Date.now() };
  const ps = /** @type {any} */ (await ollamaGet('/api/ps', 1500));
  return {
    cpu: { pct: tot ? Math.round((1 - idle / tot) * 100) : 0, model: (now[0] && now[0].model || '').trim(), cores: now.length },
    mem: { total: os.totalmem(), free: os.freemem() }, proc: { rss: process.memoryUsage().rss, uptime: process.uptime() },
    os: { platform: process.platform, release: os.release(), arch: process.arch, node: process.version }, data: { bytes: dataSize.bytes, dir: DATA },
    ollama: { ok: ps.ok, models: ps.ok && ps.data ? (ps.data.models || []).map((/** @type {any} */ m) => ({ name: m.name, size: m.size, vram: m.size_vram, expires: m.expires_at, ctx: m.context_length })) : [] },
  };
}

// ---------- /play: real files, kits, per-environment PWA ----------
function iconSvg(/** @type {any} */ p) {
  const c = p.color || '#7c5cff';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c +
    '"/><stop offset="1" stop-color="#0b0f1a"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><text x="256" y="330" font-size="260" text-anchor="middle">' + (p.emoji || '🎮') + '</text></svg>';
}
const playBase = (/** @type {string} */ id, /** @type {string} */ tag) => (tag === 'prod' ? '/play/' + id + '/' : '/play/' + id + '/' + tag + '/');
function manifestFor(/** @type {any} */ p, /** @type {string} */ tag) {
  const base = playBase(p.id, tag);
  const label = tag === 'prod' ? '' : ' (' + tag + ')';
  const icons = p.hasIcon ? [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
    : [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }];
  return { id: base, name: p.name + label, short_name: (p.name || 'App').slice(0, 12) + (tag === 'prod' ? '' : '·' + tag[0]), start_url: base, scope: base, display: 'fullscreen',
    orientation: p.orientation === 'landscape' ? 'landscape' : 'portrait', background_color: '#0b0f1a', theme_color: p.color || '#0b0f1a', icons };
}
function playSw(/** @type {string} */ prefix, /** @type {number} */ n) {
  const C = prefix + n; // network-first: new versions arrive when online, cached copy works offline
  return '// ' + C + '\nconst P=' + JSON.stringify(prefix) + ',C=' + JSON.stringify(C) + ';\n' +
    'self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(["./","manifest.webmanifest"]).catch(()=>{})))});\n' +
    'self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith(P)&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));\n' +
    'self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).search.includes("acs="))return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./"))))});\n';
}
const pwaHead = (/** @type {any} */ p) => '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="' + (p.color || '#0b0f1a') + '"><meta name="mobile-web-app-capable" content="yes">' +
  '<link rel="apple-touch-icon" href="' + (p.hasIcon ? 'icon-192.png' : 'icon.svg') + '"><link rel="icon" href="' + (p.hasIcon ? 'icon-192.png' : 'icon.svg') + '">';
const SW_REG = '<script>if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))</script>';

/** unsaved editor content ("Run" without saving) */
const drafts = new Map();
function pruneDrafts() { const cut = Date.now() - 3600e3; for (const [k, d] of drafts) if (d.ts < cut) drafts.delete(k); while (drafts.size > 30) drafts.delete(drafts.keys().next().value); }

/** @param {http.ServerResponse} res @param {URL} u @param {string} id @param {string} tag @param {string} file */
async function servePlay(res, u, id, tag, file) {
  const p = await getProject(id);
  if (!p) return send(res, 404, 'Not found');
  /** @type {(fp:string)=>Promise<Buffer|null>} */ let get; let n = 0;
  if (tag.startsWith('d-')) {
    const d = drafts.get(tag.slice(2)); if (!d || d.id !== id) return send(res, 404, 'Draft expired — press Run again');
    get = async (fp) => d.files.get(fp) || null;
  } else {
    if (['prod', 'staging', 'dev'].includes(tag)) n = p.envs[tag] || 0; else if (/^v\d+$/.test(tag)) n = Number(tag.slice(1)); else return send(res, 404, 'Not found');
    const m = n ? await manifest(id, n) : null;
    get = async (fp) => (m && m[fp] ? getBlob(id, m[fp]) : null);
  }
  const H = { 'access-control-allow-origin': '*', 'cache-control': 'no-cache' };
  let fp = file === '' ? 'index.html' : file.endsWith('/') ? file + 'index.html' : file;
  try { fp = cleanPath(fp); } catch (e) { return send(res, 400, 'Bad path', H); }
  let buf = await get(fp);
  if (!buf && fp.startsWith('kit/') && KITS[fp]) return send(res, 200, KITS[fp], { ...H, 'content-type': mimeOf(fp) });
  if (!buf) {
    if (fp === 'manifest.webmanifest') return send(res, 200, JSON.stringify(manifestFor(p, tag)), { ...H, 'content-type': MIME['.webmanifest'] });
    if (fp === 'sw.js') return send(res, 200, playSw('acs-play-' + p.id + '-' + tag + '-', n), { ...H, 'content-type': MIME['.js'] });
    if (fp === 'icon.svg') return send(res, 200, iconSvg(p), { ...H, 'content-type': MIME['.svg'] });
    if (fp === 'icon-192.png' || fp === 'icon-512.png') { try { return send(res, 200, await fsp.readFile(path.join(pdir(id), fp)), { ...H, 'content-type': 'image/png' }); } catch (e) { return send(res, 200, iconSvg(p), { ...H, 'content-type': MIME['.svg'] }); } }
    if (fp === 'index.html' && !tag.startsWith('d-') && !n) return send(res, 200, notReleasedPage(p, tag), { ...H, 'content-type': MIME['.html'] });
    return send(res, 404, 'Not found: ' + fp, H);
  }
  if (/\.html?$/i.test(fp)) {
    const mode = u.searchParams.get('acs'); const rid = Number(u.searchParams.get('rid') || 0);
    let head = '', headEnd = '', bodyEnd = '';
    if (mode === 'test') head = '<script>' + Harness.testScript(rid, String(u.searchParams.get('type') || '')) + '</script>';
    else if (mode === 'preview') head = '<script>' + Harness.previewScript(rid, await readJsonFile(path.join(pdir(id), 'pvls.json'), {})) + '</script>';
    else if (['prod', 'staging', 'dev'].includes(tag)) { headEnd = pwaHead(p); bodyEnd = SW_REG; }
    return send(res, 200, Build.prepare(buf.toString('utf8'), { head, headEnd, bodyEnd }), { ...H, 'content-type': MIME['.html'] });
  }
  return send(res, 200, buf, { ...H, 'content-type': mimeOf(fp) });
}
function notReleasedPage(/** @type {any} */ p, /** @type {string} */ env) {
  return '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(p.name) + '</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f1a;color:#eef2ff;font:16px system-ui;text-align:center">' +
    '<div><div style="font-size:64px">' + escapeHtml(p.emoji || '🎮') + '</div><h2>' + escapeHtml(p.name) + '</h2><p style="color:#8b93a7">Nothing promoted to <b>' + env + '</b> yet.<br>Open the studio → Ship → Promote.</p>' +
    '<p><a style="color:#a78bfa" href="/play/' + p.id + '/dev/">Open dev build</a></p></div></body>';
}

// ---------- zip (store method) ----------
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(/** @type {Buffer} */ b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function zip(/** @type {{name:string,data:Buffer}[]} */ files) {
  const parts = []; const central = []; let offset = 0; const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8'), crc = crc32(f.data), size = f.data.length;
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(size, 18); lh.writeUInt32LE(size, 22); lh.writeUInt16LE(name.length, 26);
    parts.push(lh, name, f.data);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(size, 20); ch.writeUInt32LE(size, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(offset, 42);
    central.push(ch, name); offset += 30 + name.length + size;
  }
  const cd = Buffer.concat(central); const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}
async function exportProject(/** @type {http.ServerResponse} */ res, /** @type {any} */ p, /** @type {string} */ env, /** @type {string} */ format) {
  const n = /^\d+$/.test(env) ? Number(env) : p.envs[env] || p.envs.dev;
  const files = n ? await readFiles(p.id, n) : null;
  if (!files || !files.get('index.html')) return send(res, 404, { error: 'Nothing to export for ' + env });
  const name = Build.slug(p.name); const index = files.get('index.html').toString('utf8');
  if (format === 'html') {
    const texts = {}; for (const [k, v] of files) if (Build.isText(k)) /** @type {any} */ (texts)[k] = v.toString('utf8');
    return send(res, 200, Build.build(index, KITS, { files: texts }), { 'content-type': MIME['.html'], 'content-disposition': 'attachment; filename="' + name + '.html"' });
  }
  const out = [];
  for (const [k, v] of files) out.push({ name: k, data: k === 'index.html' ? Buffer.from(Build.prepare(index, { headEnd: pwaHead(p), bodyEnd: SW_REG })) : v });
  const all = [...files.entries()].filter(([k]) => /\.html?$/i.test(k)).map(([, v]) => v.toString('utf8')).join('\n') + Build.prepare(index, {});
  for (const k of Build.KIT_FILES) if (!files.has(k) && all.includes(k)) out.push({ name: k, data: Buffer.from(KITS[k]) });
  const man = manifestFor(p, 'prod'); man.id = './'; man.start_url = './'; man.scope = './';
  if (!files.has('manifest.webmanifest')) out.push({ name: 'manifest.webmanifest', data: Buffer.from(JSON.stringify(man, null, 2)) });
  if (!files.has('sw.js')) out.push({ name: 'sw.js', data: Buffer.from(playSw('acs-play-' + p.id + '-export-', n)) });
  out.push({ name: 'icon.svg', data: Buffer.from(iconSvg(p)) });
  for (const ic of ['icon-192.png', 'icon-512.png']) { try { out.push({ name: ic, data: await fsp.readFile(path.join(pdir(p.id), ic)) }); } catch (e) { /* svg fallback */ } }
  if (!files.has('README.md')) out.push({ name: 'README.md', data: Buffer.from('# ' + p.name + '\n\nMade with App Creator Studio (v' + n + ').\n\n## Put it online (GitHub Pages)\n' +
    '1. Create a repo on github.com and upload these files (or `git init && git add . && git commit -m "v' + n + '" && git push`).\n2. Settings → Pages → Deploy from branch → main / root.\n3. Open the Pages URL in Chrome on your phone → ⋮ → Install app.\n') });
  return send(res, 200, zip(out), { 'content-type': 'application/zip', 'content-disposition': 'attachment; filename="' + name + '-v' + n + '.zip"' });
}

// ---------- terminal (runs on THIS computer — PC only, or phone with a PIN) ----------
const IGNORE_DIRS = new Set(['node_modules', '.git', '.acs', '.cache', '__pycache__']);
const terms = new Map(); // id → child
const termCwd = new Map();
function terminalAllowed(/** @type {http.IncomingMessage} */ req) { return isLocalReq(req) || (!!PIN && authed(req)); }
const wsDir = (/** @type {string} */ id) => path.join(WORK, id);
async function scanWorkspace(/** @type {string} */ id) {
  const root = wsDir(id); const out = new Map(); let count = 0;
  async function walk(/** @type {string} */ dir, /** @type {string} */ rel, /** @type {number} */ depth) {
    if (depth > 6 || count > 3000) return;
    let ents = []; try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of ents) {
      if (IGNORE_DIRS.has(e.name)) continue;
      const r = rel ? rel + '/' + e.name : e.name; const f = path.join(dir, e.name);
      if (e.isDirectory()) await walk(f, r, depth + 1);
      else if (e.isFile()) { const st = await fsp.stat(f); if (st.size <= 5e6) { out.set(r, sha1(await fsp.readFile(f))); count++; } }
    }
  }
  await walk(root, '', 0);
  return out;
}
/** Write the dev version into the workspace without clobbering files the terminal changed. */
async function syncWorkspace(/** @type {any} */ p) {
  const root = wsDir(p.id); await fsp.mkdir(root, { recursive: true });
  const syncFile = path.join(root, '.acs', 'sync.json');
  const synced = await readJsonFile(syncFile, {});
  const m = (await manifest(p.id, p.envs.dev)) || {};
  const now = await scanWorkspace(p.id);
  for (const [fp, h] of Object.entries(m)) {
    const cur = now.get(fp);
    if (cur === h) { synced[fp] = h; continue; }
    if (cur && synced[fp] && cur !== synced[fp]) continue; // changed in terminal and not imported yet: keep it
    await writeFileAtomic(path.join(root, ...fp.split('/')), await getBlob(p.id, h)); synced[fp] = h;
  }
  await writeFileAtomic(syncFile, JSON.stringify(synced));
  return { root, synced, devManifest: m };
}
async function workspaceChanges(/** @type {any} */ p) {
  const root = wsDir(p.id); const synced = await readJsonFile(path.join(root, '.acs', 'sync.json'), {});
  const m = (await manifest(p.id, p.envs.dev)) || {};
  const now = await scanWorkspace(p.id); const changes = [];
  for (const [fp, h] of now) if (h !== m[fp] && h !== synced[fp]) changes.push(fp);
  for (const fp of Object.keys(m)) if (!now.has(fp) && synced[fp]) changes.push('-' + fp);
  return changes.slice(0, 200);
}
function killTree(/** @type {any} */ child) {
  if (!child || child.exitCode != null) return;
  if (IS_WIN) exec('taskkill /pid ' + child.pid + ' /T /F', () => {}); else { try { process.kill(-child.pid, 'SIGTERM'); } catch (e) { child.kill('SIGTERM'); } }
}
/** @param {http.IncomingMessage} req @param {http.ServerResponse} res @param {any} p */
async function runTerminal(req, res, p) {
  const b = await readJson(req); const cmd = String(b.cmd || '').trim();
  if (!cmd) return send(res, 400, { error: 'Empty command' });
  if (terms.has(p.id)) return send(res, 409, { error: 'A command is still running — stop it first' });
  const { root } = await syncWorkspace(p);
  let cwd = termCwd.get(p.id) || root;
  const cdm = cmd.match(/^cd\s*(.*)$/i);
  res.writeHead(200, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
  const w = (/** @type {any} */ o) => { if (!res.writableEnded) res.write(JSON.stringify(o) + '\n'); };
  if (cdm && !/[&|;]/.test(cmd)) {
    const target = cdm[1].trim().replace(/^["']|["']$/g, '');
    const next = !target || target === '~' ? root : path.resolve(cwd, target);
    if (!next.startsWith(root)) { w({ e: 'Stays inside the project workspace.\n' }); }
    else { try { if ((await fsp.stat(next)).isDirectory()) { cwd = next; termCwd.set(p.id, cwd); } else w({ e: 'Not a folder\n' }); } catch (e) { w({ e: 'No such folder: ' + target + '\n' }); } }
    w({ exit: 0, cwd: path.relative(root, cwd) || '.', changes: [] }); return res.end();
  }
  log('info', 'terminal [' + p.id + '] ' + (path.relative(root, cwd) || '.') + ' > ' + cmd);
  const child = spawn(cmd, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '0', CI: '1' }, windowsHide: true, detached: !IS_WIN });
  terms.set(p.id, child);
  let bytes = 0; const cap = 2e6;
  const out = (/** @type {string} */ k) => (/** @type {Buffer} */ d) => { bytes += d.length; if (bytes < cap) w({ [k]: d.toString('utf8').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '') }); else if (bytes - d.length < cap) w({ e: '\n…output truncated…\n' }); };
  child.stdout.on('data', out('o')); child.stderr.on('data', out('e'));
  child.on('error', (e) => w({ e: e.message + '\n' }));
  child.on('close', async (code) => {
    terms.delete(p.id);
    let changes = []; try { changes = await workspaceChanges(p); } catch (e) { /* */ }
    w({ exit: code == null ? -1 : code, cwd: path.relative(root, cwd) || '.', changes }); res.end();
  });
  res.on('close', () => { if (!res.writableFinished) killTree(child); });
}
async function importWorkspace(/** @type {string} */ id, /** @type {string[]|undefined} */ only) {
  const p = await getProject(id); const changes = await workspaceChanges(p);
  const pick = changes.filter((c) => !only || only.includes(c) || only.includes(c.replace(/^-/, '')));
  if (!pick.length) throw httpErr(409, 'No workspace changes to import');
  const files = {}; const deleted = [];
  for (const c of pick) {
    if (c.startsWith('-')) { deleted.push(c.slice(1)); continue; }
    const buf = await fsp.readFile(path.join(wsDir(id), ...c.split('/')));
    /** @type {any} */ (files)[c] = Build.isText(c) ? buf.toString('utf8') : { b64: buf.toString('base64') };
  }
  const r = await addVersion(id, { files, deleted, message: 'From terminal: ' + pick.slice(0, 4).join(', ') + (pick.length > 4 ? '…' : ''), kind: 'terminal' });
  await syncWorkspace(r.project);
  return r;
}
function openFolder(/** @type {string} */ dir) {
  const cmd = IS_WIN ? 'explorer "' + dir + '"' : process.platform === 'darwin' ? 'open "' + dir + '"' : 'xdg-open "' + dir + '"';
  exec(cmd, () => {});
}

// ---------- libraries: download approved files into vendor/ for offline use ----------
async function download(/** @type {string} */ url) {
  if (!/^https?:\/\//i.test(url)) throw new Error('Only http(s) URLs');
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'AppCreatorStudio/' + VERSION } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const len = Number(r.headers.get('content-length') || 0); if (len > 15e6) throw new Error('File is over 15 MB');
  const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 15e6) throw new Error('File is over 15 MB');
  return buf;
}
async function bundleLibs(/** @type {string} */ id, /** @type {string[]} */ urls, /** @type {boolean} */ addTags) {
  const p = await getProject(id); const files = (await readFiles(id, p.envs.dev)) || new Map();
  const results = []; const changed = {}; const texts = new Map();
  for (const [k, v] of files) if (Build.isText(k)) texts.set(k, v.toString('utf8'));
  for (const url of urls.slice(0, 20)) {
    try {
      const buf = await download(url);
      let base = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || 'lib.js').replace(/[^\w.@-]+/g, '-');
      if (!/\.[a-z0-9]+$/i.test(base)) base += /css/.test(url) ? '.css' : '.js';
      let target = 'vendor/' + base, i = 2; while (files.has(target) && files.get(target).compare(buf) !== 0) target = 'vendor/' + base.replace(/(\.[a-z0-9]+)$/i, '-' + i++ + '$1');
      /** @type {any} */ (changed)[target] = Build.isText(target) ? buf.toString('utf8') : { b64: buf.toString('base64') };
      let used = false;
      for (const [k, t] of texts) {
        if (!t.includes(url)) continue; used = true;
        const rel = path.posix.relative(path.posix.dirname(k), target) || target;
        const nt = t.split(url).join(rel); texts.set(k, nt); /** @type {any} */ (changed)[k] = nt;
      }
      if (!used && addTags && texts.has('index.html') && /\.(m?js|css)$/i.test(target)) {
        const tag = /\.css$/i.test(target) ? '<link rel="stylesheet" href="' + target + '">' : '<script src="' + target + '"></script>';
        const nt = Build.injectHeadEnd(/** @type {string} */ (texts.get('index.html')), tag); texts.set('index.html', nt); /** @type {any} */ (changed)['index.html'] = nt;
      }
      results.push({ url, ok: true, path: target, bytes: buf.length });
      log('info', 'library [' + id + '] ' + url + ' → ' + target + ' (' + buf.length + ' bytes)');
    } catch (e) { results.push({ url, ok: false, error: /** @type {any} */ (e).message }); log('warn', 'library failed [' + id + '] ' + url + ': ' + /** @type {any} */ (e).message); }
  }
  const okN = results.filter((r) => r.ok).length;
  if (!okN) return { results };
  const r = await addVersion(id, { files: changed, message: 'Bundled ' + okN + ' librar' + (okN > 1 ? 'ies' : 'y') + ' for offline use', kind: 'libs' });
  return { results, ...r };
}

// ---------- auth ----------
function authed(/** @type {http.IncomingMessage} */ req) {
  if (!PIN) return true;
  const c = String(req.headers.cookie || '').match(/(?:^|;\s*)acs_pin=([a-f0-9]+)/);
  return !!c && c[1] === PIN_HASH;
}

// ---------- router ----------
/** @param {http.IncomingMessage} req @param {http.ServerResponse} res */
async function handle(req, res) {
  const u = new URL(req.url || '/', 'http://localhost');
  let p; try { p = decodeURIComponent(u.pathname); } catch (e) { return send(res, 400, 'Bad URL'); }
  const m = req.method || 'GET';

  if (p.startsWith('/play/')) {
    if (m === 'OPTIONS') return send(res, 204, '', { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' });
    const mm = p.match(/^\/play\/([a-z0-9-]+)\/(?:(dev|staging|v\d+|d-[a-f0-9]+)\/)?(.*)$/);
    if (!mm) { const bare = p.match(/^\/play\/([a-z0-9-]+)$/); return bare ? send(res, 301, '', { location: '/play/' + bare[1] + '/' }) : send(res, 404, 'Not found'); }
    return servePlay(res, u, mm[1], mm[2] || 'prod', mm[3]);
  }

  if (p.startsWith('/api/')) {
    if (p === '/api/health') {
      return send(res, 200, { ok: true, version: VERSION, needsPin: !!PIN, authed: authed(req), local: isLocalReq(req), terminal: terminalAllowed(req), lan: lanUrls(), port: PORT,
        ram: os.totalmem(), ollama: { url: settings.ollamaUrl, ...(await ollamaPing()) } });
    }
    if (p === '/api/login' && m === 'POST') {
      const b = await readJson(req);
      if (!PIN || String(b.pin) === PIN) return send(res, 200, { ok: true }, { 'set-cookie': 'acs_pin=' + PIN_HASH + '; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly' });
      log('warn', 'wrong PIN from ' + req.socket.remoteAddress); return send(res, 401, { error: 'Wrong PIN' });
    }
    if (!authed(req)) return send(res, 401, { error: 'PIN required' });
    if (p.startsWith('/api/ollama/')) return proxyOllama(req, res, p.slice('/api/ollama'.length));

    if (p === '/api/settings') {
      if (m === 'GET') return send(res, 200, settings);
      const b = await readJson(req);
      for (const k of Object.keys(DEFAULT_SETTINGS)) if (k in b) /** @type {any} */ (settings)[k] = b[k];
      settings.roles = { ...DEFAULT_SETTINGS.roles, ...(settings.roles || {}) };
      settings.numCtx = Math.max(2048, Math.min(262144, Number(settings.numCtx) || 16384));
      settings.maxOutput = Math.max(1024, Math.min(32768, Number(settings.maxOutput) || 8192));
      settings.autoFix = Math.max(0, Math.min(5, Number(settings.autoFix) || 0));
      await saveSettings(); return send(res, 200, settings);
    }
    if (p === '/api/usage') {
      if (m === 'GET') return send(res, 200, await readJsonFile(path.join(DATA, 'usage.json'), { in: 0, out: 0, calls: 0, ms: 0, byModel: {}, byDay: {} }));
      if (m === 'POST') return send(res, 200, await addUsage(await readJson(req)));
    }
    if (p === '/api/system') return send(res, 200, await systemInfo());
    if (p === '/api/kits') return send(res, 200, KITS);
    if (p === '/api/log' && m === 'POST') { const b = await readJson(req); log(b.level === 'error' ? 'error' : 'warn', 'client: ' + String(b.msg || '').slice(0, 800)); return send(res, 200, { ok: true }); }
    if (p === '/api/logs') {
      let t = ''; try { t = await fsp.readFile(path.join(LOGS, 'studio.log'), 'utf8'); } catch (e) { /* none yet */ }
      return send(res, 200, t.split('\n').slice(-Number(u.searchParams.get('tail') || 200)).join('\n'));
    }
    if (p === '/api/shutdown' && m === 'POST') {
      if (!isLocalReq(req)) return send(res, 403, { error: 'Only from the PC itself' });
      log('info', 'shutdown requested'); send(res, 200, { ok: true }); setTimeout(() => process.exit(0), 300); return;
    }

    if (p === '/api/projects') {
      if (m === 'GET') {
        await fsp.mkdir(PROJ, { recursive: true });
        const list = (await Promise.all((await fsp.readdir(PROJ)).map(getProject))).filter(Boolean).map(summary).sort((a, b) => b.updated - a.updated);
        return send(res, 200, list);
      }
      if (m === 'POST') {
        const b = await readJson(req); const proj = newProject(b); await saveProject(proj);
        log('info', 'project created ' + proj.id + ' "' + proj.name + '"');
        if (b.source || b.files) { const r = await addVersion(proj.id, { source: b.source, files: b.files, message: b.message || 'Imported', kind: 'import' }); return send(res, 200, r.project); }
        return send(res, 200, proj);
      }
    }

    const pm = p.match(/^\/api\/projects\/([a-z0-9-]+)(?:\/(.*))?$/);
    if (pm) {
      const id = pm[1]; const rest = pm[2] || '';
      if (!validId(id)) return send(res, 400, { error: 'Bad id' });
      const proj = await getProject(id);
      if (!proj) return send(res, 404, { error: 'Project not found' });

      if (rest === '') {
        if (m === 'GET') return send(res, 200, proj);
        if (m === 'PUT' || m === 'PATCH') {
          const b = await readJson(req);
          const out = await withLock(id, async () => {
            const cur = await getProject(id);
            for (const k of ['name', 'emoji', 'color', 'type', 'orientation', 'idea', 'chat']) if (k in b) cur[k] = b[k];
            if (Array.isArray(cur.chat) && cur.chat.length > 300) cur.chat = cur.chat.slice(-300);
            await saveProject(cur); return cur;
          });
          return send(res, 200, out);
        }
        if (m === 'DELETE') {
          await fsp.mkdir(TRASH, { recursive: true });
          await fsp.rename(pdir(id), path.join(TRASH, id + '-' + Date.now()));
          log('info', 'project trashed ' + id); return send(res, 200, { ok: true, trashed: true });
        }
      }
      if (rest === 'versions' && m === 'POST') return send(res, 200, await addVersion(id, await readJson(req)));
      const vm = rest.match(/^versions\/(\d+)(\/tests|\/file)?$/);
      if (vm) {
        const n = Number(vm[1]);
        if (!vm[2] && m === 'GET') {
          const files = await readFiles(id, n); if (!files) return send(res, 404, { error: 'No such version' });
          const text = {}, binary = {};
          for (const [k, v] of files) { if (Build.isText(k) && v.length < 1.5e6) /** @type {any} */ (text)[k] = v.toString('utf8'); else /** @type {any} */ (binary)[k] = v.length; }
          return send(res, 200, { n, files: text, binary });
        }
        if (vm[2] === '/file' && m === 'GET') {
          const files = await readFiles(id, n); const fp = cleanPath(u.searchParams.get('path') || '');
          const b = files && files.get(fp); if (!b) return send(res, 404, { error: 'No such file' });
          return send(res, 200, b, { 'content-type': mimeOf(fp), 'content-disposition': (u.searchParams.get('dl') ? 'attachment' : 'inline') + '; filename="' + path.posix.basename(fp) + '"' });
        }
        if (vm[2] === '/tests' && m === 'POST') {
          const b = await readJson(req);
          return send(res, 200, await withLock(id, async () => { const cur = await getProject(id); const v = cur.versions.find((/** @type {any} */ x) => x.n === n); if (v) { v.tests = b.tests || null; await saveProject(cur); } return cur; }));
        }
      }
      if (rest === 'drafts' && m === 'POST') {
        const b = await readJson(req); const base = Number(b.base || proj.envs.dev || 0);
        const files = (base && (await readFiles(id, base))) || new Map();
        for (const [k, v] of Object.entries(b.files || {})) files.set(cleanPath(k), typeof v === 'string' ? Buffer.from(v) : Buffer.from(/** @type {any} */ (v).b64 || '', 'base64'));
        for (const d of b.deleted || []) files.delete(cleanPath(d));
        const token = crypto.randomBytes(6).toString('hex'); drafts.set(token, { id, files, ts: Date.now() }); pruneDrafts();
        return send(res, 200, { token, url: '/play/' + id + '/d-' + token + '/' });
      }
      if (rest === 'pvls') {
        if (m === 'GET') return send(res, 200, await readJsonFile(path.join(pdir(id), 'pvls.json'), {}));
        const t = await readBody(req, 1e6); JSON.parse(t || '{}'); await writeFileAtomic(path.join(pdir(id), 'pvls.json'), t || '{}'); return send(res, 200, { ok: true });
      }
      if (rest === 'activity') {
        const f = path.join(pdir(id), 'activity.json');
        if (m === 'GET') return send(res, 200, await readJsonFile(f, []));
        const b = await readJson(req);
        const out = await withLock(id + ':act', async () => { let a = await readJsonFile(f, []); a = a.concat((b.items || []).slice(0, 100)).slice(-500); await writeFileAtomic(f, JSON.stringify(a)); return a.length; });
        return send(res, 200, { ok: true, count: out });
      }
      if (rest === 'promote' && m === 'POST') {
        const b = await readJson(req);
        if (!['staging', 'prod'].includes(b.to)) return send(res, 400, { error: 'Can only promote to staging or prod' });
        const out = await withLock(id, async () => {
          const cur = await getProject(id); const n = Number(b.version || (b.to === 'prod' ? cur.envs.staging : cur.envs.dev));
          if (!n || !cur.versions.some((/** @type {any} */ x) => x.n === n)) throw httpErr(400, 'Nothing to promote');
          cur.envs[b.to] = n; cur.envLog.push({ env: b.to, n, ts: Date.now() }); await saveProject(cur); return cur;
        });
        log('info', 'promote ' + id + ' v' + out.envs[b.to] + ' → ' + b.to);
        return send(res, 200, out);
      }
      if (rest === 'icon' && m === 'POST') {
        const b = await readJson(req);
        for (const [key, file] of [['png192', 'icon-192.png'], ['png512', 'icon-512.png']]) {
          const mm2 = String(b[key] || '').match(/^data:image\/png;base64,(.+)$/); if (mm2) await writeFileAtomic(path.join(pdir(id), file), Buffer.from(mm2[1], 'base64'));
        }
        return send(res, 200, await withLock(id, async () => { const cur = await getProject(id); cur.hasIcon = true; await saveProject(cur); return cur; }));
      }
      if (rest === 'duplicate' && m === 'POST') {
        const copy = newProject({ ...proj, name: proj.name + ' (remix)' }); copy.chat = []; await saveProject(copy);
        const files = proj.envs.dev ? await readFiles(id, proj.envs.dev) : null;
        if (files) { const o = {}; for (const [k, v] of files) /** @type {any} */ (o)[k] = Build.isText(k) ? v.toString('utf8') : { b64: v.toString('base64') }; await addVersion(copy.id, { files: o, message: 'Remixed from ' + proj.name + ' v' + proj.envs.dev, kind: 'import' }); }
        return send(res, 200, await getProject(copy.id));
      }
      if (rest === 'export' && m === 'GET') return exportProject(res, proj, u.searchParams.get('env') || 'prod', u.searchParams.get('format') || 'zip');
      if (rest === 'libs' && m === 'POST') { const b = await readJson(req); return send(res, 200, await bundleLibs(id, (b.urls || []).map(String), !!b.addTags)); }

      if (rest.startsWith('workspace') || rest === 'terminal' || rest === 'terminal/stop') {
        if (!terminalAllowed(req)) return send(res, 403, { error: 'The terminal only works on the PC running the studio, or from your phone when the studio is started with a PIN (--pin 1234).' });
        if (rest === 'terminal' && m === 'POST') return runTerminal(req, res, proj);
        if (rest === 'terminal/stop' && m === 'POST') { killTree(terms.get(id)); return send(res, 200, { ok: true }); }
        if (rest === 'workspace' && m === 'GET') { await syncWorkspace(proj); return send(res, 200, { dir: wsDir(id), cwd: path.relative(wsDir(id), termCwd.get(id) || wsDir(id)) || '.', running: terms.has(id), changes: await workspaceChanges(proj), local: isLocalReq(req) }); }
        if (rest === 'workspace/import' && m === 'POST') { const b = await readJson(req); return send(res, 200, await importWorkspace(id, b.paths)); }
        if (rest === 'workspace/open' && m === 'POST') { if (!isLocalReq(req)) return send(res, 403, { error: 'Only from the PC itself' }); await syncWorkspace(proj); openFolder(wsDir(id)); return send(res, 200, { ok: true }); }
      }
    }
    return send(res, 404, { error: 'Unknown API route' });
  }

  // static studio files
  let file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : p));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  try {
    if ((await fsp.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    return send(res, 200, await fsp.readFile(file), { 'content-type': mimeOf(file), 'cache-control': 'no-cache' });
  } catch (e) { return send(res, 404, 'Not found'); }
}

async function main() {
  await fsp.mkdir(PROJ, { recursive: true });
  await loadSettings(); await loadKits();
  for (const f of Build.KIT_FILES) fs.watchFile(path.join(PUBLIC, f), { interval: 1500 }, () => loadKits().catch(() => {}));
  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => {
      const code = /** @type {any} */ (e).code; const status = typeof code === 'number' ? code : 500;
      if (status >= 500) log('error', (req.method || '') + ' ' + req.url + ' → ' + (e && e.stack || e));
      if (!res.headersSent) send(res, status, { error: String(e && e.message || e) }); else res.end();
    });
  });
  server.requestTimeout = 0; server.headersTimeout = 60000;
  server.on('error', (e) => {
    if (/** @type {any} */ (e).code === 'EADDRINUSE') { console.log('\n  Port ' + PORT + ' is busy — the studio is probably already running: http://localhost:' + PORT + '\n'); if (flag('open')) openUrl('http://localhost:' + PORT); process.exit(0); }
    throw e;
  });
  server.listen(PORT, HOST, async () => {
    const o = /** @type {any} */ (await ollamaPing());
    log('info', 'studio v' + VERSION + ' listening on ' + HOST + ':' + PORT + ', ollama ' + settings.ollamaUrl + (o.ok ? ' ok' : ' unreachable'));
    console.log('\n  🛠️  App Creator Studio v' + VERSION);
    console.log('  PC:     http://localhost:' + PORT);
    for (const l of lanUrls()) console.log('  Phone:  ' + l + '   (same Wi-Fi)');
    console.log('  Ollama: ' + settings.ollamaUrl + (o.ok ? '  ✅ v' + (o.version || '?') : '  ❌ not reachable — start Ollama'));
    console.log('  PIN:    ' + (PIN ? 'on' : 'off (add --pin 1234 to protect it on shared Wi-Fi and to allow the terminal from your phone)'));
    console.log('  Data:   ' + DATA + '\n  Keep this window open while you use the studio.\n');
    if (flag('open')) openUrl('http://localhost:' + PORT);
  });
}
function openUrl(/** @type {string} */ url) { exec((IS_WIN ? 'start "" "' : process.platform === 'darwin' ? 'open "' : 'xdg-open "') + url + '"', () => {}); }
main();
