// Test helpers: a fake Ollama and a real studio server on a free port with a throwaway data folder.
'use strict';
const http = require('http');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer(); s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => { const { port } = /** @type {any} */ (s.address()); s.close(() => resolve(port)); });
  });
}

/** A tiny stand-in for Ollama: /api/version, /api/tags, /api/ps, streaming /api/chat. */
async function fakeOllama(opts = {}) {
  const calls = [];
  const reply = opts.reply || '```html\n<!doctype html><title>x</title>\n```';
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null });
      res.setHeader('content-type', 'application/json');
      if (req.url === '/api/version') return res.end(JSON.stringify({ version: '0.99.0-test' }));
      if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'qwen2.5-coder:7b', size: 4.7e9 }, { name: 'qwen2.5-coder:3b', size: 1.9e9 }] }));
      if (req.url === '/api/ps') return res.end(JSON.stringify({ models: [] }));
      if (req.url === '/api/chat') {
        res.setHeader('content-type', 'application/x-ndjson');
        const parts = reply.match(/[\s\S]{1,12}/g) || [];
        for (const p of parts) res.write(JSON.stringify({ message: { role: 'assistant', content: p }, done: false }) + '\n');
        return res.end(JSON.stringify({ done: true, prompt_eval_count: 42, eval_count: parts.length, total_duration: 1e6, eval_duration: 5e5 }) + '\n');
      }
      res.statusCode = 404; res.end(JSON.stringify({ error: 'not found' }));
    });
  });
  const port = await freePort();
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { url: 'http://127.0.0.1:' + port, port, calls, close: () => new Promise((r) => server.close(r)) };
}

/** Start server.js for real. @param {string[]} [args] @param {Record<string,string>} [env] */
async function startStudio(args = [], env = {}, root = ROOT) {
  const port = await freePort();
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
  const child = spawn(process.execPath, [path.join(root, 'server.js'), '--port', String(port), '--host', '127.0.0.1', '--data', data, ...args],
    { cwd: root, env: { FORGE_LAUNCHER: '', ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
  const base = 'http://127.0.0.1:' + port;
  const t0 = Date.now();
  for (;;) {
    try { const r = await fetch(base + '/api/health'); if (r.status === 200 || r.status === 401) break; } catch (e) { /* not yet */ }
    if (child.exitCode != null) throw new Error('studio exited early:\n' + out);
    if (Date.now() - t0 > 15000) { child.kill(); throw new Error('studio did not start:\n' + out); }
    await new Promise((r) => setTimeout(r, 100));
  }
  /** @param {string} p @param {any} [o] */
  async function api(p, o = {}) {
    const init = { method: o.method || 'GET', headers: { 'content-type': 'application/json', ...(o.headers || {}) } };
    if (o.body !== undefined) /** @type {any} */ (init).body = typeof o.body === 'string' ? o.body : JSON.stringify(o.body);
    const r = await fetch(base + p, init);
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, headers: r.headers, body: ct.includes('json') ? await r.json() : await r.text() };
  }
  const stop = () => new Promise((resolve) => {
    if (child.exitCode != null) { fs.rmSync(data, { recursive: true, force: true }); return resolve(undefined); }
    child.once('exit', () => { fs.rmSync(data, { recursive: true, force: true }); resolve(undefined); });
    child.kill();
  });
  return { base, port, data, api, stop, child, output: () => out };
}

/** Copy the studio (no .git, no data) somewhere it can safely update itself. */
function copyStudio() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-copy-'));
  fs.cpSync(ROOT, dir, { recursive: true, filter: (src) => !/[\\/](\.git|data|node_modules)([\\/]|$)/.test(path.relative(ROOT, src) ? '/' + path.relative(ROOT, src) : '') });
  return dir;
}
/** Every file of the studio as {path, data}, the way a GitHub download has them. */
function studioFiles(root = ROOT) {
  const out = [];
  (function walk(rel) {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (/^(\.git|data|node_modules)$/.test(e.name) && !rel) continue;
      if (e.isDirectory()) walk(r); else out.push({ path: r, data: fs.readFileSync(path.join(root, r)) });
    }
  })('');
  return out;
}

module.exports = { ROOT, freePort, fakeOllama, startStudio, copyStudio, studioFiles };
