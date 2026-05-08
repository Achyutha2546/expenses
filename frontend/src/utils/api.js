import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// ============ Offline Storage ============
const CACHE_PREFIX = 'offline_cache_';
const OUTBOX_KEY = 'pending_sync_operations';

const getOutbox = () => {
    try {
        return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
    } catch {
        return [];
    }
};
const saveOutbox = (outbox) => localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));

// Expose pending count for UI
export const getPendingCount = () => getOutbox().length;

/**
 * Read cached API response directly from localStorage (synchronous).
 * Used for instant hydration before network requests complete.
 * @param {string} endpoint - The API path, e.g. '/transactions'
 * @returns {any|null} Parsed cached data, or null if not found
 */
export const getCached = (endpoint) => {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + endpoint);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

// ============ Sync Status Events ============
// Components can listen for these on `window`:
//   'sync-start'     — sync is beginning
//   'sync-progress'  — { detail: { synced, total } }
//   'sync-complete'  — all ops synced successfully
//   'sync-error'     — some ops failed { detail: { remaining } }
//   'offline-saved'  — a new operation was saved to the outbox

const emitSyncEvent = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
};

// ============ Request Interceptor — JWT ============
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const { token } = JSON.parse(userInfo);
                config.headers.Authorization = `Bearer ${token}`;
            } catch { /* ignore parse errors */ }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============ Response Interceptor — Offline Support ============
api.interceptors.response.use(
    (response) => {
        // Success: cache GET responses for offline fallback
        if (response.config.method === 'get') {
            try {
                const cacheKey = CACHE_PREFIX + response.config.url;
                localStorage.setItem(cacheKey, JSON.stringify(response.data));
            } catch { /* storage full — ignore */ }
        }
        return response;
    },
    async (error) => {
        const { config } = error;

        // Only handle network errors (offline / server unreachable)
        if (!error.response || error.code === 'ERR_NETWORK') {

            // GET → return cached data
            if (config.method === 'get') {
                const cacheKey = CACHE_PREFIX + config.url;
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    console.log('[Offline] Returning cached data for:', config.url);
                    return { data: JSON.parse(cachedData), status: 200, offline: true };
                }
            }

            // POST/PUT/DELETE → save to outbox and RESOLVE with a marker
            if (['post', 'put', 'delete'].includes(config.method)) {
                const operation = {
                    url: config.url,
                    method: config.method,
                    data: config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : null,
                    id: Date.now(),
                    savedAt: new Date().toISOString()
                };

                const outbox = getOutbox();
                outbox.push(operation);
                saveOutbox(outbox);

                emitSyncEvent('offline-saved', { count: outbox.length, operation });

                // Schedule sync when back online
                window.addEventListener('online', syncOfflineData, { once: true });

                // RESOLVE instead of reject — the caller receives a success-like response
                // with `offline: true` so it can show appropriate UI
                return {
                    data: { ...(operation.data || {}), _offlineId: operation.id },
                    status: 202,
                    offline: true,
                    offlineSaved: true
                };
            }
        }
        return Promise.reject(error);
    }
);

// ============ Sync Logic ============
let isSyncing = false;

export const syncOfflineData = async () => {
    const outbox = getOutbox();
    if (outbox.length === 0 || isSyncing) return;

    isSyncing = true;
    const total = outbox.length;
    emitSyncEvent('sync-start', { total });

    console.log(`[Sync] Starting sync of ${total} operations...`);

    const remainingOperations = [];
    let synced = 0;

    for (const op of outbox) {
        try {
            await api({
                url: op.url,
                method: op.method,
                data: op.data
            });
            synced++;
            emitSyncEvent('sync-progress', { synced, total });
            console.log(`[Sync] ✓ ${op.method.toUpperCase()} ${op.url}`);
        } catch (err) {
            console.error(`[Sync] ✗ ${op.method.toUpperCase()} ${op.url}`, err.message || err);
            remainingOperations.push(op);
        }
    }

    saveOutbox(remainingOperations);
    isSyncing = false;

    if (remainingOperations.length === 0) {
        emitSyncEvent('sync-complete', { synced });
        console.log(`[Sync] All ${synced} operations synced successfully`);
    } else {
        emitSyncEvent('sync-error', { synced, remaining: remainingOperations.length });
        console.log(`[Sync] ${synced}/${total} synced, ${remainingOperations.length} remaining`);
    }
};

// Initial sync check on load
if (navigator.onLine) {
    syncOfflineData();
}
window.addEventListener('online', syncOfflineData);

export default api;
