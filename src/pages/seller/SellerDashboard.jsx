import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Skeleton, Tag } from "antd";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { getSellerDashboard, resubmitStore } from "../../services/sellerService";
import { getStorageUrl } from "../../utils/storage";
import {
    ArrowRight,
    BadgeCheck,
    Boxes,
    CheckCircle2,
    Clock3,
    Package,
    Store,
    XCircle,
} from "lucide-react";

const formatMoney = (value) => `P${Number(value || 0).toFixed(2)}`;

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Unknown";

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

const customerName = (customer) =>
    `${customer?.firstname || ""} ${customer?.lastname || ""}`.trim() || customer?.email || "Customer";

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

export default function SellerDashboard() {
    const { user } = useAuth();
    const { message } = App.useApp();
    const {
        storeVerification,
        storeStatusLoaded,
        setStoreVerification,
    } = useOutletContext();

    const [dashboard, setDashboard] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState("");
    const [resubmitting, setResubmitting] = useState(false);

    const storeStatus = storeVerification?.store_status ?? null;
    const rejectionReason = storeVerification?.rejection_reason ?? null;
    const loadingStatus = !storeStatusLoaded && !storeVerification;
    const stats = dashboard?.stats ?? {};
    const recentProducts = dashboard?.recent_products ?? [];
    const recentOrders = dashboard?.recent_orders ?? [];
    const storeVerified = storeStatus === "approved";

    useEffect(() => {
        let mounted = true;

        const fetchDashboard = async () => {
            setLoadingDashboard(true);
            setDashboardError("");

            try {
                const data = await getSellerDashboard();
                if (mounted) {
                    setDashboard(data);
                }
            } catch (err) {
                if (mounted) {
                    const nextError = err.message || "Failed to load seller dashboard";
                    setDashboardError(nextError);
                }
            } finally {
                if (mounted) {
                    setLoadingDashboard(false);
                }
            }
        };

        fetchDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    const handleResubmit = async () => {
        try {
            setResubmitting(true);
            await resubmitStore();
            message.success("Store resubmitted for review.");
            setStoreVerification({
                ...(storeVerification ?? {}),
                store_status: "pending",
                rejection_reason: null,
            });
        } catch (err) {
            message.error(err.message || "Failed to resubmit.");
        } finally {
            setResubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="rounded-3xl border border-green-100 bg-linear-to-br from-green-50 via-emerald-50 to-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="mb-1 text-sm font-medium text-green-600">{greeting()}</p>
                        <h1 className="mb-2 text-2xl font-bold text-green-950 sm:text-3xl">Welcome back, {user?.firstname}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {user?.role || "Seller"}
                            </span>
                            <span className="text-gray-500">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </span>
                        </div>
                        <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
                            Track your store approval, products, and order activity from one place.
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

            {loadingStatus ? (
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                    <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </Card>
            ) : storeStatus === "pending" ? (
                <Alert
                    showIcon
                    type="warning"
                    className="rounded-2xl"
                    title="Store under review"
                    description={
                        <span>
                            Your store is currently waiting for admin approval. While under review, only the dashboard and{" "}
                            <Link to="/seller/edit-profile" className="font-semibold text-amber-700 underline">
                                Edit Profile
                            </Link>{" "}
                            are available.
                        </span>
                    }
                    icon={<Clock3 size={18} />}
                />
            ) : storeStatus === "rejected" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-red-700">
                                <XCircle size={20} />
                                <h2 className="m-0 text-lg font-semibold text-red-800">Store verification rejected</h2>
                            </div>
                            <p className="mt-2 text-sm text-red-700">
                                Update your store details in{" "}
                                <Link to="/seller/edit-profile" className="font-semibold text-red-700 underline">
                                    Edit Profile
                                </Link>{" "}
                                and submit again when ready.
                            </p>
                        </div>
                        <Button type="primary" danger loading={resubmitting} onClick={handleResubmit}>
                            Resubmit for Review
                        </Button>
                    </div>

                    {rejectionReason ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-white/70 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Rejection reason</p>
                            <p className="mt-2 text-sm text-red-900">{rejectionReason}</p>
                        </div>
                    ) : null}
                </div>
            ) : storeVerified ? (
                <Alert
                    showIcon
                    type="success"
                    className="rounded-2xl"
                    title="Store verified"
                    description="Your store is approved and can now manage products and fulfill orders."
                    icon={<CheckCircle2 size={18} />}
                />
            ) : null}

            {dashboardError ? (
                <Alert
                    type="error"
                    showIcon
                    title="Dashboard unavailable"
                    description={dashboardError}
                    className="rounded-2xl"
                />
            ) : null}

            <div className="grid mt-4 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {loadingDashboard ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="rounded-2xl border-gray-200 shadow-sm">
                            <Skeleton active paragraph={{ rows: 2 }} title={false} />
                        </Card>
                    ))
                ) : (
                    <>
                        <StatCard icon={<Boxes size={20} />} label="Products" value={stats.total_products} helper={`${stats.active_products ?? 0} active listings`} tone="green" />
                        <StatCard icon={<BadgeCheck size={20} />} label="Orders" value={stats.total_orders} helper={`${stats.pending_orders ?? 0} waiting to process`} tone="blue" />
                        <StatCard icon={<Package size={20} />} label="Stock Units" value={stats.total_stock} helper={`${stats.out_of_stock_products ?? 0} out of stock`} tone="amber" />
                        <StatCard icon={<Store size={20} />} label="Revenue" value={formatMoney(stats.lifetime_revenue)} helper={`${stats.delivered_orders ?? 0} delivered items`} tone="emerald" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SectionCard
                        title="Recent Orders"
                        subtitle="Latest item-level orders from your store"
                        action={
                            storeVerified ? (
                                <Link to="/seller/orders">
                                    <Button type="link" className="px-0 font-semibold">
                                        View all orders <ArrowRight size={16} />
                                    </Button>
                                </Link>
                            ) : null
                        }
                    >
                        {loadingDashboard ? (
                            <Skeleton active paragraph={{ rows: 5 }} title={false} />
                        ) : recentOrders.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="font-semibold text-gray-700">No orders yet</p>
                                <p className="mt-1 text-sm text-gray-500">New customer orders will appear here once your store starts selling.</p>
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
                                                    <Tag color={
                                                        order.status === "delivered" ? "green"
                                                            : order.status === "cancelled" ? "red"
                                                                : order.status === "shipped" ? "cyan"
                                                                    : order.status === "processing" ? "blue"
                                                                        : "gold"
                                                    } className="m-0">
                                                        {(order.status || "pending").toUpperCase()}
                                                    </Tag>
                                                </div>
                                                <p className="mt-1 truncate text-sm text-gray-600">{customerName(order.customer)}</p>
                                                <p className="mt-1 text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm font-semibold text-green-700">{formatMoney(order.item_total)}</p>
                                                <p className="text-xs text-gray-400">Qty {order.quantity}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                            <div className="flex h-15 w-15 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                                                {order.product?.images?.[0]?.image_path ? (
                                                    <img
                                                        src={getStorageUrl(order.product.images[0].image_path)}
                                                        alt={order.product.name}
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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

                <SectionCard
                    title="Recent Products"
                    subtitle="Newest listings from your store"
                    action={
                        storeVerified ? (
                            <Link to="/seller/products">
                                <Button type="link" className="px-0 font-semibold">
                                    Open products <ArrowRight size={16} />
                                </Button>
                            </Link>
                        ) : null
                    }
                >
                    {loadingDashboard ? (
                        <Skeleton active paragraph={{ rows: 5 }} title={false} />
                    ) : recentProducts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                            <p className="font-semibold text-gray-700">No products yet</p>
                            <p className="mt-1 text-sm text-gray-500">Once your store is verified, you can start adding listings here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentProducts.map((product) => {
                                const totalStock = product.variants?.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0) || 0;
                                const firstVariant = product.variants?.[0];
                                const imagePath = product.images?.[0]?.image_path;

                                return (
                                    <div key={product.uuid} className="rounded-2xl border border-gray-200 p-3.5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                                                {imagePath ? (
                                                    <img src={getStorageUrl(imagePath)} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package size={18} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                                                    <Tag color={product.status === "active" ? "green" : "orange"} className="m-0">
                                                        {(product.status || "draft").replace(/_/g, " ").toUpperCase()}
                                                    </Tag>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">{product.category?.name || "No category"}</p>
                                                <p className="mt-2 text-xs text-gray-400">
                                                    {firstVariant?.price ? formatMoney(firstVariant.price) : "No price yet"} | Stock {totalStock}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">Created {formatDate(product.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </SectionCard>
            </div>

        </div>
    );
}
