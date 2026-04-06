import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    
    // If we're in development mode (running via npm run dev), use the Vite proxy
    if (import.meta.env.DEV) {
        return '/api';
    }
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    return `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Cache for GET requests
const CACHE_PREFIX = 'offline_cache_';
const OUTBOX_KEY = 'pending_sync_operations';

// Helper to get outbox
const getOutbox = () => JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
const saveOutbox = (outbox) => localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for Offline Support
api.interceptors.response.use(
    (response) => {
        // Success: If it's a GET request, update cache
        if (response.config.method === 'get') {
            const cacheKey = CACHE_PREFIX + response.config.url;
            localStorage.setItem(cacheKey, JSON.stringify(response.data));
        }
        return response;
    },
    async (error) => {
        const { config } = error;

        // Handle Offline / Network Error
        if (!error.response || error.code === 'ERR_NETWORK') {

            // For GET: Return from cache
            if (config.method === 'get') {
                const cacheKey = CACHE_PREFIX + config.url;
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    console.log('Returning cached data for:', config.url);
                    return { data: JSON.parse(cachedData), status: 200, offline: true };
                }
            }

            // For POST/PUT/DELETE: Save to Outbox
            if (['post', 'put', 'delete'].includes(config.method)) {
                const outbox = getOutbox();
                outbox.push({
                    url: config.url,
                    method: config.method,
                    data: config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : null,
                    id: Date.now()
                });
                saveOutbox(outbox);

                // Add a listener to sync when online
                window.addEventListener('online', syncOfflineData, { once: true });

                return Promise.reject({
                    message: 'Offline: Data saved and will sync when you are back online.',
                    offline: true
                });
            }
        }
        return Promise.reject(error);
    }
);

// Sync Logic
export const syncOfflineData = async () => {
    const outbox = getOutbox();
    if (outbox.length === 0) return;

    console.log('Syncing offline data...', outbox.length, 'operations');

    const remainingOperations = [];
    for (const op of outbox) {
        try {
            await api({
                url: op.url,
                method: op.method,
                data: op.data
            });
            console.log('Synced operation:', op.method, op.url);
        } catch (err) {
            console.error('Failed to sync operation:', op, err);
            remainingOperations.push(op);
        }
    }

    saveOutbox(remainingOperations);
    if (remainingOperations.length === 0) {
        window.dispatchEvent(new CustomEvent('sync-complete'));
    }
};

// Initial sync check
if (navigator.onLine) {
    syncOfflineData();
}
window.addEventListener('online', syncOfflineData);

export default api;

