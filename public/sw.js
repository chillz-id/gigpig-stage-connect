// Service Worker for Stand Up Sydney PWA
// Provides offline functionality, caching, and push notifications

const CACHE_NAME = 'standup-sydney-v1.0.0';
const STATIC_CACHE = 'standup-sydney-static-v1.0.0';
const DYNAMIC_CACHE = 'standup-sydney-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/events/,
  /\/api\/comedians/,
  /\/api\/venues/,
  /\/api\/tours/,
  /\/api\/tasks/,
  /\/rest\/v1\/events/,
  /\/rest\/v1\/profiles/,
  /\/rest\/v1\/tours/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/static/') || STATIC_ASSETS.includes(url.pathname)) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request));
  } else if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirstWithCache(request));
  } else if (url.pathname.startsWith('/')) {
    // HTML pages - network first with offline fallback
    event.respondWith(networkFirstWithOffline(request));
  }
});

// Cache first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first with cache fallback (for API requests)
async function networkFirstWithCache(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network first with offline page fallback (for HTML pages)
async function networkFirstWithOffline(request) {
  // Skip chrome-extension and other non-http(s) URLs
  if (!request.url.startsWith('http')) {
    return fetch(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-events') {
    event.waitUntil(syncOfflineEvents());
  } else if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncOfflineTasks());
  } else if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncOfflineNotifications());
  }
});

// Sync offline events when back online
async function syncOfflineEvents() {
  try {
    const offlineActions = await getOfflineActions('events');
    
    for (const action of offlineActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          await removeOfflineAction(action.id);
          console.log('Synced offline event action:', action.id);
        }
      } catch (error) {
        console.error('Failed to sync offline action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline tasks when back online
async function syncOfflineTasks() {
  try {
    const offlineActions = await getOfflineActions('tasks');
    
    for (const action of offlineActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          await removeOfflineAction(action.id);
          console.log('Synced offline task action:', action.id);
        }
      } catch (error) {
        console.error('Failed to sync offline action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline notifications when back online
async function syncOfflineNotifications() {
  try {
    const offlineActions = await getOfflineActions('notifications');
    
    for (const action of offlineActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          await removeOfflineAction(action.id);
          console.log('Synced offline notification action:', action.id);
        }
      } catch (error) {
        console.error('Failed to sync offline action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'You have new updates in Stand Up Sydney',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'standup-sydney-notification',
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.tag = data.tag || options.tag;
      options.data = { ...options.data, ...data };
    } catch (error) {
      console.error('Failed to parse push notification data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Stand Up Sydney', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Utility functions for offline storage
async function getOfflineActions(type) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    const actions = [];
    
    for (const key of keys) {
      if (key.url.includes(`offline-actions-${type}`)) {
        const response = await cache.match(key);
        const data = await response.json();
        actions.push(data);
      }
    }
    
    return actions;
  } catch (error) {
    console.error('Failed to get offline actions:', error);
    return [];
  }
}

async function removeOfflineAction(actionId) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    
    for (const key of keys) {
      if (key.url.includes(actionId)) {
        await cache.delete(key);
        break;
      }
    }
  } catch (error) {
    console.error('Failed to remove offline action:', error);
  }
}

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    // Refresh critical data in the background
    const criticalEndpoints = [
      '/api/events?limit=20',
      '/api/notifications?unread=true',
      '/api/tasks?status=pending&limit=10'
    ];
    
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.error('Failed to sync endpoint:', endpoint, error);
      }
    }
  } catch (error) {
    console.error('Content sync failed:', error);
  }
}

// Handle app update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});