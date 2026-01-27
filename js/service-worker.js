// ✅ ATUALIZAR VERSÃO PARA FORÇAR LIMPEZA DE CACHE
const CACHE_NAME = 'vendas-vivacor-v3'; // ← MUDOU DE v1 PARA v3
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './js/config.js',
  './js/firebase-init.js',
  './js/auth.js',
  './js/router.js',
  './js/components/home.js',
  './js/components/pdp.js',
  './js/components/login.js',
  './js/components/profile.js',
  './js/components/my-ads.js',
  './js/components/create-ad.js',
  './js/components/edit-ad.js',
  './js/utils/image-compress.js',
  './js/utils/storage.js',
  './js/utils/whatsapp.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // Força o novo service worker a ativar imediatamente
  self.skipWaiting();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta é válida, atualiza o cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta buscar do cache
        return caches.match(event.request);
      })
  );
});

// Activate - Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Força o service worker a controlar todas as páginas abertas
      return self.clients.claim();
    })
  );
});
