import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Empty, Input, Pagination, Spin, Tag, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Package, Search, ChevronRight, X, Clock, CheckCircle, Truck, ShoppingBag } from "lucide-react"
import * as orderService from "../../../services/orderService"
import { getStorageUrl } from "../../../utils/storage"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusTabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"]

const formatMoney = (value) => `\u20b1${Number(value || 0).toFixed(2)}`
const getStoreName = (store) => store?.store_name || store?.name || "Unknown Seller"

export default function OrderIndex() {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [counts, setCounts] = useState({})
    const [search, setSearch] = useState("")
    const [activeStatus, setActiveStatus] = useState("all")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const searchTimer = useRef(null)

    const fetchOrders = useCallback(async (page = 1, pageSize = 10, status = activeStatus, keyword = search) => {
        setLoading(true)
        try {
            const data = await orderService.getOrders({
                page,
                per_page: pageSize,
                ...(status !== "all" ? { status } : {}),
                ...(keyword.trim() ? { search: keyword.trim() } : {}),
            })
            setOrders(data?.data || [])
            setTotal(data?.pagination?.total || 0)
            setCounts(data?.counts || {})
            setPagination({
                current: data?.pagination?.current_page || page,
                pageSize: data?.pagination?.per_page || pageSize,
            })
        } catch (err) {
            message.error(err.message || "Failed to fetch orders")
        } finally {
            setLoading(false)
        }
    }, [activeStatus, message, search])

    useEffect(() => {
        fetchOrders(1, pagination.pageSize, activeStatus, search)
        return () => clearTimeout(searchTimer.current)
    }, [activeStatus, fetchOrders, pagination.pageSize, search])

    const itemRows = useMemo(() => {
        return orders.flatMap((order) =>
            (order.order_items || order.item_groups?.flatMap((group) => group.items || []) || []).map((item) => ({
                ...order,
                order_item: item,
            }))
        )
    }, [orders])

    const activeTabTotal = activeStatus === "all" ? (counts.all ?? total) : (counts[activeStatus] ?? 0)
    const paginationTotal = search.trim() ? total : activeTabTotal
    const totalItems = paginationTotal
    const shouldShowPagination = paginationTotal > pagination.pageSize

    const handleSearch = (value) => {
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => setSearch(value), 200)
    }

    const handlePageChange = (page, pageSize) => {
        fetchOrders(page, pageSize, activeStatus, search)
    }

    const handleStatusChange = (status) => {
        setActiveStatus(status)
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }))
    }

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">

            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
                        <ShoppingBag size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Your Orders</h1>
                        <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                            {totalItems} order item{totalItems !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="my-4 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:mb-6 sm:p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <Input
                        placeholder="Search by order number or product"
                        prefix={<Search size={16} className="text-gray-400" />}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="customer-orders-search rounded-xl text-base"
                        size="large"
                    />

                    <div className="customer-orders-status-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                        {statusTabs.map((status) => {
                            const isActive = activeStatus === status
                            const label = status === "all" ? "All" : statusConfig[status]?.label || status

                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(status)}
                                    className={`flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${isActive
                                            ? "border-green-600 bg-green-600 text-white"
                                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100"
                                        }`}
                                    style={{ minWidth: "max-content" }}
                                >
                                    <span className="whitespace-nowrap">{label}</span>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/15 text-white" : "bg-white text-gray-500"}`}>
                                        {counts[status] || 0}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-64 items-center justify-center">
                    <Spin size="large" />
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 sm:h-20 sm:w-20">
                            <Package size={36} className="text-green-600" />
                        </div>
                        <h2 className="mb-2 text-lg font-bold text-green-900 sm:text-xl">No orders yet</h2>
                        <p className="text-sm leading-relaxed text-gray-500">Start shopping to create your first order.</p>
                        <Button type="primary" size="large" className="mt-6 rounded-xl font-semibold" onClick={() => navigate("/")}>
                            Continue Shopping
                        </Button>
                    </div>
                </div>
            ) : itemRows.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                    <Empty description={activeStatus === "all" ? "No product orders found" : `No ${statusConfig[activeStatus]?.label?.toLowerCase() || activeStatus} items found`} />
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-5">
                    {itemRows.map((order) => {
                        const item = order.order_item
                        const statusInfo = statusConfig[item?.status] || statusConfig.pending
                        const StatusIcon = statusInfo.icon
                        const store = item?.store || item?.product?.store
                        const itemTotal = item?.item_total ?? ((Number(item?.price || 0) * Number(item?.quantity || 0)) + Number(item?.shipping_cost || 0))

                        return (
                            <div key={`${order.id}-${item?.id}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/70 p-4 md:gap-4 md:p-5">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
                                            <ShoppingBag size={20} className="text-green-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="min-w-0 text-base font-bold text-gray-950">Order #{String(order.id || "").slice(0, 8)}</h2>
                                            <p className="mt-1 text-sm font-semibold text-gray-800">{getStoreName(store)}</p>
                                            <p className="text-xs text-gray-500 sm:text-sm">{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <Tag color={statusInfo.color} className="m-0 w-fit shrink-0 self-start">
                                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                            <StatusIcon size={14} />
                                            <span>{statusInfo.label}</span>
                                        </span>
                                    </Tag>
                                </div>

                                <div className="space-y-3 p-4 md:p-5">
                                    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:h-18 sm:w-18">
                                            {item?.product?.images?.length ? (
                                                <img
                                                    src={getStorageUrl(item.product.images[0].full_url || item.product.images[0].image_path)}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 self-center">
                                            <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item?.product?.name}</p>
                                            <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                                                Price {formatMoney(item?.price)} | Shipping {formatMoney(item?.shipping_cost)}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Qty {item?.quantity || 0}</p>
                                            {item?.variant?.name && (
                                                <p className="mt-1 text-xs text-gray-500 sm:text-sm">Variant: {item.variant.name}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 self-center text-right">
                                            <p className="text-xs text-gray-500">Item total</p>
                                            <p className="mt-1 text-base font-bold text-green-700 sm:text-lg">{formatMoney(itemTotal)}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            icon={<ChevronRight size={16} />}
                                            onClick={() => navigate(`/customer/orders/items/${order?.checkout_no || order?.id}`)}
                                            className="h-11 rounded-lg px-3 text-sm font-medium"
                                            aria-label="View order details"
                                        >
                                            View
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {shouldShowPagination && (
                <div className="customer-orders-pagination mt-6 flex justify-center lg:justify-end">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={paginationTotal}
                        onChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    )
}
