function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
}

function isAbsoluteUrl(value) {
    return /^(https?:)?\/\//i.test(String(value || ""));
}

export function getAppBaseUrl() {
    return `${window.location.origin}/`;
}

export function resolveAppAssetUrl(path) {
    if (!path) return "";
    if (isAbsoluteUrl(path) || String(path).startsWith("data:")) return path;

    return new URL(String(path).replace(/^\/+/, ""), getAppBaseUrl()).href;
}

export function getApiBaseUrl() {
    const envBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);

    if (envBaseUrl) {
        return envBaseUrl;
    }

    return "/api";
}

export function getApiOrigin() {
    const apiBaseUrl = getApiBaseUrl();

    if (isAbsoluteUrl(apiBaseUrl)) {
        return new URL(apiBaseUrl).origin;
    }

    return trimTrailingSlash(window.location.origin);
}

export function resolveBackendUrl(path) {
    if (!path) return "";
    if (isAbsoluteUrl(path) || String(path).startsWith("data:")) return path;

    const normalizedPath = String(path).replace(/^\/+/, "");
    return `${getApiOrigin()}/${normalizedPath}`;
}
