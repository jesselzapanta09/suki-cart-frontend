import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { App, Empty, Input, Pagination, Spin, Tag, Button } from "antd"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ChevronRight, Clock, Package, Search, ShoppingBag, Truck, User, X } from "lucide-react"
import { getSellerOrders } from "../../../services/sellerService"
import { formatPeso } from "../../../utils/currency"
import { getStorageUrl } from "../../../utils/storage"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusTabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"]
const statusSortOrder = {
    pending: 0,
    processing: 1,
    shipped: 2,
    delivered: 3,
    cancelled: 4,
}

const customerName = (customer) => `${customer?.firstname || ""} ${customer?.lastname || ""}`.trim() || customer?.email || "Customer"
const getCustomerKey = (customer) => customer?.id || customer?.uuid || customer?.email || "unknown-customer"
const getItemTotal = (item) => item?.item_total ?? ((Number(item?.price || 0) * Number(item?.quantity || 0)) + Number(item?.shipping_cost || 0))
const getStatusRank = (status) => statusSortOrder[status] ?? Number.MAX_SAFE_INTEGER
const getCreatedAtValue = (value) => {
    const timestamp = new Date(value || 0).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
}

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
            const data = await getSellerOrders({
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
            (order.store_order?.items || []).map((item) => ({
                ...order,
                order_item: item,
            }))
        )
    }, [orders])

    const customerGroups = useMemo(() => {
        const groups = new Map()

        itemRows.forEach((order) => {
            const customer = order.customer || null
            const customerKey = getCustomerKey(customer)

            if (!groups.has(customerKey)) {
                groups.set(customerKey, {
                    key: customerKey,
                    customer,
                    items: [],
                    subtotal: 0,
                })
            }

            const group = groups.get(customerKey)
            group.items.push(order)
            group.subtotal += getItemTotal(order.order_item)
        })

        return Array.from(groups.values())
            .map((group) => {
                const sortedItems = [...group.items].sort((leftOrder, rightOrder) => {
                    if (activeStatus === "all") {
                        const statusDiff = getStatusRank(leftOrder.order_item?.status) - getStatusRank(rightOrder.order_item?.status)
                        if (statusDiff !== 0) {
                            return statusDiff
                        }
                    }

                    return getCreatedAtValue(rightOrder.created_at) - getCreatedAtValue(leftOrder.created_at)
                })

                return {
                    ...group,
                    items: sortedItems,
                    sortRank: sortedItems.reduce((lowestRank, order) => {
                        return Math.min(lowestRank, getStatusRank(order.order_item?.status))
                    }, Number.MAX_SAFE_INTEGER),
                    latestCreatedAt: sortedItems.reduce((latestValue, order) => {
                        return Math.max(latestValue, getCreatedAtValue(order.created_at))
                    }, 0),
                }
            })
            .sort((leftGroup, rightGroup) => {
                if (activeStatus === "all") {
                    const statusDiff = leftGroup.sortRank - rightGroup.sortRank
                    if (statusDiff !== 0) {
                        return statusDiff
                    }
                }

                return rightGroup.latestCreatedAt - leftGroup.latestCreatedAt
            })
    }, [activeStatus, itemRows])

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

    const handleOpenDetails = (checkoutNo) => {
        if (!checkoutNo) {
            message.warning("Unable to open order details for this item")
            return
        }

        navigate(`/seller/orders/items/${checkoutNo}`)
    }

    return (
          <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
                            <ShoppingBag size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Store Orders</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                                {totalItems} order item{totalItems !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:mb-6 sm:p-4 md:p-5">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <Input
                            placeholder="Search by order number or product"
                            prefix={<Search size={16} className="text-gray-400" />}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="seller-orders-search rounded-xl text-base"
                            size="large"
                        />

                        <div className="seller-orders-status-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                            {statusTabs.map((status) => {
                                const isActive = activeStatus === status
                                const label = status === "all" ? "All" : statusConfig[status]?.label || status

                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleStatusChange(status)}
                                        className={`flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                            isActive
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
                            <h2 className="mb-2 text-lg font-bold text-green-900 sm:text-xl">No product orders yet</h2>
                            <p className="text-sm leading-relaxed text-gray-500">New customer product orders for your store will appear here.</p>
                        </div>
                    </div>
                ) : itemRows.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                        <Empty description={activeStatus === "all" ? "No product orders found" : `No ${statusConfig[activeStatus]?.label?.toLowerCase() || activeStatus} items found`} />
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-5">
                        {customerGroups.map((group) => (
                            <div key={group.key} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gray-50/70 p-4 md:flex-row md:items-center md:p-5">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-green-100 bg-green-100">
                                            {group.customer?.profile_picture ? (
                                                <img
                                                    src={getStorageUrl(group.customer.profile_picture)}
                                                    alt={customerName(group.customer)}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <User size={20} className="text-green-700" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="truncate font-bold text-green-950">{customerName(group.customer)}</h2>
                                            <p className="text-xs text-gray-500">
                                                {group.items.length} order item{group.items.length !== 1 ? "s" : ""} from this customer
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-xs text-gray-500">Customer total</p>
                                        <p className="font-bold text-green-700">{formatPeso(group.subtotal)}</p>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {group.items.map((order) => {
                                        const item = order.order_item
                                        const statusInfo = statusConfig[item?.status] || statusConfig.pending
                                        const StatusIcon = statusInfo.icon
                                        const itemTotal = getItemTotal(item)

                                        return (
                                            <div key={`${order.id}-${item?.id}`} className="grid gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                                                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:h-18 sm:w-18">
                                                        {item?.product?.images?.length ? (
                                                            <img
                                                                src={getStorageUrl(item.product.images[0].full_url || item.product.images[0].image_path)}
                                                                alt={item.product.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 self-start">
                                                        <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item?.product?.name}</p>
                                                        <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                                                            Price {formatPeso(item?.price)} | Shipping {formatPeso(item?.shipping_cost)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500 sm:text-sm">Qty {item?.quantity || 0}</p>
                                                        {item?.variant?.name && (
                                                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Variant: {item.variant.name}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-950">Order #{String(order.id || "").slice(0, 8)}</p>
                                                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                                                        </div>
                                                        <Tag color={statusInfo.color} className="m-0 w-fit shrink-0">
                                                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                                                <StatusIcon size={14} />
                                                                <span>{statusInfo.label}</span>
                                                            </span>
                                                        </Tag>
                                                    </div>

                                                    <div className="flex items-end justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Item total</p>
                                                            <p className="mt-1 text-base font-bold text-green-700 sm:text-lg">{formatPeso(itemTotal)}</p>
                                                        </div>
                                                        <Button
                                                            icon={<ChevronRight size={16} />}
                                                            onClick={() => handleOpenDetails(order?.checkout_no || order?.id)}
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
                            </div>
                        ))}
                    </div>
                )}

                {shouldShowPagination && (
                    <div className="seller-orders-pagination mt-6 flex justify-center lg:justify-end">
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
