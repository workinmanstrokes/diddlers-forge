// Generation engine: patch parsing/applying, lean edits, model picking, starter matching.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../public/engine.js');
const R = require('../public/recipes/index.js');
const Build = require('../public/shared/build.js');

test('SEARCH/REPLACE patches apply to the right file, and misses are reported', () => {
  const files = { 'index.html': '<p>a</p>\n<b>x</b>\n', 'js/game.js': 'let speed = 1;\n' };
  const text = 'index.html\n<<<<<<< SEARCH\n<b>x</b>\n=======\n<b>y</b>\n>>>>>>> REPLACE\n\njs/game.js\n<<<<<<< SEARCH\nlet speed = 1;\n=======\nlet speed = 2;\n>>>>>>> REPLACE\n\nindex.html\n<<<<<<< SEARCH\n<i>nowhere</i>\n=======\n<i>z</i>\n>>>>>>> REPLACE';
  const r = E.applyToFiles(files, E.parseBlocks(text, 'index.html'));
  assert.equal(r.files['index.html'], '<p>a</p>\n<b>y</b>\n');
  assert.equal(r.files['js/game.js'], 'let speed = 2;\n');
  assert.equal(r.applied, 2);
  assert.equal(r.failed.length, 1);
  assert.equal(files['index.html'], '<p>a</p>\n<b>x</b>\n', 'input is not mutated');
});

test('an empty SEARCH creates a new file', () => {
  const r = E.applyToFiles({ 'index.html': 'x' }, E.parseBlocks('levels.json\n<<<<<<< SEARCH\n=======\n{"n":1}\n>>>>>>> REPLACE', 'index.html'));
  assert.equal(r.files['levels.json'], '{"n":1}\n');
});

test('patches survive small whitespace differences', () => {
  const r = E.applyToFiles({ 'index.html': '  if (a) {\n    go();\n  }\n' }, E.parseBlocks('<<<<<<< SEARCH\nif (a) {\n  go();\n}\n=======\nif (a) {\n  stop();\n}\n>>>>>>> REPLACE', 'index.html'));
  assert.equal(r.failed.length, 0); assert.match(r.files['index.html'], /stop\(\)/);
});

test('HTML is pulled out of a model reply, thinking stripped', () => {
  const x = E.extractHtml('<think>hmm</think>Sure!\n```html\n<!-- app: {"name":"A"} -->\n<!doctype html><html><body></body></html>\n```\nEnjoy');
  assert.ok(x); assert.equal(x.complete, true); assert.match(x.html, /^<!-- app:/);
  const cut = E.extractHtml('```html\n<!doctype html><html><body><script>let a =');
  assert.ok(cut); assert.equal(cut.complete, false, 'a cut-off reply is flagged so QA checks it');
  assert.equal(E.extractHtml('no code here'), null);
});

test('lean edits: only tuning words, never code requests', () => {
  for (const t of ['make it blue', 'faster enemies', 'rename it to Space Cats', 'darker theme', 'more lives']) assert.equal(E.isTuneRequest(t), true, t);
  for (const t of ['add a boss fight', 'fix the crash when I tap', 'add a shop screen', 'new level select']) assert.equal(E.isTuneRequest(t), false, t);
});

test('lean edits keep keys and types; bad values fall back', () => {
  const old = { title: 'Blaster', accent: '#ff0000', speed: 3, enemies: ['👾'], hard: false };
  const m = E.mergeCfg(old, { title: 'Ocean', accent: 'blue', speed: 'fast', enemies: ['🦈', '🐙'], extra: 1 });
  assert.deepEqual(m.cfg, { title: 'Ocean', accent: '#ff0000', speed: 3, enemies: ['🦈', '🐙'], hard: false });
  assert.deepEqual(m.changed.sort(), ['enemies', 'title']);
  assert.equal(E.mergeCfg(old, { needsCode: true }), null);
  assert.equal(E.mergeCfg(old, null), null);
});

test('lean edit prompts are tiny compared with the whole file', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../public/recipes/shooter.html'), 'utf8');
  const cfg = R.findCfg(src).obj;
  const lean = E.tuneMessages(cfg, 'make it blue', 'game').map((m) => m.content).join('');
  const full = E.editMessages({ 'index.html': src }, 'make it blue', '').map((m) => m.content).join('');
  const sys = E.SYSTEM.length;
  assert.ok((lean.length - sys) * 4 < full.length - sys, `lean ${lean.length - sys} vs full ${full.length - sys} chars`);
});

test('every role shares one system prompt so Ollama can reuse its cache', () => {
  const files = { 'index.html': '<p>x</p>' };
  const sets = [E.editMessages(files, 'x', ''), E.fixMessages(files, ['boom']), E.buildMessages('game', 'x'), E.tuneMessages({ a: 1 }, 'x', 'game')];
  for (const s of sets) assert.equal(s[0].content, E.SYSTEM);
  // files come first in the user message for edits and fixes (prefix reuse)
  assert.ok(E.editMessages(files, 'x', '')[1].content.startsWith(E.filesBlock(files)));
  assert.ok(E.fixMessages(files, ['boom'])[1].content.startsWith(E.filesBlock(files)));
});

test('model auto-pick: biggest coder that fits RAM, smallest for fast work, no embedders', () => {
  const models = [{ name: 'qwen2.5-coder:7b', size: 4.7e9 }, { name: 'qwen2.5-coder:3b', size: 1.9e9 }, { name: 'nomic-embed-text', size: 3e8 }, { name: 'llama3.1:70b', size: 4e10 }];
  assert.deepEqual(E.pickModels(models, 16e9), { code: 'qwen2.5-coder:7b', fast: 'qwen2.5-coder:3b' });
  assert.equal(E.pickModels([], 16e9).code, '');
});

test('ideas map to the right starter', () => {
  const cases = [['a zombie survival shooter', 'game', 'arena'], ['endless runner with a dino', 'game', 'runner'], ['track my daily habits', 'app', 'habits'],
    ['3 on 3 hockey game', 'game', 'hockey'], ['tower defense with dragons', 'game', 'towerdefense'], ['michigan fishing game', 'game', 'fishing']];
  for (const [idea, type, id] of cases) { const m = R.match(idea, type); assert.ok(m, idea); assert.equal(m.recipe.id, id, idea); }
  assert.equal(R.exact(R.get('snake').prompt).id, 'snake', 'a starter prompt builds with 0 tokens');
});

test('first-line meta is parsed', () => {
  assert.deepEqual(Build.parseMeta('<!-- app: {"name":"X","emoji":"🎯","type":"game"} -->\n<html>'), { name: 'X', emoji: '🎯', type: 'game' });
});
