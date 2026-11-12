// GistUpp intentionally does not cache application pages or bundles.
// This prevents an older app shell from appearing after a deployment.
const CACHE_NAME = 'gistupp-shell-v6-no-app-cache';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
