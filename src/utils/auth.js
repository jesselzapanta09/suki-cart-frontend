const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
const AUTH_EXPIRED_EVENT = "auth:expired";

export function getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser() {
    return localStorage.getItem(USER_STORAGE_KEY);
}

export function storeAuth(user, token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function storeUser(user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return atob(padded);
}

export function getTokenPayload(token) {
    if (!token) return null;

    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        return JSON.parse(decodeBase64Url(payload));
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = getTokenPayload(token);
    if (!payload?.exp) return false;

    const expiresAtMs = payload.exp * 1000;
    return Date.now() >= expiresAtMs;
}

export function notifyAuthExpired() {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export { AUTH_EXPIRED_EVENT, TOKEN_STORAGE_KEY, USER_STORAGE_KEY };
