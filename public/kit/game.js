/* Diddler’s Forge — Game Kit v2
 * Gives every generated game: fit-to-screen canvas (any phone, no zoom), unified
 * touch/mouse/keyboard input, synth sound effects, procedural music, animated backdrops,
 * particles, shake, floating text, banners, upgrade-choice cards, start / pause / game-over
 * screens, HUD, best score. The model writes only game logic. */
(function () {
  'use strict';
  var Kit = (window.Kit = window.Kit || {});

  // ---------- audio (tiny synth, no files) ----------
  var AC = window.AudioContext || window.webkitAudioContext, actx = null, master = null;
  var muted = false;
  try { muted = localStorage.getItem('kit:muted') === '1'; } catch (e) {}
  function audio() {
    if (!AC) return null;
    if (!actx) { actx = new AC(); master = actx.createGain(); master.gain.value = 0.32; master.connect(actx.destination); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type, vol, slide) {
    if (muted) return; var a = audio(); if (!a) return;
    dur = dur || 0.12; var t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.4, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    if (muted) return; var a = audio(); if (!a) return;
    var len = Math.floor(a.sampleRate * (dur || 0.2)), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'lowpass'; f.frequency.value = freq || 1800; g.gain.value = vol || 0.5;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  function seq(notes, step, type, vol) { notes.forEach(function (f, i) { setTimeout(function () { tone(f, step * 1.6, type, vol); }, i * step * 1000); }); }
  var SFX = {
    jump: function () { tone(330, 0.16, 'square', 0.3, 440); },
    coin: function () { tone(988, 0.06, 'square', 0.25); setTimeout(function () { tone(1319, 0.14, 'square', 0.25); }, 60); },
    shoot: function () { tone(900, 0.08, 'square', 0.18, -650); },
    hit: function () { noise(0.14, 0.5, 2400); tone(180, 0.14, 'sawtooth', 0.3, -100); },
    explode: function () { noise(0.5, 0.8, 900); tone(90, 0.4, 'sawtooth', 0.3, -50); },
    power: function () { seq([523, 659, 784, 1047], 0.06, 'triangle', 0.35); },
    pop: function () { tone(520, 0.07, 'sine', 0.45, 380); },
    click: function () { tone(700, 0.04, 'triangle', 0.25); },
    tick: function () { tone(1400, 0.025, 'square', 0.12); },
    lose: function () { seq([392, 330, 262, 196], 0.13, 'sawtooth', 0.28); },
    win: function () { seq([523, 659, 784, 1047, 1319], 0.08, 'triangle', 0.35); },
    combo: function () { tone(660, 0.05, 'square', 0.22); setTimeout(function () { tone(990, 0.09, 'square', 0.22); }, 45); },
  };

  // ---------- music (procedural loop per game, no files) ----------
  var MUSIC = {
    arcade: { bpm: 132, lead: 'square', bass: 'triangle', scale: [0, 2, 4, 7, 9], prog: [0, 5, 7, 5], drums: 'k.h.s.h.k.hks.h.', vol: 0.09 },
    action: { bpm: 150, lead: 'sawtooth', bass: 'square', scale: [0, 3, 5, 7, 10], prog: [0, 0, 8, 7], drums: 'k.hkskh.k.hks.hh', vol: 0.07 },
    chill: { bpm: 90, lead: 'triangle', bass: 'sine', scale: [0, 2, 4, 7, 9, 11], prog: [0, 9, 5, 7], drums: 'k...h...s...h..h', vol: 0.1 },
    happy: { bpm: 120, lead: 'triangle', bass: 'triangle', scale: [0, 2, 4, 5, 7, 9], prog: [0, 7, 9, 5], drums: 'k.h.s.h.k.h.s.hh', vol: 0.1 },
    spooky: { bpm: 96, lead: 'triangle', bass: 'sawtooth', scale: [0, 1, 3, 7, 8], prog: [0, 1, 0, 8], drums: 'k..hs..hk..hs.hh', vol: 0.08 },
  };
  var mus = { style: '', seed: '', on: false, step: 0, next: 0, timer: 0, mel: null, bus: null, nb: null };
  function seeded(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
  function musicNote(f, t, dur, type, vol) {
    var o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mus.bus); o.start(t); o.stop(t + dur + 0.03);
  }
  function musicDrum(kind, t) {
    if (kind === 'k') { var o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g); g.connect(mus.bus); o.start(t); o.stop(t + 0.16); return; }
    if (!mus.nb) { var len = Math.floor(actx.sampleRate * 0.25); mus.nb = actx.createBuffer(1, len, actx.sampleRate); var d = mus.nb.getChannelData(0); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); }
    var s = actx.createBufferSource(), f = actx.createBiquadFilter(), gn = actx.createGain(), dur = kind === 's' ? 0.12 : 0.035;
    f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000; gn.gain.setValueAtTime(kind === 's' ? 0.35 : 0.16, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.buffer = mus.nb; s.connect(f); f.connect(gn); gn.connect(mus.bus); s.start(t); s.stop(t + dur + 0.02);
  }
  function musicTick() {
    if (!actx || muted) return; var S = MUSIC[mus.style] || MUSIC.arcade, st = 60 / S.bpm / 4;
    if (mus.next < actx.currentTime) mus.next = actx.currentTime + 0.03;
    while (mus.next < actx.currentTime + 0.16) {
      var t = mus.next, i = mus.step, bar = Math.floor(i / 16) % S.prog.length, root = S.prog[bar], dr = S.drums.charAt(i % 16);
      if (i % 8 === 0 || (i % 16 === 14 && bar % 2)) musicNote(130.81 * Math.pow(2, root / 12), t, st * 3.2, S.bass, S.vol * 1.6);
      var m = mus.mel[i % 32]; if (m != null) musicNote(523.25 * Math.pow(2, m / 12), t, st * 1.7, S.lead, S.vol);
      if (dr !== '.') musicDrum(dr, t);
      mus.next += st; mus.step++;
    }
  }
  function musicSet(style, seed) {
    if (!MUSIC[style]) style = '';
    if (style && (style !== mus.style || seed !== mus.seed)) {
      var S = MUSIC[style], r = seeded(seed + style); mus.mel = [];
      for (var i = 0; i < 32; i++) mus.mel.push(i % 2 === 0 ? (r() < 0.7 ? S.scale[Math.floor(r() * S.scale.length)] + (r() < 0.2 ? 12 : 0) : null) : (r() < 0.15 ? S.scale[Math.floor(r() * S.scale.length)] + 12 : null));
      for (var j = 16; j < 24; j++) mus.mel[j] = mus.mel[j - 16]; // repeat the hook so it sticks
      mus.step = 0;
    }
    mus.style = style; mus.seed = seed;
  }
  function musicRun(on) {
    on = on && !!mus.style && !muted && !!audio();
    if (on === mus.on) return; mus.on = on;
    if (on) { if (!mus.bus) { mus.bus = actx.createGain(); mus.bus.gain.value = 0.6; mus.bus.connect(master); } mus.next = 0; musicTick(); mus.timer = setInterval(musicTick, 50); }
    else clearInterval(mus.timer);
  }

  // ---------- number formatting ----------
  function fmtNum(n) {
    n = Math.floor(Number(n) || 0); var a = Math.abs(n);
    if (a < 1e6) return n.toLocaleString('en-US');
    var u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'], k = Math.min(u.length - 1, Math.floor(Math.log10(a) / 3));
    var s = (n / Math.pow(1000, k)).toFixed(a / Math.pow(1000, k) >= 100 ? 0 : 2);
    return (s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s) + u[k];
  }

  // ---------- math helpers ----------
  var M = {
    rand: function (a, b) { return b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a); },
    randi: function (a, b) { return Math.floor(M.rand(a, b + 1)); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance: function (p) { return Math.random() < p; },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    dist: function (a, b, c, d) { return c === undefined ? Math.hypot(b.x - a.x, b.y - a.y) : Math.hypot(c - a, d - b); },
    angle: function (a, b) { return Math.atan2(b.y - a.y, b.x - a.x); },
    hitCircle: function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < (a.r || 0) + (b.r || 0); },
    hitRect: function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },
    hitCircleRect: function (c, r) {
      var nx = M.clamp(c.x, r.x, r.x + r.w), ny = M.clamp(c.y, r.y, r.y + r.h);
      return (c.x - nx) * (c.x - nx) + (c.y - ny) * (c.y - ny) < c.r * c.r;
    },
    ease: { out: function (t) { return 1 - Math.pow(1 - t, 3); }, in: function (t) { return t * t * t; }, inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } },
  };

  var CSS = '' +
    'html,body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' +
    'body{font-family:ui-rounded,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff}' +
    'canvas.kit-c{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;display:block}' +
    '.kit-hud{position:fixed;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:calc(10px + env(safe-area-inset-top)) 14px 0;pointer-events:none;z-index:5;text-shadow:0 2px 8px rgba(0,0,0,.5)}' +
    '.kit-score{font-size:30px;font-weight:900;letter-spacing:.5px;line-height:1}.kit-best{font-size:12px;opacity:.75;font-weight:700;margin-top:4px}' +
    '.kit-right{display:flex;gap:8px;align-items:center;pointer-events:auto}.kit-lives{font-size:18px;letter-spacing:2px;pointer-events:none}' +
    '.kit-ib{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(10,12,24,.45);color:#fff;font-size:16px;backdrop-filter:blur(6px);cursor:pointer}' +
    '.kit-ov{position:fixed;inset:0;display:grid;place-items:center;z-index:10;background:radial-gradient(ellipse at center,rgba(5,6,15,.35),rgba(5,6,15,.82));opacity:0;pointer-events:none;transition:opacity .25s}' +
    '.kit-ov.on{opacity:1;pointer-events:auto}' +
    '.kit-card{width:min(86vw,360px);padding:28px 22px 24px;border-radius:26px;text-align:center;background:linear-gradient(160deg,rgba(255,255,255,.12),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.16);box-shadow:0 20px 60px rgba(0,0,0,.5);backdrop-filter:blur(14px);transform:translateY(12px) scale(.96);transition:transform .35s cubic-bezier(.2,1.4,.4,1)}' +
    '.kit-ov.on .kit-card{transform:none}' +
    '.kit-emoji{font-size:64px;line-height:1;filter:drop-shadow(0 8px 18px rgba(0,0,0,.45));animation:kitb 2.2s ease-in-out infinite}' +
    '@keyframes kitb{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}' +
    '.kit-title{margin:12px 0 6px;font-size:34px;font-weight:900;line-height:1.05;background:linear-gradient(180deg,#fff,var(--kit-accent,#a78bfa));-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.kit-sub{opacity:.8;font-size:15px;line-height:1.4;margin:0 0 18px}' +
    '.kit-big{font-size:56px;font-weight:900;line-height:1;margin:6px 0}.kit-new{display:inline-block;padding:4px 10px;border-radius:99px;background:var(--kit-accent,#7c5cff);font-weight:800;font-size:12px;letter-spacing:1px;animation:kitp 1s ease-in-out infinite}' +
    '@keyframes kitp{50%{transform:scale(1.08)}}' +
    '.kit-btn{display:block;width:100%;margin-top:16px;padding:16px;border:0;border-radius:16px;font:inherit;font-size:19px;font-weight:900;color:#fff;cursor:pointer;background:linear-gradient(180deg,var(--kit-accent,#7c5cff),color-mix(in srgb,var(--kit-accent,#7c5cff) 60%,#000));box-shadow:0 8px 0 color-mix(in srgb,var(--kit-accent,#7c5cff) 45%,#000),0 14px 30px rgba(0,0,0,.35);transition:transform .08s}' +
    '.kit-btn:active{transform:translateY(4px);box-shadow:0 4px 0 color-mix(in srgb,var(--kit-accent,#7c5cff) 45%,#000)}' +
    '.kit-meta{margin-top:14px;font-size:13px;opacity:.7}' +
    '.kit-banner{position:fixed;left:0;right:0;top:30%;text-align:center;pointer-events:none;z-index:6;opacity:0}' +
    '.kit-banner b{display:block;font-size:44px;font-weight:900;letter-spacing:1px;color:#fff;text-shadow:0 0 18px var(--kit-accent,#7c5cff),0 4px 14px rgba(0,0,0,.6)}.kit-banner span{display:block;margin-top:6px;font-size:16px;font-weight:800;opacity:.85;text-shadow:0 2px 8px rgba(0,0,0,.6)}' +
    '.kit-banner.go{animation:kitbn 1.6s ease-out forwards}@keyframes kitbn{0%{opacity:0;transform:scale(.6)}12%{opacity:1;transform:scale(1.08)}22%{transform:scale(1)}78%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}' +
    '.kit-chs{display:flex;flex-direction:column;gap:10px;margin-top:14px}.kit-ch{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;padding:10px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font:inherit;text-align:left;cursor:pointer;transition:transform .1s,background .15s}' +
    '.kit-ch:hover,.kit-ch:focus-visible{background:color-mix(in srgb,var(--kit-accent,#7c5cff) 35%,transparent);outline:none}.kit-ch:active{transform:scale(.97)}.kit-ch i{font-style:normal;font-size:30px;line-height:1;pointer-events:none}.kit-ch b{display:block;font-size:16px;pointer-events:none}.kit-ch small{display:block;opacity:.75;font-size:13px;margin-top:2px;pointer-events:none}.kit-ch span{pointer-events:none}' +
    '.kit-cd{margin-top:12px;font-size:12px;opacity:.6}' +
    '.kit-btns{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:calc(20px + env(safe-area-inset-bottom));display:none;gap:14px;align-items:flex-end;z-index:6;touch-action:none;-webkit-user-select:none;user-select:none}' +
    '.kit-pad{width:66px;height:66px;border-radius:50%;border:2px solid rgba(255,255,255,.45);background:color-mix(in srgb,var(--c,#7c5cff) 58%,transparent);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);color:#fff;font:900 12px ui-rounded,system-ui,sans-serif;letter-spacing:.04em;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 6px 18px rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.25);touch-action:none;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}' +
    '.kit-btns{flex-direction:row-reverse}.kit-pad i{font-style:normal;font-size:22px;line-height:1;pointer-events:none}.kit-pad span{pointer-events:none}.kit-pad.on{transform:scale(.9);filter:brightness(1.3)}';

  Kit.game = function (cfg) {
    cfg = cfg || {};
    var landscape = cfg.orientation === 'landscape';
    var W = cfg.width || (landscape ? 640 : 360), H = cfg.height || (landscape ? 360 : 640);
    var accent = cfg.color || '#7c5cff', bg = cfg.bg || '#0b1020';
    var title = cfg.title || document.title || 'Game';
    var bestKey = 'kit:best:' + title;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.documentElement.style.setProperty('--kit-accent', accent);
    document.body.style.background = bg;
    var canvas = document.querySelector('canvas') || document.createElement('canvas');
    canvas.classList.add('kit-c'); if (!canvas.parentNode) document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var g = {
      W: W, H: H, ctx: ctx, canvas: canvas, state: 'menu', score: 0, best: 0, lives: cfg.lives || 0, level: 1,
      t: 0, dt: 0, frame: 0, data: {}, sfx: function (n) { if (SFX[n]) SFX[n](); }, tone: tone, noise: noise,
      vibrate: function (ms) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms || 20); } catch (e) {} },
    };
    for (var k in M) g[k] = M[k];
    g.fmt = fmtNum;
    var fmtScore = typeof cfg.formatScore === 'function' ? cfg.formatScore : cfg.formatScore ? fmtNum : function (n) { return String(Math.floor(n)); };
    musicSet(cfg.music || '', title);
    g.music = function (style) { musicSet(style || '', title); if (!style) musicRun(false); else if (mus.on) { musicRun(false); musicRun(true); } };
    try { g.best = Number(localStorage.getItem(bestKey)) || 0; } catch (e) {}
    g.save = function (key, val) { try { localStorage.setItem('kit:' + title + ':' + key, JSON.stringify(val)); } catch (e) {} };
    g.load = function (key, def) { try { var v = localStorage.getItem('kit:' + title + ':' + key); return v == null ? def : JSON.parse(v); } catch (e) { return def; } };

    // ---------- layout: logical W×H letterboxed into any screen ----------
    var scale = 1, ox = 0, oy = 0, dpr = 1, vw = 0, vh = 0;
    function resize() {
      vw = Math.max(1, window.innerWidth); vh = Math.max(1, window.innerHeight); dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      scale = Math.min(vw / W, vh / H); ox = (vw - W * scale) / 2; oy = (vh - H * scale) / 2;
      g.viewX = -ox / scale; g.viewY = -oy / scale; g.viewW = vw / scale; g.viewH = vh / scale; // full visible area in game units
    }
    window.addEventListener('resize', resize); resize();

    // ---------- input ----------
    var inp = (g.input = { x: W / 2, y: H / 2, down: false, pressed: false, released: false, tap: false, action: false, swipe: null,
      dragX: 0, dragY: 0, axis: { x: 0, y: 0 }, keys: {}, _kp: {},
      key: function (k) { return !!this.keys[k]; }, keyPressed: function (k) { return !!this._kp[k]; } });
    var sx = 0, sy = 0, st0 = 0, lx = 0, ly = 0;
    function toGame(e) { return { x: (e.clientX - ox) / scale, y: (e.clientY - oy) / scale }; }
    canvas.addEventListener('pointerdown', function (e) {
      audio(); var p = toGame(e); inp.x = p.x; inp.y = p.y; inp.down = true; inp.pressed = true; inp.action = true;
      sx = lx = p.x; sy = ly = p.y; st0 = performance.now(); inp.dragX = inp.dragY = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
      if (g.state !== 'play') onAnyAction();
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = toGame(e); inp.x = p.x; inp.y = p.y;
      if (inp.down) { inp.dragX += p.x - lx; inp.dragY += p.y - ly; lx = p.x; ly = p.y; }
    });
    function up(e) {
      if (!inp.down) return; var p = toGame(e); inp.down = false; inp.released = true;
      var dx = p.x - sx, dy = p.y - sy, d = Math.hypot(dx, dy), dt = performance.now() - st0;
      if (d < 14 && dt < 350) inp.tap = true;
      else if (d > 28) inp.swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    var ACTION_KEYS = { ' ': 1, Enter: 1, ArrowUp: 1, w: 1, W: 1 };
    var SWIPE_KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', s: 'down' };
    window.addEventListener('keydown', function (e) {
      audio();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
      if (!inp.keys[e.key]) { inp._kp[e.key] = true; if (ACTION_KEYS[e.key]) inp.action = true; if (SWIPE_KEYS[e.key]) inp.swipe = SWIPE_KEYS[e.key]; if (btnKeys[e.key]) btnPressed[btnKeys[e.key]] = true; }
      if (btnKeys[e.key]) btnState[btnKeys[e.key]] = true;
      inp.keys[e.key] = true;
      if (g.state === 'choose') { if (/^[1-9]$/.test(e.key)) pick(Number(e.key) - 1); else if (e.key === ' ' || e.key === 'Enter') pick(0); return; }
      if (e.key === 'Escape' || e.key === 'p') { togglePause(); return; }
      if (g.state !== 'play' && (ACTION_KEYS[e.key])) onAnyAction();
    });
    window.addEventListener('keyup', function (e) { inp.keys[e.key] = false; if (btnKeys[e.key]) btnState[btnKeys[e.key]] = false; });
    function computeAxis() {
      var ax = (inp.keys.ArrowRight || inp.keys.d || inp.keys.D ? 1 : 0) - (inp.keys.ArrowLeft || inp.keys.a || inp.keys.A ? 1 : 0);
      var ay = (inp.keys.ArrowDown || inp.keys.s || inp.keys.S ? 1 : 0) - (inp.keys.ArrowUp || inp.keys.w || inp.keys.W ? 1 : 0);
      if (inp.down && !ax && !ay) { // virtual joystick: drag distance from touch start
        var jx = (inp.x - sx) / 40, jy = (inp.y - sy) / 40, l = Math.hypot(jx, jy);
        if (l > 0.15) { if (l > 1) { jx /= l; jy /= l; } ax = jx; ay = jy; }
      }
      inp.axis.x = ax; inp.axis.y = ay;
    }
    function clearFrameInput() { inp.pressed = inp.released = inp.tap = inp.action = false; inp.swipe = null; inp.dragX = inp.dragY = 0; inp._kp = {}; btnPressed = {}; }

    // ---------- on-screen action buttons (work while the other thumb drags): g.buttons([{id, label, icon, key, color}]) ----------
    var btnBox = null, btnState = {}, btnPressed = {}, btnKeys = {};
    inp.button = function (id) { return !!btnState[id]; };
    inp.buttonPressed = function (id) { return !!btnPressed[id]; };
    g.buttons = function (list) {
      if (btnBox) btnBox.remove(); btnKeys = {}; btnState = {};
      btnBox = document.createElement('div'); btnBox.className = 'kit-btns';
      (list || []).forEach(function (b) {
        var el = document.createElement('button'); el.type = 'button'; el.className = 'kit-pad'; el.setAttribute('aria-label', b.label || b.id);
        el.innerHTML = (b.icon ? '<i>' + esc(b.icon) + '</i>' : '') + '<span>' + esc(b.label || b.id) + '</span>';
        if (b.color) el.style.setProperty('--c', b.color);
        var on = function (e) { e.preventDefault(); e.stopPropagation(); audio(); if (!btnState[b.id]) btnPressed[b.id] = true; btnState[b.id] = true; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (er) {} };
        var off = function () { btnState[b.id] = false; el.classList.remove('on'); };
        el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
        el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        [].concat(b.key || []).forEach(function (k) { btnKeys[k] = b.id; });
        btnBox.appendChild(el);
      });
      document.body.appendChild(btnBox); hudShown = null;
    };

    // ---------- effects ----------
    var parts = [], floats = [], timers = [], shakeT = 0, shakeA = 0, flashA = 0, flashC = '#fff';
    g.particles = function (x, y, o) {
      o = typeof o === 'string' ? { color: o } : o || {};
      var n = o.n || 14;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = (o.speed || 160) * (0.35 + Math.random());
        parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: (o.life || 0.6) * (0.6 + Math.random() * 0.6), max: 0,
          size: (o.size || 4) * (0.6 + Math.random() * 0.8), color: Array.isArray(o.color) ? M.pick(o.color) : o.color || accent, g: o.gravity || 0 });
        parts[parts.length - 1].max = parts[parts.length - 1].life;
      }
    };
    g.shake = function (a) { shakeA = Math.max(shakeA, a || 8); shakeT = 0.25; };
    g.flash = function (c, a) { flashC = c || '#fff'; flashA = a || 0.35; };
    g.floatText = function (x, y, text, color, size) { floats.push({ x: x, y: y, text: String(text), color: color || '#fff', size: size || 22, life: 0.9 }); };
    g.after = function (sec, fn) { timers.push({ t: sec, fn: fn, rep: 0 }); };
    g.every = function (sec, fn) { timers.push({ t: sec, fn: fn, rep: sec }); };
    g.ramp = function (from, to, seconds) { return from + (to - from) * Math.min(1, g.t / (seconds || 60)); };

    // ---------- drawing helpers ----------
    g.clear = function (c) { ctx.fillStyle = c || bg; ctx.fillRect(g.viewX, g.viewY, g.viewW, g.viewH); };
    g.circle = function (x, y, r, c) { ctx.fillStyle = c || '#fff'; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); };
    g.ring = function (x, y, r, c, w) { ctx.strokeStyle = c || '#fff'; ctx.lineWidth = w || 2; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.stroke(); };
    g.rect = function (x, y, w, h, c, r) {
      ctx.fillStyle = c || '#fff';
      if (r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); } else ctx.fillRect(x, y, w, h);
    };
    g.line = function (x1, y1, x2, y2, c, w) { ctx.strokeStyle = c || '#fff'; ctx.lineWidth = w || 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    g.text = function (s, x, y, o) {
      o = o || {}; ctx.font = (o.weight || 800) + ' ' + (o.size || 20) + 'px ui-rounded,system-ui,sans-serif';
      ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.baseline || 'middle'; ctx.fillStyle = o.color || '#fff';
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 12; }
      ctx.fillText(String(s), x, y); ctx.shadowBlur = 0;
    };
    g.emoji = function (ch, x, y, size, rot) {
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.font = (size || 32) + 'px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(ch, 0, size * 0.06 || 0); ctx.restore();
    };
    g.glow = function (c, blur) { ctx.shadowColor = c || accent; ctx.shadowBlur = blur == null ? 16 : blur; };
    g.noGlow = function () { ctx.shadowBlur = 0; };
    g.grad = function (x0, y0, x1, y1, stops) { var gr = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (c, i) { gr.addColorStop(i / Math.max(1, stops.length - 1), c); }); return gr; };

    // ---------- animated backdrops: g.backdrop('stars'|'snow'|'bubbles'|'bokeh'|'grid'|'clouds'|'waves', {colors:[top,bottom], tint, speed, alpha}) ----------
    var bdT = 0, bdGr = {}, bdF = {};
    function field(style) {
      if (bdF[style]) return bdF[style];
      var r = seeded(style + title), n = { stars: 110, snow: 70, bubbles: 26, bokeh: 16, clouds: 8, grid: 26 }[style] || 0, out = [];
      for (var i = 0; i < n; i++) out.push({ x: r(), y: r(), s: r(), p: r() * 6.283, l: i % 3 });
      return (bdF[style] = out);
    }
    g.backdrop = function (style, o) {
      o = o || {}; var X = g.viewX, Y = g.viewY, VW = g.viewW, VH = g.viewH, T = bdT * (o.speed == null ? 1 : o.speed), tint = o.tint || '#ffffff', A = o.alpha == null ? 1 : o.alpha, i, p, x, y;
      if (o.colors) {
        var gk = o.colors.join() + '|' + Math.round(Y) + '|' + Math.round(VH), gr = bdGr[gk];
        if (!gr) { gr = bdGr[gk] = ctx.createLinearGradient(0, Y, 0, Y + VH); o.colors.forEach(function (c, j) { gr.addColorStop(j / Math.max(1, o.colors.length - 1), c); }); }
        ctx.fillStyle = gr; ctx.fillRect(X, Y, VW, VH);
      }
      var F = field(style); ctx.save(); ctx.globalAlpha = A;
      if (style === 'stars') {
        for (i = 0; i < F.length; i++) { p = F[i]; var sp = [6, 16, 38][p.l]; y = Y + ((p.y * VH + T * sp) % VH); x = X + p.x * VW;
          ctx.globalAlpha = A * (0.35 + 0.65 * Math.abs(Math.sin(bdT * (0.6 + p.s) + p.p))) * [0.45, 0.7, 1][p.l]; ctx.fillStyle = tint; ctx.fillRect(x, y, [1, 1.5, 2.2][p.l], [1, 1.5, 2.2][p.l] * (p.l === 2 ? 2.5 : 1)); }
      } else if (style === 'snow') {
        for (i = 0; i < F.length; i++) { p = F[i]; y = Y + ((p.y * VH + T * (14 + p.s * 30)) % VH); x = X + ((p.x * VW + Math.sin(bdT * 0.7 + p.p) * 14) % VW);
          ctx.globalAlpha = A * 0.35 + p.s * 0.5; ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(x, y, 1 + p.s * 2.4, 0, 6.283); ctx.fill(); }
      } else if (style === 'bubbles') {
        ctx.strokeStyle = tint; ctx.lineWidth = 1.5;
        for (i = 0; i < F.length; i++) { p = F[i]; var rr = 4 + p.s * 14; y = Y + VH - ((p.y * (VH + 40) + T * (12 + p.s * 26)) % (VH + 40)) + 20; x = X + p.x * VW + Math.sin(bdT + p.p) * 10;
          ctx.globalAlpha = A * 0.18 + p.s * 0.22; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.stroke(); ctx.globalAlpha *= 0.9; ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.22, 0, 6.283); ctx.fill(); }
      } else if (style === 'bokeh') {
        var cols = Array.isArray(o.tint) ? o.tint : [tint, accent];
        for (i = 0; i < F.length; i++) { p = F[i]; x = X + ((p.x * VW + Math.sin(bdT * 0.13 + p.p) * 40 + T * 3) % VW); y = Y + ((p.y * VH + Math.cos(bdT * 0.11 + p.p) * 40) % VH);
          ctx.globalAlpha = A * 0.07 + p.s * 0.1; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(x, y, 26 + p.s * 60, 0, 6.283); ctx.fill(); }
      } else if (style === 'clouds') {
        ctx.fillStyle = tint;
        for (i = 0; i < F.length; i++) { p = F[i]; var cw = 50 + p.s * 70; x = X + VW + cw - ((p.x * (VW + cw * 2) + T * (6 + p.s * 14)) % (VW + cw * 2)); y = Y + VH * (0.05 + p.y * 0.55);
          ctx.globalAlpha = A * 0.16 + p.s * 0.2; ctx.beginPath(); ctx.arc(x, y, cw * 0.32, 0, 6.283); ctx.arc(x + cw * 0.3, y - cw * 0.12, cw * 0.28, 0, 6.283); ctx.arc(x + cw * 0.55, y + cw * 0.02, cw * 0.24, 0, 6.283); ctx.arc(x - cw * 0.3, y + cw * 0.04, cw * 0.22, 0, 6.283); ctx.fill(); }
      } else if (style === 'grid') {
        var hz = Y + VH * (o.horizon || 0.55), cx = X + VW / 2, sunR = Math.min(VW, VH) * 0.18;
        ctx.globalAlpha = A * 0.9; ctx.fillStyle = o.sun || accent; ctx.beginPath(); ctx.arc(cx, hz - sunR * 0.35, sunR, Math.PI, 0); ctx.fill();
        ctx.globalAlpha = A * 1; ctx.fillStyle = o.city || 'rgba(8,6,24,.92)';
        for (i = 0; i < F.length; i++) { p = F[i]; var bw = VW / F.length; ctx.fillRect(X + i * bw, hz - (10 + p.s * VH * 0.13), bw + 1, 10 + p.s * VH * 0.13); }
        ctx.fillStyle = o.ground || 'rgba(10,4,30,.95)'; ctx.fillRect(X, hz, VW, Y + VH - hz);
        ctx.strokeStyle = tint; ctx.lineWidth = 1.2; ctx.globalAlpha = A * 0.55;
        for (i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(cx + i * VW * 0.02, hz); ctx.lineTo(cx + i * VW * 0.22, Y + VH); ctx.stroke(); }
        for (i = 0; i < 9; i++) { var z = ((i + (T * 0.6) % 1) / 9); y = hz + (Y + VH - hz) * z * z; ctx.globalAlpha = A * 0.15 + z * 0.5; ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + VW, y); ctx.stroke(); }
      } else if (style === 'waves') {
        var top = Y + VH * (o.horizon == null ? 0.35 : o.horizon), bands = 6, wv = function (i, xx) { return top + (Y + VH - top) * Math.pow(i / bands, 1.35) + Math.sin(xx * 0.03 + bdT * (0.8 + i * 0.25) + i) * (3 + i * 2); };
        ctx.fillStyle = tint;
        for (i = 0; i < bands; i++) {
          ctx.globalAlpha = A * Math.max(0.015, 0.11 - i * 0.02); ctx.beginPath(); ctx.moveTo(X, wv(i, 0));
          for (x = 0; x <= VW + 20; x += 20) ctx.lineTo(X + x, wv(i, x));
          for (x = VW + 20; x >= 0; x -= 20) ctx.lineTo(X + x, i + 1 < bands ? wv(i + 1, x) - 2 : Y + VH);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    };

    // ---------- HUD + overlays (DOM = crisp text) ----------
    var hud = document.createElement('div'); hud.className = 'kit-hud';
    hud.innerHTML = '<div><div class="kit-score">0</div><div class="kit-best"></div></div><div class="kit-right"><span class="kit-lives"></span>' +
      '<button class="kit-ib" data-k="mute" aria-label="Sound">' + (muted ? '🔇' : '🔊') + '</button><button class="kit-ib" data-k="pause" aria-label="Pause">⏸</button></div>';
    var showHud = cfg.hud !== false; hud.style.display = 'none';
    document.body.appendChild(hud);
    var elScore = hud.querySelector('.kit-score'), elBest = hud.querySelector('.kit-best'), elLives = hud.querySelector('.kit-lives');
    hud.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    hud.addEventListener('click', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k');
      if (k === 'pause') togglePause();
      if (k === 'mute') { muted = !muted; try { localStorage.setItem('kit:muted', muted ? '1' : '0'); } catch (er) {} e.target.textContent = muted ? '🔇' : '🔊'; }
    });
    var ov = document.createElement('div'); ov.className = 'kit-ov'; document.body.appendChild(ov);
    var overAt = 0;
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    function showOverlay(kind, extra) {
      var body;
      if (kind === 'menu') {
        body = '<div class="kit-emoji">' + esc(cfg.emoji || '🎮') + '</div><div class="kit-title">' + esc(title) + '</div><p class="kit-sub">' + esc(cfg.help || 'Tap to play') + '</p>' +
          '<button class="kit-btn" data-k="go">▶ PLAY</button>' + (g.best ? '<div class="kit-meta">Best: ' + esc(fmtScore(g.best)) + '</div>' : '');
      } else if (kind === 'pause') {
        body = '<div class="kit-emoji">⏸</div><div class="kit-title">Paused</div><button class="kit-btn" data-k="resume">▶ RESUME</button>';
      } else if (kind === 'choose') {
        body = '<div class="kit-title" style="font-size:28px">' + esc(extra.title) + '</div>' + (extra.sub ? '<p class="kit-sub" style="margin:0">' + esc(extra.sub) + '</p>' : '') + '<div class="kit-chs">' +
          extra.options.map(function (o, i) { o = typeof o === 'string' ? { title: o } : o || {}; return '<button class="kit-ch" data-k="pick" data-i="' + i + '">' + (o.icon ? '<i>' + esc(o.icon) + '</i>' : '') + '<span><b>' + esc(o.title || o.name || 'Option ' + (i + 1)) + '</b>' + (o.desc ? '<small>' + esc(o.desc) + '</small>' : '') + '</span></button>'; }).join('') +
          '</div><div class="kit-cd"></div>';
      } else {
        var isNew = extra && extra.newBest;
        body = '<div class="kit-emoji">' + (kind === 'win' ? '🏆' : esc(cfg.overEmoji || '💥')) + '</div><div class="kit-title">' + (kind === 'win' ? esc(cfg.winText || 'You win!') : esc(cfg.overText || 'Game Over')) + '</div>' +
          '<div class="kit-big">' + esc(fmtScore(g.score)) + '</div>' + (isNew ? '<span class="kit-new">NEW BEST!</span>' : '<div class="kit-meta">Best: ' + esc(fmtScore(g.best)) + '</div>') +
          '<button class="kit-btn" data-k="go">↻ PLAY AGAIN</button>';
      }
      ov.innerHTML = '<div class="kit-card">' + body + '</div>'; ov.classList.add('on');
    }
    ov.addEventListener('click', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k');
      if (k === 'go') start(); else if (k === 'resume') resume(); else if (k === 'pick') pick(Number(e.target.getAttribute('data-i'))); else onAnyAction();
    });
    function hideOverlay() { ov.classList.remove('on'); }

    // ---------- banner + choice cards ----------
    var ban = document.createElement('div'); ban.className = 'kit-banner'; document.body.appendChild(ban);
    g.banner = function (text, sub) { ban.innerHTML = '<b>' + esc(text) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : ''); ban.classList.remove('go'); void ban.offsetWidth; ban.classList.add('go'); };
    var ch = null; // {options, cb, left}
    g.choose = function (options, cb, o) {
      if (g.state !== 'play' || !options || !options.length) return;
      o = o || {}; ch = { options: options, cb: cb, left: o.timeout == null ? 12 : o.timeout };
      g.state = 'choose'; SFX.power(); showOverlay('choose', { title: o.title || 'Choose one', sub: o.sub || '', options: options });
    };
    function pick(i) {
      if (g.state !== 'choose' || !ch) return; var c = ch; ch = null;
      i = Math.max(0, Math.min(c.options.length - 1, i || 0)); hideOverlay(); g.state = 'play'; last = performance.now(); SFX.coin(); clearFrameInput();
      if (c.cb) safe(c.cb, i, c.options[i]);
    }

    function onAnyAction() {
      if (g.state === 'menu') start();
      else if ((g.state === 'over' || g.state === 'win') && performance.now() - overAt > 700) start();
      else if (g.state === 'pause') resume();
    }
    function reset() {
      g.score = 0; g.t = 0; g.level = 1; g.lives = cfg.lives || 0; g.data = {};
      parts = []; floats = []; timers = []; shakeA = 0; flashA = 0; ch = null; ban.classList.remove('go');
      if (cfg.init) cfg.init(g);
    }
    function start() {
      audio(); reset(); g.state = 'play'; hideOverlay(); hud.style.display = showHud ? 'flex' : 'none'; SFX.click(); clearFrameInput();
    }
    function finish(kind) {
      if (g.state !== 'play') return;
      g.state = kind; overAt = performance.now(); g.score = Math.floor(g.score);
      var newBest = g.score > g.best;
      if (newBest) { g.best = g.score; try { localStorage.setItem(bestKey, String(g.best)); } catch (e) {} }
      if (kind === 'win') SFX.win(); else { SFX.lose(); g.vibrate(120); }
      setTimeout(function () { showOverlay(kind, { newBest: newBest && g.best > 0 }); }, 450);
    }
    g.over = function () { finish('over'); };
    g.win = function () { finish('win'); };
    g.addScore = function (n, x, y) { g.score += n; if (x != null) g.floatText(x, y, (n > 0 ? '+' : '') + n, cfg.color ? '#fff' : '#ffe066'); };
    g.loseLife = function () { g.lives--; g.shake(10); g.flash('#ff3355', 0.3); SFX.hit(); g.vibrate(60); if (g.lives <= 0) g.over(); return g.lives; };
    function togglePause() { if (g.state === 'play') { g.state = 'pause'; showOverlay('pause'); } else if (g.state === 'pause') resume(); }
    function resume() { g.state = 'play'; hideOverlay(); last = performance.now(); }
    g.pause = togglePause;
    document.addEventListener('visibilitychange', function () { if (document.hidden && g.state === 'play') togglePause(); });

    // ---------- loop ----------
    var last = performance.now(), errCount = 0, lastScore = -1, lastLives = -1, hudShown = false;
    function safe(fn, a, b) {
      try { fn(a, b); } catch (e) { errCount++; if (errCount < 4) console.error(e && e.stack ? e.stack : e); }
    }
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      computeAxis();
      g.dt = dt;
      musicRun(g.state === 'play' || g.state === 'choose');
      if (g.state !== 'pause') bdT += dt;
      if (g.state === 'choose' && ch) {
        ch.left -= dt; var cd = ov.querySelector('.kit-cd'), sec = Math.ceil(ch.left);
        if (cd && cd.getAttribute('data-s') !== String(sec)) { cd.setAttribute('data-s', String(sec)); cd.textContent = 'Auto-picks in ' + Math.max(0, sec) + 's'; }
        if (ch.left <= 0) pick(Math.floor(Math.random() * ch.options.length));
      }
      if (g.state === 'play') {
        g.t += dt; g.frame++;
        for (var i = timers.length - 1; i >= 0; i--) {
          var tm = timers[i]; tm.t -= dt;
          if (tm.t <= 0) { if (tm.rep) tm.t += tm.rep; else timers.splice(i, 1); safe(tm.fn, g); }
        }
        if (cfg.update) safe(cfg.update, g, dt);
      } else if (cfg.idle) safe(cfg.idle, g, dt);
      if (g.state !== 'pause') {
        for (var p = parts.length - 1; p >= 0; p--) { var q = parts[p]; q.life -= dt; if (q.life <= 0) { parts.splice(p, 1); continue; } q.vx *= 0.985; q.vy = q.vy * 0.985 + q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
        for (var f = floats.length - 1; f >= 0; f--) { floats[f].life -= dt; floats[f].y -= 50 * dt; if (floats[f].life <= 0) floats.splice(f, 1); }
        if (shakeT > 0) shakeT -= dt; else shakeA *= 0.8;
        flashA = Math.max(0, flashA - dt * 1.6);
      }
      // draw
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      var sxo = shakeT > 0 ? (Math.random() - 0.5) * shakeA : 0, syo = shakeT > 0 ? (Math.random() - 0.5) * shakeA : 0;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sxo * scale), dpr * (oy + syo * scale));
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      if (cfg.draw) safe(cfg.draw, g, ctx);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      for (var j = 0; j < parts.length; j++) { var r = parts[j]; ctx.globalAlpha = Math.max(0, r.life / r.max); ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(r.x, r.y, r.size, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      for (var h = 0; h < floats.length; h++) { var fl = floats[h]; ctx.globalAlpha = Math.min(1, fl.life * 2); g.text(fl.text, fl.x, fl.y, { size: fl.size, color: fl.color, weight: 900 }); }
      ctx.globalAlpha = 1;
      if (flashA > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = flashA; ctx.fillStyle = flashC; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1; }
      var hudOn = showHud && (g.state === 'play' || g.state === 'pause' || g.state === 'choose');
      if (hudOn !== hudShown) { hudShown = hudOn; hud.style.display = hudOn ? 'flex' : 'none'; if (btnBox) btnBox.style.display = hudOn && g.state !== 'choose' ? 'flex' : 'none'; }
      if (hudOn) {
        if (g.score !== lastScore) { lastScore = g.score; elScore.textContent = fmtScore(g.score); elBest.textContent = g.best ? 'BEST ' + fmtScore(g.best) : ''; }
        if (g.lives !== lastLives) { lastLives = g.lives; elLives.textContent = cfg.lives ? new Array(Math.max(0, Math.min(10, g.lives)) + 1).join(cfg.lifeIcon || '❤️') : ''; }
      }
      clearFrameInput();
    }
    reset();
    g.state = 'menu';
    if (cfg.autostart) start(); else showOverlay('menu');
    requestAnimationFrame(frame);
    Kit.current = g;
    return g;
  };
  Kit.sfx = SFX; Kit.tone = tone; Kit.math = M; Kit.fmt = fmtNum; Kit.musicStyles = Object.keys(MUSIC);
})();
