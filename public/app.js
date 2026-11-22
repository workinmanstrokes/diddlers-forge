/* Diddler’s Forge — UI controller (PM/orchestrator for the agent roles lives here too) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(Math.round(n || 0)));
  const fmtDur = (ms) => { const s = Math.round((ms || 0) / 1000); return s < 60 ? s + 's' : s < 3600 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm'; };
  const fmtBytes = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : b >= 1e3 ? Math.round(b / 1e3) + ' KB' : (b || 0) + ' B');
  const ago = (t) => { const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + 'm ago' : s < 86400 ? Math.floor(s / 3600) + 'h ago' : Math.floor(s / 86400) + 'd ago'; };
  const isPhone = () => window.matchMedia('(max-width: 899px)').matches;
  const today = () => new Date().toISOString().slice(0, 10);
  const ROLE = { pm: ['🧭', 'PM'], architect: ['📐', 'Architect'], coder: ['👨‍💻', 'Coder'], qa: ['🧪', 'QA'], debugger: ['🩺', 'Debugger'], you: ['🙋', 'You'] };

  const TEMPLATES = [
    { type: 'game', e: '🚀', t: 'Space Blaster', p: 'Vertical space shooter: drag to steer the ship, auto-fire lasers, waves of enemy formations, power-ups (spread shot, shield), a boss every 5th wave, neon-on-black style with a parallax starfield.' },
    { type: 'game', e: '🧟', t: 'Zombie Survival', p: '2D top-down zombie survival: virtual-stick movement with auto-aim shooting, enemy waves that grow, health and pickups, upgrade choice between waves, and a boss fight every 5th wave.' },
    { type: 'game', e: '🏃', t: 'Neon Runner', p: 'One-tap endless runner: tap to jump (double-tap for double jump), obstacles and gaps, coins, speed ramps up, parallax synthwave city, combo multiplier for coin streaks.' },
    { type: 'game', e: '💎', t: 'Gem Match', p: 'Match-3 puzzle on a 7x9 gem grid: swipe to swap adjacent gems, 3+ in a row clear with cascades, special gems for 4 and 5 matches, 60-second timer, combo multiplier, sparkly clears.' },
    { type: 'game', e: '🐍', t: 'Snake Arena', p: 'Modern snake: swipe or arrow keys to turn, grow by eating glowing orbs, golden orbs give bonus points, walls wrap around, speed up every 5 orbs, smooth movement and a glowing trail.' },
    { type: 'game', e: '🧱', t: 'Brick Smash', p: 'Brick breaker: drag the paddle, the ball shatters colorful bricks with particles, power-ups drop (multi-ball, wide paddle, laser), 3 lives, a new layout each level.' },
    { type: 'game', e: '🎣', t: 'Lunker Rush', p: 'Fishing game: swipe up to cast, wait for a bite, then hold to reel and release to keep the tension meter in the green zone. 12 Michigan fish species with rarity tiers and weights, a collection log, and best catch.' },
    { type: 'game', e: '💰', t: 'Idle Tycoon', p: 'Idle clicker tycoon: tap to earn cash, buy upgrades and auto-earners with escalating costs, big satisfying numbers with K/M/B suffixes, offline earnings, prestige reset for a permanent multiplier.' },
    { type: 'game', e: '🏒', t: 'Air Hockey', p: 'Air hockey vs an AI: drag your mallet in the bottom half, physics puck with wall bounces, the AI defends and attacks, first to 7 wins (g.win when the player wins, g.over when the AI wins), goal celebration effects.' },
    { type: 'app', e: '✅', t: 'Habit Streaks', p: 'Habit tracker: add habits with an emoji, tap to check off today, streak counter and a 7-day dot history per habit, a stats tab with completion rate, celebration effect on streak milestones.' },
    { type: 'app', e: '💸', t: 'Budget Buddy', p: 'Expense tracker: quick-add amount with category chips, monthly budget with a progress bar, list grouped by day, category breakdown bars, edit and delete entries.' },
    { type: 'app', e: '⏱️', t: 'Interval Timer', p: 'Workout interval timer: set work/rest seconds and rounds, a big animated ring countdown, beeps and vibration on transitions, saved presets.' },
    { type: 'app', e: '🧮', t: 'Job Estimator', p: 'Landscaping job estimator: cubic yards of mulch, gravel or topsoil from length, width and depth (inches), price per yard and delivery fee, labor hours × rate, totals with tax; save quotes with a client name and share as text.' },
    { type: 'app', e: '📝', t: 'Quick Notes', p: 'Notes app: fast capture box, pin notes, color tags, search, delete with confirm, everything saved locally.' },
    { type: 'app', e: '🎡', t: 'Decision Wheel', p: 'Decision spinner: editable list of options, a big colorful wheel that spins with easing and a ticking sound, winner celebration, saved wheels.' },
    { type: 'app', e: '🔊', t: 'Soundboard', p: 'Soundboard with 12 big colorful pads, each plays a different synthesized sound (WebAudio, no files), record and play back a sequence, haptic feedback.' },
  ];
  const CHIPS = {
    game: ['🐞 Fix bugs', '✨ Polish the visuals', '🔥 Make it harder over time', '⚡ Add power-ups', '🔊 More sound & juice', '🏆 Add levels', '🎨 New color theme'],
    app: ['🐞 Fix bugs', '✨ Polish the design', '🌗 Add light/dark toggle', '📊 Add a stats screen', '🔍 Add search', '📤 Add share/export', '🎉 Add delight animations'],
  };
  const MODE_HINTS = {
    quick: 'Builds straight away in one pass. Fewest tokens. Tests still run (free) but nothing is auto-fixed.',
    smart: 'Architect plans → you approve → Coder builds → QA tests → Debugger fixes only if something broke.',
    quality: 'Like Smart, but the Coder builds step by step with QA after each step, then QA checks every feature.',
  };
  const SUGGESTED = [
    ['qwen2.5-coder:7b', 'main coder · 16 GB RAM'], ['qwen2.5-coder:3b', 'quick edits · fastest'], ['qwen3:4b', 'planning'],
    ['gemma4:12b', 'optional heavy · slow on CPU'], ['qwen2.5-coder:14b', 'needs a GPU'],
  ];
  const LIBS = [
    ['canvas-confetti', 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'],
    ['matter-js (physics)', 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js'],
    ['howler (audio)', 'https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js'],
  ];

  const S = {
    settings: {}, health: null, models: [], projects: [], usage: null,
    p: null, n: 0, files: {}, binary: {}, viewN: 0, type: 'game', mode: 'smart',
    tab: 'chat', fview: 'editor', device: 'phone', rotated: false, busy: false, abort: null, job: null,
    pvErrors: [], pvRid: 1, buf: {}, deleted: new Set(), cur: 'index.html', term: { running: false, ctl: null },
  };

  // ---------- api ----------
  async function api(path, opts = {}) {
    const o = { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } };
    if (o.body && typeof o.body !== 'string') o.body = JSON.stringify(o.body);
    const res = await fetch('/api' + path, o);
    if (res.status === 401 && path !== '/login') { await pinPrompt(); return api(path, opts); }
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    if (!res.ok) throw Object.assign(new Error((data && data.error) || data || 'HTTP ' + res.status), { status: res.status });
    return data;
  }
  const reportError = (msg) => { try { fetch('/api/log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ level: 'error', msg }) }); } catch (e) { /* offline */ } };
  window.addEventListener('error', (e) => reportError((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', (e) => reportError('unhandled: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)));

  // ---------- toasts & modals ----------
  function toast(msg, kind = '', ms = 2600) {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, ms);
  }
  function modal(title, body, { wide = false, foot = '', onClose } = {}) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog"><div class="m-head"><h2>${title}</h2><button class="icon-btn sm" data-x>✕</button></div><div class="m-body">${body}</div>${foot ? '<div class="m-foot">' + foot + '</div>' : ''}</div>`;
    $('#modalRoot').appendChild(bg);
    const close = () => { bg.remove(); if (onClose) onClose(); };
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-x]')) close(); });
    return { el: bg, close };
  }
  function confirmBox(title, html, okText = 'Confirm', danger = false) {
    return new Promise((resolve) => {
      let done = false; const fin = (v) => { if (!done) { done = true; resolve(v); } };
      const m = modal(title, html, { foot: `<button class="btn ghost" data-no>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${okText}</button>`, onClose: () => fin(false) });
      m.el.addEventListener('click', (e) => { if (e.target.closest('[data-ok]')) { fin(true); m.close(); } else if (e.target.closest('[data-no]')) m.close(); });
    });
  }
  function promptBox(title, label, value = '') {
    return new Promise((resolve) => {
      let done = false; const fin = (v) => { if (!done) { done = true; resolve(v); } };
      const m = modal(title, `<div class="field"><label>${label}</label><input class="inp" id="pbIn" value="${esc(value)}"></div>`, { foot: '<button class="btn primary" data-ok>OK</button>', onClose: () => fin(null) });
      const go = () => { fin($('#pbIn').value.trim()); m.close(); };
      m.el.querySelector('[data-ok]').onclick = go; $('#pbIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => { $('#pbIn').focus(); $('#pbIn').select(); }, 50);
    });
  }
  function pinPrompt() {
    return new Promise((resolve) => {
      const m = modal('🔒 Studio PIN', '<p class="muted">This studio is protected with a PIN.</p><input class="inp" id="pinIn" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN">', { foot: '<button class="btn primary" data-ok>Unlock</button>' });
      const go = async () => { try { await api('/login', { method: 'POST', body: { pin: $('#pinIn').value } }); m.close(); resolve(); } catch (e) { toast(e.message, 'bad'); } };
      m.el.querySelector('[data-ok]').onclick = go; $('#pinIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => $('#pinIn').focus(), 50);
    });
  }

  // ---------- health / models / usage ----------
  async function refreshHealth() {
    try { S.health = await api('/health'); } catch (e) { S.health = { ok: false, ollama: { ok: false, error: e.message } }; }
    renderStatus();
  }
  const roleModel = (r) => (S.settings.roles && S.settings.roles[r]) || (r === 'architect' || r === 'qa' ? S.settings.fastModel || S.settings.codeModel : S.settings.codeModel);
  async function loadModels() {
    try {
      const r = await api('/ollama/api/tags');
      S.models = (r.models || []).map((m) => ({ name: m.name, size: m.size || 0, params: (m.details && m.details.parameter_size) || '' }));
    } catch (e) { S.models = []; }
    const names = S.models.map((m) => m.name); const pick = Engine.pickModels(S.models, S.health && S.health.ram);
    let changed = false;
    if (!S.settings.codeModel || (names.length && !names.includes(S.settings.codeModel))) { if (pick.code) { S.settings.codeModel = pick.code; changed = true; } }
    if (!S.settings.fastModel || (names.length && !names.includes(S.settings.fastModel))) { if (pick.fast) { S.settings.fastModel = pick.fast; changed = true; } }
    for (const r of Object.keys(S.settings.roles || {})) if (S.settings.roles[r] && names.length && !names.includes(S.settings.roles[r])) { S.settings.roles[r] = ''; changed = true; }
    if (changed) S.settings = await api('/settings', { method: 'POST', body: S.settings });
    renderStatus();
  }
  function renderStatus() {
    const b = $('#statusBtn'); const o = S.health && S.health.ollama;
    b.classList.toggle('ok', !!(o && o.ok && S.settings.codeModel)); b.classList.toggle('bad', !(o && o.ok));
    $('#modelTxt').textContent = !o || !o.ok ? 'Ollama offline' : S.settings.codeModel || 'No model';
    renderSetupCard();
  }
  async function loadUsage() { try { S.usage = await api('/usage'); } catch (e) { S.usage = null; } renderUsage(); }
  function renderUsage() { const d = S.usage && S.usage.byDay && S.usage.byDay[today()]; $('#usageTxt').textContent = fmtTok(d ? d.in + d.out : 0); }
  /** measured speed for a model: generation + prompt tokens per second */
  function speedOf(model) {
    const m = S.usage && S.usage.byModel && S.usage.byModel[model];
    if (!m || !m.evalMs) return null;
    return { gen: m.out / (m.evalMs / 1000), prompt: m.promptMs ? m.in / (m.promptMs / 1000) : 0 };
  }
  function estimate(model, outTok, inTok) {
    const sp = speedOf(model); if (!sp || !sp.gen) return '';
    const sec = outTok / sp.gen + (sp.prompt ? inTok / sp.prompt : 0);
    return `about ${fmtDur(sec * 1000)} on ${model} (${sp.gen.toFixed(1)} tok/s measured)`;
  }
  function renderSetupCard() {
    const el = $('#setupCard'); const o = S.health && S.health.ollama;
    if (o && o.ok && S.models.length) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.innerHTML = !o || !o.ok
      ? `<h3>🔌 Connect Ollama</h3><p class="muted">The studio can't reach Ollama at <code>${esc(o ? o.url : '…')}</code>.</p><ol><li>Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noopener">ollama.com</a> on your PC and start it.</li><li>Pull a coding model, e.g. <code>ollama pull qwen2.5-coder:7b</code></li><li>Ollama on another machine? Set its address in <a href="#" data-act="settings">Settings</a>.</li></ol>`
      : `<h3>📦 Get a model</h3><p class="muted">Ollama is running, but there are no models yet. For a 16 GB PC start with <b>qwen2.5-coder:7b</b> and <b>qwen2.5-coder:3b</b>.</p><p><button class="btn primary sm" data-act="settings">Open Settings → pull a model</button></p>`;
  }
  function ready() {
    const o = S.health && S.health.ollama;
    if (!o || !o.ok) { toast('Ollama is not reachable. Start Ollama or fix the address in Settings.', 'bad', 4000); openSettings(); return false; }
    if (!S.settings.codeModel) { toast('Pick a model first.', 'bad'); openSettings(); return false; }
    return true;
  }

  // ---------- routing ----------
  function route() { const m = location.hash.match(/#p=([a-z0-9-]+)/); if (m) openProject(m[1]); else showHome(); }
  async function showHome() {
    document.body.classList.remove('in-work');
    $('#home').classList.remove('hidden'); $('#work').classList.add('hidden'); $('#bottomNav').classList.add('hidden'); $('#ptitle').classList.add('hidden');
    S.p = null; $('#pvFrame').src = 'about:blank'; document.title = 'Diddler’s Forge';
    await loadProjects();
  }
  async function loadProjects() { try { S.projects = await api('/projects'); } catch (e) { S.projects = []; } renderProjects(); }

  // ---------- home ----------
  function renderTemplates() {
    $('#templates').innerHTML = TEMPLATES.filter((t) => t.type === S.type).map((t) =>
      `<button class="tpl" data-act="tpl" data-p="${esc(t.p)}"><span class="e">${t.e}</span><span><b>${esc(t.t)}</b><small>${esc(t.p)}</small></span></button>`).join('');
  }
  function projIcon(p) {
    const bg = `linear-gradient(135deg, ${esc(p.color || '#7c5cff')}, #0b0f1a)`;
    return p.hasIcon ? `<span class="ic" style="background:${bg}"><img src="/play/${p.id}/icon-192.png?${p.updated}" alt="" width="54" height="54"></span>` : `<span class="ic" style="background:${bg}">${esc(p.emoji || '🎮')}</span>`;
  }
  function renderProjects() {
    const el = $('#projects');
    el.innerHTML = !S.projects.length ? '<div class="empty-note">No projects yet. Describe an idea above or tap a starter.</div>' : S.projects.map((p) => {
      const envs = p.envs || {}; const t = p.tests;
      return `<button class="proj" data-act="open" data-id="${p.id}">${projIcon(p)}<span style="min-width:0;flex:1"><b>${esc(p.name)}</b><span class="meta"><span>${p.versions ? 'v' + (envs.dev || p.versions) : 'plan'}</span>${envs.prod ? `<span class="envb prod">PROD v${envs.prod}</span>` : ''}${envs.staging ? `<span class="envb staging">STG v${envs.staging}</span>` : ''}${t ? `<span>${t.fail ? '❌' : t.warn ? '⚠️' : '✅'}</span>` : ''}<span>${ago(p.updated)}</span></span></span></button>`;
    }).join('');
    $('#homeFoot').innerHTML = S.health && S.health.lan && S.health.lan.length ? `📱 On your phone (same Wi-Fi): <b>${esc(S.health.lan[0])}</b>` : '';
  }

  // ---------- workspace ----------
  async function loadVersionFiles(n) {
    if (!n) return { files: {}, binary: {} };
    const v = await api(`/projects/${S.p.id}/versions/${n}`); return { files: v.files || {}, binary: v.binary || {} };
  }
  async function openProject(id) {
    let p; try { p = await api('/projects/' + id); } catch (e) { toast('Project not found', 'bad'); location.hash = ''; return; }
    S.p = p; S.viewN = 0; S.pvErrors = [];
    S.n = p.envs.dev || 0;
    const v = await loadVersionFiles(S.n); S.files = v.files; S.binary = v.binary;
    resetBuffers();
    document.body.classList.add('in-work');
    $('#home').classList.add('hidden'); $('#work').classList.remove('hidden'); $('#bottomNav').classList.remove('hidden'); $('#ptitle').classList.remove('hidden');
    setTab('chat');
    renderHeader(); renderChat(); renderChips(); renderFiles(); renderTests(); renderShip(); loadPreview();
  }
  function renderHeader() {
    if (!S.p) return;
    $('#ptEmoji').textContent = S.p.emoji || '🎮'; $('#ptName').textContent = S.p.name;
    $('#ptVer').textContent = S.n ? 'v' + S.n : 'plan';
    document.title = S.p.name + ' · Diddler’s Forge';
    const v = curVersion(); const t = v && v.tests;
    for (const id of ['#testsBadge', '#testsBadge2']) {
      const b = $(id); if (!t) { b.textContent = ''; b.className = ''; continue; }
      b.textContent = t.summary.fail ? t.summary.fail : t.summary.warn ? t.summary.warn : '✓'; b.className = t.summary.fail ? 'bad' : t.summary.warn ? 'warn' : 'ok';
    }
  }
  const curVersion = () => S.p && S.p.versions.find((v) => v.n === S.n);
  function setTab(tab) {
    if (tab === 'preview' && !isPhone()) tab = 'chat';
    S.tab = tab;
    document.body.className = document.body.className.replace(/\btab-\S+/g, '').trim() + ' tab-' + tab;
    $$('#topTabs button,#bottomNav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.pane.left > .panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));
    if (tab === 'code') { renderFiles(); if (S.fview === 'terminal') loadWorkspace(); }
    if (tab === 'tests') loadActivity();
    if (tab === 'preview') fitDevice();
    if (tab === 'chat') scrollChat();
  }

  // ---------- chat ----------
  function scrollChat() { const l = $('#chatLog'); requestAnimationFrame(() => { l.scrollTop = l.scrollHeight; }); }
  function renderChat() {
    const log = $('#chatLog'); const chat = (S.p && S.p.chat) || [];
    if (!chat.length) {
      log.innerHTML = `<div class="chat-empty"><div style="font-size:40px">${esc(S.p.emoji)}</div><p>${S.n ? 'Ask for any change — the Coder sends small patches, not the whole file, to save tokens.' : 'Nothing built yet.'}</p>${!S.n && S.p.idea ? `<button class="btn primary" data-act="retry">Plan “${esc(S.p.idea.slice(0, 40))}${S.p.idea.length > 40 ? '…' : ''}”</button>` : ''}</div>`;
      return;
    }
    log.innerHTML = chat.map((m, i) => renderEntry(m, i)).join('');
    scrollChat();
  }
  function timelineHtml(logs) {
    return (logs || []).map((l) => `<div class="tl ${l.level || ''}"><span class="tl-r">${(ROLE[l.role] || ['•'])[0]} ${(ROLE[l.role] || ['', l.role])[1]}</span><span class="tl-t">${esc(l.text)}</span></div>`).join('');
  }
  function renderEntry(m, i) {
    if (m.role === 'user') return `<div class="msg user">${esc(m.text)}</div>`;
    if (m.kind === 'plan') return renderPlan(m, i);
    const icon = { build: '🛠️', edit: '✏️', fix: '🩹', error: '⚠️', info: 'ℹ️', cancel: '⏹' }[m.kind] || '🤖';
    const t = m.tests; const tags = [];
    if (m.version) tags.push(`<span class="tag">v${m.version}</span>`);
    if (m.stats) tags.push(`<span class="tag">${fmtTok((m.stats.in || 0) + (m.stats.out || 0))} tokens</span>`, `<span class="tag">${fmtDur(m.stats.ms || 0)}</span>`);
    if (t) tags.push(`<span class="tag ${t.fail ? 'bad' : t.warn ? 'warn' : 'ok'}">tests ${t.pass}✓${t.warn ? ' ' + t.warn + '⚠' : ''}${t.fail ? ' ' + t.fail + '✗' : ''}</span>`);
    const acts = [];
    if (m.version) acts.push(`<button class="btn sm ghost" data-act="view" data-n="${m.version}">👁 Preview v${m.version}</button>`);
    if (m.version && m.version > 1) acts.push(`<button class="btn sm ghost" data-act="diff" data-n="${m.version}">⇆ Changes</button>`);
    if (m.kind === 'error' && m.retry) acts.push(`<button class="btn sm primary" data-act="retry">↻ Try again</button>`);
    return `<div class="msg ai ${m.kind === 'error' ? 'err' : ''}"><div class="job-head"><span>${icon}</span><b>${esc(m.title || '')}</b></div>
      ${m.text ? `<div class="jres">${esc(m.text)}</div>` : ''}${m.log && m.log.length ? `<details><summary>Agent activity (${m.log.length})</summary><div class="timeline">${timelineHtml(m.log)}</div></details>` : ''}
      ${m.raw ? `<details><summary>Model output</summary><pre>${esc(m.raw)}</pre></details>` : ''}
      ${tags.length ? `<div class="jmeta">${tags.join('')}</div>` : ''}${acts.length ? `<div class="jacts">${acts.join('')}</div>` : ''}</div>`;
  }
  function renderChips() { $('#quickChips').innerHTML = S.n > 0 ? CHIPS[S.p.type === 'app' ? 'app' : 'game'].map((c) => `<button data-act="chip" data-t="${esc(c)}">${esc(c)}</button>`).join('') : ''; }
  async function saveChat() { try { await api('/projects/' + S.p.id, { method: 'PUT', body: { chat: S.p.chat } }); } catch (e) { /* non-fatal */ } }
  async function pushChat(entry) { entry.ts = Date.now(); S.p.chat = S.p.chat || []; S.p.chat.push(entry); renderChat(); await saveChat(); }

  // ---------- Architect plan card ----------
  function renderPlan(m, i) {
    const p = m.plan; const pending = m.status === 'pending';
    const head = `<div class="job-head"><span>📐</span><b>${pending ? 'Plan — review &amp; approve' : m.status === 'approved' ? 'Plan approved' : 'Plan ' + m.status}</b><span class="pill">${esc(p.complexity)}</span></div>`;
    if (!pending) {
      return `<div class="msg ai plan done">${head}<div class="jres"><b>${esc(p.emoji)} ${esc(p.name)}</b> — ${esc(p.pitch)}</div><details><summary>Plan details</summary><pre>${esc(Engine.planText(p))}${p.tasks.length ? '\nSteps:\n' + p.tasks.map((t, k) => k + 1 + '. ' + t).join('\n') : ''}</pre></details></div>`;
    }
    const est = Engine.EST_OUT[p.complexity] || 5000; const coder = roleModel('coder');
    const eta = estimate(coder, est, 2200);
    const qs = p.questions.map((q, k) => `<div class="pq"><div class="pq-q">${esc(q.q)}</div><div class="pq-o">${q.options.map((o) => `<button type="button" class="chipb ${q.answer === o ? 'on' : ''}" data-act="plan-ans" data-i="${i}" data-k="${k}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}
      <input class="inp sm" data-pf="q${k}" placeholder="or type your own" value="${q.options.includes(q.answer) ? '' : esc(q.answer)}"></div></div>`).join('');
    return `<div class="msg ai plan" data-plan="${i}">${head}
      <div class="pf-row"><input class="inp emoji" data-pf="emoji" value="${esc(p.emoji)}" aria-label="Emoji"><input class="inp" data-pf="name" value="${esc(p.name)}" aria-label="Name"></div>
      <textarea class="inp" data-pf="pitch" rows="2" aria-label="Pitch">${esc(p.pitch)}</textarea>
      ${qs ? `<div class="pf-label">The Architect has ${p.questions.length} question${p.questions.length > 1 ? 's' : ''}</div>${qs}` : ''}
      <div class="pf-label">Features (one per line)</div><textarea class="inp" data-pf="features" rows="${Math.min(8, p.features.length + 1)}">${esc(p.features.join('\n'))}</textarea>
      <div class="two"><div><div class="pf-label">Controls</div><input class="inp" data-pf="controls" value="${esc(p.controls)}"></div><div><div class="pf-label">Look</div><input class="inp" data-pf="look" value="${esc(p.look)}"></div></div>
      <div class="pf-label">Build steps</div><textarea class="inp" data-pf="tasks" rows="${Math.min(6, p.tasks.length + 1)}">${esc(p.tasks.join('\n'))}</textarea>
      <div class="pf-est">≈ ${fmtTok(est)} output tokens${eta ? ' · ' + esc(eta) : ' · speed is measured after your first run'}${S.mode === 'quality' && p.tasks.length > 1 ? ` · built in ${p.tasks.length} steps with tests between` : ''}</div>
      <div class="jacts"><button class="btn primary" data-act="plan-approve" data-i="${i}">✅ Approve &amp; build</button><button class="btn" data-act="plan-redo" data-i="${i}">↻ New plan</button><button class="btn ghost" data-act="plan-cancel" data-i="${i}">Cancel</button></div></div>`;
  }
  function readPlanForm(i) {
    const el = $(`[data-plan="${i}"]`); const m = S.p.chat[i]; const p = m.plan; if (!el) return p;
    const v = (k) => { const f = el.querySelector(`[data-pf="${k}"]`); return f ? f.value.trim() : ''; };
    p.emoji = v('emoji') || p.emoji; p.name = v('name') || p.name; p.pitch = v('pitch');
    p.features = v('features').split('\n').map((x) => x.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
    p.tasks = v('tasks').split('\n').map((x) => x.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
    p.controls = v('controls'); p.look = v('look');
    p.questions.forEach((q, k) => { const own = v('q' + k); if (own) q.answer = own; });
    return p;
  }

  // ---------- live job card (agent timeline) ----------
  function jobCard(title, steps) {
    $('.chat-empty') && $('.chat-empty').remove();
    const el = document.createElement('div'); el.className = 'msg ai';
    el.innerHTML = `<div class="job-head"><span>⚙️</span><b>${esc(title)}</b><span class="job-time">0s</span></div>
      <div class="steps">${steps.map((s) => `<span class="step" data-s="${s}">${s}</span>`).join('')}</div>
      <div class="jbar"><i></i></div><div class="jstats">Waiting for the model…</div><div class="timeline live"></div><div class="japprove"></div>
      <details class="jstream"><summary>Live output</summary><pre></pre></details>`;
    $('#chatLog').appendChild(el); scrollChat();
    const t0 = Date.now(); let expect = 4000, phaseT = Date.now(), lastPaint = 0;
    const timer = setInterval(() => { el.querySelector('.job-time').textContent = fmtDur(Date.now() - t0); }, 1000);
    const pre = el.querySelector('pre'), bar = el.querySelector('.jbar i'), stats = el.querySelector('.jstats'), tl = el.querySelector('.timeline');
    return {
      el,
      phase(s, exp) {
        el.querySelectorAll('.step').forEach((x) => { if (x.dataset.s === s) x.className = 'step active'; else if (x.classList.contains('active')) x.className = 'step done'; });
        if (exp) expect = exp; phaseT = Date.now(); bar.style.width = '3%'; stats.textContent = 'Waiting for the model…';
      },
      stream(text) {
        const tokens = Engine.estTokens(text); const now = performance.now(); if (now - lastPaint < 150) return; lastPaint = now;
        const secs = (Date.now() - phaseT) / 1000;
        stats.textContent = `~${fmtTok(tokens)} tokens · ${secs > 1 ? (tokens / secs).toFixed(1) : '…'} tok/s`;
        bar.style.width = Math.min(96, 3 + (tokens / expect) * 93) + '%';
        pre.textContent = text.slice(-1800); pre.scrollTop = pre.scrollHeight;
      },
      log(role, text, level) {
        const item = { ts: Date.now(), role, text, level: level || '' };
        if (S.job) S.job.log.push(item);
        tl.insertAdjacentHTML('beforeend', timelineHtml([item])); scrollChat();
      },
      approve(html) { // resolves true/false when the user decides
        return new Promise((resolve) => {
          const box = el.querySelector('.japprove');
          box.innerHTML = `<div class="approve">${html}<div class="jacts"><button class="btn sm" data-a="diff">⇆ Review changes</button><button class="btn sm primary" data-a="yes">Accept</button><button class="btn sm danger" data-a="no">Reject</button></div></div>`;
          scrollChat(); toast('The Coder needs your approval', '', 4000);
          box.onclick = (e) => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'diff') { box.dispatchEvent(new CustomEvent('diff')); return; } box.innerHTML = ''; box.onclick = null; resolve(a.dataset.a === 'yes'); };
        });
      },
      stop() { clearInterval(timer); el.remove(); },
    };
  }
  function setBusy(b) {
    S.busy = b;
    $('#sendBtn').classList.toggle('hidden', b); $('#stopBtn').classList.toggle('hidden', !b); $('#chatInput').disabled = b;
    $$('[data-act=build],[data-act=chip],[data-act=retry],[data-act=plan-approve],[data-act=plan-redo]').forEach((x) => { x.disabled = b; });
  }

  // ---------- model calls ----------
  async function call(role, messages, card, opts = {}) {
    const model = roleModel(role);
    const r = await Engine.chat({ model, messages, settings: S.settings, signal: S.abort && S.abort.signal, maxOut: opts.maxOut, temperature: opts.temperature, format: opts.format, onToken: (t) => card && card.stream(t) });
    if (S.job) { S.job.in += r.stats.in; S.job.out += r.stats.out; S.job.ms += r.stats.ms; }
    if (card && r.stats.evalMs) card.log(role, `${fmtTok(r.stats.out)} tokens out · ${(r.stats.out / (r.stats.evalMs / 1000)).toFixed(1)} tok/s${r.stats.loadMs > 2000 ? ' · model load ' + fmtDur(r.stats.loadMs) : ''}`, 'dim');
    api('/usage', { method: 'POST', body: { model, in: r.stats.in, out: r.stats.out, ms: r.stats.ms, evalMs: r.stats.evalMs, promptMs: r.stats.promptMs, projectId: S.p && S.p.id } }).then((u) => { S.usage = u; renderUsage(); }).catch(() => {});
    return r;
  }

  // ---------- flows ----------
  async function newBuild(idea, type, mode) {
    if (S.busy || !ready()) return;
    const name = idea.replace(/[^\w\s'-]/g, ' ').trim().split(/\s+/).slice(0, 4).join(' ').replace(/^./, (c) => c.toUpperCase()) || 'New ' + type;
    let p; try { p = await api('/projects', { method: 'POST', body: { type, idea, name: name.slice(0, 40), emoji: type === 'app' ? '✨' : '🎮' } }); } catch (e) { toast(e.message, 'bad'); return; }
    history.replaceState(null, '', '#p=' + p.id);
    await openProject(p.id);
    await pushChat({ role: 'user', text: idea });
    if (mode === 'quick' || S.settings.planFirst === false) await runJob('build', { idea, type, mode });
    else await runPlan(idea, type);
  }

  async function runPlan(idea, type) {
    if (S.busy || !ready()) return;
    S.abort = new AbortController(); S.job = { in: 0, out: 0, ms: 0, log: [] }; setBusy(true);
    const card = jobCard('Architect is planning', ['Plan']);
    try {
      card.phase('Plan', 500); card.log('pm', 'New ' + type + ' request → asking the Architect for a plan');
      const r = await call('architect', Engine.architectMessages(type, idea), card, { maxOut: 900, temperature: 0.6, format: Engine.PLAN_SCHEMA });
      const raw = Engine.parseJson(r.text);
      if (!raw) throw Object.assign(new Error('The Architect did not return a readable plan. Try again or pick a different planning model in Settings.'), { raw: r.text });
      const plan = Engine.normalizePlan(raw, type);
      if (!plan.features.length) plan.features = [idea];
      if (!plan.tasks.length) plan.tasks = ['Complete playable core of: ' + idea];
      card.stop();
      (S.p.chat || []).forEach((m) => { if (m.kind === 'plan' && m.status === 'pending') m.status = 'replaced'; });
      await pushChat({ role: 'ai', kind: 'plan', status: 'pending', plan, idea, type, stats: { ...S.job } });
      if (plan.emoji || plan.name) { S.p.emoji = plan.emoji; S.p.name = plan.name; renderHeader(); api('/projects/' + S.p.id, { method: 'PUT', body: { name: plan.name, emoji: plan.emoji } }).catch(() => {}); }
      toast('Plan ready — review and approve', 'good');
    } catch (e) {
      card.stop();
      if (e.name === 'AbortError') await pushChat({ role: 'ai', kind: 'cancel', title: 'Stopped', text: 'Planning cancelled.' });
      else await pushChat({ role: 'ai', kind: 'error', title: 'Planning failed', text: e.message, raw: (e.raw || '').slice(-2000), retry: true });
    } finally { setBusy(false); S.abort = null; S.job = null; }
  }

  async function runJob(kind, args) {
    if (S.busy || !ready()) return;
    if (dirtyCount() && kind !== 'build') await saveBuffers(true);
    const mode = args.mode || S.mode; const plan = args.plan || null;
    const stepMode = kind === 'build' && mode === 'quality' && plan && plan.tasks.length > 1;
    const steps = kind === 'build' ? ['Write', ...(stepMode ? ['Steps'] : []), 'Test', 'Fix', ...(mode === 'quality' ? ['Review'] : [])] : ['Patch', 'Test', 'Fix'];
    const title = kind === 'build' ? 'Building ' + (plan ? plan.name : 'your ' + (args.type || S.p.type)) : kind === 'fix' ? 'Fixing problems' : 'Applying: ' + (args.request || '').slice(0, 50);
    S.abort = new AbortController(); S.job = { in: 0, out: 0, ms: 0, log: [] }; setBusy(true);
    const card = jobCard(title, steps);
    const entry = { role: 'ai', kind, title: '', text: '' };
    let lastRaw = '';
    try {
      let files = { ...S.files }; let message = '';
      if (kind === 'build') {
        const type = args.type || S.p.type;
        let brief = plan ? Engine.planText(plan) : '';
        if (stepMode) brief += `\n\nBuild ONLY step 1 now: ${plan.tasks[0]}\nMake it complete and playable on its own. Later steps arrive as patches: ${plan.tasks.slice(1).join('; ')}. Structure the code so they are easy to add.`;
        card.log('pm', plan ? `Plan approved: ${plan.features.length} features, ${plan.tasks.length} steps${stepMode ? ' — building step by step' : ''}` : 'Quick build — no plan');
        card.phase('Write', stepMode ? 3500 : Engine.EST_OUT[(plan && plan.complexity) || 'medium']);
        card.log('coder', stepMode ? 'Step 1/' + plan.tasks.length + ': ' + plan.tasks[0] : 'Writing the whole ' + type);
        const msgs = Engine.buildMessages(type, args.idea, brief);
        const r = await call('coder', msgs, card); lastRaw = r.text;
        let ex = Engine.extractHtml(r.text);
        if (ex && !ex.complete && r.stats.doneReason === 'length') {
          card.log('coder', 'Hit the output limit — continuing where it stopped', 'warn');
          const r2 = await call('coder', [...msgs, { role: 'assistant', content: r.text }, { role: 'user', content: 'Continue exactly where you stopped. Output only the rest of the file — no repetition, no explanations.' }], card);
          ex = Engine.extractHtml(r.text + r2.text.replace(/^```[a-z]*\n?/i, ''));
        }
        if (!ex) throw Object.assign(new Error('The model did not return an HTML file. Try again, or switch to a stronger Coder model in Settings.'), { raw: r.text });
        if (!ex.complete) card.log('coder', 'Output looks cut off — QA will check it', 'warn');
        files = { ...files, 'index.html': ex.html }; message = stepMode ? 'Step 1: ' + plan.tasks[0].slice(0, 80) : 'Initial build';
      } else {
        card.phase('Patch', kind === 'fix' ? 700 : 900);
        const problems = args.problems || [];
        card.log(kind === 'fix' ? 'debugger' : 'coder', kind === 'fix' ? `Diagnosing ${problems.length} problem${problems.length > 1 ? 's' : ''}` : 'Patching: ' + args.request.slice(0, 90));
        const res = await patchFlow(files, kind === 'fix' ? Engine.fixMessages(files, problems) : Engine.editMessages(files, args.request, S.p.idea), args.request || 'Fix: ' + problems.join('; '), card, kind === 'fix' ? 'debugger' : 'coder');
        lastRaw = res.raw; files = res.files; entry.text = res.how;
        message = kind === 'fix' ? 'Fix: ' + (problems[0] || 'problems').slice(0, 80) : args.request;
      }
      let v = await saveFiles(files, message, kind, roleModel('coder'));
      card.phase('Test'); let tests = await qaRun(v.n, card);

      if (stepMode) {
        card.phase('Steps', 900);
        for (let k = 1; k < plan.tasks.length; k++) {
          tests = await debugLoop(tests, card, mode);
          card.log('coder', `Step ${k + 1}/${plan.tasks.length}: ${plan.tasks[k]}`);
          const res = await patchFlow(S.files, Engine.editMessages(S.files, 'Add step ' + (k + 1) + ': ' + plan.tasks[k] + '\nKeep everything that already works.', args.idea), plan.tasks[k], card, 'coder');
          v = await saveFiles(res.files, 'Step ' + (k + 1) + ': ' + plan.tasks[k].slice(0, 80), 'build', roleModel('coder'));
          tests = await qaRun(v.n, card);
        }
      }
      tests = await debugLoop(tests, card, mode);

      if (mode === 'quality' && plan && plan.features.length && !tests.summary.fail) {
        card.phase('Review', 300); card.log('qa', 'Checking every planned feature against the code');
        try {
          const r = await call('qa', Engine.qaMessages(S.files, plan.features), card, { maxOut: 800, temperature: 0.1, format: Engine.QA_SCHEMA });
          const j = Engine.parseJson(r.text); const missing = j && Array.isArray(j.results) ? j.results.filter((x) => x && x.ok === false) : [];
          if (!missing.length) card.log('qa', `All ${plan.features.length} features present ✓`, 'ok');
          else {
            card.log('qa', `${missing.length} feature(s) missing: ${missing.map((x) => x.feature).join('; ').slice(0, 160)}`, 'warn');
            const req = 'Implement these missing features: ' + missing.map((x) => x.feature + (x.note ? ' (' + x.note + ')' : '')).join('; ');
            const res = await patchFlow(S.files, Engine.editMessages(S.files, req, args.idea), req, card, 'coder');
            v = await saveFiles(res.files, 'QA: add missing features', 'build', roleModel('coder'));
            tests = await debugLoop(await qaRun(v.n, card), card, mode);
          }
        } catch (e) { if (e.name === 'AbortError') throw e; card.log('qa', 'Feature review skipped: ' + e.message, 'warn'); }
      }

      const sum = tests.summary;
      entry.title = kind === 'build' ? `Built ${S.p.name}` : kind === 'fix' ? 'Fixed' : 'Updated';
      entry.text = [entry.text, sum.fail ? `${sum.fail} test${sum.fail > 1 ? 's' : ''} still failing — open Tests or tap “🐞 Fix bugs”.` : sum.warn ? 'Works — a few warnings in Tests.' : 'All tests passed.'].filter(Boolean).join(' ');
      entry.version = S.n; entry.tests = sum; entry.stats = { in: S.job.in, out: S.job.out, ms: S.job.ms }; entry.log = S.job.log.slice(-30);
      card.log('pm', `Done — v${S.n} saved${sum.fail ? ' with failing tests' : ''}`, sum.fail ? 'warn' : 'ok');
      card.stop(); await pushChat(entry);
      renderChips(); toast(sum.fail ? 'Saved v' + S.n + ' — some tests failing' : 'v' + S.n + ' ready ✓', sum.fail ? 'bad' : 'good');
      if (isPhone() && !sum.fail) setTab('preview');
    } catch (e) {
      const log = S.job ? S.job.log.slice(-30) : [];
      card.stop();
      if (e.name === 'AbortError') await pushChat({ role: 'ai', kind: 'cancel', title: 'Stopped', text: 'Cancelled — finished steps are saved as versions; nothing else changed.', log, stats: { ...S.job } });
      else await pushChat({ role: 'ai', kind: 'error', title: 'Something went wrong', text: e.message, raw: (e.raw || lastRaw || '').slice(-3000), retry: kind === 'build' && !S.n, log, stats: { ...S.job } });
    } finally {
      if (S.job && S.job.log.length) api(`/projects/${S.p.id}/activity`, { method: 'POST', body: { items: S.job.log } }).catch(() => {});
      setBusy(false); S.abort = null; S.job = null;
    }
  }

  /** Debugger loop: repair until tests pass or the attempt limit is hit. A version is saved before every repair. */
  async function debugLoop(tests, card, mode) {
    const rounds = mode === 'quick' ? 0 : mode === 'quality' ? Math.max(2, S.settings.autoFix || 0) : S.settings.autoFix || 0;
    let round = 0;
    while (tests.problems.length && round < rounds) {
      round++; card.phase('Fix', 700);
      card.log('debugger', `Repair ${round}/${rounds}: ${tests.problems[0].slice(0, 140)}`);
      try {
        const res = await patchFlow(S.files, Engine.fixMessages(S.files, tests.problems.slice(0, 8)), 'Fix: ' + tests.problems.join('; '), card, 'debugger');
        const v = await saveFiles(res.files, 'Repair ' + round + ': ' + tests.problems[0].slice(0, 70), 'fix', roleModel('debugger'));
        card.phase('Test'); tests = await qaRun(v.n, card);
      } catch (e) { if (e.name === 'AbortError') throw e; card.log('debugger', 'Repair failed: ' + e.message, 'warn'); break; }
    }
    if (tests.problems.length && rounds) card.log('debugger', `Stopped after ${round} attempt${round === 1 ? '' : 's'} (limit ${rounds}) — see Tests`, 'warn');
    return tests;
  }

  async function patchFlow(files, msgs, request, card, role) {
    const r = await call(role, msgs, card);
    const blocks = Engine.parseBlocks(r.text, 'index.html');
    if (blocks.length) {
      const a = Engine.applyToFiles(files, blocks);
      if (a.failed.length) {
        card.log(role, `${a.failed.length} patch${a.failed.length > 1 ? 'es' : ''} didn't match — asking for exact text`, 'warn');
        const r2 = await call(role, Engine.retryPatchMessages(a.files, request, a.failed), card);
        const b2 = Engine.parseBlocks(r2.text, 'index.html');
        const a2 = b2.length ? Engine.applyToFiles(a.files, b2) : { files: a.files, failed: a.failed, applied: 0, touched: [] };
        if (!a.applied && !a2.applied) {
          const rw = rewriteCandidate(files, r2.text); if (rw) return approveRewrite(files, rw, card, r2.text);
          throw Object.assign(new Error('Could not apply the change — the patch text did not match the files.'), { raw: r.text });
        }
        const n = a.applied + a2.applied;
        card.log(role, `Applied ${n} patch${n > 1 ? 'es' : ''} to ${[...new Set([...a.touched, ...a2.touched])].join(', ')}`);
        return { files: a2.files, how: `Applied ${n} patch${n > 1 ? 'es' : ''}.`, partial: a2.failed.length > 0, raw: r.text };
      }
      card.log(role, `Applied ${a.applied} small patch${a.applied > 1 ? 'es' : ''} to ${a.touched.join(', ')}`);
      return { files: a.files, how: `Applied ${a.applied} small patch${a.applied > 1 ? 'es' : ''}.`, raw: r.text };
    }
    const rw = rewriteCandidate(files, r.text);
    if (rw) return approveRewrite(files, rw, card, r.text);
    throw Object.assign(new Error('The model reply had no usable patch or file.'), { raw: r.text });
  }
  function rewriteCandidate(files, text) {
    const out = { ...files }; let any = false;
    const named = Engine.extractFiles(text);
    for (const [p, c] of Object.entries(named)) { out[p] = c; any = true; }
    const ex = Engine.extractHtml(text);
    if (ex && ex.complete && !named['index.html']) { out['index.html'] = ex.html; any = true; }
    return any ? out : null;
  }
  /** Rule from the blueprint: never overwrite whole files without approval. */
  async function approveRewrite(oldFiles, newFiles, card, raw) {
    const changed = Object.keys(newFiles).filter((p) => newFiles[p] !== oldFiles[p]);
    const lines = (s) => (s || '').split('\n').length;
    const html = `<b>The Coder wants to rewrite whole file${changed.length > 1 ? 's' : ''}:</b> ${changed.map((p) => `${esc(p)} (${lines(oldFiles[p])} → ${lines(newFiles[p])} lines)`).join(', ')}.<br><span class="muted">Small local models sometimes drop features when rewriting. Review the changes first.</span>`;
    const box = card.el.querySelector('.japprove');
    const onDiff = () => showDiffText(changed.map((p) => [p, oldFiles[p] || '', newFiles[p]]), 'Proposed rewrite');
    box.addEventListener('diff', onDiff);
    card.log('coder', 'Proposed a full rewrite — waiting for your approval', 'warn');
    const ok = await card.approve(html);
    box.removeEventListener('diff', onDiff);
    if (!ok) { card.log('you', 'Rejected the rewrite', 'warn'); throw new Error('Rewrite rejected — nothing was changed.'); }
    card.log('you', 'Approved the rewrite', 'ok');
    return { files: newFiles, how: 'Rewrote ' + changed.join(', ') + ' (approved).', raw };
  }

  /** Save a whole files map as a new version (only changed files are sent). */
  async function saveFiles(newFiles, message, kind, model) {
    const changed = {}; const deleted = [];
    for (const [p, c] of Object.entries(newFiles)) if (S.files[p] !== c) changed[p] = c;
    for (const p of Object.keys(S.files)) if (!(p in newFiles)) deleted.push(p);
    if (!Object.keys(changed).length && !deleted.length) throw new Error('The change did not modify anything.');
    const r = await api(`/projects/${S.p.id}/versions`, { method: 'POST', body: { base: S.n, files: changed, deleted, message, kind, model, tokens: S.job ? { in: S.job.in, out: S.job.out } : null } });
    afterSave(r, newFiles);
    return r.version;
  }
  function afterSave(r, newFiles) {
    const prevKey = (S.p.emoji || '') + (S.p.color || '');
    S.p = { ...r.project, chat: S.p.chat };
    S.n = r.version.n; S.viewN = 0;
    if (newFiles) { S.files = { ...newFiles }; }
    resetBuffers(); renderHeader(); renderFiles(); renderShip(); loadPreview();
    if (!S.p.hasIcon || prevKey !== (S.p.emoji || '') + (S.p.color || '')) makeIcons().catch(() => {});
  }
  async function qaRun(n, card) {
    if (card) card.log('qa', 'Running tests on a ' + (S.p.orientation === 'landscape' ? '844×390' : '390×844') + ' phone screen');
    const res = await testAndStore(n);
    if (card) card.log('qa', `${res.summary.pass} passed · ${res.summary.warn} warnings · ${res.summary.fail} failed${res.problems.length ? ' — ' + res.problems[0].slice(0, 120) : ''}`, res.summary.fail ? 'bad' : res.summary.warn ? 'warn' : 'ok');
    return res;
  }
  async function testAndStore(n) {
    const isCur = n === S.n;
    const src = isCur ? { files: S.files, binary: S.binary } : await loadVersionFiles(n);
    const res = await Tester.runTests({ id: S.p.id, tag: 'v' + n, type: S.p.type, orientation: S.p.orientation, files: src.files, binary: src.binary });
    const tests = { summary: res.summary, checks: res.checks, errors: res.errors.slice(0, 10), fps: res.fps, problems: res.problems, external: res.external, ts: Date.now() };
    const v = S.p.versions.find((x) => x.n === n); if (v) v.tests = tests;
    api(`/projects/${S.p.id}/versions/${n}/tests`, { method: 'POST', body: { tests } }).catch(() => {});
    renderHeader(); renderTests(); renderShip(); if (S.fview === 'libs') renderLibs();
    return res;
  }
  async function makeIcons() {
    const draw = (size) => {
      const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, size, size); g.addColorStop(0, S.p.color || '#7c5cff'); g.addColorStop(1, '#0b0f1a');
      x.fillStyle = g; x.fillRect(0, 0, size, size);
      const r = x.createRadialGradient(size * 0.3, size * 0.25, 0, size * 0.3, size * 0.25, size * 0.8); r.addColorStop(0, 'rgba(255,255,255,.28)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = r; x.fillRect(0, 0, size, size);
      x.font = `${Math.round(size * 0.52)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = size * 0.05; x.shadowOffsetY = size * 0.02;
      x.fillText(S.p.emoji || '🎮', size / 2, size * 0.54);
      return c.toDataURL('image/png');
    };
    const p = await api(`/projects/${S.p.id}/icon`, { method: 'POST', body: { png192: draw(192), png512: draw(512) } });
    S.p.hasIcon = p.hasIcon;
  }

  // ---------- preview ----------
  async function loadPreview(draftTag) {
    const tag = draftTag || (S.viewN ? 'v' + S.viewN : S.n ? 'v' + S.n : '');
    $('#pvEmpty').classList.toggle('hidden', !!tag); $('#device').classList.toggle('hidden', !tag);
    S.pvErrors = []; renderPvErrors();
    $('#pvLabel').textContent = !tag ? '' : draftTag ? 'unsaved edits' : 'v' + (S.viewN || S.n) + (S.viewN ? ' (older)' : '');
    $('#openTab').href = S.p ? (draftTag ? `/play/${S.p.id}/${draftTag}/` : S.viewN ? `/play/${S.p.id}/v${S.viewN}/` : `/play/${S.p.id}/dev/`) : '#';
    const banner = $('#pvBanner');
    if (S.viewN) { banner.classList.remove('hidden'); banner.innerHTML = `Viewing <b>v${S.viewN}</b> (latest is v${S.n}) <span class="grow"></span><button class="btn sm" data-act="view-latest">Back to latest</button><button class="btn sm primary" data-act="restore" data-n="${S.viewN}">↺ Restore v${S.viewN}</button>`; }
    else banner.classList.add('hidden');
    if (!tag) { $('#pvFrame').src = 'about:blank'; return; }
    S.pvRid++;
    $('#pvFrame').src = `/play/${S.p.id}/${tag}/?acs=preview&rid=${S.pvRid}`;
    fitDevice();
  }
  function renderPvErrors() {
    const b = $('#pvErrors');
    if (!S.pvErrors.length) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden'); b.textContent = `⚠ ${S.pvErrors.length} error${S.pvErrors.length > 1 ? 's' : ''} — tap to fix with AI`;
  }
  function fitDevice() {
    const dev = $('#device'), stage = $('#pvStage');
    if (isPhone()) { dev.style.transform = ''; return; }
    let w = 390, h = 844;
    if (S.device === 'tablet') { w = 820; h = 1180; }
    if (S.rotated && S.device !== 'desktop') [w, h] = [h, w];
    dev.classList.toggle('desktop', S.device === 'desktop');
    const sw = stage.clientWidth - 40, sh = stage.clientHeight - 40;
    if (S.device === 'desktop') { dev.style.width = Math.max(320, sw) + 'px'; dev.style.height = Math.max(300, sh) + 'px'; dev.style.transform = 'translate(-50%,-50%)'; return; }
    const pad = 24; dev.style.width = w + pad + 'px'; dev.style.height = h + pad + 'px';
    dev.style.transform = `translate(-50%,-50%) scale(${Math.min(1, sw / (w + pad), sh / (h + pad))})`;
  }
  let lsTimer = 0;
  window.addEventListener('message', (e) => {
    const d = e.data; if (!d || typeof d !== 'object' || e.source !== $('#pvFrame').contentWindow) return;
    if (d.type === 'acs-err' && d.rid === S.pvRid) { if (S.pvErrors.length < 10 && !S.pvErrors.some((x) => x.msg === d.msg)) { S.pvErrors.push(d); renderPvErrors(); } }
    else if (d.type === 'acs-ls' && S.p) { const id = S.p.id; clearTimeout(lsTimer); lsTimer = setTimeout(() => api(`/projects/${id}/pvls`, { method: 'PUT', body: d.d }).catch(() => {}), 400); }
  });

  // ---------- Files tab: explorer + editor ----------
  function resetBuffers() { S.buf = { ...S.files }; S.deleted = new Set(); if (!(S.cur in S.buf) && !(S.cur in S.binary)) S.cur = 'index.html' in S.buf ? 'index.html' : Object.keys(S.buf)[0] || 'index.html'; }
  const dirtyList = () => Object.keys(S.buf).filter((p) => S.buf[p] !== S.files[p]);
  const dirtyCount = () => dirtyList().length + S.deleted.size;
  function fileIcon(p) { return /\.html?$/.test(p) ? '🌐' : /\.m?js$/.test(p) ? '📜' : /\.css$/.test(p) ? '🎨' : /\.json$/.test(p) ? '🧾' : /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(p) ? '🖼' : /\.(mp3|ogg|wav)$/i.test(p) ? '🔊' : /\.md$/.test(p) ? '📝' : '📄'; }
  function renderFiles() {
    if (!S.p) return;
    $$('#fileSeg button').forEach((b) => b.classList.toggle('active', b.dataset.fview === S.fview));
    $$('[data-fview-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.fviewPanel !== S.fview));
    if (S.fview === 'libs') return renderLibs();
    if (S.fview === 'terminal') return renderTerminal();
    const all = [...new Set([...Object.keys(S.buf), ...Object.keys(S.binary)])].filter((p) => !S.deleted.has(p)).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
    const dirty = new Set(dirtyList());
    $('#fileList').innerHTML = all.map((p) => {
      const depth = p.split('/').length - 1; const nm = p.split('/').pop(); const dir = p.split('/').slice(0, -1).join('/');
      return `<button class="fitem ${p === S.cur ? 'on' : ''}" data-act="file-open" data-p="${esc(p)}" style="--d:${depth}" title="${esc(p)}"><span>${fileIcon(p)}</span><span class="fn">${dir ? `<i>${esc(dir)}/</i>` : ''}${esc(nm)}</span>${dirty.has(p) ? '<b class="dot">●</b>' : p in S.binary ? `<small>${fmtBytes(S.binary[p])}</small>` : ''}</button>`;
    }).join('') || '<p class="muted" style="padding:10px">No files yet.</p>';
    $('#filesCount').textContent = all.length;
    const isBin = S.cur in S.binary && !(S.cur in S.buf);
    $('#editor').classList.toggle('hidden', isBin); $('#binView').classList.toggle('hidden', !isBin);
    $('#curFile').textContent = S.cur;
    if (isBin) {
      const url = `/api/projects/${S.p.id}/versions/${S.n}/file?path=${encodeURIComponent(S.cur)}`;
      $('#binView').innerHTML = /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(S.cur) ? `<img src="${url}" alt=""><p class="muted">${fmtBytes(S.binary[S.cur])}</p>` : /\.(mp3|ogg|wav)$/i.test(S.cur) ? `<audio controls src="${url}"></audio>` : `<p class="muted">Binary file · ${fmtBytes(S.binary[S.cur])}</p>`;
      $('#binView').innerHTML += `<p><a class="btn sm" href="${url}&dl=1">⬇ Download</a></p>`;
      $('#codeInfo').textContent = fmtBytes(S.binary[S.cur]) + ' · use it as "' + S.cur + '"';
    } else {
      const ta = $('#code'); if (ta.dataset.file !== S.cur || ta.value !== (S.buf[S.cur] || '')) { ta.value = S.buf[S.cur] || ''; ta.dataset.file = S.cur; ta.scrollTop = 0; }
      syncEditor();
    }
    $('#saveBtn').disabled = !dirtyCount();
    $('#saveBtn').textContent = dirtyCount() ? `💾 Save (${dirtyCount()})` : '💾 Saved';
  }
  const TOK = /(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`)|(<\/?[a-zA-Z][\w-]*|\/?>)|\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|this|true|false|null|undefined|typeof|of|in|async|await|try|catch|finally|throw|import|export|default|from)\b|(\b\d+(?:\.\d+)?\b|#[0-9a-fA-F]{3,8}\b)/g;
  function highlight(code) {
    let out = '', last = 0, m; TOK.lastIndex = 0;
    while ((m = TOK.exec(code))) { out += esc(code.slice(last, m.index)); out += `<span class="${m[1] ? 't-c' : m[2] ? 't-s' : m[3] ? 't-t' : m[4] ? 't-k' : 't-n'}">${esc(m[0])}</span>`; last = TOK.lastIndex; }
    return out + esc(code.slice(last)) + '\n';
  }
  let hlRaf = 0;
  function syncEditor() {
    const code = $('#code').value, big = code.length > 160000;
    $('.ed-wrap').classList.toggle('plain', big); $('#hl').innerHTML = big ? '' : highlight(code);
    const lines = code.split('\n').length; let g = ''; for (let i = 1; i <= lines; i++) g += i + '\n';
    $('#gutter').textContent = g;
    $('#codeInfo').textContent = `${lines} lines · ${(code.length / 1024).toFixed(1)} KB · ~${fmtTok(Engine.estTokens(code))} tokens`;
    syncScroll();
  }
  function syncScroll() { const ta = $('#code'); $('#hl').scrollTop = ta.scrollTop; $('#hl').scrollLeft = ta.scrollLeft; $('#gutter').scrollTop = ta.scrollTop; }
  async function saveBuffers(silent) {
    if (!dirtyCount()) return;
    const changed = {}; for (const p of dirtyList()) changed[p] = S.buf[p];
    const r = await api(`/projects/${S.p.id}/versions`, { method: 'POST', body: { base: S.n, files: changed, deleted: [...S.deleted], message: 'Edited ' + Object.keys(changed).concat([...S.deleted].map((d) => '−' + d)).slice(0, 3).join(', '), kind: 'manual', model: 'you' } });
    const nf = { ...S.files, ...changed }; for (const d of S.deleted) delete nf[d];
    for (const d of S.deleted) delete S.binary[d];
    afterSave(r, nf);
    if (!silent) toast('Saved v' + S.n, 'good');
    testAndStore(S.n);
  }
  async function runDraft() {
    if (!dirtyCount()) { loadPreview(); if (isPhone()) setTab('preview'); return; }
    const changed = {}; for (const p of dirtyList()) changed[p] = S.buf[p];
    const d = await api(`/projects/${S.p.id}/drafts`, { method: 'POST', body: { base: S.n, files: changed, deleted: [...S.deleted] } });
    loadPreview('d-' + d.token); if (isPhone()) setTab('preview');
  }
  async function structural(files, deleted, message) {
    const r = await api(`/projects/${S.p.id}/versions`, { method: 'POST', body: { base: S.n, files, deleted, message, kind: 'manual', model: 'you' } });
    const v = await loadVersionFiles(r.version.n); S.binary = v.binary; afterSave(r, v.files); testAndStore(S.n);
  }

  // ---------- Terminal ----------
  async function loadWorkspace() {
    if (!S.p || !S.health) return;
    if (!S.health.terminal) return renderTerminal();
    try { S.term.ws = await api(`/projects/${S.p.id}/workspace`); } catch (e) { S.term.ws = null; }
    renderTerminal();
  }
  function renderTerminal() {
    const el = $('#termPanel'); if (!el) return;
    if (!S.health || !S.health.terminal) {
      el.querySelector('.term-lock').classList.remove('hidden'); el.querySelector('.term-ui').classList.add('hidden'); return;
    }
    el.querySelector('.term-lock').classList.add('hidden'); el.querySelector('.term-ui').classList.remove('hidden');
    const ws = S.term.ws;
    $('#termCwd').textContent = ws ? 'workspace/' + S.p.id + (ws.cwd === '.' ? '' : '/' + ws.cwd) : '…';
    $('#termOpen').classList.toggle('hidden', !(S.health && S.health.local));
    $('#termStop').classList.toggle('hidden', !S.term.running); $('#termRun').classList.toggle('hidden', S.term.running);
    const ch = (ws && ws.changes) || [];
    $('#termChanges').classList.toggle('hidden', !ch.length);
    $('#termChanges').innerHTML = ch.length ? `<span>${ch.length} file${ch.length > 1 ? 's' : ''} changed in the terminal: ${esc(ch.slice(0, 4).join(', '))}${ch.length > 4 ? '…' : ''}</span><button class="btn sm primary" data-act="term-import">Save as new version</button>` : '';
  }
  function termWrite(text, cls) {
    const out = $('#termOut'); const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text; out.appendChild(s);
    if (out.childNodes.length > 1500) out.removeChild(out.firstChild);
    out.scrollTop = out.scrollHeight;
  }
  async function termRun(cmd) {
    if (!cmd || S.term.running) return;
    if (cmd === 'clear' || cmd === 'cls') { $('#termOut').textContent = ''; return; }
    termWrite('› ' + cmd + '\n', 't-cmd');
    S.term.running = true; S.term.ctl = new AbortController(); renderTerminal();
    try {
      const res = await fetch(`/api/projects/${S.p.id}/terminal`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cmd }), signal: S.term.ctl.signal });
      if (!res.ok) { const j = await res.json().catch(() => ({})); termWrite((j.error || 'HTTP ' + res.status) + '\n', 't-err'); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue;
          const j = JSON.parse(line);
          if (j.o) termWrite(j.o); if (j.e) termWrite(j.e, 't-err');
          if ('exit' in j) { termWrite(`[exit ${j.exit}]\n`, j.exit ? 't-err' : 't-dim'); if (S.term.ws) { S.term.ws.cwd = j.cwd; S.term.ws.changes = j.changes; } }
        }
      }
    } catch (e) { if (e.name !== 'AbortError') termWrite(e.message + '\n', 't-err'); else termWrite('[stopped]\n', 't-err'); }
    finally { S.term.running = false; S.term.ctl = null; renderTerminal(); }
  }

  // ---------- Libraries (dependencies) ----------
  function renderLibs() {
    const el = $('#libsPanel'); if (!el || !S.p) return;
    const st = Tester.staticChecks(S.files, S.binary);
    const vendor = [...Object.keys(S.files), ...Object.keys(S.binary)].filter((p) => p.startsWith('vendor/'));
    el.innerHTML = `<div class="libs">
      <h3>Detected external files</h3>
      ${st.external.length ? `<p class="muted">These load from the internet, so the app breaks offline and on the installed version. Bundle them into <code>vendor/</code>:</p>
        <div class="liblist">${st.external.map((u, k) => `<label class="libitem"><input type="checkbox" checked data-lib="${k}"><span>${esc(u)}</span></label>`).join('')}</div>
        <button class="btn primary sm" data-act="libs-bundle">📦 Bundle selected for offline</button>` : '<p class="muted">✅ None — this project works fully offline.</p>'}
      ${st.bare.length ? `<p class="warn-note">Bare imports (${esc(st.bare.join(', '))}) need a bundled file. Add the library by URL below, then import it from <code>vendor/…</code>.</p>` : ''}
      <h3>Add a library</h3>
      <div class="row"><input class="inp" id="libUrl" placeholder="https://cdn.jsdelivr.net/npm/…/file.min.js"><button class="btn" data-act="libs-add">Download</button></div>
      <div class="sugg">${LIBS.map(([n, u]) => `<button data-act="libs-sugg" data-u="${esc(u)}">${esc(n)}</button>`).join('')}</div>
      <p class="muted small">The file is saved into <code>vendor/</code> and a script tag is added to index.html. The AI is told it's available. You approve every download.</p>
      <h3>Bundled libraries (${vendor.length})</h3>
      ${vendor.length ? vendor.map((p) => `<div class="libitem"><span>${fileIcon(p)} ${esc(p)}</span><small class="muted">${fmtBytes(S.binary[p] || (S.files[p] || '').length)}</small></div>`).join('') : '<p class="muted">None yet.</p>'}
    </div>`;
    el._external = st.external;
  }
  async function bundleLibs(urls, addTags) {
    if (!urls.length) return toast('Nothing selected');
    if (!(await confirmBox('Download ' + urls.length + ' file' + (urls.length > 1 ? 's' : '') + '?', `<p class="muted">The studio server will download:</p><ul class="small">${urls.map((u) => `<li style="word-break:break-all">${esc(u)}</li>`).join('')}</ul><p class="muted">They're saved into <code>vendor/</code> as a new version, so you can roll back.</p>`, 'Download'))) return;
    toast('Downloading…');
    try {
      const r = await api(`/projects/${S.p.id}/libs`, { method: 'POST', body: { urls, addTags } });
      const bad = r.results.filter((x) => !x.ok);
      if (r.version) { const v = await loadVersionFiles(r.version.n); S.binary = v.binary; afterSave(r, v.files); testAndStore(S.n); }
      toast(bad.length ? `${r.results.length - bad.length} bundled, ${bad.length} failed: ${bad[0].error}` : 'Bundled ✓', bad.length ? 'bad' : 'good', 5000);
    } catch (e) { toast(e.message, 'bad'); }
  }

  // ---------- Tests panel + activity ----------
  function renderTests() {
    const head = $('#testsHead'), body = $('#testsBody'); if (!S.p) return;
    const v = curVersion(); const t = v && v.tests;
    let html = '';
    if (!S.n) { head.innerHTML = '<div class="info"><h3>No build yet</h3><p class="muted">QA runs automatically after every build and edit.</p></div>'; }
    else if (!t) { head.innerHTML = `<div class="info"><h3>v${S.n} not tested</h3><p class="muted">Runs locally — costs no tokens.</p></div><button class="btn primary" data-act="test">🧪 Run tests</button>`; }
    else {
      const s = t.summary, total = s.pass + s.warn + s.fail || 1, pct = Math.round((s.pass + s.warn * 0.5) / total * 100);
      const col = s.fail ? 'var(--bad)' : s.warn ? 'var(--warn)' : 'var(--good)';
      head.innerHTML = `<div class="score" style="background:conic-gradient(${col} ${pct}%, var(--s2) 0)"><div style="width:58px;height:58px;border-radius:50%;background:var(--bg2);display:grid;place-items:center">${pct}</div></div>
        <div class="info"><h3>v${S.n}: ${s.fail ? s.fail + ' failing' : s.warn ? 'passing with warnings' : 'all passing'}</h3><p class="muted">${s.pass} passed · ${s.warn} warnings · ${s.fail} failed · ${ago(t.ts)}</p></div>
        <div class="row wrap"><button class="btn sm" data-act="test">↻ Re-run</button>${(t.problems || []).length || s.warn ? `<button class="btn sm primary" data-act="fix-tests">🩺 Send to Debugger</button>` : ''}</div>`;
      const icon = { pass: '✓', warn: '!', fail: '✗' };
      html += t.checks.map((c) => `<div class="check"><span class="ci ${c.status}">${icon[c.status]}</span><div><b>${esc(c.name)}</b>${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</div></div>`).join('');
      if (t.errors && t.errors.length) html += `<div class="errbox"><h4>JavaScript errors</h4>${t.errors.map((e) => `<div>${esc(e.msg)}${e.file ? `<code>${esc(e.file)}${e.line ? ':' + e.line : ''}${e.code ? '  ' + esc(e.code) : ''}</code>` : ''}</div>`).join('')}</div>`;
    }
    html += `<h3 class="sub-h">Error console &amp; agent activity</h3><div class="console" id="activityLog"><p class="muted">Loading…</p></div>`;
    body.innerHTML = html;
    renderActivity();
  }
  async function loadActivity() { if (!S.p) return; try { S.activity = await api(`/projects/${S.p.id}/activity`); } catch (e) { S.activity = []; } renderActivity(); }
  function renderActivity() {
    const el = $('#activityLog'); if (!el) return;
    const items = (S.activity || []).slice(-80).reverse();
    const pv = S.pvErrors.map((e) => ({ ts: Date.now(), role: 'qa', text: 'Preview error: ' + e.msg + (e.file ? ` (${e.file}:${e.line})` : ''), level: 'bad' }));
    const all = pv.concat(items);
    el.innerHTML = all.length ? all.map((l) => `<div class="tl ${l.level || ''}"><span class="tl-time">${new Date(l.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span class="tl-r">${(ROLE[l.role] || ['•'])[0]} ${(ROLE[l.role] || ['', l.role])[1]}</span><span class="tl-t">${esc(l.text)}</span></div>`).join('') : '<p class="muted">Agent steps, test results and repairs show up here.</p>';
  }

  // ---------- Ship panel ----------
  function renderShip() {
    const el = $('#ship'); if (!S.p) return;
    const p = S.p, envs = p.envs, vs = p.versions;
    const vt = (n) => { const v = vs.find((x) => x.n === n); const t = v && v.tests; return t ? `<span class="tag ${t.summary.fail ? 'bad' : t.summary.warn ? 'warn' : 'ok'}">${t.summary.fail ? t.summary.fail + ' failing' : t.summary.warn ? t.summary.warn + ' warnings' : 'tests pass'}</span>` : '<span class="tag">untested</span>'; };
    const card = (env, label, next) => `<div class="env ${env}"><h4>${label}</h4><div class="v">${envs[env] ? 'v' + envs[env] : '—'}</div><div class="vmsg">${envs[env] ? esc((vs.find((x) => x.n === envs[env]) || {}).message || '') : 'Nothing here yet'}</div>
      ${envs[env] ? vt(envs[env]) : '<span class="tag">empty</span>'}
      <div class="acts">${envs[env] ? `<a class="btn sm" href="/play/${p.id}/${env === 'prod' ? '' : env + '/'}" target="_blank" rel="noopener">↗ Open</a>` : ''}
      ${next ? `<button class="btn sm ${env === 'staging' ? 'good' : 'primary'}" data-act="promote" data-to="${next}" ${envs[env] && envs[env] !== envs[next] ? '' : 'disabled'}>Promote to ${next === 'prod' ? 'Production' : 'Staging'} →</button>` : ''}</div></div>`;
    const exEnv = envs.prod ? 'prod' : envs.staging ? 'staging' : 'dev';
    const multi = Object.keys(S.files).filter((f) => !f.startsWith('vendor/')).length + Object.keys(S.binary).length > 1;
    el.innerHTML = `<div class="pipeline">${card('dev', 'DEV', 'staging')}${card('staging', 'STAGING', 'prod')}${card('prod', 'PRODUCTION', null)}</div>
      <p class="tip">Dev = latest build. Promote to <b>Staging</b> to try it on your phone, then to <b>Production</b> when you're happy. Nothing goes live without you tapping Promote.
      ${envs.prod ? `<br>📱 Install the live app: open <b>${esc(location.origin)}/play/${p.id}/</b> in Chrome on your phone → ⋮ → <b>Install app</b>. Promoting a new version updates it the next time it opens online.` : ''}</p>
      <h3>Export</h3>
      <div class="ex-row"><select id="exEnv">${['prod', 'staging', 'dev'].filter((e) => envs[e]).map((e) => `<option value="${e}" ${e === exEnv ? 'selected' : ''}>${e} (v${envs[e]})</option>`).join('')}</select>
        <button class="btn sm" data-act="export" data-f="zip" ${envs.dev ? '' : 'disabled'}>⬇ PWA .zip (GitHub Pages)</button>
        <button class="btn sm" data-act="export" data-f="html" ${envs.dev ? '' : 'disabled'}>⬇ Single HTML file</button></div>
      <p class="tip">The .zip has every file plus manifest, service worker and icons — upload it to a GitHub repo and turn on Pages.${multi ? ' The single HTML file inlines scripts and styles; images and modules stay in the .zip only.' : ''}</p>
      <h3>Versions (${vs.length})</h3>
      <div class="vlist">${vs.slice().reverse().map((v) => {
        const k = { build: '🛠️', edit: '✏️', fix: '🩹', manual: '⌨️', restore: '↺', import: '⬆', terminal: '⌨', libs: '📦' }[v.kind] || '•';
        const envTags = ['prod', 'staging'].filter((e) => envs[e] === v.n).map((e) => `<span class="envb ${e}">${e.toUpperCase()}</span>`).join(' ');
        const t = v.tests ? (v.tests.summary.fail ? '❌' : v.tests.summary.warn ? '⚠️' : '✅') : '';
        return `<div class="vrow ${v.n === S.n ? 'cur' : ''}"><span class="vn">v${v.n}</span><span class="vm"><b>${k} ${esc(v.message)}</b><small>${ago(v.ts)}${v.tokens ? ' · ' + fmtTok((v.tokens.in || 0) + (v.tokens.out || 0)) + ' tok' : ''}${v.files > 1 ? ' · ' + v.files + ' files' : ''} ${t} ${envTags}</small></span>
          <span class="va"><button class="icon-btn sm" data-act="view" data-n="${v.n}" title="Preview">👁</button>${v.n > 1 ? `<button class="icon-btn sm" data-act="diff" data-n="${v.n}" title="Changes">⇆</button>` : ''}${v.n !== S.n ? `<button class="icon-btn sm" data-act="restore" data-n="${v.n}" title="Restore">↺</button>` : ''}</span></div>`;
      }).join('') || '<p class="muted">No versions yet.</p>'}</div>
      <h3>Project</h3>
      <div class="kv"><span>Tokens used on this project</span><span>${fmtTok((p.usage.in || 0) + (p.usage.out || 0))}</span><span>AI calls</span><span>${p.usage.calls || 0}</span><span>AI time</span><span>${fmtDur(p.usage.ms || 0)}</span></div>
      <div class="danger-zone"><button class="btn sm" data-act="rename">✎ Rename</button><button class="btn sm" data-act="remix">🧬 Remix (copy)</button><button class="btn sm danger" data-act="delete">🗑 Delete</button></div>`;
  }
  async function promote(to) {
    const from = to === 'prod' ? 'staging' : 'dev'; const n = S.p.envs[from]; const v = S.p.versions.find((x) => x.n === n); const t = v && v.tests;
    const warn = t && t.summary.fail ? `<p style="color:#fca5a5">⚠ v${n} has ${t.summary.fail} failing test(s).</p>` : !t ? '<p style="color:#fcd34d">⚠ This version has not been tested.</p>' : '';
    if (!(await confirmBox(`Promote v${n} to ${to === 'prod' ? 'Production' : 'Staging'}?`, `<p><b>v${n}</b> — ${esc(v ? v.message : '')}</p>${warn}<p class="muted">${to === 'prod' ? 'Anyone with the live link (and installed copies) will get this version.' : 'Staging lets you try it as a real app before going live.'}</p>`, 'Promote'))) return;
    try { S.p = { ...(await api(`/projects/${S.p.id}/promote`, { method: 'POST', body: { to, version: n } })), chat: S.p.chat }; renderShip(); toast(`v${n} is now on ${to}`, 'good'); } catch (e) { toast(e.message, 'bad'); }
  }
  async function viewVersion(n) { S.viewN = n === S.n ? 0 : n; loadPreview(); if (isPhone()) setTab('preview'); }
  async function restoreVersion(n) {
    const v = await loadVersionFiles(n);
    const files = { ...v.files }; const deleted = Object.keys(S.files).filter((p) => !(p in files)).concat(Object.keys(S.binary).filter((p) => !(p in v.binary)));
    const r = await api(`/projects/${S.p.id}/versions`, { method: 'POST', body: { base: n, files: {}, message: 'Restored v' + n, kind: 'restore', allowSame: true } });
    void deleted; S.binary = v.binary; afterSave(r, files); toast('Restored as v' + S.n, 'good'); testAndStore(S.n);
  }

  function lineDiff(a, b) {
    const A = a.split('\n'), B = b.split('\n');
    let s = 0; while (s < A.length && s < B.length && A[s] === B[s]) s++;
    let ea = A.length, eb = B.length; while (ea > s && eb > s && A[ea - 1] === B[eb - 1]) { ea--; eb--; }
    const a2 = A.slice(s, ea), b2 = B.slice(s, eb), n = a2.length, m = b2.length, ops = [];
    for (let i = 0; i < s; i++) ops.push([' ', A[i]]);
    if (n * m > 6e6) { a2.forEach((l) => ops.push(['-', l])); b2.forEach((l) => ops.push(['+', l])); }
    else {
      const L = new Uint32Array((n + 1) * (m + 1)), W = m + 1;
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * W + j] = a2[i] === b2[j] ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
      let i = 0, j = 0;
      while (i < n && j < m) { if (a2[i] === b2[j]) { ops.push([' ', a2[i]]); i++; j++; } else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) ops.push(['-', a2[i++]]); else ops.push(['+', b2[j++]]); }
      while (i < n) ops.push(['-', a2[i++]]); while (j < m) ops.push(['+', b2[j++]]);
    }
    for (let i = ea; i < A.length; i++) ops.push([' ', A[i]]);
    return ops;
  }
  function diffHtml(a, b) {
    const ops = lineDiff(a, b); let html = '', run = [], add = 0, del = 0;
    const flush = () => { if (run.length > 6) html += run.slice(0, 2).join('') + `<div class="s">⋯ ${run.length - 4} unchanged lines ⋯</div>` + run.slice(-2).join(''); else html += run.join(''); run = []; };
    for (const [t, l] of ops) { if (t === ' ') { run.push(`<div>  ${esc(l)}</div>`); continue; } flush(); if (t === '+') add++; else del++; html += `<div class="${t === '+' ? 'a' : 'd'}">${t} ${esc(l)}</div>`; }
    flush(); return { html, add, del };
  }
  function showDiffText(pairs, title) {
    const parts = pairs.map(([p, a, b]) => { const d = diffHtml(a, b); return `<p class="muted"><b>${esc(p)}</b> · <span style="color:#86efac">+${d.add}</span> <span style="color:#fca5a5">−${d.del}</span></p><div class="diff">${d.html || '<div class="s">No changes</div>'}</div>`; });
    modal(title, parts.join('') || '<p class="muted">No text changes.</p>', { wide: true });
  }
  async function showDiff(n) {
    const [a, b] = await Promise.all([loadVersionFiles(n - 1).catch(() => ({ files: {}, binary: {} })), loadVersionFiles(n)]);
    const paths = [...new Set([...Object.keys(a.files), ...Object.keys(b.files)])].filter((p) => a.files[p] !== b.files[p]);
    const binCh = [...new Set([...Object.keys(a.binary), ...Object.keys(b.binary)])].filter((p) => a.binary[p] !== b.binary[p]);
    const v = S.p.versions.find((x) => x.n === n);
    showDiffText(paths.map((p) => [p + (!(p in a.files) ? ' (new)' : !(p in b.files) ? ' (deleted)' : ''), a.files[p] || '', b.files[p] || '']), `v${n - 1} → v${n} · ${esc(v ? v.message : '')}${binCh.length ? ' · binary: ' + esc(binCh.join(', ')) : ''}`);
  }

  // ---------- Hardware monitor ----------
  let monTimer = 0;
  async function openMonitor() {
    const m = modal('📈 Monitor', '<div id="monBody"><p class="muted">Reading…</p></div>', { wide: true, onClose: () => clearInterval(monTimer) });
    const tick = async () => {
      if (!document.body.contains(m.el)) return clearInterval(monTimer);
      let s; try { [s] = await Promise.all([api('/system'), loadUsage()]); } catch (e) { return; }
      const used = s.mem.total - s.mem.free, memPct = Math.round(used / s.mem.total * 100);
      const ring = (pct, label, sub, col) => `<div class="gauge"><div class="ring" style="background:conic-gradient(${col} ${pct}%, var(--s2) 0)"><span>${pct}%</span></div><b>${label}</b><small>${sub}</small></div>`;
      const u = S.usage || { byModel: {}, byDay: {} }; const d = (u.byDay || {})[today()] || { in: 0, out: 0, calls: 0 };
      const speeds = Object.entries(u.byModel || {}).filter(([, x]) => x.evalMs).map(([name, x]) => `<tr><td>${esc(name)}</td><td>${(x.out / (x.evalMs / 1000)).toFixed(1)}</td><td>${x.promptMs ? (x.in / (x.promptMs / 1000)).toFixed(0) : '—'}</td><td>${x.calls}</td><td>${fmtTok(x.in + x.out)}</td></tr>`).join('');
      const models = s.ollama.models.length ? s.ollama.models.map((x) => { const gpu = x.size ? Math.round((x.vram || 0) / x.size * 100) : 0; const exp = x.expires ? Math.max(0, Math.round((new Date(x.expires) - Date.now()) / 60000)) : null;
        return `<div class="lm"><b>${esc(x.name)}</b><span>${fmtBytes(x.size)} · ${gpu ? gpu + '% on GPU' : 'CPU only'}${x.ctx ? ' · ctx ' + fmtTok(x.ctx) : ''}${exp != null ? ' · unloads in ' + exp + ' min' : ''}</span></div>`; }).join('')
        : `<p class="muted">${s.ollama.ok ? 'No model loaded right now — the first request loads it (takes a few seconds).' : 'Ollama not reachable.'}</p>`;
      $('#monBody').innerHTML = `
        ${s.mem.free < 1.5e9 ? '<div class="warn-note">⚠ Low free memory. Close other apps, or use a 3B model for edits (Settings → Roles).</div>' : ''}
        <div class="gauges">${ring(s.cpu.pct, 'CPU', s.cpu.cores + ' cores', s.cpu.pct > 85 ? 'var(--warn)' : 'var(--acc2)')}${ring(memPct, 'RAM', fmtBytes(used) + ' / ' + fmtBytes(s.mem.total), memPct > 88 ? 'var(--bad)' : memPct > 75 ? 'var(--warn)' : 'var(--good)')}
          <div class="gauge"><div class="ring flat"><span>${fmtTok(d.in + d.out)}</span></div><b>Tokens today</b><small>${d.calls} AI calls</small></div>
          <div class="gauge"><div class="ring flat"><span>${fmtBytes(s.data.bytes)}</span></div><b>Project storage</b><small>studio uses ${fmtBytes(s.proc.rss)} RAM</small></div></div>
        <h3 class="sub-h">Loaded in Ollama</h3>${models}
        <h3 class="sub-h">Model speed (measured)</h3>${speeds ? `<table class="tbl"><tr><th>Model</th><th>Write tok/s</th><th>Read tok/s</th><th>Calls</th><th>Tokens</th></tr>${speeds}</table>` : '<p class="muted">Shows up after your first AI call.</p>'}
        <p class="muted small">${esc(s.cpu.model)} · ${esc(s.os.platform)} ${esc(s.os.release)} · Node ${esc(s.os.node)} · up ${fmtDur(s.proc.uptime * 1000)}<br>Data folder: <code>${esc(s.data.dir)}</code></p>
        <div class="row wrap"><button class="btn sm" data-act="logs">📜 Studio log</button>${S.health && S.health.local ? '<button class="btn sm danger" data-act="shutdown">⏻ Stop studio</button>' : ''}</div>`;
    };
    await tick(); monTimer = setInterval(tick, 2000);
  }

  // ---------- Settings ----------
  async function openSettings() {
    await refreshHealth(); await loadModels(); await loadUsage();
    const s = S.settings, o = (S.health && S.health.ollama) || {};
    const opts = (sel, allowDefault) => (allowDefault ? `<option value="">(default)</option>` : '') + (S.models.length ? S.models.map((m) => `<option value="${esc(m.name)}" ${m.name === sel ? 'selected' : ''}>${esc(m.name)} · ${(m.size / 1e9).toFixed(1)} GB</option>`).join('') : '<option value="">No models installed</option>');
    const lan = (S.health && S.health.lan) || []; const ram = S.health && S.health.ram;
    const roles = s.roles || {};
    const body = `
      <div class="fset"><h3>Ollama</h3>
        <div class="field"><label>Server address</label><div class="row"><input class="inp" id="sUrl" value="${esc(s.ollamaUrl)}" placeholder="http://127.0.0.1:11434"><button class="btn" data-s="test">Test</button></div>
        <span class="hint" id="sUrlHint">${o.ok ? '✅ Connected · Ollama ' + esc(o.version || '') : '❌ ' + esc(o.error || 'Not reachable')}. The studio talks to Ollama for you, so your phone only needs to reach this studio.</span></div></div>
      <div class="fset"><h3>Models</h3>
        <div class="two"><div class="field"><label>Main model (Coder &amp; Debugger)</label><select class="inp" id="sCode">${opts(s.codeModel)}</select></div>
        <div class="field"><label>Fast model (Architect &amp; QA)</label><select class="inp" id="sFast">${opts(s.fastModel)}</select></div></div>
        ${ram ? `<p class="hint">This PC has ${fmtBytes(ram)} RAM — models bigger than ~${fmtBytes(ram * 0.55)} are skipped for auto-pick.</p>` : ''}
        <details class="roles"><summary>Per-role models (advanced)</summary><p class="hint">On 16 GB machines, using one model for every role avoids reload time between steps.</p><div class="two">
          ${['architect', 'coder', 'debugger', 'qa'].map((r) => `<div class="field"><label>${ROLE[r][0]} ${ROLE[r][1]}</label><select class="inp" data-role="${r}">${opts(roles[r], true)}</select></div>`).join('')}</div></details>
        <div class="field"><label>Download a model</label><div class="row"><input class="inp" id="sPull" placeholder="e.g. qwen2.5-coder:7b"><button class="btn primary" data-s="pull">Pull</button></div>
          <div class="sugg">${SUGGESTED.map(([n, h]) => `<button data-s="sugg" data-n="${n}" title="${h}">${n} <span class="muted">· ${h}</span></button>`).join('')}</div>
          <div class="pullbar hidden" id="pullBar"><i></i></div><span class="hint" id="pullTxt"></span></div></div>
      <div class="fset"><h3>Generation</h3>
        <label class="sw"><span><b>Plan first, then approve</b><br><span class="muted" style="font-size:13px">The Architect asks questions and shows an editable plan before anything is built (Smart &amp; Quality).</span></span><input type="checkbox" id="sPlan" ${s.planFirst !== false ? 'checked' : ''}></label>
        <div class="two">
          <div class="field"><label>Default mode</label><select class="inp" id="sMode">${['quick', 'smart', 'quality'].map((m) => `<option ${m === S.mode ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
          <div class="field"><label>Repair attempts (Smart)</label><select class="inp" id="sFix">${[0, 1, 2, 3].map((n) => `<option ${n === s.autoFix ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label>Context size</label><select class="inp" id="sCtx">${[8192, 12288, 16384, 24576, 32768].map((n) => `<option value="${n}" ${n === s.numCtx ? 'selected' : ''}>${n / 1024}k${n === 16384 ? ' (recommended)' : n === 8192 ? ' (low RAM)' : ''}</option>`).join('')}</select><span class="hint">Kept fixed so Ollama never reloads the model between calls.</span></div>
          <div class="field"><label>Max output tokens</label><select class="inp" id="sOut">${[4096, 6144, 8192, 12288].map((n) => `<option ${n === s.maxOutput ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label>Creativity (temperature ${s.temperature})</label><input type="range" id="sTemp" min="0" max="1" step="0.05" value="${s.temperature}"></div>
          <div class="field"><label>Keep model loaded</label><select class="inp" id="sKeep">${['5m', '15m', '30m', '1h', '-1'].map((k) => `<option value="${k}" ${k === s.keepAlive ? 'selected' : ''}>${k === '-1' ? 'forever' : k}</option>`).join('')}</select></div>
        </div>
        <label class="sw"><span><b>Skip “thinking”</b><br><span class="muted" style="font-size:13px">Reasoning models (qwen3, deepseek-r1…) answer directly. Saves lots of tokens and time.</span></span><input type="checkbox" id="sNoThink" ${s.noThink ? 'checked' : ''}></label></div>
      <div class="fset"><h3>Phone</h3>${lan.length ? lan.map((l) => `<div class="lan"><span class="grow">${esc(l)}</span><button class="btn sm" data-s="copy" data-v="${esc(l)}">Copy</button></div>`).join('') : '<p class="muted">No Wi-Fi address found.</p>'}
        <p class="muted" style="font-size:13px">Open that address in Chrome on your phone (same Wi-Fi). ${S.health && S.health.needsPin ? 'PIN protection is on.' : 'Tip: start the studio with a PIN on shared Wi-Fi — it also unlocks the terminal from your phone.'}</p></div>`;
    const m = modal('⚙︎ Settings', body, { wide: true, foot: '<button class="btn ghost" data-x>Close</button><button class="btn primary" data-s="save">Save</button>' });
    const q = (sel) => m.el.querySelector(sel);
    m.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-s]'); if (!b) return; const k = b.dataset.s;
      if (k === 'test') {
        S.settings = await api('/settings', { method: 'POST', body: { ollamaUrl: q('#sUrl').value.trim() } }); await refreshHealth();
        const oo = S.health.ollama; q('#sUrlHint').textContent = oo.ok ? '✅ Connected · Ollama ' + (oo.version || '') : '❌ ' + (oo.error || 'Not reachable');
        if (oo.ok) { await loadModels(); q('#sCode').innerHTML = opts(S.settings.codeModel); q('#sFast').innerHTML = opts(S.settings.fastModel); }
      }
      if (k === 'sugg') q('#sPull').value = b.dataset.n;
      if (k === 'copy' && navigator.clipboard) navigator.clipboard.writeText(b.dataset.v).then(() => toast('Copied'));
      if (k === 'pull') pullModel(q('#sPull').value.trim(), q, opts);
      if (k === 'save') {
        S.mode = q('#sMode').value; localStorage.setItem('acs:mode', S.mode); setModeSeg();
        const rolesNew = {}; m.el.querySelectorAll('[data-role]').forEach((x) => { rolesNew[x.dataset.role] = x.value; });
        S.settings = await api('/settings', { method: 'POST', body: {
          ollamaUrl: q('#sUrl').value.trim(), codeModel: q('#sCode').value, fastModel: q('#sFast').value, roles: rolesNew, autoFix: Number(q('#sFix').value), planFirst: q('#sPlan').checked,
          numCtx: Number(q('#sCtx').value), maxOutput: Number(q('#sOut').value), temperature: Number(q('#sTemp').value), keepAlive: q('#sKeep').value, noThink: q('#sNoThink').checked, mode: S.mode,
        } });
        m.close(); toast('Settings saved', 'good'); refreshHealth();
      }
    });
  }
  async function pullModel(name, q, opts) {
    if (!name) { toast('Type a model name'); return; }
    const bar = q('#pullBar'), txt = q('#pullTxt'); bar.classList.remove('hidden');
    try {
      const res = await fetch('/api/ollama/api/pull', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: name, name, stream: true }) });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue;
          const j = JSON.parse(line); if (j.error) throw new Error(j.error);
          txt.textContent = j.status + (j.total ? ` · ${((j.completed || 0) / 1e9).toFixed(2)} / ${(j.total / 1e9).toFixed(2)} GB` : '');
          if (j.total) bar.firstElementChild.style.width = Math.round((j.completed || 0) / j.total * 100) + '%';
        }
      }
      txt.textContent = '✅ ' + name + ' ready'; bar.firstElementChild.style.width = '100%';
      await loadModels(); q('#sCode').innerHTML = opts(S.settings.codeModel); q('#sFast').innerHTML = opts(S.settings.fastModel);
    } catch (e) { txt.textContent = '❌ ' + e.message.slice(0, 200); }
  }

  // ---------- actions ----------
  function setModeSeg() { $$('#modeSeg button').forEach((b) => b.classList.toggle('active', b.dataset.mode === S.mode)); $('#modeHint').textContent = MODE_HINTS[S.mode]; }
  const ACT = {
    home: () => { location.hash = ''; },
    settings: (b, e) => { e.preventDefault(); openSettings(); },
    usage: () => openMonitor(),
    logs: async () => { const t = await api('/logs?tail=300'); modal('📜 Studio log', `<pre class="logpre">${esc(t || 'Empty')}</pre>`, { wide: true }); },
    shutdown: async () => { if (await confirmBox('Stop the studio?', '<p class="muted">The server on this PC stops. Start it again with the desktop icon.</p>', 'Stop', true)) { await api('/shutdown', { method: 'POST' }).catch(() => {}); document.body.innerHTML = '<p style="padding:40px;font:16px system-ui;color:#ccc">Studio stopped. You can close this tab.</p>'; } },
    build: () => { const idea = $('#ideaInput').value.trim(); if (!idea) { $('#ideaInput').focus(); toast('Describe your idea first ✍️'); return; } newBuild(idea, S.type, S.mode); },
    tpl: (b) => { $('#ideaInput').value = b.dataset.p; $('#ideaInput').focus(); $('#home').scrollTo({ top: 0, behavior: 'smooth' }); },
    open: (b) => { location.hash = '#p=' + b.dataset.id; },
    retry: () => { if (!S.p || !S.p.idea) return; if (S.mode === 'quick' || S.settings.planFirst === false) runJob('build', { idea: S.p.idea, type: S.p.type, mode: S.mode }); else runPlan(S.p.idea, S.p.type); },
    'plan-ans': (b) => { const m = S.p.chat[Number(b.dataset.i)]; readPlanForm(Number(b.dataset.i)); const q = m.plan.questions[Number(b.dataset.k)]; q.answer = q.answer === b.dataset.v ? '' : b.dataset.v; renderChat(); saveChat(); },
    'plan-approve': async (b) => {
      const i = Number(b.dataset.i); const m = S.p.chat[i]; const plan = readPlanForm(i);
      const unanswered = plan.questions.filter((q) => !q.answer); unanswered.forEach((q) => { q.answer = q.options[0] || ''; });
      m.status = 'approved'; m.plan = plan; renderChat(); await saveChat();
      S.p.name = plan.name; S.p.emoji = plan.emoji; renderHeader(); api('/projects/' + S.p.id, { method: 'PUT', body: { name: plan.name, emoji: plan.emoji } }).catch(() => {});
      runJob('build', { idea: m.idea || S.p.idea, type: plan.kind || m.type || S.p.type, mode: S.mode, plan });
    },
    'plan-redo': (b) => { const m = S.p.chat[Number(b.dataset.i)]; m.status = 'replaced'; saveChat(); runPlan(m.idea || S.p.idea, m.type || S.p.type); },
    'plan-cancel': (b) => { const m = S.p.chat[Number(b.dataset.i)]; m.status = 'cancelled'; renderChat(); saveChat(); },
    chip: async (b) => {
      const t = b.dataset.t;
      if (/Fix bugs/.test(t)) {
        const res = await testAndStore(S.n);
        if (res.problems.length) return runJob('fix', { problems: res.problems.slice(0, 8) });
        return runJob('edit', { request: 'Review the code for bugs and edge cases (state not fully reset on restart, collision mistakes, NaN/undefined values, things drawn off-screen, controls that do not work on touch) and fix any you find. If nothing is wrong, make one small polish improvement.' });
      }
      runJob('edit', { request: t.replace(/^\S+\s/, '') });
    },
    stop: () => { if (S.abort) S.abort.abort(); },
    view: (b) => viewVersion(Number(b.dataset.n)),
    'view-latest': () => { S.viewN = 0; loadPreview(); },
    restore: async (b) => { if (await confirmBox('Restore v' + b.dataset.n + '?', '<p class="muted">Creates a new version with that code. Nothing is lost.</p>', 'Restore')) restoreVersion(Number(b.dataset.n)); },
    diff: (b) => showDiff(Number(b.dataset.n)),
    promote: (b) => promote(b.dataset.to),
    export: (b) => { const env = ($('#exEnv') || {}).value || 'dev'; location.href = `/api/projects/${S.p.id}/export?env=${env}&format=${b.dataset.f}`; },
    test: async () => { if (!S.n) return; toast('Running tests…'); const n = S.viewN || S.n; const r = await testAndStore(n); toast(r.summary.fail ? r.summary.fail + ' failing' : 'Tests passed ✓', r.summary.fail ? 'bad' : 'good'); if (isPhone()) setTab('tests'); },
    'fix-tests': () => { const v = curVersion(); const t = v && v.tests; const pr = t && t.problems && t.problems.length ? t.problems : t ? t.checks.filter((c) => c.status !== 'pass').map((c) => c.name + ': ' + c.detail) : []; if (!pr.length) return toast('Nothing to fix 🎉'); setTab('chat'); runJob('fix', { problems: pr.slice(0, 8) }); },
    'fix-preview': () => { const pr = S.pvErrors.map((e) => 'JS error while playing: ' + e.msg + (e.file ? ` (${e.file}:${e.line})` : '')); setTab('chat'); runJob('fix', { problems: pr }); },
    reload: () => loadPreview(),
    rotate: () => { S.rotated = !S.rotated; fitDevice(); },
    'file-open': (b) => { S.cur = b.dataset.p; renderFiles(); if (isPhone()) $('#fileList').classList.remove('open'); },
    'files-toggle': () => $('#fileList').classList.toggle('open'),
    'file-new': async () => {
      const name = await promptBox('New file', 'Path (e.g. levels.json or js/enemies.js)'); if (!name) return;
      const p = name.replace(/^\/+/, ''); if (p in S.buf || p in S.binary) return toast('That file already exists', 'bad');
      S.buf[p] = /\.html?$/.test(p) ? '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n</head>\n<body>\n</body>\n</html>\n' : /\.json$/.test(p) ? '{}\n' : ''; S.cur = p; renderFiles();
    },
    'file-rename': async () => {
      const old = S.cur; const name = await promptBox('Rename / move', 'New path', old); if (!name || name === old) return;
      if (old in S.binary && !(old in S.buf)) return toast('Download and re-upload binary files to rename them', 'bad');
      await structural({ [name]: S.buf[old] }, [old], `Renamed ${old} → ${name}`); S.cur = name; renderFiles();
    },
    'file-delete': async () => {
      const p = S.cur; if (p === 'index.html') return toast('index.html is the app entry — it can’t be deleted', 'bad');
      if (!(await confirmBox('Delete ' + esc(p) + '?', '<p class="muted">Saved as a new version, so you can restore it later.</p>', 'Delete', true))) return;
      if (!(p in S.files) && !(p in S.binary)) { delete S.buf[p]; S.cur = 'index.html'; renderFiles(); return; }
      await structural({}, [p], 'Deleted ' + p); S.cur = 'index.html'; renderFiles();
    },
    'file-download': () => { if (S.cur in S.binary) { location.href = `/api/projects/${S.p.id}/versions/${S.n}/file?path=${encodeURIComponent(S.cur)}&dl=1`; return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.buf[S.cur] || ''])); a.download = S.cur.split('/').pop(); a.click(); },
    'code-run': () => runDraft(),
    'code-save': () => saveBuffers(false),
    'code-revert': () => { S.buf[S.cur] = S.files[S.cur] != null ? S.files[S.cur] : ''; $('#code').dataset.file = ''; renderFiles(); toast('Reverted ' + S.cur); },
    'code-copy': () => navigator.clipboard && navigator.clipboard.writeText($('#code').value).then(() => toast('Copied')),
    'term-run': () => { const i = $('#termIn'); const c = i.value.trim(); i.value = ''; termRun(c); },
    'term-chip': (b) => termRun(b.dataset.c),
    'term-stop': () => { if (S.term.ctl) S.term.ctl.abort(); api(`/projects/${S.p.id}/terminal/stop`, { method: 'POST' }).catch(() => {}); },
    'term-open': () => api(`/projects/${S.p.id}/workspace/open`, { method: 'POST' }).then(() => toast('Opened in File Explorer')).catch((e) => toast(e.message, 'bad')),
    'term-import': async () => {
      try { const r = await api(`/projects/${S.p.id}/workspace/import`, { method: 'POST', body: {} }); const v = await loadVersionFiles(r.version.n); S.binary = v.binary; afterSave(r, v.files); if (S.term.ws) S.term.ws.changes = []; renderTerminal(); toast('Saved v' + S.n + ' from the terminal', 'good'); testAndStore(S.n); }
      catch (e) { toast(e.message, 'bad'); }
    },
    'libs-bundle': () => { const ext = $('#libsPanel')._external || []; const urls = $$('#libsPanel [data-lib]').filter((x) => x.checked).map((x) => ext[Number(x.dataset.lib)]); bundleLibs(urls, false); },
    'libs-add': () => { const u = $('#libUrl').value.trim(); if (!/^https?:\/\//.test(u)) return toast('Paste a full https:// link', 'bad'); bundleLibs([u], true); },
    'libs-sugg': (b) => { $('#libUrl').value = b.dataset.u; },
    rename: async () => {
      const m = modal('Rename', `<input class="inp" id="rnIn" value="${esc(S.p.name)}"><div class="row" style="margin-top:10px"><input class="inp" id="rnEm" value="${esc(S.p.emoji)}" style="width:80px;text-align:center;font-size:22px"><input class="inp" id="rnCol" type="color" value="${esc(S.p.color)}" style="width:80px;padding:4px"></div>`, { foot: '<button class="btn primary" data-ok>Save</button>' });
      m.el.querySelector('[data-ok]').onclick = async () => { const chat = S.p.chat; S.p = { ...(await api('/projects/' + S.p.id, { method: 'PUT', body: { name: $('#rnIn').value.trim() || S.p.name, emoji: $('#rnEm').value.trim() || S.p.emoji, color: $('#rnCol').value } })), chat }; m.close(); renderHeader(); renderShip(); makeIcons().catch(() => {}); };
    },
    remix: async () => { const p = await api(`/projects/${S.p.id}/duplicate`, { method: 'POST' }); toast('Remixed into a new project'); location.hash = '#p=' + p.id; },
    delete: async () => { if (!(await confirmBox('Delete ' + esc(S.p.name) + '?', '<p class="muted">The project moves to <code>data/trash</code> on the PC, so you can still recover it from there.</p>', 'Delete', true))) return; await api('/projects/' + S.p.id, { method: 'DELETE' }); toast('Moved to trash'); location.hash = ''; },
  };

  function wire() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act] && !b.disabled) { ACT[b.dataset.act](b, e); return; }
      const t = e.target.closest('[data-tab]'); if (t && t.closest('#topTabs,#bottomNav')) setTab(t.dataset.tab);
      const fv = e.target.closest('#fileSeg [data-fview]'); if (fv) { S.fview = fv.dataset.fview; renderFiles(); if (S.fview === 'terminal') loadWorkspace(); }
      const ty = e.target.closest('#typeSeg [data-type]'); if (ty) { S.type = ty.dataset.type; $$('#typeSeg button').forEach((x) => x.classList.toggle('active', x === ty)); renderTemplates(); $('#ideaInput').placeholder = S.type === 'app' ? 'A habit tracker with streaks, emoji habits and a weekly stats screen…' : 'A 2D zombie survival game with shooting, enemy waves, health, upgrades and a boss fight…'; }
      const md = e.target.closest('#modeSeg [data-mode]'); if (md) { S.mode = md.dataset.mode; localStorage.setItem('acs:mode', S.mode); setModeSeg(); }
      const dv = e.target.closest('#deviceSeg [data-device]'); if (dv) { S.device = dv.dataset.device; $$('#deviceSeg button').forEach((x) => x.classList.toggle('active', x === dv)); fitDevice(); }
    });
    $('#ideaInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ACT.build(); });
    $('#composer').addEventListener('submit', (e) => {
      e.preventDefault(); const t = $('#chatInput').value.trim(); if (!t || S.busy) return;
      pushChat({ role: 'user', text: t });
      if (!S.n) {
        const pending = (S.p.chat || []).find((m) => m.kind === 'plan' && m.status === 'pending');
        if (!S.p.idea) { S.p.idea = t; api('/projects/' + S.p.id, { method: 'PUT', body: { idea: t } }).catch(() => {}); }
        if (pending || S.mode === 'quick' || S.settings.planFirst === false) runJob('build', { idea: t, type: S.p.type, mode: S.mode }); else runPlan(t, S.p.type);
      } else runJob('edit', { request: t });
      $('#chatInput').value = ''; autosize();
    });
    const autosize = () => { const ta = $('#chatInput'); ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; };
    $('#chatInput').addEventListener('input', autosize);
    $('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !isPhone()) { e.preventDefault(); $('#composer').requestSubmit(); } });
    const ta = $('#code');
    ta.addEventListener('input', () => { S.buf[S.cur] = ta.value; cancelAnimationFrame(hlRaf); hlRaf = requestAnimationFrame(() => { syncEditor(); $('#saveBtn').disabled = !dirtyCount(); $('#saveBtn').textContent = dirtyCount() ? `💾 Save (${dirtyCount()})` : '💾 Saved'; const it = $(`.fitem[data-p="${CSS.escape(S.cur)}"]`); if (it && !it.querySelector('.dot')) renderFiles(); }); });
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveBuffers(false); }
    });
    $('#termIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ACT['term-run'](); } });
    $('#uploadFile').addEventListener('change', async (e) => {
      const list = [...e.target.files]; if (!list.length) return; const files = {};
      for (const f of list) {
        if (f.size > 25e6) { toast(f.name + ' is over 25 MB', 'bad'); continue; }
        const target = (/\.(png|jpe?g|gif|webp|svg|ico)$/i.test(f.name) ? 'assets/' : /\.(mp3|ogg|wav)$/i.test(f.name) ? 'assets/' : '') + f.name.replace(/[^\w.@-]+/g, '-');
        files[target] = Build.isText(target) ? await f.text() : { b64: await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(f); }) };
      }
      e.target.value = '';
      if (Object.keys(files).length) { await structural(files, [], 'Uploaded ' + Object.keys(files).join(', ')); S.cur = Object.keys(files)[0]; renderFiles(); toast('Uploaded — reference it as ' + S.cur, 'good', 4000); }
    });
    $('#importFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const text = await f.text(); const title = (text.match(/<title>([^<]{1,60})<\/title>/i) || [])[1] || f.name.replace(/\.html?$/i, '');
      const type = /<canvas|requestAnimationFrame/i.test(text) ? 'game' : 'app';
      try { const p = await api('/projects', { method: 'POST', body: { name: title, type, source: text, message: 'Imported ' + f.name } }); location.hash = '#p=' + p.id; toast('Imported ' + f.name, 'good'); } catch (er) { toast(er.message, 'bad'); }
      e.target.value = '';
    });
    window.addEventListener('hashchange', route);
    window.addEventListener('resize', () => { if (!isPhone() && S.tab === 'preview') setTab('chat'); fitDevice(); });
    new ResizeObserver(() => fitDevice()).observe($('#pvStage'));
    window.addEventListener('beforeunload', (e) => { if (S.busy || dirtyCount()) { e.preventDefault(); e.returnValue = ''; } });
  }

  async function init() {
    wire();
    S.mode = localStorage.getItem('acs:mode') || 'smart'; setModeSeg(); renderTemplates();
    try {
      await refreshHealth(); S.settings = await api('/settings');
      if (!localStorage.getItem('acs:mode') && S.settings.mode) { S.mode = S.settings.mode; setModeSeg(); }
    } catch (e) { toast('Studio server not reachable: ' + e.message, 'bad', 6000); }
    loadModels(); loadUsage(); route();
    setInterval(async () => { const was = S.health && S.health.ollama && S.health.ollama.ok; await refreshHealth(); if (!was && S.health.ollama.ok) loadModels(); }, 20000);
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  init();
})();
