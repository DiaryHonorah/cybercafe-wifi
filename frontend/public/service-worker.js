/* ============================================
   SERVICE WORKER — Cyber Famille
   Version 4.0 - Stratégie Network First
   ============================================ */

const CACHE_NAME = "cyber-famille-v4";
const CACHE_DYNAMIQUE = "cyber-famille-dynamic-v4";

// Ne JAMAIS cacher ces URLs (toujours réseau)
const NE_PAS_CACHER = [
  "/api/",
  "/admin",
  "/portail",
];

// ============================================
// INSTALLATION
// ============================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installation v4...");
  self.skipWaiting();
});

// ============================================
// ACTIVATION
// ============================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation v4...");
  event.waitUntil(
    caches.keys().then((noms) => {
      return Promise.all(
        noms
          .filter((nom) => nom !== CACHE_NAME && nom !== CACHE_DYNAMIQUE)
          .map((nom) => {
            console.log("[SW] Suppression ancien cache :", nom);
            return caches.delete(nom);
          })
      );
    })
  );
  self.clients.claim();
});

// ============================================
// INTERCEPTION DES REQUÊTES
// Stratégie : NETWORK FIRST pour tout
// (le cache sert uniquement en cas d'échec réseau)
// ============================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les API (toujours réseau)
  if (url.pathname.includes("/api/")) {
    return;
  }

  // Ne pas intercepter WebSocket
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    return;
  }

  // Ne pas intercepter les méthodes non-GET
  if (request.method !== "GET") {
    return;
  }

  // Ne pas cacher les pages admin (toujours réseau pour éviter les versions périmées)
  if (NE_PAS_CACHER.some((p) => url.pathname.startsWith(p))) {
    return;
  }

  // NETWORK FIRST : essayer le réseau d'abord
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache les assets statiques uniquement
        if (
          response.status === 200 &&
          (request.destination === "style" ||
            request.destination === "script" ||
            request.destination === "image" ||
            request.destination === "font")
        ) {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIQUE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, servir depuis le cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return new Response("Hors ligne", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});

// ============================================
// MESSAGE : Forcer la mise à jour
// ============================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Vider le cache sur demande
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((noms) => {
      return Promise.all(noms.map((nom) => caches.delete(nom)));
    });
  }
});