// Studio self-update: tar reading, safety checks, a full download update and the restart loop.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Update = require('../lib/update.js');
const { freePort, startStudio, copyStudio, studioFiles } = require('./helpers.js');

test('semver compare', () => {
  assert.ok(Update.semverCmp('3.5.0', '3.4.9') > 0);
  assert.ok(Update.semverCmp('v3.10.0', '3.9.0') > 0);
  assert.equal(Update.semverCmp('3.5.0', '3.5.0'), 0);
  assert.ok(Update.semverCmp('3.4.0', '3.5.0') < 0);
});

test('tar round trip, GitHub top folder, long names and unsafe paths', () => {
  const long = 'public/' + 'x'.repeat(120) + '.js';
  const tgz = Update.writeTarGz([
    { path: 'diddlers-forge-main/package.json', data: Buffer.from('{"name":"diddlers-forge","version":"9.0.0"}') },
    { path: 'diddlers-forge-main/' + long, data: Buffer.from('let a = 1;') },
    { path: 'diddlers-forge-main/data/settings.json', data: Buffer.from('{"hacked":true}') },
    { path: 'diddlers-forge-main/.git/config', data: Buffer.from('x') },
  ]);
  const raw = Update.readTar(tgz);
  assert.equal(raw.length, 4);
  assert.ok(raw.some((f) => f.path.endsWith(long)), 'GNU long name kept');
  const files = Update.stripTop(raw);
  assert.deepEqual(files.map((f) => f.path).sort(), ['package.json', long].sort(), 'data/ and .git are never written');
  assert.equal(Update.stripTop([{ path: 'a/../../etc/passwd', data: Buffer.from('') }]).length, 0);
});

test('validate refuses things that are not the studio or have broken code', () => {
  const ok = studioFiles();
  assert.equal(Update.validate(ok).error, undefined);
  assert.match(Update.validate(ok.filter((f) => f.path !== 'server.js')).error, /missing/);
  const other = ok.map((f) => (f.path === 'package.json' ? { path: f.path, data: Buffer.from('{"name":"something-else","version":"1.0.0"}') } : f));
  assert.match(Update.validate(other).error, /different project/);
  const broken = ok.map((f) => (f.path === 'public/engine.js' ? { path: f.path, data: Buffer.from('function (') } : f));
  assert.match(Update.validate(broken).error, /syntax error/);
});

/** Serve a newer studio the way GitHub would (package.json + .tar.gz). */
async function fakeGitHub(version, tweak) {
  const files = studioFiles().map((f) => {
    if (f.path === 'package.json') { const j = JSON.parse(f.data.toString('utf8')); j.version = version; return { path: f.path, data: Buffer.from(JSON.stringify(j, null, 2)) }; }
    return f;
  });
  if (tweak) tweak(files);
  const tgz = Update.writeTarGz(files.map((f) => ({ path: 'diddlers-forge-main/' + f.path, data: f.data })));
  const pkg = files.find((f) => f.path === 'package.json').data;
  const server = http.createServer((req, res) => {
    if (req.url === '/package.json') { res.setHeader('content-type', 'application/json'); return res.end(pkg); }
    if (req.url === '/forge.tar.gz') { res.setHeader('content-type', 'application/gzip'); return res.end(tgz); }
    res.statusCode = 404; res.end();
  });
  const port = await freePort(); await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { url: 'http://127.0.0.1:' + port, close: () => new Promise((r) => server.close(r)) };
}

test('download update: checks, backs up, writes only changed files, keeps data/', async () => {
  const gh = await fakeGitHub('99.0.0', (files) => {
    files.push({ path: 'public/new-in-99.txt', data: Buffer.from('hello from the future') });
    const rd = files.find((f) => f.path === 'README.md'); rd.data = Buffer.concat([rd.data, Buffer.from('\nUpdated!\n')]);
  });
  const dir = copyStudio();
  const studio = await startStudio(['--update-url', gh.url], {}, dir);
  try {
    fs.writeFileSync(path.join(studio.data, 'keep-me.txt'), 'my stuff');
    const st = await studio.api('/api/update');
    assert.equal(st.body.mode, 'download'); assert.equal(st.body.latest, '99.0.0'); assert.equal(st.body.available, true);

    const r = await studio.api('/api/update', { method: 'POST' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.updated, true); assert.equal(r.body.version, '99.0.0'); assert.equal(r.body.restart, true);
    assert.equal(r.body.files, 3, 'package.json, README.md and the new file');
    assert.equal(fs.readFileSync(path.join(dir, 'public/new-in-99.txt'), 'utf8'), 'hello from the future');
    assert.match(fs.readFileSync(path.join(dir, 'README.md'), 'utf8'), /Updated!/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version, '99.0.0');
    assert.ok(fs.existsSync(path.join(r.body.backup, 'README.md')), 'old README backed up');
    assert.doesNotMatch(fs.readFileSync(path.join(r.body.backup, 'README.md'), 'utf8'), /Updated!/);
    assert.equal(fs.readFileSync(path.join(studio.data, 'keep-me.txt'), 'utf8'), 'my stuff');

    const again = await studio.api('/api/update', { method: 'POST' });
    assert.equal(again.body.updated, false, 'second update has nothing to do');
  } finally { await studio.stop(); await gh.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('download update refuses an older version and a broken download', async () => {
  const older = await fakeGitHub('0.1.0');
  const dir = copyStudio();
  const studio = await startStudio(['--update-url', older.url], {}, dir);
  try {
    assert.equal((await studio.api('/api/update')).body.available, false);
    const r = await studio.api('/api/update', { method: 'POST' });
    assert.equal(r.status, 409); assert.match(r.body.error, /older/);
  } finally { await studio.stop(); await older.close(); }
  const broken = await fakeGitHub('99.0.0', (files) => { files.find((f) => f.path === 'server.js').data = Buffer.from('this is not javascript ((('); });
  const studio2 = await startStudio(['--update-url', broken.url], {}, dir);
  try {
    const before = fs.readFileSync(path.join(dir, 'server.js'));
    const r = await studio2.api('/api/update', { method: 'POST' });
    assert.equal(r.status, 422); assert.match(r.body.error, /syntax error/);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'server.js')), before, 'nothing written');
  } finally { await studio2.stop(); await broken.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('restart exits with code 75 under a launcher', async () => {
  const studio = await startStudio([], { FORGE_LAUNCHER: '1' });
  const exited = new Promise((r) => studio.child.once('exit', (code) => r(code)));
  const r = await studio.api('/api/restart', { method: 'POST' });
  assert.equal(r.status, 200);
  assert.equal(await exited, 75);
  await studio.stop();
});

test('start.sh brings the studio back after a restart', { skip: process.platform === 'win32' }, async () => {
  const port = await freePort();
  const data = fs.mkdtempSync(path.join(require('os').tmpdir(), 'forge-sh-'));
  const sh = spawn('sh', [path.join(__dirname, '..', 'start.sh'), '--port', String(port), '--host', '127.0.0.1', '--data', data], { stdio: 'ignore', detached: true, env: { ...process.env, PATH: process.env.PATH } });
  const base = 'http://127.0.0.1:' + port;
  const up = async () => { for (let i = 0; i < 100; i++) { try { const h = await fetch(base + '/api/health'); if (h.ok) return h.json(); } catch (e) { /* starting */ } await new Promise((r) => setTimeout(r, 100)); } throw new Error('not up'); };
  try {
    const h1 = await up(); assert.equal(h1.launcher, true);
    const pidBefore = (await (await fetch(base + '/api/system')).json()).proc.uptime;
    await fetch(base + '/api/restart', { method: 'POST' });
    await new Promise((r) => setTimeout(r, 800));
    await up();
    const after = (await (await fetch(base + '/api/system')).json()).proc.uptime;
    assert.ok(after < pidBefore + 0.5 || after < 5, 'a fresh process is answering');
  } finally {
    try { process.kill(-sh.pid, 'SIGTERM'); } catch (e) { /* gone */ }
    await new Promise((r) => setTimeout(r, 300));
    fs.rmSync(data, { recursive: true, force: true });
  }
});
