import React from "react";
import ReactDOM from "react-dom/client";
import { getApps, initializeApp } from "firebase/app";
import App from "./App.jsx";
import "./index.css";

import {
    setUpMessageListener,
    syncWebPushSubscription,
} from "./services/notificationService";

import {
    listenPushMobile,
    setUpMobileTokenRefreshListener,
    syncMobilePushSubscription,
} from "./services/pushMobile";

import { getStoredToken } from "./utils/auth";
import { navigateWithinApp } from "./services/inAppNavigation";
import { resolveDeepLinkRoute } from "./services/deepLinks";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function applyIncomingDeepLink(rawUrl) {
    const route = resolveDeepLinkRoute(rawUrl);

    if (!route) {
        return;
    }

    navigateWithinApp(route, { replace: true });
}

function installCordovaDeepLinkHandler() {
    if (typeof window === "undefined") {
        return;
    }

    const pendingUrls = Array.isArray(window.__sukiPendingOpenUrls)
        ? [...window.__sukiPendingOpenUrls]
        : [];

    window.__sukiPendingOpenUrls = [];
    window.handleOpenURL = (url) => {
        window.__sukiPendingOpenUrls = window.__sukiPendingOpenUrls || [];
        window.__sukiPendingOpenUrls.push(url);

        window.setTimeout(() => {
            const queuedUrl = window.__sukiPendingOpenUrls.shift();
            if (queuedUrl) {
                applyIncomingDeepLink(queuedUrl);
            }
        }, 0);
    };

    pendingUrls.forEach((url) => applyIncomingDeepLink(url));
}

installCordovaDeepLinkHandler();

async function initializeWebPush() {
    try {
        if (!getApps().length) {
            initializeApp(firebaseConfig);
        }

        console.log("[Firebase] Initialized (Web)");

        if ("serviceWorker" in navigator && "Notification" in window) {
            await navigator.serviceWorker
                .register("/firebase-messaging-sw.js")
                .then((reg) => console.log("[SW] Firebase SW registered:", reg))
                .catch((err) => console.error("[SW] Registration failed:", err));

            await setUpMessageListener();

            if (getStoredToken() && Notification.permission === "granted") {
                await syncWebPushSubscription();
            }
        }
    } catch (err) {
        console.error("[Firebase] Init failed:", err);
    }
}

function waitForCordovaOrTimeout(timeout = 3000) {
    return new Promise((resolve) => {
        let resolved = false;

        const finish = (mode) => {
            if (!resolved) {
                resolved = true;
                resolve(mode);
            }
        };

        document.addEventListener("deviceready", () => finish("cordova"), { once: true });

        if (window.location.protocol === "file:") {
            setTimeout(() => finish("cordova"), timeout);
            return;
        }

        setTimeout(() => finish("web"), timeout);
    });
}

waitForCordovaOrTimeout().then(async (mode) => {
    if (mode === "cordova") {
        console.log("[Push] Cordova ready -> mobile runtime");

        listenPushMobile();
        setUpMobileTokenRefreshListener();

        if (getStoredToken()) {
            await syncMobilePushSubscription();
        }

        return;
    }

    console.log("[Push] Web runtime detected");
    await initializeWebPush();
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
