// ✅ Service Worker Simplificado - Sem cache pré-carregado
const CACHE_NAME = 'vendas-vivacor-v4';

// Install - Não pré-cacheia nada, evita erros
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
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
