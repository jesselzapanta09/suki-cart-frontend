import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { App, Badge, Modal, Button } from "antd";
import { ShoppingBag, LayoutDashboard, ShoppingCart, User, LogOut } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useCart } from "../context/CartContext";
import Avatar from "../components/Avatar";
import NotificationBell from "../components/NotificationBell";
import { navigateWithinApp } from "../services/inAppNavigation";
import { sukiCartLogoHome } from "../utils/logos";

const NAV = [
    { label: "Dashboard", to: "/customer/dashboard", icon: LayoutDashboard },
    { label: "Cart", to: "/customer/cart", icon: ShoppingCart, cartBadge: true },
    { label: "Order", to: "/customer/orders", icon: ShoppingBag },
];

export default function CustomerLayout() {
    const { user, logoutUser } = useAuth();
    const { totalItems } = useCart();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [logoutModalOpen, setLogoutModalOpen] = React.useState(false);
    const [logoutLoading, setLogoutLoading] = React.useState(false);
    const navigateToRoute = React.useCallback((to, options = {}) => {
        if (!navigateWithinApp(to, options)) {
            navigate(to, options);
        }
    }, [navigate]);

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

    const isActive = (to) => location.pathname === to;
    const profileActive = isActive("/customer/edit-profile");
    const getMobileNavClass = (active) =>
        `flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition-colors ${active
            ? "bg-green-50 text-green-700 ring-1 ring-green-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        }`;

    const mobileBottomNav = (
        <>
            {/* Mobile Bottom Nav */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-120 border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
            >
                <div className="grid grid-cols-4 gap-2 text-green-600">

                    {/* Dashboard */}
                    <button
                        type="button"
                        onClick={() => navigateToRoute("/customer/dashboard")}
                        className={getMobileNavClass(isActive("/customer/dashboard"))}
                        aria-current={isActive("/customer/dashboard") ? "page" : undefined}
                    >
                        <LayoutDashboard size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Dashboard</span>
                    </button>

                    {/* Cart */}
                    <button
                        type="button"
                        onClick={() => navigateToRoute("/customer/cart")}
                        className={getMobileNavClass(isActive("/customer/cart"))}
                        aria-current={isActive("/customer/cart") ? "page" : undefined}
                    >
                        <Badge count={totalItems} size="small" offset={[6, -2]}>
                            {/* force color in case Badge acts up */}
                            <ShoppingCart size={18} className="text-inherit" style={{ color: "#16a34a" }} />
                        </Badge>
                        <span className="text-[11px] font-semibold">Cart</span>
                    </button>

                    {/* Order */}
                    <button
                        type="button"
                        onClick={() => navigateToRoute("/customer/orders")}
                        className={getMobileNavClass(isActive("/customer/orders"))}
                        aria-current={isActive("/customer/orders") ? "page" : undefined}
                    >
                        <ShoppingBag size={18} className="text-inherit" />
                        <span className="text-[11px] font-semibold">Order</span>
                    </button>

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
            <div className="h-20 md:hidden" style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }} />
        </>
    );

    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden overscroll-x-none bg-gray-50 text-gray-900">
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                {/* Desktop Layout (md and above): 3-column grid */}
                <div className="hidden md:grid grid-cols-3 items-center px-4 sm:px-6 lg:px-8 h-16 sm:h-20 max-w-7xl mx-auto gap-2 sm:gap-4">
                    {/* Column 1: Logo */}
                    <Link to="/" className="no-underline flex items-center gap-1 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                            <img src={sukiCartLogoHome} alt="SukiCart Logo" className="h-full w-full rounded-xl object-contain" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="font-display font-bold text-green-900 text-sm sm:text-base">SukiCart</div>
                        </div>
                    </Link>

                    {/* Column 2: Desktop nav links */}
                    <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                        {NAV.map(n => {
                            const Icon = n.icon;
                            const active = isActive(n.to);
                            return (
                                <div key={n.to} className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${active ? "bg-green-50 text-green-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>
                                    <Link to={n.to} className="flex items-center gap-1 sm:gap-2 no-underline text-inherit">
                                        {n.cartBadge ? (
                                            <Badge count={totalItems} size="small" color="#16a34a" offset={[4, -2]}><Icon size={16} /></Badge>
                                        ) : <Icon size={16} />}
                                        <span className="hidden sm:inline">{n.label}</span>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Column 3: Notifications, user info, and logout */}
                    <div className="flex items-center gap-1 sm:gap-2 justify-end">
                        <NotificationBell />
                        <Link
                            to="/customer/edit-profile"
                            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl no-underline transition-colors ${profileActive
                                    ? "bg-green-100 border border-green-200"
                                    : "bg-green-50 border border-green-100 hover:bg-green-100"
                                }`}
                        >
                            <Avatar user={user} />
                            <div>
                                <div className="text-[10px] text-green-600 font-mono">{user?.firstname} {user?.lastname}</div>
                            </div>
                        </Link>
                        <button onClick={() => setLogoutModalOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent text-sm font-medium">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Layout (< md): Logo, profile, and notification bell */}
                <div className="flex items-center justify-between px-4 py-3 md:hidden">
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
                            <div className="text-xs font-medium text-green-700/75">Customer</div>
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            type="button"
                            onClick={() => navigateToRoute("/customer/edit-profile")}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border-none bg-transparent p-0"
                            aria-label="Open profile"
                        >
                            {user ? (
                                <Avatar user={user} />
                            ) : (
                                <User size={18} className="text-green-700" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 overflow-x-hidden pb-4"><Outlet /></main>
            {mobileBottomNav}

            {/* Logout Confirmation Modal */}
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
