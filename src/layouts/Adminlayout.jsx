import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { App, Modal, Button, Drawer } from "antd";
import { LayoutDashboard, Users, LogOut, LayoutGrid, ShieldCheck, Store, Package, History, MoreHorizontal } from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/auth-context";
import Avatar from "../components/Avatar";
import { navigateWithinApp } from "../services/inAppNavigation";
import { sukiCartLogo, sukiCartLogoHome } from "../utils/logos";

const SIDEBAR_W = 240;
const BREAKPOINT = 1024;

const NAV = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Categories", to: "/admin/categories", icon: LayoutGrid },
    { label: "Seller Verify", to: "/admin/seller-verify", icon: ShieldCheck },
    { label: "Verified Sellers", to: "/admin/sellers", icon: Store },
    { label: "Active products", to: "/admin/products", icon: Package },
    { label: "Logs", to: "/admin/logs", icon: History },
];

const MOBILE_PRIMARY_NAV = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Products", to: "/admin/products", icon: Package },
];

const MOBILE_SECONDARY_NAV = [
    { label: "Categories", to: "/admin/categories", icon: LayoutGrid },
    { label: "Seller Verify", to: "/admin/seller-verify", icon: ShieldCheck },
    { label: "Verified Sellers", to: "/admin/sellers", icon: Store },
    { label: "Logs", to: "/admin/logs", icon: History },
];

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT);
    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isDesktop;
}

function SidebarContent({ user, location, handleLogout }) {
    const profileActive = location.pathname === "/admin/edit-profile";

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
                        <div className="text-[0.68rem] text-[#86efac] font-mono">ADMIN PANEL</div>
                    </div>
                </Link>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                {NAV.map((n) => {
                    const active = location.pathname === n.to || location.pathname.startsWith(`${n.to}/`);
                    const IconComponent = n.icon;
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
                    to="/admin/edit-profile"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 mb-1.5 rounded-[10px] no-underline transition-[background] duration-150"
                    style={{
                        background: profileActive ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.05)",
                    }}
                >
                    <Avatar user={user} />
                    <div className="overflow-hidden">
                        <div className="text-white font-body font-semibold text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis">{user?.username}</div>
                        <div className="text-[#86efac] text-[0.68rem] font-mono">
                            {user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : ""}
                        </div>
                    </div>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] border-none bg-transparent text-white/50 font-body text-[0.875rem] cursor-pointer transition-all duration-150 hover:bg-[rgba(231,74,74,0.15)] hover:text-[rgba(255,130,130,0.9)]">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const { user, logoutUser } = useAuth();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useIsDesktop();
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const navigateToRoute = React.useCallback((to, options = {}) => {
        if (!navigateWithinApp(to, options)) {
            navigate(to, options);
        }
    }, [navigate]);
    const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);
    const moreActive = MOBILE_SECONDARY_NAV.some((n) => isActive(n.to));
    const getMobileNavClass = (active) =>
        `flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition-colors ${active
            ? "bg-green-50 text-green-700 ring-1 ring-green-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        }`;

    useEffect(() => {
        if (!moreOpen) return;

        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;
        const scrollY = window.scrollY;

        const prev = {
            bodyOverflow: bodyStyle.overflow,
            bodyPosition: bodyStyle.position,
            bodyTop: bodyStyle.top,
            bodyLeft: bodyStyle.left,
            bodyRight: bodyStyle.right,
            bodyWidth: bodyStyle.width,
            bodyTouchAction: bodyStyle.touchAction,
            htmlOverflow: htmlStyle.overflow,
        };

        bodyStyle.overflow = "hidden";
        bodyStyle.position = "fixed";
        bodyStyle.top = `-${scrollY}px`;
        bodyStyle.left = "0";
        bodyStyle.right = "0";
        bodyStyle.width = "100%";
        bodyStyle.touchAction = "none";
        htmlStyle.overflow = "hidden";

        return () => {
            bodyStyle.overflow = prev.bodyOverflow;
            bodyStyle.position = prev.bodyPosition;
            bodyStyle.top = prev.bodyTop;
            bodyStyle.left = prev.bodyLeft;
            bodyStyle.right = prev.bodyRight;
            bodyStyle.width = prev.bodyWidth;
            bodyStyle.touchAction = prev.bodyTouchAction;
            htmlStyle.overflow = prev.htmlOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [moreOpen]);

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

    return (
        <div className="flex min-h-screen overflow-x-hidden overscroll-x-none bg-gray-50">
            {/* DESKTOP: fixed sidebar */}
            {isDesktop && (
                <div className="w-60 shrink-0">
                    <div className="fixed top-0 left-0 z-40"><SidebarContent user={user} location={location} handleLogout={() => setLogoutModalOpen(true)} /></div>
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
                            <div className="text-xs font-medium text-green-700/75">Admin</div>
                        </div>
                    </button>
                    <div className="flex items-center gap-2.5">
                        <NotificationBell />
                        <button
                            type="button"
                            onClick={() => navigateToRoute("/admin/edit-profile")}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border-none bg-transparent p-0 no-underline"
                            aria-label="Open profile"
                        >
                            <Avatar user={user} />
                        </button>
                    </div>
                </nav>
            )}

            <main className={`flex-1 min-w-0 ${isDesktop ? 'pt-0' : 'pt-15.5 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]'}`}>
                {/* Desktop topbar */}
                {isDesktop && (
                    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
                        <div className="mx-auto flex h-14 max-w-7xl items-center justify-end gap-3 px-3 sm:px-4 lg:px-8">
                            <NotificationBell />
                            <Avatar user={user} />
                        </div>
                    </div>
                )}
                <Outlet />
            </main>

            {/* MOBILE/TABLET Bottom Nav */}
            {!isDesktop && (
                <nav
                    className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
                >
                    <div className="grid grid-cols-4 gap-2 text-green-600">
                        {MOBILE_PRIMARY_NAV.map((n) => {
                            const IconComponent = n.icon;
                            return (
                                <button
                                    key={n.to}
                                    type="button"
                                    onClick={() => navigateToRoute(n.to)}
                                    className={getMobileNavClass(isActive(n.to))}
                                    aria-current={isActive(n.to) ? "page" : undefined}
                                >
                                    <IconComponent size={18} className="text-inherit" />
                                    <span className="text-[11px] font-semibold whitespace-nowrap">{n.label}</span>
                                </button>
                            );
                        })}

                        <Button
                            type="text"
                            onClick={() => setMoreOpen(true)}
                            className="h-auto! min-h-13! w-full! p-0! rounded-2xl! border-0!"
                            aria-expanded={moreOpen}
                            aria-controls="admin-mobile-more-drawer"
                        >
                            <span className={getMobileNavClass(moreActive)}>
                                <MoreHorizontal size={18} className="text-inherit" />
                                <span className="text-[11px] font-semibold">More</span>
                            </span>
                        </Button>
                    </div>
                </nav>
            )}

            {!isDesktop && (
                <Drawer
                    id="admin-mobile-more-drawer"
                    title="More"
                    placement="bottom"
                    open={moreOpen}
                    onClose={() => setMoreOpen(false)}
                    height="auto"
                    footer={
                        <Button
                            type="text"
                            danger
                            onClick={() => {
                                setMoreOpen(false);
                                setLogoutModalOpen(true);
                            }}
                            className="h-auto! w-full! justify-start! rounded-xl! border-0! bg-red-50! px-3! py-3! text-left! transition-colors hover:bg-red-100/70! hover:text-red-600!"
                        >
                            <span className="flex items-center gap-3">
                                <LogOut size={18} className="text-inherit" />
                                <span className="text-sm font-semibold">Logout</span>
                            </span>
                        </Button>
                    }
                    styles={{
                        body: { overflow: "hidden", paddingBottom: 0 },
                        content: { maxHeight: "calc(100dvh - 5rem)" },
                        footer: {
                            padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)",
                            borderTop: "none",
                        },
                    }}
                    className="md:hidden"
                >
                    <div className="flex flex-col gap-2">
                        {MOBILE_SECONDARY_NAV.map((n) => {
                            const IconComponent = n.icon;
                            const active = isActive(n.to);
                            return (
                                <button
                                    key={n.to}
                                    type="button"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        navigateToRoute(n.to);
                                    }}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-3 no-underline transition-colors ${active
                                        ? "bg-green-50 text-green-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                        }`}
                                >
                                    <IconComponent size={18} className="text-inherit" />
                                    <span className="text-sm font-medium">{n.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </Drawer>
            )}

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
