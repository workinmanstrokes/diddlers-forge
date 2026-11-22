// @ts-check
/* Diddler’s Forge — QA test runner (free: runs locally, no model calls).
 * Static checks: referenced files exist, JavaScript syntax, offline-safe (no external files), bare imports.
 * Runtime checks (sandboxed phone-sized iframe, see shared/harness.js): loads cleanly, draws something,
 * reacts to taps/keys, survives random play, fits the screen, FPS, tap targets, text size, __selfTest(). */
(function (root) {
  'use strict';
  let ridSeq = 1;
  const SKIP_REF = /^(kit\/(game|app)\.js|kit\/ui\.css|manifest\.webmanifest|sw\.js|icon(-\d+)?\.(png|svg))$/;

  function resolveRel(/** @type {string} */ from, /** @type {string} */ ref) {
    const clean = ref.split(/[?#]/)[0]; if (!clean) return '';
    const parts = (clean.startsWith('/') ? [] : from.split('/').slice(0, -1)).concat(clean.replace(/^\//, '').split('/'));
    const out = []; for (const p of parts) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
    return out.join('/');
  }

  /** @param {Record<string,string>} files text files @param {Record<string,number>} [binary] */
  function staticChecks(files, binary) {
    const exists = (/** @type {string} */ p) => p in files || (binary && p in binary) || SKIP_REF.test(p);
    const missing = new Set(), external = new Set(), bare = new Set(), syntax = [];
    for (const [p, src] of Object.entries(files)) {
      if (/^vendor\//.test(p)) continue;
      if (/\.html?$/i.test(p)) {
        for (const m of src.matchAll(/<(?:script|img|audio|video|source|link|iframe)\b[^>]*?\s(?:src|href)=["']([^"']+)["']/gi)) {
          const ref = m[1].trim();
          if (/^(https?:)?\/\//i.test(ref)) { if (!/<link[^>]+rel=["'](?:preconnect|dns-prefetch|canonical)/i.test(m[0])) external.add(ref); continue; }
          if (/^(data:|blob:|#|mailto:|tel:|javascript:)/i.test(ref)) continue;
          const r = resolveRel(p, ref); if (r && !exists(r)) missing.add(r + ' (in ' + p + ')');
        }
        for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
          const attrs = m[1]; if (/\bsrc=/i.test(attrs) || /type=["'](?!text\/javascript|application\/javascript)[^"']*["']/i.test(attrs)) {
            if (/type=["']module["']/i.test(attrs) && !/\bsrc=/i.test(attrs)) scanImports(m[2]); continue;
          }
          const err = syntaxError(m[2]); if (err) syntax.push(p + ' (inline script near line ' + (src.slice(0, m.index).split('\n').length) + '): ' + err);
        }
        for (const m of src.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)/gi)) external.add(m[1]);
      } else if (/\.m?js$/i.test(p)) {
        if (/^\s*(import|export)\s/m.test(src)) scanImports(src);
        else { const err = syntaxError(src); if (err) syntax.push(p + ': ' + err); }
      } else if (/\.css$/i.test(p)) {
        for (const m of src.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)/gi)) external.add(m[1]);
        for (const m of src.matchAll(/@import\s+(?:url\()?["']?(https?:\/\/[^"')\s]+)/gi)) external.add(m[1]);
      }
    }
    function scanImports(/** @type {string} */ code) {
      for (const m of code.matchAll(/(?:import|export)\s+(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
        const ref = m[1] || m[2];
        if (/^(https?:)?\/\//.test(ref)) external.add(ref); else if (!/^[./]/.test(ref)) bare.add(ref);
      }
    }
    const checks = [];
    checks.push({ id: 'files', name: 'All referenced files exist', status: missing.size ? 'fail' : 'pass', detail: missing.size ? 'Missing: ' + [...missing].slice(0, 5).join(', ') : '' });
    checks.push({ id: 'syntax', name: 'JavaScript syntax', status: syntax.length ? 'fail' : 'pass', detail: syntax.slice(0, 3).join(' · ') });
    checks.push({ id: 'offline', name: 'Works offline (no external files)', status: external.size || bare.size ? 'warn' : 'pass',
      detail: external.size ? external.size + ' external file(s) — bundle them in Files → Libraries' : bare.size ? 'Bare imports need a bundled file: ' + [...bare].slice(0, 4).join(', ') : '' });
    const problems = [...missing].map((m) => 'Missing file: ' + m).concat(syntax.map((s) => 'Syntax error in ' + s));
    return { checks, problems, external: [...external], bare: [...bare] };
  }
  function syntaxError(/** @type {string} */ code) {
    if (!code.trim()) return '';
    try { new Function(code); return ''; } // compiles only — never runs
    catch (e) { return e instanceof SyntaxError ? e.message : ''; }
  }

  /**
   * @param {{id:string, tag:string, type?:string, orientation?:string, files:Record<string,string>, binary?:Record<string,number>, timeout?:number}} o
   * @returns {Promise<{checks:any[], errors:any[], fps:number, summary:{pass:number,warn:number,fail:number}, problems:string[], external:string[]}>}
   */
  function runTests(o) {
    const st = staticChecks(o.files, o.binary);
    const rid = ridSeq++;
    const land = o.orientation === 'landscape';
    const w = land ? 844 : 390, h = land ? 390 : 844;
    return frameRun(`/play/${o.id}/${o.tag}/?acs=test&rid=${rid}&type=${encodeURIComponent(o.type || '')}`, w, h, 'acs-test', rid, o.timeout || 14000, { label: 'QA is testing', secs: 5 }).then((data) => {
      if (!data) data = { checks: [{ id: 'load', name: 'Finishes loading', status: 'fail', detail: 'App froze or never finished loading (infinite loop?)' }], errors: [], fps: 0 };
      const runtime = data.checks || [];
      const errors = (data.errors || []).map((/** @type {any} */ e) => {
        const src = e.file && o.files[e.file]; const code = src && e.line ? (src.split('\n')[e.line - 1] || '').trim().slice(0, 160) : '';
        return { ...e, code: e.file && e.file.startsWith('kit/') ? '' : code };
      });
      const checks = st.checks.concat(runtime);
      const summary = { pass: 0, warn: 0, fail: 0 };
      checks.forEach((/** @type {any} */ c) => { /** @type {any} */ (summary)[c.status]++; });
      const problems = st.problems.slice();
      for (const e of errors) problems.push('JS error: ' + e.msg + (e.code ? `  — at ${e.file}:${e.line}: ${e.code}` : e.file ? ` (in ${e.file})` : ''));
      for (const c of runtime) if (c.status === 'fail' && (!['load', 'stable'].includes(c.id) || !errors.length)) problems.push(c.name + ' FAILED: ' + c.detail);
      return { checks, errors, fps: data.fps || 0, summary, problems, external: st.external };
    });
  }

  // ---------- Playtester (free: no model calls) ----------
  /** load a page in a hidden phone-sized sandbox and wait for one message type */
  /** @param {{label?:string, secs?:number}} [watch] show a small live window (also keeps the browser from throttling it) */
  function frameRun(/** @type {string} */ src, /** @type {number} */ w, /** @type {number} */ h, /** @type {string} */ msgType, /** @type {number} */ rid, /** @type {number} */ timeout, watch) {
    return new Promise((resolve) => {
      const f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-forms allow-pointer-lock'); f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
      let box = null, tick = 0;
      if (watch) {
        const sc = Math.min(0.3, 150 / Math.max(w, h) * 2.2);
        box = document.createElement('div'); box.className = 'pt-live';
        box.style.cssText = `width:${Math.round(w * sc)}px;height:${Math.round(h * sc) + 26}px`;
        box.innerHTML = `<div class="pt-live-h"><i></i><span>${watch.label || 'QA is playing'}</span><b></b></div>`;
        f.style.cssText = `width:${w}px;height:${h}px;border:0;transform:scale(${sc});transform-origin:0 0;pointer-events:none;display:block;background:#000`;
        box.appendChild(f); document.body.appendChild(box);
        const t0 = Date.now(); tick = window.setInterval(() => { const left = Math.max(0, (watch.secs || 0) - Math.round((Date.now() - t0) / 1000)); const b = box && box.querySelector('b'); if (b) b.textContent = watch.secs ? left + 's' : ''; }, 500);
      } else f.style.cssText = `position:fixed;right:0;bottom:0;width:${w}px;height:${h}px;border:0;opacity:0.01;pointer-events:none;z-index:-1;transform:scale(.04);transform-origin:100% 100%;`;
      let done = false;
      const fin = (/** @type {any} */ d) => { if (done) return; done = true; window.removeEventListener('message', on); clearTimeout(t); clearInterval(tick); if (box) box.remove(); else f.remove(); resolve(d); };
      const on = (/** @type {MessageEvent} */ e) => { if (e.source === f.contentWindow && e.data && e.data.type === msgType && e.data.rid === rid) fin(e.data); };
      window.addEventListener('message', on);
      const t = setTimeout(() => fin(null), timeout);
      f.src = src; if (!box) document.body.appendChild(f);
    });
  }
  function sizesFor(/** @type {string} */ type, /** @type {string} */ orientation) {
    if (orientation === 'landscape') return [[640, 360], [844, 390], [932, 430]];
    return type === 'app' ? [[360, 640], [430, 932], [820, 1180], [1280, 800]] : [[360, 640], [390, 844], [430, 932]];
  }
  /**
   * Plays the game / uses the app for real, then checks layout on several screen sizes.
   * @param {{id:string, tag:string, type:string, orientation?:string, secs?:number, onStatus?:(s:string)=>void}} o
   */
  async function playtest(o) {
    const secs = o.secs || 20; const land = o.orientation === 'landscape';
    const layouts = [];
    for (const [w, h] of sizesFor(o.type, o.orientation)) {
      o.onStatus && o.onStatus(`Checking layout on ${w}×${h}`);
      const rid = ridSeq++;
      const d = await frameRun(`/play/${o.id}/${o.tag}/?acs=layout&rid=${rid}`, w, h, 'acs-layout', rid, 9000);
      layouts.push(d ? { w, h, overX: d.overX, overY: d.overY, off: d.off, offs: d.offs, cover: d.cover, canvas: d.canvas, tiny: d.tiny } : { w, h, failed: true });
    }
    o.onStatus && o.onStatus(o.type === 'app' ? 'Using the app like a person would' : `Playing for ${secs}s (idle, random, sweep)`);
    const rid = ridSeq++;
    const d = await frameRun(`/play/${o.id}/${o.tag}/?acs=playtest&rid=${rid}&type=${encodeURIComponent(o.type || '')}&secs=${secs}`, land ? 844 : 390, land ? 390 : 844, 'acs-playtest', rid, secs * 1000 + 25000, { label: o.type === 'app' ? 'QA is using the app' : 'QA is playing', secs: secs + 2 });
    return analyze(d ? d.m : null, layouts, o.type, secs);
  }

  const W8 = { high: 15, med: 7, low: 3 };
  /** turn raw measurements into metrics, findings and a 0-100 score */
  function analyze(/** @type {any} */ m, /** @type {any[]} */ layouts, /** @type {string} */ type, /** @type {number} */ secs) {
    const findings = []; const metrics = [];
    const F = (sev, area, text, fix) => findings.push({ sev, area, text, fix });
    const r1 = (x) => Math.round(x * 10) / 10;
    if (!m) {
      F('high', 'Stability', 'The playtest never finished — the app froze or crashed while being played.', 'Look for infinite loops or code that blocks the main thread.');
      return { score: 0, metrics, findings, layouts, shots: [], mode: type, secs };
    }
    const bg = !!m.hidden;
    const fps = bg ? [] : (m.fps || []).slice(1); const fpsAvg = fps.length ? Math.round(fps.reduce((a, b) => a + b, 0) / fps.length) : 0; const fpsMin = fps.length ? Math.min(...fps) : 0;
    const heapMB = m.heap0 && m.heap1 ? r1((m.heap1 - m.heap0) / 1048576) : null;
    if (m.mode === 'game') {
      const runs = m.runs || []; const idle = runs.filter((r) => r.mode === 'idle'); const active = runs.filter((r) => r.mode !== 'idle');
      const idleDied = idle.filter((r) => r.died); const actDied = active.filter((r) => r.died);
      const idleSurv = idleDied.length ? r1(Math.min(...idleDied.map((r) => r.dur)) / 1000) : null;
      const avgRun = actDied.length ? r1(actDied.reduce((a, r) => a + r.dur, 0) / actDied.length / 1000) : null;
      const best = runs.reduce((a, r) => Math.max(a, r.score || 0), 0);
      const playSec = runs.reduce((a, r) => a + r.dur, 0) / 1000;
      const scoreMin = playSec ? Math.round(runs.reduce((a, r) => a + (r.score || 0), 0) / playSec * 60) : 0;
      const hashes = (m.hashes || []).filter(Boolean); const variety = hashes.length > 2 ? r1(new Set(hashes).size / hashes.length) : null;
      const juiceMin = playSec ? Math.round(m.juice / playSec * 60) : 0;
      metrics.push(
        { k: 'Idle survival', v: m.kit ? (idleSurv == null ? `> ${r1(secs * 0.25)}s` : idleSurv + 's') : '—', hint: 'Time before losing without touching anything' },
        { k: 'Avg run', v: m.kit ? (avgRun == null ? 'no deaths' : avgRun + 's') : '—', hint: 'How long active runs lasted' },
        { k: 'Runs / deaths', v: m.kit ? `${runs.length} / ${runs.filter((r) => r.died).length}` : '—' },
        { k: 'Best score', v: m.kit ? String(best) : '—' }, { k: 'Score / min', v: m.kit ? String(scoreMin) : '—' },
        { k: 'FPS', v: fps.length ? `${fpsAvg} avg · ${fpsMin} min` : '—' }, { k: 'Long frames', v: String(m.longFrames || 0) },
        { k: 'Sounds', v: String(m.sounds || 0) }, { k: 'Juice / min', v: m.kit ? String(juiceMin) : '—', hint: 'Shake, particles, popups, flashes' },
        { k: 'Screen variety', v: variety == null ? '—' : Math.round(variety * 100) + '%', hint: 'How often the picture changed' },
        { k: 'Memory', v: heapMB == null ? '—' : (heapMB >= 0 ? '+' : '') + heapMB + ' MB' },
        { k: 'Restart', v: m.notes.restartOk === undefined ? '—' : m.notes.restartOk ? '✓ resets' : '✗ broken' }, { k: 'Pause', v: m.notes.pauseOk === undefined ? '—' : m.notes.pauseOk ? '✓ works' : '✗ broken' });
      if (m.kit && !bg) {
        if (idleSurv != null && idleSurv < 3) F('high', 'Difficulty', `Lost after ${idleSurv}s without touching anything — the start isn't safe.`, 'Add a 2–3 second grace period: delay the first hazard and make the player briefly invincible at the start.');
        if (actDied.length >= 2 && avgRun != null && avgRun < 6) F('high', 'Difficulty', `Active runs lasted only ${avgRun}s on average — too hard to learn.`, 'Slow the early pace and ramp difficulty over 60–90 seconds with g.ramp().');
        if (!runs.some((r) => r.died) && secs >= 15) F('med', 'Difficulty', `Never lost in ${secs}s of idle, random and sweeping play.`, 'Make sure losing is possible and ramp hazards faster so there is real pressure.');
        if (idleSurv != null && avgRun != null && actDied.length >= 2 && Math.abs(avgRun - idleSurv) / Math.max(avgRun, idleSurv) < 0.2)
          F('med', 'Gameplay', `Playing barely changes the outcome — idle lasted ${idleSurv}s, active runs ${avgRun}s.`, 'Make the controls matter more: dodging, aiming or timing should clearly extend a run.');
        if (best === 0 && playSec > 5) F('high', 'Gameplay', `Score never went up in ${Math.round(playSec)}s of play.`, 'Award points for basic actions early so players see progress right away.');
        if (m.notes.restartOk === false) F('high', 'Stability', 'Play again did not fully reset the game (score not 0 or not playing).', 'Reset every piece of game state inside init(g).');
        if (m.notes.pauseOk === false) F('med', 'Stability', 'Pause / resume did not work.', 'Let the kit handle pausing; do not override g.state.');
        if (juiceMin < 3 && playSec > 8) F('low', 'Feel', 'Very little impact feedback while playing.', 'Add g.particles(), g.shake() and score popups on hits, pickups and milestones.');
      }
      if (!m.sounds) F('med', 'Feel', 'No sound effects played during the whole playtest.', 'Add g.sfx() for actions, pickups, hits and game over.');
      if (variety != null && variety < 0.35) F('med', 'Visual', 'The screen barely changes while playing.', 'Add motion: animated background, parallax stars, idle animations, moving hazards.');
      if (fps.length && fpsMin < 40) F('med', 'Performance', `Frame rate dipped to ${fpsMin} fps (avg ${fpsAvg}).`, 'Cap particle counts, remove off-screen objects, avoid creating gradients every frame.');
      if (!bg && (m.longFrames || 0) > 12) F('low', 'Performance', `${m.longFrames} stutters (frames over 50 ms).`, 'Avoid heavy work inside update/draw; precompute what you can.');
    } else {
      const add = m.add || {}; const nav = m.nav || { total: 0, ok: 0 }; const dead = m.dead || []; const lat = m.latency || {}; const con = m.contrast || { low: 0, samples: [] };
      metrics.push(
        { k: 'Screens reached', v: String(m.views || 1) }, { k: 'Tabs working', v: nav.total ? `${nav.ok}/${nav.total}` : '—' },
        { k: 'Add an item', v: !add.tried ? 'no form' : add.ok ? '✓ works' : '✗ nothing shown' }, { k: 'Saved after reload', v: m.persist === undefined ? '—' : m.persist ? '✓ yes' : '✗ lost' },
        { k: 'Buttons tried', v: String(m.buttons || 0) }, { k: 'Dead buttons', v: String(dead.length) }, { k: 'Reaction', v: lat.max ? `${lat.avg} ms avg · ${lat.max} max` : '—' },
        { k: 'Low contrast', v: String(con.low || 0) }, { k: 'Memory', v: heapMB == null ? '—' : (heapMB >= 0 ? '+' : '') + heapMB + ' MB' });
      if (nav.total && nav.ok < nav.total) F('med', 'UX', `Only ${nav.ok} of ${nav.total} tabs changed the screen.`, 'Make every tab button switch to its own view.');
      if (add.tried && !add.ok) F('high', 'UX', 'Filling in the form and pressing the main button did not add or show anything.', 'Wire the form submit/Add button to save the entry, re-render the list and clear the input.');
      if (add.ok && m.persist === false) F('high', 'UX', 'Data typed in was gone after reloading the app.', "Save with Kit.app.store() (or localStorage) on every change and render from it on load.");
      if (dead.length) F('med', 'UX', `${dead.length} button${dead.length > 1 ? 's' : ''} seemed to do nothing: ${dead.slice(0, 4).map((x) => '“' + x + '”').join(', ')}.`, 'Give every button a visible result (navigate, update, toast) or remove it.');
      if (lat.max > 300) F('low', 'Performance', `Slowest reaction to a tap: ${lat.max} ms.`, 'Keep click handlers light; render only what changed.');
      if (con.low) F('med', 'Visual', `${con.low} text element${con.low > 1 ? 's are' : ' is'} hard to read (low contrast)${con.samples.length ? ': ' + con.samples.map((x) => '“' + x + '”').join(', ') : ''}.`, 'Raise text/background contrast to at least 4.5:1.');
    }
    if (heapMB != null && heapMB > 25) F('med', 'Performance', `Memory grew ${heapMB} MB in ${secs}s — objects may never be removed.`, 'Remove bullets, particles and enemies when they leave the screen; clear timers on restart.');
    if ((m.errors || []).length) F('high', 'Stability', `${m.errors.length} error${m.errors.length > 1 ? 's' : ''} while playing: ${m.errors[0].msg}`, 'Fix the error shown (file and line are in the Checks view).');
    const badX = layouts.filter((l) => l.overX).map((l) => l.w + '×' + l.h);
    const cut = layouts.filter((l) => !l.overX && l.off > 0);
    if (badX.length) F('high', 'Layout', `Sideways scrolling on ${badX.join(', ')}.`, 'Use max-width:100%, flexible units and wrap rows so nothing is wider than the screen.');
    if (cut.length) F('med', 'Layout', `Content is cut off on ${cut.map((l) => l.w + '×' + l.h).join(', ')} (${cut[0].offs.join(', ')}).`, 'Let content shrink/wrap on narrow screens.');
    if (m.mode === 'game') { const tallY = layouts.filter((l) => l.overY).map((l) => l.w + '×' + l.h); if (tallY.length) F('med', 'Layout', `Page scrolls vertically on ${tallY.join(', ')}.`, 'Games should fill the screen exactly — no page scrolling.'); }
    const tiny = layouts.filter((l) => l.tiny > 0); if (tiny.length) F('low', 'Layout', `Tiny text (< 11px) on ${tiny.map((l) => l.w + '×' + l.h).join(', ')}.`, 'Use at least 12–13px for small labels.');
    const failedL = layouts.filter((l) => l.failed); if (failedL.length) F('med', 'Stability', `Didn't finish loading on ${failedL.map((l) => l.w + '×' + l.h).join(', ')}.`, 'Check for code that depends on a specific screen size.');
    const order = { high: 0, med: 1, low: 2 }; findings.sort((a, b) => order[a.sev] - order[b.sev]);
    const score = Math.max(0, Math.min(100, 100 - findings.reduce((a, f) => a + W8[f.sev], 0)));
    if (bg) metrics.unshift({ k: 'Note', v: 'studio was in the background — timing results skipped' });
    return { score, metrics, findings, layouts, shots: m.shots || [], mode: m.mode, secs, errors: m.errors || [], incomplete: bg };
  }
  /** short text version for the Critic agent */
  function reportText(/** @type {any} */ r) {
    if (!r) return 'No playtest data.';
    return 'Measured: ' + r.metrics.filter((x) => x.v !== '—').map((x) => x.k + ' ' + x.v).join('; ') + '\nLayout: ' + r.layouts.map((l) => `${l.w}×${l.h} ${l.failed ? 'failed' : l.overX ? 'sideways-scroll' : l.off ? 'cut-off' : 'ok'}`).join(', ') +
      (r.findings.length ? '\nProblems found:\n' + r.findings.map((f) => `- [${f.sev}] ${f.area}: ${f.text}`).join('\n') : '\nNo measured problems.');
  }

  const api = { runTests, staticChecks, resolveRel, playtest, analyze, reportText };
  // @ts-ignore
  root.Tester = api;
})(typeof window !== 'undefined' ? window : globalThis);
