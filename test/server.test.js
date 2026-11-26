// End-to-end tests of the studio server against a fake Ollama. Run: npm test
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { fakeOllama, startStudio } = require('./helpers.js');

const PAGE = `<!-- app: {"name":"Test Game","emoji":"🎯","color":"#22c55e","type":"game","orientation":"portrait"} -->
<!doctype html><html><head><meta name="viewport" content="width=device-width"><script src="kit/game.js"></script><title>Test</title></head>
<body><script>const CFG = {"title": "Test Game", "accent": "#22c55e"};
Kit.game({title: CFG.title, init(g){}, update(g, dt){}, draw(g, ctx){ g.clear('#000'); }});</script></body></html>`;

let ollama, studio;
before(async () => {
  ollama = await fakeOllama();
  studio = await startStudio(['--ollama', ollama.url, '--no-git-update']);
});
after(async () => { await studio.stop(); await ollama.close(); });

test('health reports the version and a connected Ollama', async () => {
  const r = await studio.api('/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.version, require('../package.json').version);
  assert.equal(r.body.ollama.ok, true);
  assert.equal(r.body.ollama.version, '0.99.0-test');
  assert.equal(r.body.local, true);
  assert.equal(r.body.terminal, true);
  assert.ok(Array.isArray(r.body.lan));
});

test('serves the studio PWA shell', async () => {
  for (const p of ['/', '/app.js', '/engine.js', '/manifest.webmanifest', '/sw.js', '/kit/game.js', '/recipes/index.js']) {
    const r = await fetch(studio.base + p); assert.equal(r.status, 200, p); await r.arrayBuffer();
  }
  const m = await (await fetch(studio.base + '/manifest.webmanifest')).json();
  assert.ok(m.icons && m.icons.length, 'manifest has icons');
  const esc = await fetch(studio.base + '/%2e%2e/server.js'); assert.notEqual(esc.status, 200, 'no path escape from public/');
});

test('settings are saved and clamped to safe ranges', async () => {
  const r = await studio.api('/api/settings', { method: 'POST', body: { numCtx: 999999999, autoFix: 50, playtestSecs: 1, codeModel: 'qwen2.5-coder:7b', notASetting: 1 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.numCtx, 262144); assert.equal(r.body.autoFix, 5); assert.equal(r.body.playtestSecs, 8);
  assert.equal(r.body.codeModel, 'qwen2.5-coder:7b'); assert.equal(r.body.notASetting, undefined);
  const saved = JSON.parse(fs.readFileSync(path.join(studio.data, 'settings.json'), 'utf8'));
  assert.equal(saved.codeModel, 'qwen2.5-coder:7b');
});

test('Ollama proxy streams chat and blocks other endpoints', async () => {
  const r = await fetch(studio.base + '/api/ollama/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'x', messages: [{ role: 'user', content: 'hi' }], stream: true }) });
  assert.equal(r.status, 200);
  const lines = (await r.text()).trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines[lines.length - 1].done, true);
  assert.match(lines.map((l) => (l.message ? l.message.content : '')).join(''), /<!doctype html>/);
  assert.equal(ollama.calls.filter((c) => c.url === '/api/chat').length, 1);
  const blocked = await studio.api('/api/ollama/api/delete', { method: 'DELETE', body: { model: 'x' } });
  assert.equal(blocked.status, 404, 'deleting models through the studio is not allowed');
  const tags = await studio.api('/api/ollama/api/tags');
  assert.equal(tags.body.models.length, 2);
});

test('project lifecycle: create, version, dedupe, promote, play, export, remix, delete', async () => {
  const created = await studio.api('/api/projects', { method: 'POST', body: { name: 'Demo', type: 'game', idea: 'a test game' } });
  assert.equal(created.status, 200); const id = created.body.id; assert.match(id, /^[a-z0-9]{8}$/);

  const v1 = await studio.api(`/api/projects/${id}/versions`, { method: 'POST', body: { files: { 'index.html': PAGE }, message: 'first', kind: 'build' } });
  assert.equal(v1.status, 200); assert.equal(v1.body.version.n, 1);
  assert.equal(v1.body.project.name, 'Test Game', 'name comes from the <!-- app: --> line');
  assert.equal(v1.body.project.emoji, '🎯');

  const same = await studio.api(`/api/projects/${id}/versions`, { method: 'POST', body: { files: { 'index.html': PAGE } } });
  assert.equal(same.status, 409, 'saving identical files is refused');

  const bad = await studio.api(`/api/projects/${id}/versions`, { method: 'POST', body: { files: { '../escape.html': 'x' } } });
  assert.equal(bad.status, 400, 'path traversal is refused');

  const v2 = await studio.api(`/api/projects/${id}/versions`, { method: 'POST', body: { files: { 'index.html': PAGE.replace('#000', '#111'), 'data/levels.json': '{"a":1}' }, message: 'second' } });
  assert.equal(v2.body.version.n, 2); assert.equal(v2.body.version.files, 2);

  const files = await studio.api(`/api/projects/${id}/versions/1`);
  assert.deepEqual(Object.keys(files.body.files), ['index.html']);

  // dev serves the newest version, prod is empty until promoted
  const dev = await fetch(`${studio.base}/play/${id}/dev/`); assert.equal(dev.status, 200); assert.match(await dev.text(), /#111/);
  const prod0 = await (await fetch(`${studio.base}/play/${id}/`)).text(); assert.doesNotMatch(prod0, /#111/);
  const kit = await fetch(`${studio.base}/play/${id}/dev/kit/game.js`); assert.equal(kit.status, 200, 'kits are served next to the app');

  assert.equal((await studio.api(`/api/projects/${id}/promote`, { method: 'POST', body: { to: 'prod' } })).status, 400, 'nothing in staging yet');
  const st = await studio.api(`/api/projects/${id}/promote`, { method: 'POST', body: { to: 'staging', version: 1 } });
  assert.equal(st.body.envs.staging, 1);
  const pr = await studio.api(`/api/projects/${id}/promote`, { method: 'POST', body: { to: 'prod' } });
  assert.equal(pr.body.envs.prod, 1);
  const prod = await (await fetch(`${studio.base}/play/${id}/`)).text(); assert.match(prod, /#000/); assert.match(prod, /manifest\.webmanifest/);
  const man = await (await fetch(`${studio.base}/play/${id}/manifest.webmanifest`)).json();
  assert.equal(man.orientation, 'portrait'); assert.equal(man.display, 'fullscreen'); assert.equal(man.start_url, `/play/${id}/`);
  const sw = await fetch(`${studio.base}/play/${id}/sw.js`); assert.equal(sw.status, 200);

  const zip = await fetch(`${studio.base}/api/projects/${id}/export?env=prod&format=zip`);
  assert.equal(zip.status, 200); const zb = Buffer.from(await zip.arrayBuffer()); assert.equal(zb.readUInt32LE(0), 0x04034b50, 'a real zip');
  const single = await fetch(`${studio.base}/api/projects/${id}/export?env=prod&format=html`);
  assert.equal(single.status, 200); const html = await single.text(); assert.doesNotMatch(html, /src="kit\/game\.js"/, 'single HTML inlines the kit');

  const remix = await studio.api(`/api/projects/${id}/duplicate`, { method: 'POST' });
  assert.equal(remix.status, 200); assert.notEqual(remix.body.id, id); assert.equal(remix.body.versions.length, 1);

  const list = await studio.api('/api/projects'); assert.ok(list.body.some((p) => p.id === id));
  const del = await studio.api(`/api/projects/${id}`, { method: 'DELETE' }); assert.equal(del.body.trashed, true);
  assert.equal((await studio.api(`/api/projects/${id}`)).status, 404);
  assert.ok(fs.readdirSync(path.join(studio.data, 'trash')).some((d) => d.startsWith(id)), 'deleted projects go to data/trash');
});

test('usage is counted per day and per model', async () => {
  await studio.api('/api/usage', { method: 'POST', body: { model: 'qwen2.5-coder:3b', in: 100, out: 50, ms: 1000 } });
  const u = await studio.api('/api/usage');
  assert.ok(u.body.byModel['qwen2.5-coder:3b'].out >= 50);
  assert.ok(Object.keys(u.body.byDay).length >= 1);
});

test('find-ollama finds the local Ollama on a custom port', async () => {
  const r = await studio.api(`/api/find-ollama?port=${ollama.port}&timeout=400`);
  assert.equal(r.status, 200);
  const hit = r.body.found.find((f) => f.thisMachine);
  assert.ok(hit, 'found Ollama on this machine: ' + JSON.stringify(r.body));
  assert.equal(hit.version, '0.99.0-test'); assert.equal(hit.models, 2);
});

test('update check reports a clear status without a network', async () => {
  const r = await studio.api('/api/update');
  assert.equal(r.status, 200);
  assert.equal(r.body.current, require('../package.json').version);
  assert.ok(['git', 'download'].includes(r.body.mode));
  assert.equal(typeof r.body.available, 'boolean');
});

test('PIN mode locks the API until you log in', async () => {
  const locked = await startStudio(['--ollama', ollama.url, '--pin', '4321']);
  try {
    const h = await locked.api('/api/health'); assert.equal(h.status, 200); assert.equal(h.body.needsPin, true); assert.equal(h.body.authed, false);
    assert.equal((await locked.api('/api/projects')).status, 401);
    assert.equal((await locked.api('/api/login', { method: 'POST', body: { pin: '0000' } })).status, 401);
    const ok = await locked.api('/api/login', { method: 'POST', body: { pin: '4321' } });
    assert.equal(ok.status, 200);
    const cookie = String(ok.headers.get('set-cookie')).split(';')[0];
    assert.equal((await locked.api('/api/projects', { headers: { cookie } })).status, 200);
  } finally { await locked.stop(); }
});
