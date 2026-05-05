import api from './api';
import { isCordova } from './pushHelper';

let foregroundMessageListenerReady = false;
let messagingLib = null;

async function loadMessaging() {
    if (isCordova()) {
        console.log('[Push] Cordova detected - Firebase Web SDK not loaded');
        return null;
    }

    if (!messagingLib) {
        try {
            messagingLib = await import('firebase/messaging');
        } catch (err) {
            console.error('[Push] Failed to load Firebase messaging:', err);
            return null;
        }
    }

    return messagingLib;
}

async function isMessagingSupportedInThisEnvironment() {
    if (isCordova()) {
        return false;
    }

    if (
        typeof window === 'undefined' ||
        typeof navigator === 'undefined' ||
        window.location?.protocol === 'file:'
    ) {
        return false;
    }

    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
        return false;
    }

    const lib = await loadMessaging();
    if (!lib || typeof lib.isSupported !== 'function') {
        return false;
    }

    return lib.isSupported().catch(() => false);
}

export function getNotifications(page = 1, perPage = 20) {
    return api.get('/notifications', { params: { page, per_page: perPage } });
}

export function getUnreadCount() {
    return api.get('/notifications/unread-count');
}

export function markRead(id) {
    return api.post(`/notifications/${id}/mark-read`);
}

export function markAllRead() {
    return api.post('/notifications/mark-all-read');
}

export function deleteNotification(id) {
    return api.delete(`/notifications/${id}`);
}

export function saveFCMToken(deviceToken, deviceType = 'web', deviceName = null) {
    return api.post('/notifications/push-subscription', {
        device_token: deviceToken,
        device_type: deviceType,
        device_name: deviceName,
    });
}

export function deleteFCMToken(deviceToken) {
    return api.delete('/notifications/push-subscription', {
        data: { device_token: deviceToken },
    });
}

export async function getCurrentWebPushToken() {
    if (isCordova()) {
        return null;
    }

    try {
        const supported = await isMessagingSupportedInThisEnvironment();
        if (!supported) {
            return null;
        }

        const lib = await loadMessaging();
        if (!lib) {
            return null;
        }

        const { getMessaging, getToken } = lib;
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        if (!registration) {
            return null;
        }

        return await getToken(getMessaging(), {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        }).catch(() => null);
    } catch (err) {
        console.warn('[Push] Failed to read current web token:', err);
        return null;
    }
}

export async function registerPushSubscription(options = {}) {
    const {
        requestPermission = true,
        saveToBackend = true,
    } = options;

    if (isCordova()) {
        console.warn('[Push] Not supported in Cordova environment.');
        return null;
    }

    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
        console.warn('[Push] Not supported in this environment.');
        return null;
    }

    try {
        const supported = await isMessagingSupportedInThisEnvironment();
        if (!supported) {
            console.warn('[Push] Firebase messaging is not supported in this environment.');
            return null;
        }

        const lib = await loadMessaging();
        if (!lib) {
            console.warn('[Push] Failed to load Firebase messaging SDK.');
            return null;
        }

        const { getMessaging, getToken } = lib;
        const messaging = getMessaging();

        let permission = Notification.permission;
        if (permission !== 'granted' && requestPermission) {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('[Push] Notification permission denied.');
            return null;
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn('[Push] Failed to get FCM token.');
            return null;
        }

        if (saveToBackend) {
            await saveFCMToken(token, 'web', navigator.userAgent.substring(0, 255));
        }

        await setUpMessageListener();

        return token;
    } catch (err) {
        console.error('[Push] Failed to register:', err);
        return null;
    }
}

export async function syncWebPushSubscription() {
    return registerPushSubscription({
        requestPermission: false,
        saveToBackend: true,
    });
}

export async function unregisterPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
    }

    if (isCordova()) {
        console.warn('[Push] Unregister not supported in Cordova environment.');
        return;
    }

    try {
        const supported = await isMessagingSupportedInThisEnvironment();
        if (!supported) {
            return;
        }

        const lib = await loadMessaging();
        if (!lib) {
            console.warn('[Push] Failed to load Firebase messaging SDK.');
            return;
        }

        const { getMessaging, deleteToken } = lib;
        const messaging = getMessaging();
        const token = await getCurrentWebPushToken();

        if (token) {
            await deleteFCMToken(token).catch(() => null);
        }

        await deleteToken(messaging).catch(() => null);
    } catch (err) {
        console.error('[Push] Failed to unregister:', err);
    }
}

export async function setUpMessageListener() {
    if (foregroundMessageListenerReady) {
        return;
    }

    if (isCordova()) {
        console.log('[Push] Skip web listener (Cordova)');
        return;
    }

    try {
        const supported = await isMessagingSupportedInThisEnvironment();
        if (!supported) {
            console.warn('[Push] Foreground listener skipped: unsupported environment.');
            return;
        }

        const lib = await loadMessaging();
        if (!lib) {
            console.warn('[Push] Failed to load Firebase messaging SDK.');
            return;
        }

        const { getMessaging, onMessage } = lib;
        const messaging = getMessaging();

        onMessage(messaging, (payload) => {
            console.log('[Push] Foreground message:', payload);

            const title = payload.notification?.title || payload.data?.title || 'Notification';
            const body = payload.notification?.body || payload.data?.message || '';

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/suki-cart-logo.png',
                });
            }

            window.dispatchEvent(
                new CustomEvent('pushNotification', {
                    detail: {
                        id: payload.data?.notification_id || Date.now(),
                        type: payload.data?.type || 'system',
                        title,
                        message: body,
                        data: payload.data || {},
                        created_at: new Date().toISOString(),
                    },
                })
            );
        });

        foregroundMessageListenerReady = true;
    } catch (err) {
        console.warn('[Push] Failed to set up message listener:', err);
    }
}
