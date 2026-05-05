import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { App, Modal, Button } from "antd";
import { LayoutDashboard, Package, LogOut, Lock, ShoppingBag } from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/auth-context";
import Avatar from "../components/Avatar";
import { getStoreStatus } from "../services/sellerService";
import { navigateWithinApp } from "../services/inAppNavigation";
import { sukiCartLogo, sukiCartLogoHome } from "../utils/logos";

const BREAKPOINT = 1024;
const STORE_VERIFICATION_CACHE_KEY = "seller_store_verification";

const NAV = [
    { label: "Dashboard", to: "/seller/dashboard", icon: LayoutDashboard, alwaysVisible: true },
    { label: "Products", to: "/seller/products", icon: Package, alwaysVisible: false },
    { label: "Orders", to: "/seller/orders", icon: ShoppingBag, alwaysVisible: false },
];

function readCachedStoreVerification() {
    const cached = sessionStorage.getItem(STORE_VERIFICATION_CACHE_KEY);
    if (!cached) return null;

    try {
        return JSON.parse(cached);
    } catch {
        sessionStorage.removeItem(STORE_VERIFICATION_CACHE_KEY);
        return null;
    }
}

function persistStoreVerification(verification) {
    if (!verification) {
        sessionStorage.removeItem(STORE_VERIFICATION_CACHE_KEY);
        return;
    }

    sessionStorage.setItem(STORE_VERIFICATION_CACHE_KEY, JSON.stringify(verification));
}

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT);
    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isDesktop;
}

function SidebarContent({ user, location, handleLogout, storeVerified }) {
    const profileActive = location.pathname === "/seller/edit-profile";

    return (
        <div className="w-60 h-screen bg-rail-950 flex flex-col shadow-[2px_0_20px_rgba(0,0,0,0.18)]">
            {/* Brand */}
            <div className="px-5 py-6 border-b border-white/8">
                <Link to="/" className="no-underline flex items-center gap-2.5">
                    <div className="w-8.5 h-8.5 rounded-[9px] bg-white flex items-center justify-center">
                        <img src={sukiCartLogo} alt="SukiCart Logo" className="w-7 h-7 rounded-xl object-contain" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-white text-[0.95rem]">SukiCart</div>
                        <div className="text-[0.68rem] text-[#86efac] font-mono">SELLER PANEL</div>
                    </div>
                </Link>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                {NAV.map((n) => {
                    const active = location.pathname === n.to;
                    const IconComponent = n.icon;
                    const disabled = !storeVerified && !n.alwaysVisible;
                    if (disabled) {
                        return (
                            <div key={n.to}
                                className="flex items-center gap-2.5 px-3 py-2.75 rounded-[9px] font-body text-[0.9rem] mb-1 cursor-not-allowed opacity-40"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                                title="Available after store verification"
                            >
                                <Lock size={18} className="text-white/30" />
                                {n.label}
                            </div>
                        );
                    }
                    return (
                        <Link key={n.to} to={n.to}
                            className={`flex items-center gap-2.5 px-3 py-2.75 rounded-[9px] no-underline font-body text-[0.9rem] mb-1 transition-[background] duration-150 ${active ? 'font-semibold' : 'font-normal'}`}
                            style={{
                                color: active ? "white" : "rgba(255,255,255,0.7)",
                                background: active ? "rgba(34,197,94,0.25)" : "transparent",
                            }}>
                            <IconComponent size={18} className={active ? "text-[#86efac]" : "text-white/40"} />
                            {n.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User + logout */}
            <div className="px-3 py-4 border-t border-white/8">
                <Link
                    to="/seller/edit-profile"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 mb-1.5 rounded-[10px] no-underline transition-[background] duration-150"
                    style={{
                        background: profileActive ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.05)",
                    }}
                >
                    <Avatar user={user} />
                    <div className="overflow-hidden">
                        <div className="text-white font-body font-semibold text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis">{user?.username}</div>
                        <div className="text-[#86efac] text-[0.68rem] font-mono">{
                            user?.firstname || user?.lastname
                                ? `${user?.firstname || ""} ${user?.lastname || ""}`.trim().toUpperCase()
                                : "SELLER"
                        }</div>
                    </div>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] border-none bg-transparent text-white/50 font-body text-[0.875rem] cursor-pointer transition-all duration-150 hover:bg-[rgba(231,74,74,0.15)] hover:text-[rgba(255,130,130,0.9)]">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
}

export default function SellerLayout() {
    const { user, logoutUser } = useAuth();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useIsDesktop();
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [storeVerification, setStoreVerification] = useState(() => readCachedStoreVerification());
    const [storeStatusLoaded, setStoreStatusLoaded] = useState(false);
    const storeVerified = storeVerification?.store_status === "approved";
    const navigateToRoute = React.useCallback((to, options = {}) => {
        if (!navigateWithinApp(to, options)) {
            navigate(to, options);
        }
    }, [navigate]);

    const updateStoreVerification = (verification) => {
        setStoreVerification(verification);
        persistStoreVerification(verification);
    };

    useEffect(() => {
        getStoreStatus()
            .then(data => updateStoreVerification(data))
            .catch(() => updateStoreVerification(readCachedStoreVerification() ?? {
                store_status: "pending",
                rejection_reason: null,
            }))
            .finally(() => setStoreStatusLoaded(true));
    }, []);

    // Redirect to dashboard if trying to access restricted routes while unverified
    useEffect(() => {
        if (!storeStatusLoaded) return;

        if (!storeVerified) {
            const allowedPaths = ["/seller/dashboard", "/seller/edit-profile", "/seller/notifications"];
            if (!allowedPaths.includes(location.pathname)) {
                navigateToRoute("/seller/dashboard", { replace: true });
            }
        }
    }, [location.pathname, storeStatusLoaded, storeVerified, navigateToRoute]);

    const isActive = (to) => location.pathname === to;
    const getMobileNavClass = (active, disabled = false) =>
        `flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition-colors ${disabled
            ? "cursor-not-allowed text-gray-300"
            : active
                ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        }`;

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await logoutUser();
            message.success("Logged out successfully");
            setLogoutModalOpen(false);
            navigateToRoute("/", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            message.error("Failed to logout");
        } finally {
            setLogoutLoading(false);
        }
    };

    const mobileBottomNav = (
        <nav
            className="fixed bottom-0 left-0 right-0 z-120 border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        >
            <div className="grid grid-cols-4 gap-2 text-green-600">
                <button
                    type="button"
                    onClick={() => navigateToRoute("/seller/dashboard")}
                    className={getMobileNavClass(isActive("/seller/dashboard"))}
                    aria-current={isActive("/seller/dashboard") ? "page" : undefined}
                >
                    <LayoutDashboard size={18} className="text-inherit" />
                    <span className="text-[11px] font-semibold">Dashboard</span>
                </button>

                {!storeVerified ? (
                    <button
                        type="button"
                        disabled
                        className={getMobileNavClass(false, true)}
                        title="Available after store verification"
                    >
                        <Package size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Products</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => navigateToRoute("/seller/products")}
                        className={getMobileNavClass(isActive("/seller/products"))}
                        aria-current={isActive("/seller/products") ? "page" : undefined}
                    >
                        <Package size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Products</span>
                    </button>
                )}

                {!storeVerified ? (
                    <button
                        type="button"
                        disabled
                        className={getMobileNavClass(false, true)}
                        title="Available after store verification"
                    >
                        <ShoppingBag size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Orders</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => navigateToRoute("/seller/orders")}
                        className={getMobileNavClass(isActive("/seller/orders"))}
                        aria-current={isActive("/seller/orders") ? "page" : undefined}
                    >
                        <ShoppingBag size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Orders</span>
                    </button>
                )}

                {/* Logout */}
                <Button
                    type="text"
                    danger
                    onClick={() => setLogoutModalOpen(true)}
                    className="h-auto! min-h-13! w-full! p-0! rounded-2xl! border-0! bg-red-50! text-inherit transition-colors hover:bg-red-100/70! hover:text-red-600!"
                >
                    <span className="flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-2">
                        <LogOut size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Logout</span>
                    </span>
                </Button>
            </div>
        </nav>
    );

    return (
        <div className="flex min-h-screen overflow-x-hidden overscroll-x-none bg-gray-50">
            {/* DESKTOP: fixed sidebar */}
            {isDesktop && (
                <div className="w-60 shrink-0">
                    <div className="fixed top-0 left-0 z-40"><SidebarContent user={user} location={location} handleLogout={() => setLogoutModalOpen(true)} storeVerified={storeVerified} /></div>
                </div>
            )}

            {/* MOBILE: top navbar */}
            {!isDesktop && (
                <nav className="fixed top-0 left-0 right-0 z-50 h-15.5 bg-white border-b border-gray-100 flex items-center justify-between px-4 shadow-sm">
                    <button
                        type="button"
                        onClick={() => navigateToRoute("/")}
                        className="flex shrink-0 items-center gap-2 no-underline border-none bg-transparent p-0 text-left"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                            <img src={sukiCartLogoHome} alt="SukiCart Logo" className="h-full w-full rounded-xl object-contain" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold leading-tight text-green-900">SukiCart</div>
                            <div className="text-xs font-medium text-green-700/75">Seller</div>
                        </div>
                    </button>
                    <div className="flex items-center gap-2.5">
                        <NotificationBell />
                        <button
                            type="button"
                            onClick={() => navigateToRoute("/seller/edit-profile")}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border-none bg-transparent p-0 no-underline"
                            aria-label="Open profile"
                        >
                            <Avatar user={user} />
                        </button>
                    </div>
                </nav>
            )}

            <main className={`flex-1 min-w-0 overflow-x-hidden ${isDesktop ? 'pt-0' : 'pt-15.5 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]'}`}>
                {/* Desktop topbar */}
                {isDesktop && (
                    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
                        <div className="mx-auto flex h-14 max-w-7xl items-center justify-end gap-3 px-3 sm:px-4 lg:px-8">
                            <NotificationBell />
                            <Avatar user={user} />
                        </div>
                    </div>
                )}
                <Outlet context={{
                    storeVerification,
                    storeStatusLoaded,
                    setStoreVerification: updateStoreVerification,
                }} />
            </main>

            {/* MOBILE/TABLET Bottom Nav */}
            {!isDesktop && mobileBottomNav}

            <Modal
                title="Logout"
                open={logoutModalOpen}
                onCancel={() => !logoutLoading && setLogoutModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setLogoutModalOpen(false)} disabled={logoutLoading}>
                        Cancel
                    </Button>,
                    <Button
                        key="logout"
                        type="primary"
                        danger
                        loading={logoutLoading}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>,
                ]}
            >
                Are you sure you want to logout?
            </Modal>
        </div>
    );
}
