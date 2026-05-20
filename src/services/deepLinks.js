import { isCordovaNavigationRuntime } from "./inAppNavigation";

export const APP_URL_SCHEME = "sukicart";

const ACTION_TO_WEB_ROUTE = {
    verifyEmail: "/verify-email",
    resetPassword: "/reset-password",
};

const ACTION_TO_HANDOFF_ROUTE = {
    verifyEmail: "/open-app/verify-email",
    resetPassword: "/open-app/reset-password",
};

function appendSearchParams(pathname, params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            searchParams.set(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
}

function normalizeActionSegment(pathname = "", hostname = "") {
    const pathSegments = String(pathname)
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean);

    const routeSegments = hostname
        ? [hostname.trim(), ...pathSegments]
        : pathSegments;

    if (routeSegments[0] === "open-app" && routeSegments[1]) {
        return routeSegments[1];
    }

    return routeSegments[0] ?? "";
}

export function mapActionSegmentToAction(segment) {
    switch (String(segment || "").toLowerCase()) {
        case "verify-email":
            return "verifyEmail";
        case "reset-password":
            return "resetPassword";
        default:
            return null;
    }
}

export function buildWebAuthRoute(action, params = {}) {
    const pathname = ACTION_TO_WEB_ROUTE[action];
    return pathname ? appendSearchParams(pathname, params) : "/";
}

export function buildAppHandoffRoute(action, params = {}) {
    const pathname = ACTION_TO_HANDOFF_ROUTE[action];
    return pathname ? appendSearchParams(pathname, params) : "/";
}

export function buildAppDeepLink(action, params = {}) {
    const route = buildWebAuthRoute(action, params);
    const [pathname, queryString = ""] = route.split("?");
    const normalizedPath = pathname.replace(/^\/+/, "");
    return `${APP_URL_SCHEME}://${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

export function resolveDeepLinkRoute(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") {
        return null;
    }

    try {
        const parsedUrl = new URL(rawUrl);
        const actionSegment = normalizeActionSegment(parsedUrl.pathname, parsedUrl.hostname);
        const action = mapActionSegmentToAction(actionSegment);

        if (!action) {
            return null;
        }

        const token = parsedUrl.searchParams.get("token");
        return buildWebAuthRoute(action, token ? { token } : {});
    } catch (error) {
        console.warn("[DeepLink] Failed to parse incoming URL:", rawUrl, error);
        return null;
    }
}

export function shouldAttemptAppOpen() {
    if (typeof window === "undefined" || isCordovaNavigationRuntime()) {
        return false;
    }

    const userAgent = window.navigator?.userAgent ?? "";
    return /Android|iPhone|iPad|iPod/i.test(userAgent);
}
