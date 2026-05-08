import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyAxglINJgS2Lw9G7Z5BOVBwS3NTwUH2RDw",
    authDomain: "expense-tracker-aa175.firebaseapp.com",
    projectId: "expense-tracker-aa175",
    storageBucket: "expense-tracker-aa175.firebasestorage.app",
    messagingSenderId: "930837422199",
    appId: "1:930837422199:web:dc88f96f270e391225a672",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firebase Cloud Messaging — only initialize if supported
let messaging = null;

const initMessaging = async () => {
    try {
        // Check if the browser supports notifications
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            console.log('Push notifications not supported in this browser');
            return null;
        }
        messaging = getMessaging(app);
        return messaging;
    } catch (error) {
        console.error('Failed to initialize FCM:', error);
        return null;
    }
};

/**
 * Request notification permission and get FCM token
 * @returns {string|null} FCM token or null
 */
const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        if (!messaging) {
            await initMessaging();
        }
        if (!messaging) return null;

        // Register the FCM service worker
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
        });

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('VITE_FIREBASE_VAPID_KEY is not set in .env');
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swRegistration
        });

        if (token) {
            console.log('FCM Token obtained');
            return token;
        } else {
            console.log('No FCM token available');
            return null;
        }
    } catch (error) {
        console.error('Error getting notification permission:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 * @param {function} callback - Called with message payload
 * @returns {function} Unsubscribe function
 */
const onForegroundMessage = (callback) => {
    if (!messaging) {
        initMessaging().then(() => {
            if (messaging) {
                onMessage(messaging, callback);
            }
        });
        return () => {};
    }
    return onMessage(messaging, callback);
};

export { auth, googleProvider, messaging, requestNotificationPermission, onForegroundMessage, initMessaging };
