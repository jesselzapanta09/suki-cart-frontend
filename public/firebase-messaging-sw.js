/* global importScripts, firebase, clients */
// Firebase Cloud Messaging service worker
// This handles background notifications from FCM

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase (same config as in your app)
// Note: You may need to set these values or have Firebase SDK initialize them
firebase.initializeApp({
    apiKey: "AIzaSyBcOXKZUPzx1lNmL52VbZ9sumvjGlRzoCo",
    authDomain: "suki-cart-7b5bc.firebaseapp.com",
    projectId: "suki-cart-7b5bc",
    storageBucket: "suki-cart-7b5bc.firebasestorage.app",
    messagingSenderId: "68185417879",
    appId: "1:68185417879:web:8ee34934eb0999ca2861d2"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'SukiCart';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/suki-cart-logo.png',
        badge: '/suki-cart-logo.png',
        data: payload.data || {},
        tag: `fcm-${payload.data?.notification_id || Date.now()}`,
        vibrate: [100, 50, 100],
        requireInteraction: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

