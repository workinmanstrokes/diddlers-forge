// @ts-check
/* App Creator Studio — QA test runner (free: runs locally, no model calls).
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
    return new Promise((resolve) => {
      const f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-scripts allow-forms allow-pointer-lock');
      f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
      // inside the viewport (tiny + transparent) so the browser doesn't throttle its animation frames
      f.style.cssText = `position:fixed;right:0;bottom:0;width:${w}px;height:${h}px;border:0;opacity:0.01;pointer-events:none;z-index:-1;transform:scale(.04);transform-origin:100% 100%;`;
      let done = false;
      const finish = (/** @type {any} */ data) => {
        if (done) return; done = true;
        window.removeEventListener('message', onMsg); clearTimeout(timer); f.remove();
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
        resolve({ checks, errors, fps: data.fps || 0, summary, problems, external: st.external });
      };
      const onMsg = (/** @type {MessageEvent} */ e) => { if (e.source === f.contentWindow && e.data && e.data.type === 'acs-test' && e.data.rid === rid) finish(e.data); };
      window.addEventListener('message', onMsg);
      const timer = setTimeout(() => finish({ checks: [{ id: 'load', name: 'Finishes loading', status: 'fail', detail: 'App froze or never finished loading (infinite loop?)' }], errors: [], fps: 0 }), o.timeout || 14000);
      f.src = `/play/${o.id}/${o.tag}/?acs=test&rid=${rid}&type=${encodeURIComponent(o.type || '')}`;
      document.body.appendChild(f);
    });
  }

  const api = { runTests, staticChecks, resolveRel };
  // @ts-ignore
  root.Tester = api;
})(typeof window !== 'undefined' ? window : globalThis);
