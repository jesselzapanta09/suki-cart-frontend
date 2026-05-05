import React, { useState, useEffect, useCallback } from "react";
import { Button, Skeleton, Empty, Tabs, Badge, message as antMessage } from "antd";
import {
    Bell, ShoppingBag, Tag, Settings, Store, CheckCheck, Trash2, RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    deleteNotification,
    getCurrentWebPushToken,
    getNotifications,
    markAllRead,
    markRead,
    registerPushSubscription,
    unregisterPushSubscription,
} from "../../services/notificationService";
import { isCordova } from "../../services/pushHelper";
import {
    getCurrentMobilePushToken,
    isMobilePushRuntime,
    registerPushMobile,
    unregisterPushMobile,
} from "../../services/pushMobile";
import { navigateWithinApp } from "../../services/inAppNavigation";

const TYPE_META = {
    order: { icon: ShoppingBag, bg: "bg-green-100", text: "text-green-600", label: "Order" },
    promo: { icon: Tag, bg: "bg-orange-100", text: "text-orange-500", label: "Promo" },
    store: { icon: Store, bg: "bg-purple-100", text: "text-purple-600", label: "Store" },
    system: { icon: Settings, bg: "bg-blue-100", text: "text-blue-500", label: "System" },
};

function getTypeMeta(type) {
    return TYPE_META[type] ?? TYPE_META.system;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({ n, onMarkRead, onDelete, onOpen }) {
    const meta = getTypeMeta(n.type);
    const Icon = meta.icon;

    return (
        <div
            onClick={() => onOpen(n)}
            className={`flex gap-4 px-4 py-4 border-b border-gray-100 transition-colors cursor-default
                        ${n.data?.url ? "cursor-pointer" : ""}
                        ${!n.read_at ? "bg-green-50/70" : "hover:bg-gray-50/60"}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                <Icon size={16} className={meta.text} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold leading-snug ${!n.read_at ? "text-green-900" : "text-gray-700"}`}>
                        {n.title}
                    </span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                        {timeAgo(n.created_at)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                        {meta.label}
                    </span>
                    {!n.read_at && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkRead(n.id);
                            }}
                            className="text-[10px] text-green-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                        >
                            Mark read
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(n.id);
                        }}
                        className="ml-auto text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-0 flex items-center"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {!n.read_at && (
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-2" />
            )}
        </div>
    );
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [tab, setTab] = useState("all");
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const fetchPage = useCallback(async (page = 1, replace = true) => {
        if (replace) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await getNotifications(page, 20);
            const items = res.data ?? [];
            setNotifications(prev => replace ? items : [...prev, ...items]);
            setMeta(res.meta ?? null);
        } catch {
            antMessage.error("Failed to load notifications.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

    useEffect(() => {
        (async () => {
            try {
                const token = (isMobilePushRuntime() || isCordova())
                    ? await getCurrentMobilePushToken()
                    : await getCurrentWebPushToken();

                setPushEnabled(!!token);
            } catch (err) {
                console.log("Push status check skipped:", err);
                setPushEnabled(false);
            }
        })();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
            );
        } catch {
            antMessage.error("Failed to mark as read.");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
            );
            antMessage.success("All notifications marked as read.");
        } catch {
            antMessage.error("Failed to mark all as read.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch {
            antMessage.error("Failed to delete notification.");
        }
    };

    const handleOpen = async (notification) => {
        if (!notification.read_at) {
            await handleMarkRead(notification.id);
        }

        if (notification.data?.url) {
            if (!navigateWithinApp(notification.data.url)) {
                navigate(notification.data.url);
            }
        }
    };

    const handleTogglePush = async () => {
        setPushLoading(true);

        try {
            const cordovaRuntime = isCordova() || window.location.protocol === "file:" || document.URL.startsWith("file:");

            if (cordovaRuntime) {
                if (pushEnabled) {
                    await unregisterPushMobile();
                    setPushEnabled(false);
                    antMessage.success("Push notifications disabled.");
                } else {
                    const token = await registerPushMobile({
                        requestPermission: true,
                        saveToBackend: true,
                    });

                    if (token) {
                        setPushEnabled(true);
                        antMessage.success("Push notifications enabled!");
                    } else {
                        setPushEnabled(false);
                        antMessage.error("Failed to enable mobile push notifications.");
                    }
                }

                return;
            }

            if (isMobilePushRuntime()) {
                antMessage.warning("Mobile push plugin is not ready yet. Please reopen the app and try again.");
                return;
            }

            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                antMessage.warning("Push notifications are not supported in this browser.");
                return;
            }

            if (pushEnabled) {
                await unregisterPushSubscription();
                setPushEnabled(false);
                antMessage.success("Push notifications disabled.");
            } else {
                const token = await registerPushSubscription({
                    requestPermission: true,
                    saveToBackend: true,
                });

                if (token) {
                    setPushEnabled(true);
                    antMessage.success("Push notifications enabled!");
                } else {
                    antMessage.error("Failed to enable push notifications.");
                }
            }
        } catch (err) {
            console.error(err);
            antMessage.error("Something went wrong.");
        } finally {
            setPushLoading(false);
        }
    };

    const filtered = tab === "unread"
        ? notifications.filter(n => !n.read_at)
        : notifications;

    const currentPage = meta?.current_page ?? 1;
    const lastPage = meta?.last_page ?? 1;

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Bell size={20} className="text-green-700" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-500">{unreadCount} unread</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchPage(1)}
                        className="text-gray-400 hover:text-green-600 bg-transparent border-none cursor-pointer p-1"
                        title="Refresh"
                    >
                        <RefreshCw size={15} />
                    </button>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            icon={<CheckCheck size={13} />}
                            onClick={handleMarkAllRead}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-4 shadow-sm">
                <div>
                    <p className="text-sm font-semibold text-gray-800">Push Notifications</p>
                    <p className="text-xs text-gray-500">
                        {pushEnabled
                            ? "You'll receive push alerts even when the app is closed."
                            : "Enable to get alerts when the app is in background."}
                    </p>
                </div>
                <Button
                    size="small"
                    loading={pushLoading}
                    onClick={handleTogglePush}
                    className={pushEnabled
                        ? "border-red-200 text-red-500 hover:bg-red-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"}
                >
                    {pushEnabled ? "Disable" : "Enable"}
                </Button>
            </div>

            <Tabs
                activeKey={tab}
                onChange={setTab}
                size="small"
                items={[
                    { key: "all", label: "All" },
                    {
                        key: "unread",
                        label: (
                            <span className="flex items-center gap-1.5">
                                Unread
                                {unreadCount > 0 && (
                                    <Badge count={unreadCount} size="small" color="#16a34a" />
                                )}
                            </span>
                        ),
                    },
                ]}
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} active avatar={{ shape: "square", size: 40 }} paragraph={{ rows: 1 }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={tab === "unread" ? "No unread notifications" : "No notifications yet"}
                        className="py-12"
                    />
                ) : (
                    filtered.map(n => (
                        <NotificationItem
                            key={n.id}
                            n={n}
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
                            onOpen={handleOpen}
                        />
                    ))
                )}

                {!loading && currentPage < lastPage && (
                    <div className="p-3 text-center border-t border-gray-100">
                        <Button
                            size="small"
                            loading={loadingMore}
                            onClick={() => fetchPage(currentPage + 1, false)}
                            className="text-green-600"
                        >
                            Load more
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
