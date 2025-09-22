// Aurora Learning Platform Service Worker
// Advanced caching and performance optimization

const CACHE_NAME = 'aurora-learning-v1.0.0';
const STATIC_CACHE = 'aurora-static-v1';
const DYNAMIC_CACHE = 'aurora-dynamic-v1';
const API_CACHE = 'aurora-api-v1';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/aurora-logo.png',
  '/default-avatar.png',
  '/fonts/inter-var.woff2',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/user/profile',
  '/api/courses/featured',
  '/api/progress/summary',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Resource patterns and their strategies
const RESOURCE_STRATEGIES = [
  { pattern: /\.(js|css|woff2|png|jpg|jpeg|svg|ico)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },
  { pattern: /\/api\/courses\//, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE },
  { pattern: /\/api\/user\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
  { pattern: /\/api\/progress\//, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE },
  { pattern: /\/(games|learning|community)\//, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE },
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache API responses
      caches.open(API_CACHE).then(cache => {
        console.log('🌐 Pre-caching API responses');
        return Promise.all(
          API_ENDPOINTS.map(endpoint =>
            fetch(endpoint)
              .then(response => {
                if (response.ok) {
                  return cache.put(endpoint, response.clone());
                }
              })
              .catch(err => console.log(`❌ Failed to cache ${endpoint}:`, err))
          )
        );
      }),
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const cachesToDelete = cacheNames.filter(cacheName =>
          !Object.values({ STATIC_CACHE, DYNAMIC_CACHE, API_CACHE }).includes(cacheName)
        );

        return Promise.all(
          cachesToDelete.map(cacheName => {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }),

      // Take control of all pages
      self.clients.claim(),
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for allowed domains)
  if (url.origin !== location.origin && !isAllowedOrigin(url.origin)) {
    return;
  }

  // Determine strategy based on resource pattern
  const strategy = getResourceStrategy(request.url);

  event.respondWith(
    handleRequest(request, strategy)
      .catch(error => {
        console.error('❌ Fetch error:', error);
        return getFallbackResponse(request);
      })
  );
});

// Handle different caching strategies
async function handleRequest(request, strategy) {
  const url = new URL(request.url);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);

    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);

    default:
      return staleWhileRevalidate(request);
  }
}

// Cache First strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log(`💾 Cache hit: ${request.url}`);
    return cachedResponse;
  }

  console.log(`🌐 Cache miss, fetching: ${request.url}`);
  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
  }

  return response;
}

// Network First strategy
async function networkFirst(request) {
  try {
    console.log(`🌐 Network first: ${request.url}`);
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log(`💾 Network failed, trying cache: ${request.url}`);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });

  if (cachedResponse) {
    console.log(`💾 Serving stale: ${request.url}`);
    return cachedResponse;
  }

  console.log(`🌐 No cache, waiting for network: ${request.url}`);
  return fetchPromise;
}

// Determine caching strategy for a resource
function getResourceStrategy(url) {
  for (const { pattern, strategy } of RESOURCE_STRATEGIES) {
    if (pattern.test(url)) {
      return strategy;
    }
  }

  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE; // Default strategy
}

// Check if origin is allowed for caching
function isAllowedOrigin(origin) {
  const allowedOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.github.com',
  ];

  return allowedOrigins.includes(origin);
}

// Provide fallback responses
async function getFallbackResponse(request) {
  const url = new URL(request.url);

  // Fallback for navigation requests
  if (request.mode === 'navigate') {
    const cachedIndex = await caches.match('/');
    if (cachedIndex) {
      return cachedIndex;
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aurora - Offline</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              text-align: center;
              padding: 50px;
              background: #0d1117;
              color: #ffffff;
            }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            .offline-title { font-size: 24px; margin-bottom: 10px; }
            .offline-message { color: #8b949e; margin-bottom: 30px; }
            .retry-button {
              background: #238636;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">📡</div>
          <div class="offline-title">You're offline</div>
          <div class="offline-message">
            Please check your internet connection and try again.
          </div>
          <button class="retry-button" onclick="location.reload()">
            Try Again
          </button>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 503,
        statusText: 'Service Unavailable',
      }
    );
  }

  // Fallback for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        offline: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
        statusText: 'Service Unavailable',
      }
    );
  }

  // Generic fallback
  return new Response('Resource not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgress());
  }

  if (event.tag === 'user-actions-sync') {
    event.waitUntil(syncUserActions());
  }
});

// Sync user progress when back online
async function syncProgress() {
  try {
    const pendingProgress = await getStoredData('pendingProgress');

    if (pendingProgress && pendingProgress.length > 0) {
      console.log('📊 Syncing progress data...');

      for (const progressData of pendingProgress) {
        try {
          await fetch('/api/progress/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData),
          });

          console.log('✅ Progress synced:', progressData.id);
        } catch (error) {
          console.error('❌ Failed to sync progress:', error);
        }
      }

      // Clear synced data
      await clearStoredData('pendingProgress');
    }
  } catch (error) {
    console.error('❌ Progress sync failed:', error);
  }
}

// Sync user actions when back online
async function syncUserActions() {
  try {
    const pendingActions = await getStoredData('pendingActions');

    if (pendingActions && pendingActions.length > 0) {
      console.log('👤 Syncing user actions...');

      for (const action of pendingActions) {
        try {
          await fetch('/api/user/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action),
          });

          console.log('✅ Action synced:', action.type);
        } catch (error) {
          console.error('❌ Failed to sync action:', error);
        }
      }

      // Clear synced data
      await clearStoredData('pendingActions');
    }
  } catch (error) {
    console.error('❌ Actions sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AuroraOfflineDB', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function clearStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AuroraOfflineDB', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('📱 Push notification received');

  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/aurora-logo.png',
    badge: '/aurora-badge.png',
    data: data.data,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked');

  event.notification.close();

  if (event.action) {
    // Handle action button clicks
    console.log('🎯 Action clicked:', event.action);
  } else {
    // Handle notification body click
    const url = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if Aurora is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
    console.log('📊 Performance metrics received:', event.data.metrics);

    // Store metrics for analysis
    // In a real app, you might send this to analytics
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Aurora Service Worker loaded successfully');