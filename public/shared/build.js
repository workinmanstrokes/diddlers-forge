// @ts-check
/* App Creator Studio — shared page preparation (browser + Node).
 * prepare(): used when serving pages (kits load as real files from kit/…).
 * build():   used for the single-file HTML export (kits + local scripts/styles inlined).
 * Injected markup never contains newlines, so error line numbers match your file exactly. */
(function (root) {
  'use strict';
  const KIT_FILES = ['kit/ui.css', 'kit/game.js', 'kit/app.js'];

  /** @param {string} src */
  function parseMeta(src) {
    const m = String(src || '').match(/<!--\s*app:\s*(\{[\s\S]*?\})\s*-->/);
    if (!m) return {};
    try { return JSON.parse(m[1]); } catch (e) { return {}; }
  }
  const one = (/** @type {string} */ s) => String(s || '').replace(/\r?\n/g, ' ');

  /** @param {string} html @param {string} chunk */
  function injectHeadStart(html, chunk) {
    chunk = one(chunk);
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (t) => t + chunk);
    if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (t) => t + '<head>' + chunk + '</head>');
    if (/<!doctype[^>]*>/i.test(html)) return html.replace(/<!doctype[^>]*>/i, (t) => t + chunk);
    return chunk + html;
  }
  /** @param {string} html @param {string} chunk */
  function injectHeadEnd(html, chunk) {
    chunk = one(chunk);
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, () => chunk + '</head>');
    return injectHeadStart(html, chunk);
  }
  /** @param {string} html @param {string} chunk */
  function injectBodyEnd(html, chunk) {
    chunk = one(chunk);
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => chunk + '</body>');
    return html + chunk;
  }
  const safeScript = (/** @type {string} */ s) => String(s || '').replace(/<\/script/gi, '<\\/script');

  /** Which kits a page uses, including ones the model called but forgot to include. @param {string} html */
  function kitUse(html) {
    return {
      gameTag: /<script[^>]+kit\/game\.js/i.test(html), appTag: /<script[^>]+kit\/app\.js/i.test(html), cssTag: /<link[^>]+kit\/ui\.css/i.test(html),
      game: /\bKit\.game\s*\(/.test(html), app: /\bKit\.app\b/.test(html),
      css: /\bKit\.app\b|class=["'][^"']*\b(card|btn|tabbar|topbar)\b/.test(html),
    };
  }

  /** Serve-time preparation: kit tags, doctype, charset, viewport, extra head/body chunks. */
  function prepare(/** @type {string} */ src, /** @type {{head?:string, headEnd?:string, bodyEnd?:string}} */ opts) {
    opts = opts || {};
    let html = String(src || '');
    const k = kitUse(html);
    let extra = '';
    if (!k.cssTag && k.css) extra += '<link rel="stylesheet" href="kit/ui.css">';
    if (!k.appTag && k.app) extra += '<script src="kit/app.js"></script>';
    if (!k.gameTag && k.game) extra += '<script src="kit/game.js"></script>';
    if (extra) html = injectHeadEnd(html, extra);
    if (!/<!doctype/i.test(html)) html = '<!DOCTYPE html>' + html;
    let head = '';
    if (!/<meta[^>]+charset/i.test(html)) head += '<meta charset="utf-8">';
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) head += '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
    if (opts.head) head += opts.head;
    if (head) html = injectHeadStart(html, head);
    if (opts.headEnd) html = injectHeadEnd(html, opts.headEnd);
    if (opts.bodyEnd) html = injectBodyEnd(html, opts.bodyEnd);
    return html;
  }

  /**
   * Single-file build: inline kits and local .js/.css files.
   * @param {string} src @param {Record<string,string>} kits @param {{files?:Record<string,string>, head?:string, headEnd?:string, bodyEnd?:string}} [opts]
   */
  function build(src, kits, opts) {
    opts = opts || {};
    const files = opts.files || {};
    let html = prepare(src, {});
    html = html.replace(/<link[^>]+href=["']\.?\/?kit\/ui\.css["'][^>]*>/gi, () => '<style data-kit="ui">' + (kits['kit/ui.css'] || '') + '</style>');
    html = html.replace(/<script[^>]+src=["']\.?\/?kit\/(game|app)\.js["'][^>]*>\s*<\/script>/gi, (_, n) => '<script data-kit="' + n + '">' + safeScript(kits['kit/' + n + '.js']) + '</script>');
    html = html.replace(/<script([^>]*?)\ssrc=["'](?!https?:|\/\/|data:)\.?\/?([^"']+\.m?js)["']([^>]*)>\s*<\/script>/gi, (t, a, p, b) =>
      files[p] != null && !/type=["']module/i.test(a + b) ? '<script' + a + b + '>' + safeScript(files[p]) + '</script>' : t);
    html = html.replace(/<link([^>]*?)href=["'](?!https?:|\/\/|data:)\.?\/?([^"']+\.css)["']([^>]*)>/gi, (t, a, p, b) =>
      files[p] != null && /stylesheet/i.test(a + b) ? '<style>' + files[p] + '</style>' : t);
    if (opts.head) html = injectHeadStart(html, opts.head);
    if (opts.headEnd) html = injectHeadEnd(html, opts.headEnd);
    if (opts.bodyEnd) html = injectBodyEnd(html, opts.bodyEnd);
    return html;
  }

  /** @param {string} s */
  function slug(s) {
    return String(s || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'app';
  }

  const TEXT_RE = /\.(html?|m?js|cjs|css|json|txt|md|svg|csv|xml|glsl|frag|vert|webmanifest|ts|tsx|jsx|ya?ml|toml|ini|py|sh|bat|ps1|gitignore)$/i;
  const isText = (/** @type {string} */ p) => TEXT_RE.test(p) || !/\.[a-z0-9]+$/i.test(p);

  const api = { build, prepare, parseMeta, slug, kitUse, isText, KIT_FILES, injectHeadStart, injectHeadEnd, injectBodyEnd };
  // @ts-ignore
  root.Build = api;
  // @ts-ignore
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
