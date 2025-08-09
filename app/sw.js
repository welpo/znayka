const CACHE_NAME = "znayka-v1.0.0";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css?h=b69c7986",
  "/script.js?h=8259ad30",
  "/manifest.json?h=c2d6c6ea",
  "/icons/favicon.ico",
  "/icons/icon-16x16.png",
  "/icons/icon-32x32.png",
  "/icons/icon-48x48.png",
  "/icons/icon-96x96.png",
  "/icons/icon-192x192.png",
  "/icons/icon-192x192-maskable.png",
  "/icons/icon-512x512.png",
  "/icons/icon-512x512-maskable.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log("Service worker installed and assets cached");
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("Service worker activated");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          console.log("Serving from cache:", event.request.url);
          return response;
        }
        console.log("Fetching from network:", event.request.url);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error("Fetch failed:", error);
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      })
  );
});
