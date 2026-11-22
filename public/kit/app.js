/* App Creator Studio — App Kit v1: tiny helpers so generated apps stay short.
 * Kit.app.$ / $$ / h(), store(), toast(), confirm(), sheet(), sfx(), haptic(), fmt, uid().
 * Auto-wires bottom tabs: <button data-tab="x"> shows <section data-page="x">. */
(function () {
  'use strict';
  var Kit = (window.Kit = window.Kit || {});
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function h(tag, props) {
    var el = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    if (props) for (var k in props) {
      var v = props[k];
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    (function add(list) { list.forEach(function (c) { if (Array.isArray(c)) add(c); else if (c != null && c !== false) el.appendChild(c.nodeType ? c : document.createTextNode(String(c))); }); })(kids);
    return el;
  }

  var mem = {};
  function store(key, def) {
    var k = 'app:' + key;
    function get() { try { var v = localStorage.getItem(k); return v == null ? clone(def) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : clone(def); } }
    function set(v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return v; }
    return { get: get, set: set, update: function (fn) { var v = get(); var r = fn(v); return set(r === undefined ? v : r); } };
  }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  function toast(msg, ms) {
    var wrap = $('.toast-wrap') || document.body.appendChild(h('div', { class: 'toast-wrap' }));
    var t = wrap.appendChild(h('div', { class: 'toast' }, msg));
    setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 320); }, ms || 1800);
  }

  function sheet(content, opts) {
    opts = opts || {};
    var bg = h('div', { class: 'modal-bg' }), box = h('div', { class: 'modal' });
    if (opts.title) box.appendChild(h('h2', null, opts.title));
    box.appendChild(typeof content === 'string' ? h('div', { html: content }) : content);
    bg.appendChild(box); document.body.appendChild(bg);
    function close() { bg.remove(); if (opts.onClose) opts.onClose(); }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    return { el: box, close: close };
  }
  function confirmBox(msg, okText) {
    return new Promise(function (res) {
      var body = h('div', { class: 'col' }, h('p', null, msg),
        h('div', { class: 'row' }, h('button', { class: 'btn grow', onclick: function () { s.close(); res(false); } }, 'Cancel'),
          h('button', { class: 'btn primary grow', onclick: function () { s.close(); res(true); } }, okText || 'OK')));
      var s = sheet(body);
    });
  }

  var actx = null;
  function sfx(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      var f = { tap: 600, success: 880, error: 200, pop: 520 }[kind || 'tap'] || 600;
      o.type = kind === 'error' ? 'sawtooth' : 'sine'; o.frequency.setValueAtTime(f, t);
      if (kind === 'success') o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.17);
    } catch (e) {}
  }
  function haptic(ms) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms || 12); } catch (e) {} }

  var fmt = {
    money: function (n, cur) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'USD' }).format(n || 0); } catch (e) { return '$' + (+n || 0).toFixed(2); } },
    num: function (n, d) { return (+n || 0).toLocaleString(undefined, { maximumFractionDigits: d == null ? 2 : d }); },
    date: function (d) { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); },
    time: function (d) { return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); },
    ago: function (d) { var s = (Date.now() - new Date(d)) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + 'm ago' : s < 86400 ? Math.floor(s / 3600) + 'h ago' : Math.floor(s / 86400) + 'd ago'; },
    duration: function (sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; },
  };
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function wireTabs() {
    var tabs = $$('[data-tab]'); if (!tabs.length) return;
    function show(name) {
      tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
      $$('[data-page]').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-page') === name); });
      document.dispatchEvent(new CustomEvent('tab', { detail: name }));
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { haptic(8); show(t.getAttribute('data-tab')); }); });
    var first = tabs.filter(function (t) { return t.classList.contains('active'); })[0] || tabs[0];
    show(first.getAttribute('data-tab'));
    Kit.app.showTab = show;
  }

  Kit.app = { $: $, $$: $$, h: h, store: store, toast: toast, sheet: sheet, confirm: confirmBox, sfx: sfx, haptic: haptic, fmt: fmt, uid: uid, showTab: function () {} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireTabs); else setTimeout(wireTabs, 0);
})();
