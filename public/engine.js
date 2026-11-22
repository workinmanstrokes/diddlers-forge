// @ts-check
/* Diddler’s Forge — generation engine: prompts, Ollama streaming, patch edits.
 * Token-saving design:
 *  1. Kits: the model writes only game/app logic (no loop/resize/input/menus/CSS boilerplate).
 *  2. One stable system prompt for every call → Ollama reuses its prompt cache (KV prefix).
 *  3. Edits are SEARCH/REPLACE patches, not full rewrites.
 *  4. No chat history is resent — the current file IS the memory.
 *  5. Tests run locally (free); the model is only called again if something actually broke.
 *  6. Fixed num_ctx + keep_alive → the model stays loaded, no reloads between calls. */
(function (root) {
  'use strict';

  const GAME_KIT = `GAME KIT — add <script src="kit/game.js"></script> in <head>, then:
Kit.game({title,emoji,help:'one-line how to play',color:'#accent',bg:'#background',orientation:'portrait'|'landscape',lives:3(optional),init(g){},update(g,dt){},draw(g,ctx){}})
• Logical canvas g.W×g.H = 360×640 (landscape 640×360), auto-scaled to any screen. Use these units. g.viewX,g.viewY,g.viewW,g.viewH = whole visible area (for full-bleed backgrounds).
• Kit already does: game loop, start menu, pause, game over + replay, HUD (score/best/lives), mute, best score saving. Never build menus/HUD yourself. init(g) runs on every (re)start — create/reset ALL state there. draw also runs behind the menu.
• Input g.input: x,y (game units), down, tap, action (tap/Space/Enter/Up this frame), swipe ('left'|'right'|'up'|'down'|null), axis {x,y} −1..1 (arrows/WASD or touch-drag joystick), dragX,dragY (finger delta this frame), key('ArrowLeft'), keyPressed(' ').
• Flow: g.score, g.addScore(n,x,y) (+popup), g.lives, g.loseLife(), g.over(), g.win(), g.level, g.t (seconds played), g.ramp(from,to,seconds) for difficulty, g.after(sec,fn), g.every(sec,fn) (call in init).
• Juice: g.sfx('jump|coin|shoot|hit|explode|power|pop|click|tick|lose|win|combo'), g.particles(x,y,{color,n,speed,size,life,gravity}), g.shake(px), g.flash(color,alpha), g.floatText(x,y,text,color), g.vibrate(ms).
• Draw: g.clear(color), g.rect(x,y,w,h,color,radius), g.circle(x,y,r,color), g.ring(x,y,r,color,w), g.line(x1,y1,x2,y2,color,w), g.text(s,x,y,{size,color,align,weight,glow}), g.emoji('🚀',x,y,size,rot), g.glow(color,blur)/g.noGlow(), g.grad(x0,y0,x1,y1,[colors]); ctx is a normal 2D context.
• Math: g.rand(a,b), g.randi(a,b), g.pick(arr), g.chance(p), g.clamp(v,a,b), g.lerp, g.dist(a,b), g.angle(a,b), g.hitCircle(a,b){x,y,r}, g.hitRect(a,b){x,y,w,h}, g.hitCircleRect(c,r), g.ease.out(t). g.save(k,v)/g.load(k,def) for progress.`;

  const APP_KIT = `APP KIT — add <link rel="stylesheet" href="kit/ui.css"> and <script src="kit/app.js"></script> in <head>, then:
• Layout: <body><div class="app"><header class="topbar"><div class="title">…</div></header><main class="content">…</main><nav class="tabbar">…</nav></div>
• Classes: card(.accent) stat>.value+.label big-number btn(.primary .ghost .danger .block .sm .icon) fab field>label+.input input(select/textarea too) switch>input+span list>item(.avatar .main>b+small) chip(.active) badge(.good .bad .warn) progress>i(style width) segment>button(.active) grid(.three) row col stack between grow muted small empty(.big) divider. Theme: override --accent --accent-2 --bg --surface in :root; body.light = light mode.
• Tabs auto-wired: <button data-tab="home" class="active">🏠<span>Home</span></button> shows <section data-page="home">.
• JS: const {$,$$,h,store,toast,confirm,sheet,sfx,haptic,fmt,uid}=Kit.app; const db=store('items',[]); db.get()/db.set(v)/db.update(fn); h('div',{class:'card',onclick:fn},...children); toast('Saved'); if(await confirm('Delete?'))…; sheet(el,{title}); fmt.money/num/date/time/ago/duration; sfx('tap|success|error|pop').`;

  const SYSTEM = `You are an elite mobile game and app developer. You ship polished, fun, bug-free single-file HTML5 apps.
Every file you write:
- Starts with this exact first line: <!-- app: {"name":"Short Name","emoji":"🎮","color":"#hex","type":"game|app","orientation":"portrait|landscape"} -->
- New projects are ONE self-contained index.html. Existing multi-file projects keep their files (relative local paths only). No external URLs or CDNs; libraries only from vendor/. Visuals come from canvas, CSS, gradients and emoji.
- Uses the kits below instead of boilerplate.
- Fits a phone screen with no zooming or sideways scrolling. Portrait unless the idea truly needs landscape. Touch-first; mouse and keyboard also work.
- Looks great: cohesive palette, depth (gradients, glow, shadows), smooth animation, satisfying feedback on every action.
- Games: clear goal, fair collisions, ramping difficulty, juice (particles, shake, sfx, score popups), a safe first few seconds.
- Apps: genuinely useful, data persisted with store(), helpful empty states, confirm before deleting.
- Tight code: no comments except short section labels, no console.log, no unused code.

${GAME_KIT}

${APP_KIT}`;

  const PATCH_RULES = `Reply ONLY with SEARCH/REPLACE blocks, as many as needed. Put the file path on the line above each block:
index.html
<<<<<<< SEARCH
exact lines copied from that file
=======
the new lines
>>>>>>> REPLACE
SEARCH text must match the file exactly (same spaces). Keep each block small but unique. To create a new file, leave SEARCH empty. No explanations.
Only if more than half of index.html must change, reply instead with the full new file in one \`\`\`html block.`;

  const LANG = { html: 'html', htm: 'html', js: 'js', mjs: 'js', css: 'css', json: 'json', svg: 'xml', md: 'md', glsl: 'glsl' };
  /** Files the model should see: text files, minus bundled libraries and kits. @param {Record<string,string>} files */
  function contextFiles(files) {
    return Object.keys(files).filter((p) => !/^(vendor|kit|node_modules)\//.test(p) && !/\.min\.(js|css)$/.test(p) && files[p].length < 200000)
      .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
  }
  /** @param {Record<string,string>} files */
  function filesBlock(files) {
    const list = contextFiles(files);
    const vendor = Object.keys(files).filter((p) => p.startsWith('vendor/'));
    const one = list.length === 1 && list[0] === 'index.html';
    let out = one ? 'Current file index.html:\n```html\n' + files['index.html'] + '\n```\n'
      : 'Current project files:\n' + list.map((p) => '### ' + p + '\n```' + (/** @type {any} */ (LANG)[(p.split('.').pop() || '').toLowerCase()] || '') + '\n' + files[p] + '\n```').join('\n') + '\n';
    if (vendor.length) out += 'Bundled libraries you may use: ' + vendor.join(', ') + '\n';
    return out;
  }

  /** @param {'game'|'app'} type @param {string} idea @param {string} [plan] */
  function buildMessages(type, idea, plan) {
    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Build this ${type}: ${idea}\n${plan ? '\nDesign brief:\n' + plan + '\n' : ''}\nUse the ${type === 'game' ? 'GAME' : 'APP'} KIT. Reply with only the complete file in one \`\`\`html block.` },
    ];
  }

  /** Coder: apply a change. @param {Record<string,string>} files @param {string} request @param {string} idea */
  function editMessages(files, request, idea) {
    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `${filesBlock(files)}${idea ? 'Original idea: ' + idea.slice(0, 300) + '\n' : ''}\nChange request: ${request}\n\n${PATCH_RULES}` },
    ];
  }

  /** Debugger: diagnose and repair. @param {Record<string,string>} files @param {string[]} problems */
  function fixMessages(files, problems) {
    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `${filesBlock(files)}\nYou are the Debugger. Automated tests on a phone screen found these problems:\n- ${problems.join('\n- ')}\n\nFind the root cause of each and fix it without changing what works.\n\n${PATCH_RULES}` },
    ];
  }

  /** @param {Record<string,string>} files @param {string} request @param {{path:string,search:string}[]} failed */
  function retryPatchMessages(files, request, failed) {
    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `${filesBlock(files)}\nChange request: ${request}\n\nYour previous SEARCH blocks did not match. Not found:\n${failed.map((b) => '--- ' + b.path + '\n' + b.search.slice(0, 400)).join('\n')}\n---\nCopy SEARCH lines exactly from the files above.\n\n${PATCH_RULES}` },
    ];
  }

  // ---------- Architect: plan as JSON ----------
  const PLAN_SCHEMA = {
    type: 'object',
    properties: {
      name: { type: 'string' }, emoji: { type: 'string' }, kind: { type: 'string', enum: ['game', 'app'] }, pitch: { type: 'string' },
      questions: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } } }, required: ['q', 'options'] } },
      features: { type: 'array', items: { type: 'string' } }, controls: { type: 'string' }, look: { type: 'string' },
      tasks: { type: 'array', items: { type: 'string' } }, complexity: { type: 'string', enum: ['small', 'medium', 'large'] },
    },
    required: ['name', 'emoji', 'kind', 'pitch', 'questions', 'features', 'controls', 'look', 'tasks', 'complexity'],
  };
  /** @param {'game'|'app'} type @param {string} idea */
  function architectMessages(type, idea) {
    return [
      { role: 'system', content: 'You are the Architect for a mobile ' + type + ' studio. Plans become single-file HTML5 ' + type + 's (canvas + kit, touch-first, offline). Reply with JSON only.' },
      { role: 'user', content: `Idea: "${idea}"
Make a build plan as JSON:
- name (2-3 words), emoji (one), kind ("${type}" unless clearly the other), pitch (one sentence)
- questions: 0-3 short questions ONLY where the answer changes the build; 2-4 short options each, best option first
- features: 4-8 concrete must-haves (testable)
- controls: one line; look: palette with hex colors + style, one line
- tasks: 2-5 build steps in order; step 1 is a complete playable/usable core
- complexity: small | medium | large` },
    ];
  }
  /** @param {any} raw */
  function normalizePlan(raw, /** @type {string} */ type) {
    const p = raw && typeof raw === 'object' ? raw : {};
    const arr = (/** @type {any} */ a) => (Array.isArray(a) ? a.map((x) => String(typeof x === 'object' ? x.title || x.name || JSON.stringify(x) : x).trim()).filter(Boolean) : []);
    return {
      name: String(p.name || 'New ' + type).slice(0, 40), emoji: String(p.emoji || (type === 'app' ? '✨' : '🎮')).slice(0, 8), kind: p.kind === 'app' || p.kind === 'game' ? p.kind : type,
      pitch: String(p.pitch || '').slice(0, 300),
      questions: (Array.isArray(p.questions) ? p.questions : []).filter((q) => q && q.q).slice(0, 3).map((q) => ({ q: String(q.q).slice(0, 160), options: arr(q.options).slice(0, 4), answer: '' })),
      features: arr(p.features).slice(0, 10), controls: String(p.controls || ''), look: String(p.look || ''),
      tasks: arr(p.tasks).slice(0, 5), complexity: ['small', 'medium', 'large'].includes(p.complexity) ? p.complexity : 'medium',
    };
  }
  /** @param {any} plan */
  function planText(plan) {
    const qa = (plan.questions || []).filter((/** @type {any} */ q) => q.answer).map((/** @type {any} */ q) => `- ${q.q} → ${q.answer}`);
    return [`Name: ${plan.name} ${plan.emoji}`, plan.pitch && `Pitch: ${plan.pitch}`, plan.controls && `Controls: ${plan.controls}`, plan.look && `Look: ${plan.look}`,
      plan.features.length && 'Features:\n' + plan.features.map((/** @type {string} */ f) => '- ' + f).join('\n'), qa.length && 'Decisions:\n' + qa.join('\n')].filter(Boolean).join('\n');
  }
  const EST_OUT = { small: 3200, medium: 5000, large: 7000 };

  // ---------- QA: check the plan's features against the code ----------
  const QA_SCHEMA = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: { feature: { type: 'string' }, ok: { type: 'boolean' }, note: { type: 'string' } }, required: ['feature', 'ok'] } } }, required: ['results'] };
  /** @param {Record<string,string>} files @param {string[]} features */
  function qaMessages(files, features) {
    return [
      { role: 'system', content: 'You are a strict QA tester. Read code and decide if each feature is really implemented and wired to the UI/controls. Reply with JSON only.' },
      { role: 'user', content: `${filesBlock(files)}\nFeatures to verify:\n${features.map((f, i) => i + 1 + '. ' + f).join('\n')}\n\nReturn {"results":[{"feature":"…","ok":true|false,"note":"why, if missing"}]} with one entry per feature.` },
    ];
  }
  /** Lenient JSON parse for small models. @param {string} t */
  function parseJson(t) {
    const s = stripThink(t).trim();
    try { return JSON.parse(s); } catch (e) { /* fall through */ }
    const m = s.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch (e) { /* */ } }
    return null;
  }

  /** @param {'game'|'app'} type @param {string} idea */
  function planMessages(type, idea) {
    return [
      { role: 'system', content: 'You are a top mobile ' + type + ' designer. Be concrete, specific and brief.' },
      { role: 'user', content: `Design brief (max 110 words) for a single-file mobile ${type}: "${idea}".\nSections, one or two lines each: Core loop · Controls · Progression · Look & palette (hex colors) · Juice & feedback${type === 'app' ? ' · Screens' : ''}.\nMake it fun, polished and buildable in one HTML file with canvas/CSS only.` },
    ];
  }

  // ---------- parsing ----------
  /** @param {string} t */
  const stripThink = (t) => String(t || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '');

  /** @param {string} text @returns {{html:string, complete:boolean}|null} */
  function extractHtml(text) {
    let t = stripThink(text);
    const fence = t.match(/```(?:html|HTML|htm)?[^\n]*\n([\s\S]*?)(?:\n```|$)/);
    let code = fence ? fence[1] : t;
    let start = code.search(/<!--\s*app:/i);
    if (start < 0) start = code.search(/<!doctype|<html/i);
    if (start < 0) return null;
    code = code.slice(start);
    const end = code.toLowerCase().lastIndexOf('</html>');
    if (end >= 0) code = code.slice(0, end + 7);
    return { html: code.trim() + '\n', complete: end >= 0 };
  }

  const PATH_LINE = /^[#>*\s`'"-]*(?:file:\s*)?([\w@.\-]+(?:\/[\w@.\-]+)*\.[a-z0-9]{1,12})[`'"*:\s]*$/i;
  /** @param {string} text @param {string} [defPath] @returns {{path:string, search:string, replace:string}[]} */
  function parseBlocks(text, defPath) {
    const t = stripThink(text).replace(/\r\n/g, '\n');
    const re = /<{5,9} ?SEARCH[^\n]*\n([\s\S]*?)\n?={5,9}[^\n]*\n([\s\S]*?)\n?>{5,9} ?REPLACE/g;
    const out = []; let m; let last = defPath || 'index.html';
    while ((m = re.exec(t))) {
      const before = t.slice(0, m.index).split('\n'); let p = '';
      for (let i = before.length - 1, k = 0; i >= 0 && k < 3; i--) {
        const l = before[i].trim(); if (!l || /^```/.test(l)) continue; k++;
        const pm = l.match(PATH_LINE); if (pm) p = pm[1]; break;
      }
      if (p) last = p;
      out.push({ path: p || last, search: m[1] === '\n' ? '' : m[1], replace: m[2] });
    }
    return out;
  }

  /** whitespace-tolerant search: match by trimmed, non-empty lines */
  function fuzzyFind(/** @type {string} */ text, /** @type {string} */ search) {
    const want = search.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!want.length) return null;
    const lines = text.split('\n'); const offs = []; let o = 0;
    for (const l of lines) { offs.push(o); o += l.length + 1; }
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== want[0]) continue;
      let j = i, k = 0;
      while (j < lines.length && k < want.length) {
        const tl = lines[j].trim();
        if (tl === '') { j++; continue; }
        if (tl !== want[k]) break;
        j++; k++;
      }
      if (k === want.length) return { start: offs[i], end: offs[j - 1] + lines[j - 1].length };
    }
    return null;
  }

  /** Apply blocks to a files map. @param {Record<string,string>} files @param {{path:string, search:string, replace:string}[]} blocks */
  function applyToFiles(files, blocks) {
    const out = { ...files }; const failed = []; const touched = new Set(); let applied = 0;
    for (const b of blocks) {
      let p = b.path.replace(/^\.?\//, '');
      if (!(p in out) && !b.search.trim()) { out[p] = b.replace.replace(/\n?$/, '\n'); touched.add(p); applied++; continue; }
      if (!(p in out)) { const only = Object.keys(out).filter((k) => !/^(vendor|kit)\//.test(k)); p = only.length === 1 ? only[0] : p; }
      if (!(p in out)) { failed.push(b); continue; }
      if (!b.search.trim()) { out[p] = out[p].replace(/\n?$/, '\n') + b.replace + '\n'; touched.add(p); applied++; continue; }
      const r = applyBlocks(out[p], [b]);
      if (r.failed.length) failed.push(b); else { out[p] = r.src; touched.add(p); applied++; }
    }
    return { files: out, failed, applied, touched: [...touched] };
  }

  /** @param {string} src @param {{search:string, replace:string}[]} blocks */
  function applyBlocks(src, blocks) {
    let out = src; const failed = [];
    for (const b of blocks) {
      if (!b.search.trim()) { failed.push(b); continue; }
      const i = out.indexOf(b.search);
      if (i >= 0) {
        let rep = b.replace;
        const lineStart = out.lastIndexOf('\n', i - 1) + 1;
        if (i > lineStart && /^\s*$/.test(out.slice(lineStart, i)) && !/^\s/.test(b.search)) rep = rep.replace(/^[ \t]+/, '');
        out = out.slice(0, i) + rep + out.slice(i + b.search.length); continue;
      }
      const f = fuzzyFind(out, b.search);
      if (f) { out = out.slice(0, f.start) + b.replace + out.slice(f.end); continue; }
      failed.push(b);
    }
    return { src: out, failed, applied: blocks.length - failed.length };
  }

  /** Fenced blocks with a path (\`\`\`js game.js, or a path line above). @param {string} text */
  function extractFiles(text) {
    const t = stripThink(text); const out = {}; const re = /```([\w-]*)[ \t]*([^\n`]*)\n([\s\S]*?)\n```/g; let m;
    while ((m = re.exec(t))) {
      let p = (m[2] || '').trim();
      if (!PATH_LINE.test(p)) { const before = t.slice(0, m.index).trimEnd().split('\n').pop() || ''; const pm = before.trim().match(PATH_LINE); p = pm ? pm[1] : ''; } else p = (p.match(PATH_LINE) || [])[1] || '';
      if (p) /** @type {any} */ (out)[p] = m[3] + '\n';
    }
    return out;
  }

  const estTokens = (/** @type {string} */ s) => Math.ceil(String(s || '').length / 3.4);

  // ---------- Ollama ----------
  /**
   * @param {{model:string, messages:{role:string,content:string}[], settings:any, maxOut?:number, temperature?:number,
   *   signal?:AbortSignal, onToken?:(text:string)=>void, format?:any}} o
   */
  async function chat(o) {
    const s = o.settings || {};
    const numCtx = Number(s.numCtx) || 16384;
    const promptTok = o.messages.reduce((n, m) => n + estTokens(m.content) + 6, 0);
    const room = numCtx - promptTok - 128;
    if (room < 600) throw new Error(`This file (~${promptTok} tokens) is too big for the ${numCtx} context. Raise "Context size" in Settings.`);
    const body = {
      model: o.model, messages: o.messages, stream: true, keep_alive: s.keepAlive || '15m',
      options: { num_ctx: numCtx, num_predict: Math.max(512, Math.min(o.maxOut || s.maxOutput || 8192, room)), temperature: o.temperature ?? s.temperature ?? 0.4, top_p: 0.9, repeat_penalty: 1.05 },
    };
    if (s.noThink) /** @type {any} */ (body).think = false;
    if (o.format) /** @type {any} */ (body).format = o.format;
    const go = () => fetch('/api/ollama/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: o.signal });
    let res = await go();
    if (!res.ok) {
      const t = await res.text();
      if (/** @type {any} */ (body).think === false && /think/i.test(t)) { delete /** @type {any} */ (body).think; res = await go(); }
      else if (o.format && typeof o.format === 'object' && /format|schema/i.test(t)) { /** @type {any} */ (body).format = 'json'; res = await go(); }
      else throw new Error(errText(t, res.status));
      if (!res.ok) throw new Error(errText(await res.text(), res.status));
    }
    if (!res.body) throw new Error('No response stream');
    const reader = res.body.getReader(); const dec = new TextDecoder();
    let buf = '', text = '', stats = { in: 0, out: 0, ms: 0, evalMs: 0, promptMs: 0, loadMs: 0, doneReason: '' };
    const t0 = performance.now();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        let j; try { j = JSON.parse(line); } catch (e) { continue; }
        if (j.error) throw new Error(j.error);
        if (j.message && j.message.content) { text += j.message.content; o.onToken && o.onToken(text); }
        if (j.done) stats = { in: j.prompt_eval_count || 0, out: j.eval_count || 0, ms: (j.total_duration || 0) / 1e6 || performance.now() - t0, evalMs: (j.eval_duration || 0) / 1e6,
          promptMs: (j.prompt_eval_duration || 0) / 1e6, loadMs: (j.load_duration || 0) / 1e6, doneReason: j.done_reason || '' };
      }
    }
    if (!stats.ms) stats.ms = performance.now() - t0;
    if (!stats.out) stats.out = estTokens(text);
    if (!stats.in) stats.in = promptTok;
    return { text: stripThink(text), stats };
  }
  function errText(/** @type {string} */ t, /** @type {number} */ code) {
    try { const j = JSON.parse(t); if (j.error) return j.error; } catch (e) { /* plain text */ }
    return (t || 'HTTP ' + code).slice(0, 300);
  }

  /** Pick sensible defaults from what's installed; skip models too big for this PC's RAM. @param {{name:string,size:number}[]} models @param {number} [ramBytes] */
  function pickModels(models, ramBytes) {
    const limit = ramBytes ? ramBytes * 0.55 : Infinity;
    let usable = models.filter((m) => !/embed|bge|minilm|nomic|whisper|vision-only/i.test(m.name));
    if (usable.some((m) => m.size <= limit)) usable = usable.filter((m) => m.size <= limit);
    const coder = usable.filter((m) => /coder|devstral|codestral|codegemma|starcoder|codellama|deepseek-coder/i.test(m.name)).sort((a, b) => b.size - a.size);
    const general = usable.filter((m) => /qwen|gpt-oss|glm|gemma|llama|mistral|phi|deepseek|granite|nemotron/i.test(m.name)).sort((a, b) => b.size - a.size);
    const code = (coder[0] || general[0] || usable[0] || { name: '' }).name;
    const smallest = usable.slice().sort((a, b) => a.size - b.size)[0];
    return { code, fast: (smallest || { name: code }).name };
  }

  const api = { SYSTEM, buildMessages, editMessages, fixMessages, retryPatchMessages, planMessages, architectMessages, normalizePlan, planText, PLAN_SCHEMA, EST_OUT,
    qaMessages, QA_SCHEMA, parseJson, extractHtml, extractFiles, parseBlocks, applyBlocks, applyToFiles, fuzzyFind, contextFiles, filesBlock, chat, estTokens, pickModels, stripThink };
  // @ts-ignore
  root.Engine = api;
  // @ts-ignore
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
