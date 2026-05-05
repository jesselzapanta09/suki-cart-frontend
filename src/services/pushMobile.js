import { deleteFCMToken, saveFCMToken } from './notificationService.js';
import { navigateWithinApp } from './inAppNavigation.js';
import { getStoredToken } from '../utils/auth';

let mobileMessageListenerReady = false;
let mobileTokenRefreshListenerReady = false;

function getFirebasePlugin() {
    return typeof window !== 'undefined' ? window.FirebasePlugin : null;
}

function callPlugin(methodName, ...args) {
    return new Promise((resolve, reject) => {
        const plugin = getFirebasePlugin();
        if (!plugin || typeof plugin[methodName] !== 'function') {
            reject(new Error(`FirebasePlugin.${methodName} is not available`));
            return;
        }

        plugin[methodName](
            ...args,
            resolve,
            reject
        );
    });
}

function getDeviceType() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    return /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'android';
}

function getMobileMessageData(message) {
    const nestedData = message?.data;

    if (nestedData && typeof nestedData === 'object' && Object.keys(nestedData).length > 0) {
        return nestedData;
    }

    return message && typeof message === 'object' ? message : {};
}

function navigateMobileToRoute(rawUrl) {
    navigateWithinApp(rawUrl);
}

function buildMobileNotification(message) {
    const data = getMobileMessageData(message);

    return {
        id: data.notification_id || message?.id || Date.now(),
        type: data.type || 'system',
        title: message?.title || data.title || 'Notification',
        message: message?.body || data.message || data.body || '',
        data,
        created_at: new Date().toISOString(),
    };
}

async function ensureMobilePermission(requestPermission = true) {
    const plugin = getFirebasePlugin();
    if (!plugin) {
        return false;
    }

    if (typeof plugin.hasPermission === 'function') {
        const hasPermission = await callPlugin('hasPermission').catch(() => false);
        if (hasPermission) {
            return true;
        }
    }

    if (!requestPermission || typeof plugin.grantPermission !== 'function') {
        return false;
    }

    return callPlugin('grantPermission').catch(() => false);
}

async function setMobileAutoInitEnabled(enabled) {
    const plugin = getFirebasePlugin();
    if (!plugin || typeof plugin.setAutoInitEnabled !== 'function') {
        return;
    }

    await callPlugin('setAutoInitEnabled', !!enabled).catch((error) => {
        console.warn('[Push] Failed to set mobile autoinit:', error);
    });
}

async function fetchMobileToken() {
    return callPlugin('getToken').catch((error) => {
        console.error('[Push] FirebasePlugin.getToken error:', error);
        return null;
    });
}

export function isMobilePushRuntime() {
    if (typeof window === 'undefined') {
        return false;
    }

    const protocol = window.location?.protocol;
    const host = window.location?.hostname;
    const docUrl = typeof document !== 'undefined' ? document.URL : '';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

    const isFileWebView = protocol === 'file:' || docUrl.startsWith('file:');
    const isLocalhostWebView = (host === 'localhost' || host === '127.0.0.1')
        && /(Android|iPhone|iPad|iPod|wv)/i.test(ua);

    return !!window.cordova || !!window.FirebasePlugin || (isFileWebView && /cordova/i.test(ua)) || (isLocalhostWebView && !!window.cordova);
}

export function canUseMobilePush() {
    if (typeof window === 'undefined') {
        return false;
    }

    return !!window.FirebasePlugin || !!window.cordova;
}

export function waitForCordovaBridge(timeoutMs = 15000) {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }

        if (window.FirebasePlugin || window.cordova) {
            resolve(true);
            return;
        }

        let pollCount = 0;
        const pollInterval = 250;
        const maxPolls = Math.ceil(timeoutMs / pollInterval);

        const checkBridge = () => {
            pollCount++;

            if (window.FirebasePlugin || window.cordova) {
                console.log('[Push] Cordova bridge found after', pollCount * pollInterval, 'ms');
                resolve(true);
                return;
            }

            if (pollCount >= maxPolls) {
                console.warn('[Push] Cordova bridge not found after', timeoutMs, 'ms');
                resolve(false);
                return;
            }

            setTimeout(checkBridge, pollInterval);
        };

        setTimeout(checkBridge, 0);
    });
}

export function waitForMobilePushReady(timeoutMs = 15000) {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }

        if (!window.cordova && !window.FirebasePlugin) {
            console.warn('[Push] Cordova bridge/plugin not available');
            resolve(false);
            return;
        }

        if (window.FirebasePlugin) {
            console.log('[Push] FirebasePlugin already available');
            resolve(true);
            return;
        }

        let pollCount = 0;
        const pollInterval = 250;
        const maxPolls = Math.ceil(timeoutMs / pollInterval);

        const checkPlugin = () => {
            pollCount++;

            if (window.FirebasePlugin) {
                console.log('[Push] FirebasePlugin found after', pollCount * pollInterval, 'ms');
                resolve(true);
                return;
            }

            if (pollCount >= maxPolls) {
                console.warn('[Push] FirebasePlugin not found after', timeoutMs, 'ms');
                resolve(false);
                return;
            }

            setTimeout(checkPlugin, pollInterval);
        };

        setTimeout(checkPlugin, 0);
    });
}

export async function getCurrentMobilePushToken() {
    const bridgeReady = await waitForCordovaBridge(15000);
    if (!bridgeReady) {
        return null;
    }

    const ready = await waitForMobilePushReady(15000);
    if (!ready || !getFirebasePlugin()) {
        return null;
    }

    return fetchMobileToken();
}

export async function registerPushMobile(options = {}) {
    const {
        requestPermission = true,
        saveToBackend = true,
    } = options;

    console.log('[Push] Starting mobile push registration...');

    const bridgeReady = await waitForCordovaBridge(15000);
    if (!bridgeReady) {
        console.warn('[Push] Skipping mobile push registration: Cordova bridge/plugin unavailable');
        return null;
    }

    const ready = await waitForMobilePushReady(15000);
    if (!ready || !getFirebasePlugin()) {
        console.error('[Push] Firebase plugin not available after full wait');
        return null;
    }

    const hasPermission = await ensureMobilePermission(requestPermission);
    if (!hasPermission) {
        console.warn('[Push] Mobile notification permission denied.');
        return null;
    }

    await setMobileAutoInitEnabled(true);

    const token = await fetchMobileToken();
    if (!token) {
        console.warn('[Push] No token returned from plugin');
        return null;
    }

    if (saveToBackend && getStoredToken()) {
        await saveFCMToken(token, getDeviceType(), 'cordova');
    }

    return token;
}

export async function syncMobilePushSubscription() {
    return registerPushMobile({
        requestPermission: false,
        saveToBackend: true,
    });
}

export async function unregisterPushMobile() {
    const plugin = getFirebasePlugin();
    if (!plugin) {
        return;
    }

    const token = await getCurrentMobilePushToken();
    if (token && getStoredToken()) {
        await deleteFCMToken(token).catch(() => null);
    }

    await setMobileAutoInitEnabled(false);
    await callPlugin('unregister').catch((error) => {
        console.error('[Push] FirebasePlugin.unregister error:', error);
    });
}

export function listenPushMobile() {
    const plugin = getFirebasePlugin();
    if (!plugin || mobileMessageListenerReady) {
        return;
    }

    plugin.onMessageReceived(
        function (message) {
            console.log('[Push] Mobile message received:', message);

            const notification = buildMobileNotification(message);
            window.dispatchEvent(
                new CustomEvent('pushNotification', { detail: notification })
            );

            if (message?.tap) {
                navigateMobileToRoute(notification.data?.url);
            }
        },
        function (error) {
            console.error('[Push] Mobile message listener error:', error);
        }
    );

    mobileMessageListenerReady = true;
}

export function setUpMobileTokenRefreshListener() {
    const plugin = getFirebasePlugin();
    if (!plugin || mobileTokenRefreshListenerReady) {
        return;
    }

    plugin.onTokenRefresh(
        async function (token) {
            console.log('[Push] Mobile token refreshed:', token);

            if (!token || !getStoredToken()) {
                return;
            }

            try {
                await saveFCMToken(token, getDeviceType(), 'cordova');
            } catch (error) {
                console.error('[Push] Failed to save refreshed mobile token:', error);
            }
        },
        function (error) {
            console.error('[Push] Mobile token refresh listener error:', error);
        }
    );

    mobileTokenRefreshListenerReady = true;
}
