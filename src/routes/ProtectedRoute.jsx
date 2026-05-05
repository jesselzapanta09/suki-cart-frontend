import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

// role: "admin" | "seller" | "customer" | "user" | undefined (any authenticated)
const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, isAdmin, isSeller, isCustomer, loading } = useAuth();

    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (role === "admin"    && !isAdmin)    return <Navigate to="/dashboard" replace />;
    if (role === "seller"   && !isSeller)   return <Navigate to="/dashboard" replace />;
    if (role === "customer" && !isCustomer) return <Navigate to="/dashboard" replace />;
    if (role === "user"     && isAdmin)     return <Navigate to="/admin/dashboard" replace />;

    return children;
};

export default ProtectedRoute;
