import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Skeleton, Tag } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { getCustomerDashboard } from "../../services/customerDashboardService";
import { getStorageUrl } from "../../utils/storage";
import {
    ArrowRight,
    BadgeCheck,
    Package,
    ShoppingBag,
    ShoppingCart,
    Truck,
} from "lucide-react";

const formatMoney = (value) => `P${Number(value || 0).toFixed(2)}`;

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
        : "Unknown";

function StatCard({ icon, label, value, helper, tone = "green" }) {
    const tones = {
        green: "bg-green-50 text-green-700 ring-green-100",
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
    };

    return (
        <Card className="h-full rounded-2xl border-gray-200 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">{value ?? 0}</p>
                    {helper ? <p className="mt-2 text-sm text-gray-500">{helper}</p> : null}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${tones[tone] || tones.green}`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}

function SectionCard({ title, subtitle, action, children }) {
    return (
        <Card className="h-full rounded-2xl border-gray-200 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="font-sora text-lg font-bold text-gray-900">{title}</h2>
                    {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </Card>
    );
}

export default function CustomerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const fetchDashboard = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await getCustomerDashboard();
                if (mounted) {
                    setDashboard(data);
                }
            } catch (err) {
                if (mounted) {
                    const nextError = err.message || "Failed to load customer dashboard";
                    setError(nextError);
                    message.error(nextError);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboard();

        return () => {
            mounted = false;
        };
    }, [message]);

    const stats = dashboard?.stats ?? {};
    const cartPreview = dashboard?.cart_preview ?? [];
    const recentOrders = dashboard?.recent_orders ?? [];

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
                <div className="rounded-3xl border border-green-100 bg-linear-to-br from-green-50 via-emerald-50 to-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="mb-1 text-sm font-medium text-green-600">{greeting()}</p>
                            <h1 className="mb-2 text-2xl font-bold text-green-950 sm:text-3xl">Welcome back, {user?.firstname}</h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    {user?.role || "Customer"}
                                </span>
                                <span className="text-gray-500">
                                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </span>
                            </div>
                            <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
                                Check your orders, continue shopping, and keep an eye on what is waiting in your cart.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-green-100 backdrop-blur sm:px-5">
                            <div className="text-3xl font-bold text-green-900 sm:text-4xl">
                                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Current time</p>
                        </div>
                    </div>
                </div>

                {error ? (
                    <Alert
                        type="error"
                        showIcon
                        title="Dashboard unavailable"
                        description={error}
                        className="rounded-2xl"
                    />
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Card key={index} className="rounded-2xl border-gray-200 shadow-sm">
                                <Skeleton active paragraph={{ rows: 2 }} title={false} />
                            </Card>
                        ))
                    ) : (
                        <>
                            <StatCard icon={<ShoppingCart size={20} />} label="Cart Items" value={stats.cart_items} helper={`${stats.cart_lines ?? 0} product lines`} tone="green" />
                            <StatCard icon={<ShoppingBag size={20} />} label="Orders" value={stats.total_orders} helper={`${stats.pending_orders ?? 0} still pending`} tone="blue" />
                            <StatCard icon={<Truck size={20} />} label="Delivered" value={stats.delivered_orders} helper={`${stats.shipped_orders ?? 0} currently shipped`} tone="amber" />
                            <StatCard icon={<BadgeCheck size={20} />} label="Spend" value={formatMoney(stats.spend_total)} helper={`${stats.reviews_given ?? 0} reviews submitted`} tone="emerald" />
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <SectionCard
                            title="Recent Orders"
                            subtitle="Your latest product orders"
                            action={
                                <Link to="/customer/orders">
                                    <Button type="link" className="px-0 font-semibold">
                                        View all orders <ArrowRight size={16} />
                                    </Button>
                                </Link>
                            }
                        >
                            {loading ? (
                                <Skeleton active paragraph={{ rows: 5 }} title={false} />
                            ) : recentOrders.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                    <p className="font-semibold text-gray-700">No orders yet</p>
                                    <p className="mt-1 text-sm text-gray-500">Start shopping to place your first order.</p>
                                    <Button type="primary" className="mt-5 rounded-xl" onClick={() => navigate("/")}>
                                        Continue Shopping
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="rounded-2xl border border-gray-200 p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            Order #{String(order.checkout_no || "").slice(0, 8)}
                                                        </p>
                                                        <Tag
                                                            color={
                                                                order.status === "delivered" ? "green"
                                                                    : order.status === "cancelled" ? "red"
                                                                        : order.status === "shipped" ? "cyan"
                                                                            : order.status === "processing" ? "blue"
                                                                                : "gold"
                                                            }
                                                            className="m-0"
                                                        >
                                                            {(order.status || "pending").toUpperCase()}
                                                        </Tag>
                                                        {order.can_review ? <Tag color="purple" className="m-0">REVIEW READY</Tag> : null}
                                                    </div>
                                                    <p className="mt-1 truncate text-sm text-gray-600">{order.store?.store_name || "Unknown store"}</p>
                                                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-sm font-semibold text-green-700">{formatMoney(order.item_total)}</p>
                                                    <p className="text-xs text-gray-400">Qty {order.quantity}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                                                    {order.product?.images?.[0]?.image_path ? (
                                                        <img
                                                            src={getStorageUrl(order.product.images[0].image_path)}
                                                            alt={order.product?.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package size={18} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-gray-900">{order.product?.name || "Product"}</p>
                                                    {order.variant?.name ? <p className="mt-1 text-xs text-gray-500">Variant: {order.variant.name}</p> : null}
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Price {formatMoney(order.price)} | Shipping {formatMoney(order.shipping_cost)}
                                                    </p>
                                                </div>
                                                <div className="shrink-0">
                                                    <Button
                                                        className="rounded-xl"
                                                        onClick={() => navigate(`/customer/orders/items/${order.checkout_no}`)}
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard
                        title="Cart Preview"
                        subtitle="Items waiting in your SukiCart"
                        action={
                            <Link to="/customer/cart">
                                <Button type="link" className="px-0 font-semibold">
                                    Open cart <ArrowRight size={16} />
                                </Button>
                            </Link>
                        }
                    >
                        {loading ? (
                            <Skeleton active paragraph={{ rows: 5 }} title={false} />
                        ) : cartPreview.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="font-semibold text-gray-700">Your cart is empty</p>
                                <p className="mt-1 text-sm text-gray-500">Browse products and add something you like.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cartPreview.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-gray-200 p-3.5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                                                {item.product?.images?.[0]?.image_path ? (
                                                    <img src={getStorageUrl(item.product.images[0].image_path)} alt={item.product?.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package size={18} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-900">{item.product?.name || "Product"}</p>
                                                <p className="mt-1 text-xs text-gray-500">{item.product?.store?.store_name || "Unknown store"}</p>
                                                {item.variant?.name ? <p className="mt-1 text-xs text-gray-500">Variant: {item.variant.name}</p> : null}
                                                <p className="mt-2 text-xs text-gray-400">
                                                    Qty {item.quantity} | {formatMoney(item.line_total)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

            </div>
    );
}
