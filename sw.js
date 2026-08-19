/* Mariame A. — service worker
   Stratégie « réseau d'abord » : à chaque ouverture, l'application va chercher
   la dernière version en ligne. Si le téléphone n'a pas de connexion,
   elle affiche la dernière version enregistrée au lieu d'une page blanche. */

const CACHE = 'mariame-v1';
const ESSENTIELS = ['./', './index.html', './logo.png', './icon.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ESSENTIELS).catch(() => null))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // On ne touche pas aux appels à la base de données ni aux services externes
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(rep => {
        if (rep && rep.status === 200) {
          const copie = rep.clone();
          caches.open(CACHE).then(c => c.put(req, copie));
        }
        return rep;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'maj') self.skipWaiting();
});
