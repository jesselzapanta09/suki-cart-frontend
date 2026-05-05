export const isCordova = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    // Cordova bridge may be late during startup; file:// is a reliable mobile hint.
    return !!window.cordova || window.location?.protocol === 'file:';
};