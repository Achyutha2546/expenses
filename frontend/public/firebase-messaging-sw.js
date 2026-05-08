/* eslint-disable no-undef */
// Firebase Messaging Service Worker for background push notifications
// This file runs as a separate service worker dedicated to FCM

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAxglINJgS2Lw9G7Z5BOVBwS3NTwUH2RDw",
    authDomain: "expense-tracker-aa175.firebaseapp.com",
    projectId: "expense-tracker-aa175",
    storageBucket: "expense-tracker-aa175.firebasestorage.app",
    messagingSenderId: "930837422199",
    appId: "1:930837422199:web:dc88f96f270e391225a672",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'Spendly';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        tag: payload.data?.type || 'default',
        renotify: true,
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    let targetUrl = '/dashboard';

    // Route to relevant page based on notification type
    if (data.type === 'daily_reminder') {
        targetUrl = '/add';
    } else if (data.type === 'budget_exceeded' || data.type === 'budget_warning') {
        targetUrl = '/dashboard';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // Otherwise open a new window
            return clients.openWindow(targetUrl);
        })
    );
});
