export function isCordovaNavigationRuntime() {
    if (typeof window === 'undefined') {
        return false;
    }

    return !!window.cordova || window.location?.protocol === 'file:' || document.URL.startsWith('file:');
}

export function normalizeAppRoute(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return '/';
    }

    const trimmedUrl = rawUrl.trim();

    if (/^https?:\/\//i.test(trimmedUrl)) {
        try {
            const parsedUrl = new URL(trimmedUrl);
            return `${parsedUrl.pathname || '/'}${parsedUrl.search || ''}${parsedUrl.hash || ''}` || '/';
        } catch {
            return '/';
        }
    }

    return trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
}

export function navigateWithinApp(rawUrl, options = {}) {
    if (typeof window === 'undefined') {
        return false;
    }

    const { replace = false } = options;
    const route = normalizeAppRoute(rawUrl);

    if (!isCordovaNavigationRuntime()) {
        return false;
    }

    try {
        window.sessionStorage?.setItem('redirect', route);

        const currentRoute = `${window.location.pathname || '/'}${window.location.search || ''}${window.location.hash || ''}`;
        const navigateMethod = replace ? 'replaceState' : 'pushState';

        if (currentRoute !== route) {
            window.history[navigateMethod](null, '', route);
        }

        window.dispatchEvent(new PopStateEvent('popstate'));
        return true;
    } catch (error) {
        console.error('[Navigation] Failed to navigate within app:', error);
        return false;
    }
}
