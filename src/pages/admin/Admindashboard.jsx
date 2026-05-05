import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Skeleton, Tag } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import {
    ArrowRight,
    BadgeCheck,
    Boxes,
    Package,
    ShieldCheck,
    Store,
    UserCheck,
    Users,
} from "lucide-react";
import { getAdminDashboard } from "../../services/adminDashboardService";

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

const getRoleColor = (role) => {
    if (role === "admin") return "green";
    if (role === "seller") return "orange";
    return "blue";
};

function StatCard({ icon, label, value, tone = "green", helper }) {
    const tones = {
        green: "bg-green-50 text-green-700 ring-green-100",
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
    };

    return (
        <Card className="h-full rounded-2xl border-gray-200 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">{value ?? 0}</p>
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
            <div className="mb-4 flex items-start justify-between gap-3">
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

export default function AdminDashboard() {
    const { user } = useAuth();
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
                const data = await getAdminDashboard();
                if (mounted) {
                    setDashboard(data);
                }
            } catch (err) {
                if (mounted) {
                    const nextError = err.message || "Failed to load admin dashboard";
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
    const pendingStores = dashboard?.pending_stores ?? [];
    const recentUsers = dashboard?.recent_users ?? [];
    const recentProducts = dashboard?.recent_products ?? [];

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="rounded-3xl border border-green-100 bg-linear-to-br from-green-50 via-emerald-50 to-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="mb-1 text-sm font-medium text-green-600">{greeting()}</p>
                        <h1 className="mb-2 text-2xl font-bold text-green-950 sm:text-3xl">Welcome back, {user?.firstname}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {user?.role || "Administrator"}
                            </span>
                            <span className="text-gray-500">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </span>
                        </div>
                        <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
                            Keep an eye on user activity, active products, and seller approvals from one place.
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
                    message="Dashboard unavailable"
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
                        <StatCard icon={<Users size={20} />} label="Managed Users" value={stats.managed_users} helper={`${stats.customers ?? 0} customers`} tone="green" />
                        <StatCard icon={<Store size={20} />} label="Pending Stores" value={stats.pending_stores} helper={`${stats.verified_stores ?? 0} verified stores`} tone="amber" />
                        <StatCard icon={<Package size={20} />} label="Active Products" value={stats.active_products} helper={`${stats.categories ?? 0} categories`} tone="emerald" />
                        <StatCard icon={<UserCheck size={20} />} label="Verified Accounts" value={stats.verified_users} helper={`${stats.sellers ?? 0} sellers`} tone="blue" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SectionCard
                        title="Seller Verification Queue"
                        subtitle="Stores currently waiting for admin review"
                        action={
                            <Link to="/admin/seller-verify">
                                <Button type="link" className="px-0 font-semibold">
                                    Open queue <ArrowRight size={16} />
                                </Button>
                            </Link>
                        }
                    >
                        {loading ? (
                            <Skeleton active paragraph={{ rows: 4 }} title={false} />
                        ) : pendingStores.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="font-semibold text-gray-700">No pending store reviews</p>
                                <p className="mt-1 text-sm text-gray-500">Everything in the seller queue looks up to date.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingStores.map((store) => (
                                    <Link
                                        key={store.uuid}
                                        to={`/admin/seller-verify/${store.uuid}`}
                                        className="block rounded-2xl border border-gray-200 p-4 no-underline transition-colors hover:border-green-200 hover:bg-green-50/50"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-base font-semibold text-gray-900">{store.store_name}</p>
                                                    <Tag color="gold" className="m-0">Pending</Tag>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {store.user?.firstname} {store.user?.lastname} {" | "} {store.user?.email}
                                                </p>
                                                <p className="mt-2 text-xs text-gray-400">
                                                    {store.category?.name || "No category"} {" | "} Submitted {formatDateTime(store.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                                Review <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="space-y-4">
                    <SectionCard title="Quick Totals" subtitle="A snapshot of the admin workspace">
                        {loading ? (
                            <Skeleton active paragraph={{ rows: 5 }} title={false} />
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { label: "Verified stores", value: stats.verified_stores, icon: ShieldCheck, tone: "text-green-700 bg-green-50" },
                                    { label: "Rejected stores", value: stats.rejected_stores, icon: BadgeCheck, tone: "text-amber-700 bg-amber-50" },
                                    { label: "Seller accounts", value: stats.sellers, icon: Store, tone: "text-blue-700 bg-blue-50" },
                                    { label: "Categories", value: stats.categories, icon: Boxes, tone: "text-emerald-700 bg-emerald-50" },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                            </div>
                                            <span className="text-lg font-bold text-gray-900">{item.value ?? 0}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <SectionCard
                    title="Newest Users"
                    subtitle="Recently added accounts"
                    action={
                        <Link to="/admin/users">
                            <Button type="link" className="px-0 font-semibold">
                                Manage users <ArrowRight size={16} />
                            </Button>
                        </Link>
                    }
                >
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 4 }} title={false} />
                    ) : recentUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">No user records found.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentUsers.map((account) => (
                                <div key={account.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                            {[account.firstname, account.lastname].filter(Boolean).join(" ") || account.email}
                                        </p>
                                        <p className="truncate text-sm text-gray-500">{account.email}</p>
                                        <p className="mt-1 text-xs text-gray-400">Joined {formatDate(account.created_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag color={getRoleColor(account.role)} className="m-0">{account.role?.toUpperCase()}</Tag>
                                        {account.email_verified_at ? <Tag color="green" className="m-0">Verified</Tag> : <Tag className="m-0">Unverified</Tag>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="Latest Active Products"
                    subtitle="Newest items already visible in the catalog"
                    action={
                        <Link to="/admin/products">
                            <Button type="link" className="px-0 font-semibold">
                                Browse products <ArrowRight size={16} />
                            </Button>
                        </Link>
                    }
                >
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 4 }} title={false} />
                    ) : recentProducts.length === 0 ? (
                        <p className="text-sm text-gray-500">No active products found.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentProducts.map((product) => {
                                const firstVariant = product.variants?.[0];
                                const totalStock = product.variants?.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0) || 0;

                                return (
                                    <Link
                                        key={product.uuid}
                                        to={`/admin/products/${product.uuid}`}
                                        className="block rounded-2xl border border-gray-200 p-4 no-underline transition-colors hover:border-green-200 hover:bg-green-50/50"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                                                <p className="truncate text-sm text-gray-500">
                                                    {product.store?.store_name || "No store"} {" | "} {product.category?.name || "No category"}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">Created {formatDate(product.created_at)}</p>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm font-semibold text-green-700">
                                                    {firstVariant?.price ? `P${Number(firstVariant.price).toFixed(2)}` : "No price"}
                                                </p>
                                                <p className="text-xs text-gray-400">Stock {totalStock}</p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}
