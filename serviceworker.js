const cacheName = 'cacheNameTV';

self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open(cacheName).then(function(cache) {
        return cache.addAll(
          [
            '/styles.css',
            '/code.js',
            '/index.html'
          ]
        );
      })
    );
  });

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.open('search-requests').then(function(cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function(response) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
});