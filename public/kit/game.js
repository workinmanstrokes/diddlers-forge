/* App Creator Studio — Game Kit v1
 * Gives every generated game: fit-to-screen canvas (any phone, no zoom), unified
 * touch/mouse/keyboard input, synth sound effects, particles, shake, floating text,
 * start / pause / game-over screens, HUD, best score. The model writes only game logic. */
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
    '.kit-meta{margin-top:14px;font-size:13px;opacity:.7}';

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
    try { g.best = Number(localStorage.getItem(bestKey)) || 0; } catch (e) {}
    g.save = function (key, val) { try { localStorage.setItem('kit:' + title + ':' + key, JSON.stringify(val)); } catch (e) {} };
    g.load = function (key, def) { try { var v = localStorage.getItem('kit:' + title + ':' + key); return v == null ? def : JSON.parse(v); } catch (e) { return def; } };

    // ---------- layout: logical W×H letterboxed into any screen ----------
    var scale = 1, ox = 0, oy = 0, dpr = 1, vw = 0, vh = 0;
    function resize() {
      vw = window.innerWidth; vh = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2.5);
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
      if (!inp.keys[e.key]) { inp._kp[e.key] = true; if (ACTION_KEYS[e.key]) inp.action = true; if (SWIPE_KEYS[e.key]) inp.swipe = SWIPE_KEYS[e.key]; }
      inp.keys[e.key] = true;
      if (e.key === 'Escape' || e.key === 'p') { togglePause(); return; }
      if (g.state !== 'play' && (ACTION_KEYS[e.key])) onAnyAction();
    });
    window.addEventListener('keyup', function (e) { inp.keys[e.key] = false; });
    function computeAxis() {
      var ax = (inp.keys.ArrowRight || inp.keys.d || inp.keys.D ? 1 : 0) - (inp.keys.ArrowLeft || inp.keys.a || inp.keys.A ? 1 : 0);
      var ay = (inp.keys.ArrowDown || inp.keys.s || inp.keys.S ? 1 : 0) - (inp.keys.ArrowUp || inp.keys.w || inp.keys.W ? 1 : 0);
      if (inp.down && !ax && !ay) { // virtual joystick: drag distance from touch start
        var jx = (inp.x - sx) / 40, jy = (inp.y - sy) / 40, l = Math.hypot(jx, jy);
        if (l > 0.15) { if (l > 1) { jx /= l; jy /= l; } ax = jx; ay = jy; }
      }
      inp.axis.x = ax; inp.axis.y = ay;
    }
    function clearFrameInput() { inp.pressed = inp.released = inp.tap = inp.action = false; inp.swipe = null; inp.dragX = inp.dragY = 0; inp._kp = {}; }

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
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * 0.06 || 0); ctx.restore();
    };
    g.glow = function (c, blur) { ctx.shadowColor = c || accent; ctx.shadowBlur = blur == null ? 16 : blur; };
    g.noGlow = function () { ctx.shadowBlur = 0; };
    g.grad = function (x0, y0, x1, y1, stops) { var gr = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (c, i) { gr.addColorStop(i / Math.max(1, stops.length - 1), c); }); return gr; };

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
          '<button class="kit-btn" data-k="go">▶ PLAY</button>' + (g.best ? '<div class="kit-meta">Best: ' + g.best + '</div>' : '');
      } else if (kind === 'pause') {
        body = '<div class="kit-emoji">⏸</div><div class="kit-title">Paused</div><button class="kit-btn" data-k="resume">▶ RESUME</button>';
      } else {
        var isNew = extra && extra.newBest;
        body = '<div class="kit-emoji">' + (kind === 'win' ? '🏆' : esc(cfg.overEmoji || '💥')) + '</div><div class="kit-title">' + (kind === 'win' ? esc(cfg.winText || 'You win!') : esc(cfg.overText || 'Game Over')) + '</div>' +
          '<div class="kit-big">' + g.score + '</div>' + (isNew ? '<span class="kit-new">NEW BEST!</span>' : '<div class="kit-meta">Best: ' + g.best + '</div>') +
          '<button class="kit-btn" data-k="go">↻ PLAY AGAIN</button>';
      }
      ov.innerHTML = '<div class="kit-card">' + body + '</div>'; ov.classList.add('on');
    }
    ov.addEventListener('click', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k');
      if (k === 'go') start(); else if (k === 'resume') resume(); else onAnyAction();
    });
    function hideOverlay() { ov.classList.remove('on'); }

    function onAnyAction() {
      if (g.state === 'menu') start();
      else if ((g.state === 'over' || g.state === 'win') && performance.now() - overAt > 700) start();
      else if (g.state === 'pause') resume();
    }
    function reset() {
      g.score = 0; g.t = 0; g.level = 1; g.lives = cfg.lives || 0; g.data = {};
      parts = []; floats = []; timers = []; shakeA = 0; flashA = 0;
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
    var last = performance.now(), errCount = 0, lastScore = -1, lastLives = -1;
    function safe(fn, a, b) {
      try { fn(a, b); } catch (e) { errCount++; if (errCount < 4) console.error(e && e.stack ? e.stack : e); }
    }
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      computeAxis();
      g.dt = dt;
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
      if (showHud && g.state === 'play') {
        if (g.score !== lastScore) { lastScore = g.score; elScore.textContent = String(Math.floor(g.score)); elBest.textContent = g.best ? 'BEST ' + g.best : ''; }
        if (g.lives !== lastLives) { lastLives = g.lives; elLives.textContent = cfg.lives ? new Array(Math.max(0, g.lives) + 1).join(cfg.lifeIcon || '❤️') : ''; }
      }
      if (g.state !== 'play' && g.state !== 'pause') hud.style.display = 'none';
      clearFrameInput();
    }
    reset();
    g.state = 'menu';
    if (cfg.autostart) start(); else showOverlay('menu');
    requestAnimationFrame(frame);
    Kit.current = g;
    return g;
  };
  Kit.sfx = SFX; Kit.tone = tone; Kit.math = M;
})();
