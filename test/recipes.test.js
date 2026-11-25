// Every starter recipe: present, cached offline, tunable, themes valid, scripts compile, phone-friendly.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const R = require('../public/recipes/index.js');
const Build = require('../public/shared/build.js');

const DIR = path.join(__dirname, '../public/recipes');
const sw = fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8');
const isColor = (v) => /^#[0-9a-f]{3,8}$/i.test(v);

test('catalog and files match one-to-one', () => {
  const ids = R.list.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
  assert.deepEqual(files.sort(), ids.slice().sort());
});

test('every recipe is in the studio service worker, so starters work offline', () => {
  for (const r of R.list) assert.ok(sw.includes("'" + r.id + "'"), r.id + ' missing from public/sw.js SHELL');
});

for (const r of R.list) {
  test(`recipe ${r.emoji} ${r.name} (${r.id})`, () => {
    const src = fs.readFileSync(path.join(DIR, r.id + '.html'), 'utf8');
    const meta = Build.parseMeta(src);
    assert.equal(meta.type, r.type, 'first line type matches catalog');
    assert.ok(['portrait', 'landscape'].includes(meta.orientation || 'portrait'));
    assert.match(src, /<meta name="viewport"[^>]*width=device-width/, 'has a phone viewport');
    assert.doesNotMatch(src, /<(script|link)[^>]+(src|href)="https?:/i, 'no CDN files (must work offline)');
    if (r.type === 'game') assert.match(src, /kit\/game\.js/); else assert.match(src, /kit\/(app\.js|ui\.css)/);

    const cfg = R.findCfg(src);
    assert.ok(cfg && cfg.obj, 'has a parseable const CFG = {…} tuning block');
    assert.ok(Object.keys(cfg.obj).length >= 3);

    assert.ok(r.themes.length >= 1);
    for (const th of r.themes) {
      for (const [k, v] of Object.entries(th.cfg)) {
        assert.ok(k in cfg.obj, `theme "${th.name}" key "${k}" exists in CFG`);
        const base = cfg.obj[k];
        assert.equal(Array.isArray(v), Array.isArray(base), `theme "${th.name}" key "${k}" keeps its type`);
        if (!Array.isArray(v)) assert.equal(typeof v, typeof base, `theme "${th.name}" key "${k}" keeps its type`);
        if (typeof base === 'string' && isColor(base)) assert.ok(isColor(v), `theme "${th.name}" key "${k}" is a color`);
      }
      const themed = R.setCfg(src, { ...cfg.obj, ...th.cfg });
      assert.deepEqual(R.findCfg(themed).obj, { ...cfg.obj, ...th.cfg }, 'applying the theme round-trips');
    }

    const scripts = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    assert.ok(scripts.length >= 1);
    for (const s of scripts) assert.doesNotThrow(() => new vm.Script(s, { filename: r.id + '.html' }), 'inline script compiles');
    assert.ok(R.match(r.prompt, r.type), 'its own description matches a starter');
  });
}

test('kits compile', () => {
  for (const f of ['kit/game.js', 'kit/app.js', 'shared/build.js', 'shared/harness.js', 'tester.js']) {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(__dirname, '../public', f), 'utf8'), { filename: f }), f);
  }
});

test('single-file build inlines the kit so exports work anywhere', () => {
  const src = fs.readFileSync(path.join(DIR, 'snake.html'), 'utf8');
  const kits = {}; for (const f of Build.KIT_FILES) kits[f] = fs.readFileSync(path.join(__dirname, '../public', f), 'utf8');
  const out = Build.build(src, kits, {});
  assert.doesNotMatch(out, /<script src="kit\/game\.js"><\/script>/);
  assert.ok(out.length > src.length + 1000);
});
