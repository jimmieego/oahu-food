const SHELL_VERSION = 1;
const TILES_VERSION = '20261012';
const SHELL_CACHE = `oahu-food-shell-v${SHELL_VERSION}`;
const MAP_CACHE = `oahu-food-map-${TILES_VERSION}`;
const DATA_TIMEOUT_MS = 3000;

const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const TILES_URL = scopeUrl('tiles/oahu.pmtiles');
const PAGE_URL = scopeUrl('index.html');
const DATA_URL = scopeUrl('restaurants.md');
const CODE_FILES = [
    'index.html',
    'styles.css',
    'app.js',
    'parse.js',
    'search.js',
    'map-theme.js',
    'manifest.webmanifest',
].map(scopeUrl);
const STATIC_FILES = [
    'icons/icon.svg',
    'icons/apple-touch-icon.png',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'vendor/fonts/atkinson-hyperlegible-next-latin.woff2',
    'vendor/leaflet/leaflet.css',
    'vendor/leaflet/leaflet.js',
    'vendor/leaflet.markercluster/MarkerCluster.css',
    'vendor/leaflet.markercluster/leaflet.markercluster.js',
    'vendor/protomaps-leaflet/protomaps-leaflet.js',
].map(scopeUrl);
const SHELL_FILES = [...CODE_FILES, ...STATIC_FILES, DATA_URL];

let tilesFile = null;
let mapDownload = null;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(SHELL_FILES.map((url) => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    tilesFile = null;
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith('oahu-food-') && key !== SHELL_CACHE && key !== MAP_CACHE)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'save-map') {
        event.waitUntil(saveMap());
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) {
        return;
    }
    const url = request.url.split(/[?#]/)[0];
    if (request.mode === 'navigate') {
        if (url === self.registration.scope || url === PAGE_URL) {
            event.respondWith(savedFirst(event, PAGE_URL));
        }
    } else if (url === TILES_URL) {
        event.respondWith(tileResponse(request));
    } else if (url === DATA_URL) {
        event.respondWith(freshFirst(event, DATA_URL));
    } else if (CODE_FILES.includes(url)) {
        event.respondWith(savedFirst(event, url));
    } else if (STATIC_FILES.includes(url)) {
        event.respondWith(savedOnly(url));
    }
});

async function notifyClients(message) {
    for (const client of await self.clients.matchAll({ includeUncontrolled: true })) {
        client.postMessage(message);
    }
}

function saveMap() {
    mapDownload ??= (async () => {
        try {
            const cache = await caches.open(MAP_CACHE);
            if (!(await cache.match(TILES_URL))) {
                const response = await fetch(TILES_URL, { cache: 'reload' });
                if (response.status !== 200) {
                    throw new Error(`The map file returned HTTP ${response.status}`);
                }
                await cache.put(TILES_URL, response);
            }
            await notifyClients({ type: 'map-saved' });
        } catch (error) {
            await notifyClients({ type: 'map-failed', message: String(error) });
        } finally {
            mapDownload = null;
        }
    })();
    return mapDownload;
}

async function savedTiles() {
    tilesFile ??= caches
        .open(MAP_CACHE)
        .then((cache) => cache.match(TILES_URL))
        .then((response) => response?.blob() ?? null);
    const blob = await tilesFile;
    if (!blob) {
        tilesFile = null;
    }
    return blob;
}

async function tileResponse(request) {
    const blob = await savedTiles().catch(() => null);
    if (!blob) {
        return fetch(request);
    }
    const size = blob.size;
    const range = request.headers.get('range')?.match(/^bytes=(\d+)-(\d*)$/);
    if (!range) {
        return new Response(blob, {
            headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(size) },
        });
    }
    const start = Number(range[1]);
    const end = Math.min(range[2] ? Number(range[2]) : size - 1, size - 1);
    if (start > end) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    return new Response(blob.slice(start, end + 1), {
        status: 206,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(end - start + 1),
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
        },
    });
}

function refresh(event, key) {
    const update = fetch(key, { cache: 'no-cache' }).then(async (response) => {
        if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(key, response.clone());
        }
        return response;
    });
    event.waitUntil(update.catch(() => undefined));
    return update;
}

async function savedFirst(event, key) {
    const update = refresh(event, key);
    return (await caches.match(key)) ?? update;
}

async function savedOnly(key) {
    return (await caches.match(key)) ?? fetch(key);
}

async function freshFirst(event, key) {
    const update = refresh(event, key);
    const timeout = new Promise((resolve) => setTimeout(resolve, DATA_TIMEOUT_MS, null));
    const fresh = await Promise.race([update.catch(() => null), timeout]);
    if (fresh) {
        return fresh;
    }
    return (await caches.match(key)) ?? update;
}
