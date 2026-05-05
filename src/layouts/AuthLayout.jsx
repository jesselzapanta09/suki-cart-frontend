import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export default function AuthLayout() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return (
        <div className="min-h-screen overflow-x-hidden overscroll-x-none">
            <Outlet />
        </div>
    );
}
