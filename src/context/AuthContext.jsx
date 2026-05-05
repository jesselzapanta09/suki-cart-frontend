import React, { useState, useEffect } from "react";
import { getProfile } from "../services/profileService";
import { AuthContext } from "./auth-context";
import {
    AUTH_EXPIRED_EVENT,
    clearStoredAuth,
    getStoredToken,
    getStoredUser,
    isTokenExpired,
    storeAuth,
    storeUser,
} from "../utils/auth";
import { unregisterPushSubscription } from "../services/notificationService";
import { isMobilePushRuntime, unregisterPushMobile } from "../services/pushMobile";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearAuthState = React.useCallback(() => {
        setUser(null);
        setToken(null);
        clearStoredAuth();
    }, []);

    useEffect(() => {
        let cancelled = false;

        const restoreAuth = async () => {
            const storedToken = getStoredToken();
            const storedUser = getStoredUser();
            let parsedUser = null;

            if (storedUser) {
                try {
                    parsedUser = JSON.parse(storedUser);
                } catch {
                    clearStoredAuth();
                }
            }

            if (!storedToken) {
                setLoading(false);
                return;
            }

            if (isTokenExpired(storedToken)) {
                clearAuthState();
                setLoading(false);
                return;
            }

            setToken(storedToken);

            if (parsedUser) {
                setUser(parsedUser);
            }

            try {
                const data = await getProfile();
                if (cancelled) return;

                setUser(data.user);
                storeUser(data.user);
            } catch (err) {
                if (cancelled) return;

                if (err?.status === 401) {
                    clearAuthState();
                } else if (parsedUser) {
                    setUser(parsedUser);
                } else {
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        restoreAuth();

        return () => {
            cancelled = true;
        };
    }, [clearAuthState]);

    useEffect(() => {
        const handleAuthExpired = () => {
            clearAuthState();
            setLoading(false);
        };

        window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    }, [clearAuthState]);

    const loginUser = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        storeAuth(userData, userToken);
    };

    const updateUser = (updatedData) => {
        const merged = { ...user, ...updatedData };
        setUser(merged);
        storeUser(merged);
    };

    const logoutUser = async () => {
        try {
            if (isMobilePushRuntime()) {
                await unregisterPushMobile();
            } else {
                await unregisterPushSubscription();
            }
        } catch (error) {
            console.warn("Push unregister failed during logout:", error);
        } finally {
            clearAuthState();
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            loginUser, logoutUser, updateUser,
            isAuthenticated: !!token,
            isAdmin: user?.role === "admin",
            isSeller: user?.role === "seller",
            isCustomer: user?.role === "customer",
            role: user?.role ?? null,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
