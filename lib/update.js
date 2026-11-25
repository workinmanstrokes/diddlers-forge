// @ts-check
/* Diddler’s Forge — studio self-update helpers (zero dependencies).
 * Two ways to update:
 *  - git installs (a clone with .git): `git fetch` + `git pull --ff-only`
 *  - download installs (a .zip from GitHub): fetch the newest .tar.gz of the repo, check it, back up the files it
 *    replaces into data/backups/, then write only the files that changed. Your data/ folder is never touched. */
'use strict';
const zlib = require('zlib');
const path = require('path');

/** Compare "3.4.0" style versions. @returns {number} <0 if a<b, 0 if equal, >0 if a>b */
function semverCmp(/** @type {string} */ a, /** @type {string} */ b) {
  const pa = String(a || '0').replace(/^v/, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  const pb = String(b || '0').replace(/^v/, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}

/** Read a (gzipped) tar archive into regular files. Handles ustar, pax (x/g) and GNU long names.
 * @param {Buffer} buf @returns {{path:string,data:Buffer}[]} */
function readTar(buf) {
  const tar = buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf) : buf;
  const out = []; let off = 0; let longName = ''; let paxPath = '';
  const str = (/** @type {number} */ o, /** @type {number} */ n) => { const s = tar.subarray(o, o + n); const z = s.indexOf(0); return s.subarray(0, z < 0 ? n : z).toString('utf8'); };
  while (off + 512 <= tar.length) {
    if (tar[off] === 0) break; // end-of-archive marker
    let name = str(off, 100); const prefix = str(off + 345, 155);
    const size = parseInt(str(off + 124, 12).trim() || '0', 8) || 0; const type = String.fromCharCode(tar[off + 156] || 48);
    const body = tar.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === 'L') { longName = body.toString('utf8').replace(/\0+$/, ''); continue; }
    if (type === 'x' || type === 'g') {
      if (type === 'x') { const m = body.toString('utf8').match(/(?:^|\n)\d+ path=([^\n]*)\n/); if (m) paxPath = m[1]; }
      continue;
    }
    if (prefix) name = prefix + '/' + name;
    if (longName) { name = longName; longName = ''; }
    if (paxPath) { name = paxPath; paxPath = ''; }
    if (type === '0' || type === '\0' || type === '7') out.push({ path: name, data: Buffer.from(body) });
  }
  return out;
}

/** GitHub archives put everything under "<repo>-<branch>/". Remove that folder and drop anything unsafe.
 * @param {{path:string,data:Buffer}[]} files */
function stripTop(files) {
  const tops = new Set(files.map((f) => f.path.split('/')[0]));
  const strip = tops.size === 1 && files.every((f) => f.path.includes('/'));
  const out = [];
  for (const f of files) {
    const p = (strip ? f.path.split('/').slice(1).join('/') : f.path).replace(/\\/g, '/');
    if (!p || p.startsWith('/') || p.split('/').some((x) => x === '..' || x === '.' || x === '') || /[\0:]/.test(p)) continue;
    if (/^(data|\.git|node_modules)(\/|$)/.test(p)) continue; // never touch user data or git internals
    out.push({ path: p, data: f.data });
  }
  return out;
}

/** Check a downloaded studio before anything is written.
 * @param {{path:string,data:Buffer}[]} files @returns {{version:string, error?:string}} */
function validate(files) {
  const get = (/** @type {string} */ p) => files.find((f) => f.path === p);
  const pkg = get('package.json'); const srv = get('server.js');
  if (!pkg || !srv || !get('public/index.html')) return { version: '', error: 'The download is not a Diddler’s Forge studio (package.json, server.js or public/index.html missing).' };
  let version = '';
  try { const j = JSON.parse(pkg.data.toString('utf8')); if (j.name !== 'diddlers-forge') return { version: '', error: 'The download is a different project (' + j.name + ').' }; version = String(j.version || ''); }
  catch (e) { return { version: '', error: 'The downloaded package.json is broken.' }; }
  const vm = require('vm');
  for (const f of files) {
    if (!/\.js$/.test(f.path) || f.path.startsWith('public/recipes/') && !f.path.endsWith('index.js')) continue;
    try { new vm.Script(f.data.toString('utf8').replace(/^#!.*/, ''), { filename: f.path }); } catch (e) { return { version, error: 'The downloaded ' + f.path + ' has a syntax error: ' + /** @type {any} */ (e).message }; }
  }
  return { version };
}

/** Which files would change? @param {{path:string,data:Buffer}[]} files @param {(p:string)=>Buffer|null} readCurrent */
function diffFiles(files, readCurrent) {
  const changed = [], added = [];
  for (const f of files) {
    const cur = readCurrent(f.path);
    if (!cur) added.push(f.path); else if (Buffer.compare(cur, f.data) !== 0) changed.push(f.path);
  }
  return { changed, added };
}

/** Where a download install fetches from. @param {{repo:string, branch:string, base?:string}} o */
function sources(o) {
  if (o.base) return { pkg: o.base.replace(/\/$/, '') + '/package.json', tarball: o.base.replace(/\/$/, '') + '/forge.tar.gz' };
  return { pkg: 'https://raw.githubusercontent.com/' + o.repo + '/' + o.branch + '/package.json', tarball: 'https://codeload.github.com/' + o.repo + '/tar.gz/refs/heads/' + o.branch };
}

/** Build a tar.gz from files (used by tests and by `npm run pack`). @param {{path:string,data:Buffer}[]} files */
function writeTarGz(files) {
  const blocks = [];
  for (const f of files) {
    const h = Buffer.alloc(512);
    const name = Buffer.from(f.path, 'utf8');
    if (name.length > 100) { // GNU long name
      const ln = Buffer.alloc(512); ln.write('././@LongLink', 0); ln.write('0000644\0', 100); ln.write('0000000\0', 108); ln.write('0000000\0', 116);
      ln.write((name.length + 1).toString(8).padStart(11, '0') + '\0', 124); ln.write('00000000000\0', 136); ln.write('L', 156); ln.write('ustar  \0', 257);
      checksum(ln); blocks.push(ln, pad(Buffer.concat([name, Buffer.from([0])])));
    }
    name.copy(h, 0, 0, Math.min(100, name.length));
    h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116);
    h.write(f.data.length.toString(8).padStart(11, '0') + '\0', 124); h.write('00000000000\0', 136); h.write('0', 156); h.write('ustar\0' + '00', 257);
    checksum(h); blocks.push(h, pad(f.data));
  }
  blocks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(blocks));
  function pad(/** @type {Buffer} */ b) { const n = Math.ceil(b.length / 512) * 512; const o = Buffer.alloc(n); b.copy(o); return o; }
  function checksum(/** @type {Buffer} */ hd) { hd.fill(32, 148, 156); let s = 0; for (let i = 0; i < 512; i++) s += hd[i]; hd.write(s.toString(8).padStart(6, '0') + '\0 ', 148); }
}

const isSafeRel = (/** @type {string} */ p) => !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..');

module.exports = { semverCmp, readTar, stripTop, validate, diffFiles, sources, writeTarGz, isSafeRel };
