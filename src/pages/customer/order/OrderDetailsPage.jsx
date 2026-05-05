import React, { useCallback, useEffect, useMemo, useState } from "react"
import { App, Button, Empty, Input, Modal, Rate, Spin, Tag } from "antd"
import { ArrowLeft, CheckCircle, Clock, MapPin, Package, ShoppingBag, Star, Truck, X } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import * as orderService from "../../../services/orderService"
import LocationAddress from "../../../components/LocationAddress"
import ReviewProductModal from "./ReviewProductModal"
import { getStorageUrl } from "../../../utils/storage"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusSteps = ["pending", "processing", "shipped", "delivered"]

const formatMoney = (value) => `\u20b1${Number(value || 0).toFixed(2)}`
const canCancelItem = (item) => ["pending", "processing"].includes(item?.status)
const getCancelledByLabel = (cancelledBy) => ({
    customer: "Customer",
    seller: "Seller",
    admin: "Admin",
}[cancelledBy] || "Unknown")

export default function OrderDetailsPage() {
    const { checkoutNo } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()

    const [order, setOrder] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancellationReason, setCancellationReason] = useState("")
    const [cancellationLoading, setCancellationLoading] = useState(false)
    const [deliveryLoading, setDeliveryLoading] = useState(false)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [reviewSubmitting, setReviewSubmitting] = useState(false)

    const fetchOrderDetails = useCallback(async () => {
        setLoading(true)
        try {
            const data = await orderService.getOrder(checkoutNo)
            setOrder(data?.data?.group || null)
            setSelectedItem(data?.data?.item || null)
        } catch (err) {
            message.error(err.message || "Failed to fetch order details")
        } finally {
            setLoading(false)
        }
    }, [checkoutNo, message])

    useEffect(() => {
        fetchOrderDetails()
    }, [fetchOrderDetails])

    const rawItemGroups = useMemo(() => order?.item_groups || [], [order])
    const itemGroups = useMemo(() => {
        if (!selectedItem) return []
        return rawItemGroups
            .map((group) => ({ ...group, items: (group.items || []).filter((item) => item.id === selectedItem.id) }))
            .filter((group) => group.items.length > 0)
    }, [rawItemGroups, selectedItem])

    const closeCancelModal = () => {
        setCancelTarget(null)
        setCancellationReason("")
    }

    const handleCancel = async () => {
        if (!cancellationReason.trim()) {
            message.warning("Please provide a cancellation reason")
            return
        }

        setCancellationLoading(true)
        try {
            const data = await orderService.cancelOrderItem(cancelTarget.item.id, cancellationReason)
            setOrder(data?.data?.group || null)
            setSelectedItem(data?.data?.item || null)
            message.success("Item cancelled and totals recalculated")
            closeCancelModal()
        } catch (err) {
            message.error(err.message || "Failed to cancel")
        } finally {
            setCancellationLoading(false)
        }
    }

    const handleMarkDelivered = async () => {
        if (!selectedItem?.id) return

        setDeliveryLoading(true)
        try {
            const data = await orderService.markOrderItemDelivered(selectedItem.id)
            setOrder(data?.data?.group || null)
            setSelectedItem(data?.data?.item || null)
            message.success("Product marked as delivered")
        } catch (err) {
            message.error(err.message || "Failed to mark product delivered")
        } finally {
            setDeliveryLoading(false)
        }
    }

    const handleReviewSubmit = async (values) => {
        if (!selectedItem?.id) return

        setReviewSubmitting(true)
        try {
            await orderService.createProductReview(selectedItem.id, values)
            await fetchOrderDetails()
            setReviewModalOpen(false)
            message.success("Product review submitted")
        } catch (err) {
            message.error(err.message || "Failed to submit product review")
        } finally {
            setReviewSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
                <Spin size="large" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-3 py-8 sm:px-4">
                <div className="text-center">
                    <Empty description="Order not found" />
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate("/customer/orders")}
                        className="mt-4 h-10 px-6 text-base font-semibold sm:h-11"
                    >
                        Back to Orders
                    </Button>
                </div>
            </div>
        )
    }

    const currentStatus = selectedItem?.status || order.status
    const currentStep = currentStatus === "cancelled" ? 0 : Math.max(statusSteps.indexOf(currentStatus), 0)
    const statusInfo = statusConfig[currentStatus] || statusConfig.pending
    const StatusIcon = statusInfo.icon
    const itemTotal = selectedItem ? Number(selectedItem.price || 0) * Number(selectedItem.quantity || 0) : 0
    const timelineItems = statusSteps.map((status, index) => {
        const isCompleted = index < currentStep
        const isCurrent = status === currentStatus
        const isUpcoming = index > currentStep
        const Icon = statusConfig[status].icon

        return {
            status,
            index,
            isCompleted,
            isCurrent,
            isUpcoming,
            Icon,
            label: statusConfig[status].label,
        }
    })

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="mb-4 flex items-center gap-2 px-3 sm:mb-6 sm:gap-3 sm:px-4">
                <button
                    onClick={() => navigate("/customer/orders")}
                    className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-200 sm:p-2.5"
                    aria-label="Back to orders"
                >
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-gray-900 sm:text-2xl md:text-3xl">Order #{String(order.id || "").slice(0, 8)}</h1>
                    <p className="mt-0.5 text-xs text-gray-500 sm:mt-1 sm:text-sm">{new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div className="mx-3 mb-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:mx-0 sm:mb-6 sm:p-4 md:p-5">
                <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 sm:text-lg">Product Timeline</h2>
                    </div>
                </div>

                {selectedItem?.status === "cancelled" ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 sm:text-sm">
                        <p>This product order was cancelled by {getCancelledByLabel(selectedItem?.cancelled_by)}.</p>
                        {selectedItem?.cancellation_reason && (
                            <p className="mt-2 text-xs text-red-600">Reason: {selectedItem.cancellation_reason}</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 overflow-x-auto pb-2 sm:grid-cols-2 sm:gap-3 sm:pb-0 md:grid-cols-4 md:gap-4">
                        {timelineItems.map((item) => (
                            <div key={item.status} className="relative shrink-0 sm:shrink">
                                {item.index < timelineItems.length - 1 && (
                                    <div
                                        className={`absolute top-6 left-[calc(50%+2rem)] right-4 hidden h-1 rounded-full md:block ${item.index < currentStep ? "bg-green-400" : "bg-gray-200"}`}
                                    />
                                )}

                                <div
                                    className={`relative h-full rounded-xl border p-2.5 transition-all sm:rounded-2xl sm:p-4 ${item.isCurrent
                                            ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                                            : item.isCompleted
                                                ? "border-green-200 bg-green-50"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-2xl ${item.isCurrent
                                                    ? "bg-blue-600 text-white"
                                                    : item.isCompleted
                                                        ? "bg-green-600 text-white"
                                                        : "border border-gray-200 bg-white text-gray-400"
                                                }`}
                                        >
                                            <item.Icon size={18} className="sm:h-5 sm:w-5" />
                                        </div>

                                        <div className="min-w-0 flex flex-col items-start gap-1.5">
                                            <p className="line-clamp-2 text-xs font-semibold text-gray-900 sm:text-sm">{item.label}</p>
                                            {item.isCurrent && (
                                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                                    Current
                                                </span>
                                            )}
                                            {item.isCompleted && (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                                    Done
                                                </span>
                                            )}
                                            {item.isUpcoming && (
                                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                                    Next
                                                </span>
                                            )}
                                            <p className="text-xs text-gray-500">{item.index + 1}/{timelineItems.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-3 px-3 sm:space-y-4 sm:px-0 md:space-y-5">
                    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 md:p-5">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100 sm:h-10 sm:w-10 sm:rounded-xl">
                                <MapPin size={18} className="text-blue-700 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold text-gray-900 sm:text-lg">Delivery</h2>
                                <LocationAddress location={order.location} inline className="mt-1 inline-block text-xs text-gray-700 sm:mt-2 sm:text-sm" />
                                {order.address_extra && (
                                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">{order.address_extra}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {itemGroups.map((group, index) => (
                            <div key={group.store?.id || index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <div className="flex flex-col items-start justify-between gap-2 border-b border-gray-100 bg-gray-50/70 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4 md:p-5">
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-gray-950 sm:text-base">Ordered Item&apos;s</h2>
                                        <p className="text-xs text-gray-500">{order.active_items_count || 0} active | {order.cancelled_items_count || 0} cancelled</p>
                                    </div>
                                    <p className="shrink-0 text-lg font-bold text-green-700 sm:text-xl">{formatMoney(group.subtotal)}</p>
                                </div>

                                {(group.shipment?.courier_name || group.items?.[0]?.courier_name) && (
                                    <div className="mx-3 mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-xs text-cyan-800 sm:mx-4 sm:text-sm md:mx-5 md:mt-4">
                                        <p><span className="font-semibold">Courier:</span> {group.shipment?.courier_name || group.items?.[0]?.courier_name}</p>
                                        {(group.shipment?.tracking_number || group.items?.[0]?.tracking_number) && (
                                            <p><span className="font-semibold">Tracking Number:</span> {group.shipment?.tracking_number || group.items?.[0]?.tracking_number}</p>
                                        )}
                                    </div>
                                )}

                                <div className="divide-y divide-gray-100">
                                    {(group.items || []).map((item) => (
                                        <div key={item.id} className="p-3 sm:p-4 md:p-5">
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[70px_1fr] md:grid-cols-[80px_1fr]">
                                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-17.5 sm:w-17.5 md:h-20 md:w-20">
                                                    {item.product?.images?.length ? (
                                                        <img
                                                            src={getStorageUrl(item.product.images[0].full_url || item.product.images[0].image_path)}
                                                            alt={item.product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package size={28} className="text-gray-400" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                                                            {item.product?.name}
                                                        </h3>
                                                        <Tag
                                                            color={statusConfig[item.status]?.color || "default"}
                                                            className="m-0 w-fit shrink-0 text-xs"
                                                        >
                                                            {statusConfig[item.status]?.label || item.status}
                                                        </Tag>
                                                    </div>
                                                    {item.variant && <p className="mt-1 text-xs text-gray-500 sm:text-sm">Variant: {item.variant.name}</p>}
                                                    <div className="mt-2 flex items-center justify-between gap-2">
                                                        <p className="text-xs text-gray-600 sm:text-sm">Qty: {item.quantity}</p>
                                                        {canCancelItem(item) && (
                                                            <Button
                                                                danger
                                                                size="small"
                                                                icon={<X size={14} />}
                                                                onClick={() => setCancelTarget({ type: "item", item })}
                                                                className="h-8 shrink-0 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {order.message && (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                            <h3 className="mb-2 font-semibold text-gray-900">Message</h3>
                            <p className="text-sm text-gray-800">{order.message}</p>
                        </div>
                    )}

                    {selectedItem?.review && (
                        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-start gap-2.5 sm:gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
                                    <Star size={18} className="text-amber-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="font-semibold text-gray-900">Your Review</h3>
                                        <Rate disabled value={selectedItem.review.rating} />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Variant: {selectedItem.review.variant_name || selectedItem.variant?.name || "Default"}
                                    </p>
                                    <p className="mt-3 text-sm text-gray-700">{selectedItem.review.review}</p>
                                    <p className="mt-3 text-xs text-gray-400">
                                        Submitted {new Date(selectedItem.review.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-3 sm:px-0">
                    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:sticky lg:top-4">
                        {selectedItem?.status === "shipped" ? (
                            <div className="rounded-2xl border border-green-100 bg-white p-3 shadow-sm sm:p-4 md:p-5">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-11 sm:w-11 sm:rounded-2xl">
                                        <CheckCircle size={20} className="text-green-700 sm:h-5.5 sm:w-5.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">Confirm Delivery</h3>
                                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                            Mark this product as received after you get it from the courier.
                                        </p>
                                        <Button
                                            type="primary"
                                            block
                                            icon={<CheckCircle size={16} />}
                                            loading={deliveryLoading}
                                            onClick={handleMarkDelivered}
                                            className="mt-4 h-10 text-base font-semibold sm:h-11"
                                        >
                                            Received Product
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : selectedItem?.can_review ? (
                            <div className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm sm:p-4 md:p-5">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 sm:h-11 sm:w-11 sm:rounded-2xl">
                                        <Star size={20} className="text-amber-700 sm:h-5.5 sm:w-5.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">Rate This Product</h3>
                                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                            Share your feedback about this order item.
                                        </p>
                                        <Button
                                            block
                                            icon={<Star size={16} />}
                                            onClick={() => setReviewModalOpen(true)}
                                            className="mt-4 h-10 text-base font-semibold sm:h-11"
                                        >
                                            Rate Product
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 md:p-5">
                            <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 ring-1 ring-green-100 sm:h-10 sm:w-10 sm:rounded-xl">
                                    <ShoppingBag size={18} className="text-green-700 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 sm:text-base">Receipt Summary</h3>
                                    <p className="text-xs text-gray-500">
                                        {order.active_items_count || 0} active | {order.cancelled_items_count || 0} cancelled
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Item Total</span>
                                    <span className="font-medium text-gray-800">{formatMoney(itemTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-800">{formatMoney(order.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium text-gray-800">{formatMoney(order.shipping_cost)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-3">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-green-600">{formatMoney(order.total_price)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button block size="large" onClick={() => navigate("/customer/orders")} className="h-10 text-base sm:h-11">
                                    Back to Orders
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title="Cancel Product Order"
                open={Boolean(cancelTarget)}
                onCancel={closeCancelModal}
                onOk={handleCancel}
                okText="Cancel Order"
                okButtonProps={{ danger: true, loading: cancellationLoading }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for cancelling {cancelTarget?.item?.product?.name || "this item"}.
                    </p>
                    <Input.TextArea
                        placeholder="Enter cancellation reason..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        rows={4}
                        maxLength={1000}
                    />
                </div>
            </Modal>

            <ReviewProductModal
                open={reviewModalOpen}
                item={selectedItem}
                submitting={reviewSubmitting}
                onCancel={() => setReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
            />
        </div>
    )
}
