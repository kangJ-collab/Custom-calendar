"use strict";

const VERSION = "1.0.0";
const CACHE_PREFIX = "custom-calendar";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${VERSION}`;
const OFFLINE_URL = "./index.html";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/app.css?v=1.0.0",
  "./js/app.js?v=1.0.0",
  "./js/pwa.js?v=1.0.0",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const results = await Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
    const critical = ["./index.html", "./css/app.css?v=1.0.0", "./js/app.js?v=1.0.0"];
    const cachedRequests = await cache.keys();
    const cachedUrls = cachedRequests.map(request => request.url);
    const missingCritical = critical.filter(item => !cachedUrls.some(url => url.endsWith(item.replace("./", ""))));
    if (missingCritical.length) throw new Error("Critical app shell files were not cached.");
    if (results.some(result => result.status === "rejected")) {
      // Optional assets may fail without aborting installation.
    }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (APP_SHELL.some(item => url.pathname.endsWith(item.split("?")[0].replace("./", "")))) {
      event.respondWith(cacheFirst(request));
    } else {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  event.respondWith(fetch(request).catch(() => new Response("", { status: 504, statusText: "External resource unavailable" })));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => null);
  return cached || network || new Response("", { status: 504 });
}

async function networkFirstDocument(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return await caches.match(request)
      || await caches.match(OFFLINE_URL)
      || new Response("오프라인에서 앱을 불러올 수 없습니다.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
  }
}
