// Diddler’s Forge — offline shell. Network-first so studio updates show up right away.
const C = 'acs-studio-v9';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'engine.js', 'tester.js', 'shared/build.js', 'shared/harness.js', 'kit/game.js', 'kit/app.js', 'kit/ui.css', 'recipes/index.js', ...['shooter', 'arena', 'runner', 'flappy', 'catcher', 'breakout', 'snake', 'match3', 'clicker', 'fishing', 'hockey', 'basketball', 'towerdefense', 'idletd', 'racer', 'cards', 'battle', 'cats', 'habits', 'budget', 'timer', 'notes'].map((r) => 'recipes/' + r + '.html'), 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('acs-studio-') && x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/play/')) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
