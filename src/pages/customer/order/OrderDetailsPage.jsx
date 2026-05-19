import React, { useCallback, useEffect, useMemo, useState } from "react"
import { App, Button, Empty, Input, Modal, Rate, Spin, Tag } from "antd"
import { ArrowLeft, CheckCircle, Clock, MapPin, Package, ShoppingBag, Star, Truck, X } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import * as orderService from "../../../services/orderService"
import LocationAddress from "../../../components/LocationAddress"
import ReviewProductModal from "./ReviewProductModal"
import { formatPeso } from "../../../utils/currency"
import { getStorageUrl } from "../../../utils/storage"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusSteps = ["pending", "processing", "shipped", "delivered"]

const getCancelledByLabel = (cancelledBy) => ({
    customer: "Customer",
    seller: "Seller",
    admin: "Admin",
}[cancelledBy] || "Unknown")

export default function OrderDetailsPage() {
    const { orderUuid } = useParams()
    const identifier = orderUuid
    const navigate = useNavigate()
    const { message } = App.useApp()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancellationReason, setCancellationReason] = useState("")
    const [cancellationLoading, setCancellationLoading] = useState(false)
    const [deliveryLoading, setDeliveryLoading] = useState(false)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [reviewSubmitting, setReviewSubmitting] = useState(false)
    const [selectedReviewItem, setSelectedReviewItem] = useState(null)

    const fetchOrderDetails = useCallback(async () => {
        setLoading(true)
        try {
            const data = await orderService.getOrder(identifier)
            setOrder(data?.data || null)
        } catch (err) {
            message.error(err.message || "Failed to fetch order details")
        } finally {
            setLoading(false)
        }
    }, [identifier, message])

    useEffect(() => {
        fetchOrderDetails()
    }, [fetchOrderDetails])

    const closeCancelModal = () => {
        setCancelOpen(false)
        setCancellationReason("")
    }

    const handleCancel = async () => {
        if (!cancellationReason.trim()) {
            message.warning("Please provide a cancellation reason")
            return
        }

        setCancellationLoading(true)
        try {
            const data = await orderService.cancelOrder(order?.uuid || identifier, cancellationReason)
            setOrder(data?.data || null)
            message.success("Order cancelled")
            closeCancelModal()
        } catch (err) {
            message.error(err.message || "Failed to cancel order")
        } finally {
            setCancellationLoading(false)
        }
    }

    const handleMarkReceived = async () => {
        if (!order?.uuid && !identifier) return

        setDeliveryLoading(true)
        try {
            const data = await orderService.markOrderReceived(order?.uuid || identifier)
            setOrder(data?.data || null)
            message.success("Order marked as received")
        } catch (err) {
            message.error(err.message || "Failed to mark order received")
        } finally {
            setDeliveryLoading(false)
        }
    }

    const handleReviewSubmit = async (values) => {
        if (!selectedReviewItem?.id) return

        setReviewSubmitting(true)
        try {
            await orderService.createProductReview(selectedReviewItem.id, values)
            await fetchOrderDetails()
            setReviewModalOpen(false)
            setSelectedReviewItem(null)
            message.success("Product review submitted")
        } catch (err) {
            message.error(err.message || "Failed to submit product review")
        } finally {
            setReviewSubmitting(false)
        }
    }

    const timelineItems = useMemo(() => {
        const currentStatus = order?.status || "pending"
        const currentStep = currentStatus === "cancelled" ? 0 : Math.max(statusSteps.indexOf(currentStatus), 0)

        return statusSteps.map((status, index) => ({
            status,
            index,
            isCompleted: index < currentStep,
            isCurrent: status === currentStatus,
            isUpcoming: index > currentStep,
            Icon: statusConfig[status].icon,
            label: statusConfig[status].label,
        }))
    }, [order?.status])

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

    const statusInfo = statusConfig[order.status] || statusConfig.pending

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
                    <h1 className="text-lg font-bold text-gray-900 sm:text-2xl md:text-3xl">Order #{String(order.uuid || order.id || "").slice(0, 8)}</h1>
                    <p className="mt-0.5 text-xs text-gray-500 sm:mt-1 sm:text-sm">{new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div className="mx-3 mb-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:mx-0 sm:mb-6 sm:p-4 md:p-5">
                <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 sm:text-lg">Order Timeline</h2>
                    </div>
                    <Tag color={statusInfo.color} className="m-0 w-fit shrink-0">
                        {statusInfo.label}
                    </Tag>
                </div>

                {order.status === "cancelled" ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 sm:text-sm">
                        <p>This store order was cancelled by {getCancelledByLabel(order.cancelled_by || "customer")}.</p>
                        {order.cancellation_reason && (
                            <p className="mt-2 text-xs text-red-600">Reason: {order.cancellation_reason}</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 overflow-x-auto pb-2 sm:grid-cols-2 sm:gap-3 sm:pb-0 md:grid-cols-4 md:gap-4">
                        {timelineItems.map((item) => (
                            <div key={item.status} className="relative shrink-0 sm:shrink">
                                {item.index < timelineItems.length - 1 && (
                                    <div
                                        className={`absolute top-6 left-[calc(50%+2rem)] right-4 hidden h-1 rounded-full md:block ${item.index < timelineItems.findIndex((step) => step.isCurrent) ? "bg-green-400" : "bg-gray-200"}`}
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

                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex flex-col items-start justify-between gap-2 border-b border-gray-100 bg-gray-50/70 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4 md:p-5">
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold text-gray-950 sm:text-base">{order.store?.store_name || "Store Order"}</h2>
                                <p className="text-xs text-gray-500">{order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}</p>
                            </div>
                            <p className="shrink-0 text-lg font-bold text-green-700 sm:text-xl">{formatPeso(order.total_price)}</p>
                        </div>

                        {order.shipment?.courier_name && (
                            <div className="mx-3 mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-xs text-cyan-800 sm:mx-4 sm:text-sm md:mx-5 md:mt-4">
                                <p><span className="font-semibold">Courier:</span> {order.shipment.courier_name}</p>
                                {order.shipment?.tracking_number && (
                                    <p><span className="font-semibold">Tracking Number:</span> {order.shipment.tracking_number}</p>
                                )}
                            </div>
                        )}

                        <div className="divide-y divide-gray-100">
                            {(order.order_items || []).map((item) => (
                                <div key={item.id} className="p-3 sm:p-4 md:p-5">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-20 sm:w-20">
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
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                                                        {item.product?.name}
                                                    </h3>
                                                    {item.variant && <p className="mt-1 text-xs text-gray-500 sm:text-sm">Variant: {item.variant.name}</p>}
                                                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">Qty: {item.quantity}</p>
                                                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">Line total: {formatPeso(item.line_total)}</p>
                                                    {item.message ? <p className="mt-2 text-xs text-gray-600 sm:text-sm">Message: {item.message}</p> : null}
                                                </div>
                                                {/* <Tag color={statusConfig[item.status]?.color || "default"} className="m-0 w-fit shrink-0 text-xs">
                                                    {statusConfig[item.status]?.label || item.status}
                                                </Tag> */}
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                                {item.can_review ? (
                                                    <Button
                                                        size="small"
                                                        icon={<Star size={14} />}
                                                        onClick={() => {
                                                            setSelectedReviewItem(item)
                                                            setReviewModalOpen(true)
                                                        }}
                                                    >
                                                        Rate Product
                                                    </Button>
                                                ) : null}
                                                {item.review ? (
                                                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                                        <div className="flex items-center gap-2">
                                                            <Rate disabled value={item.review.rating} />
                                                        </div>
                                                        <p className="mt-1">{item.review.review}</p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-3 sm:px-0">
                    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:sticky lg:top-4">
                        {order.can_mark_received ? (
                            <div className="rounded-2xl border border-green-100 bg-white p-3 shadow-sm sm:p-4 md:p-5">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-11 sm:w-11 sm:rounded-2xl">
                                        <CheckCircle size={20} className="text-green-700 sm:h-5.5 sm:w-5.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">Confirm Delivery</h3>
                                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                            Mark this whole order as received after all items arrive.
                                        </p>
                                        <Button
                                            type="primary"
                                            block
                                            icon={<CheckCircle size={16} />}
                                            loading={deliveryLoading}
                                            onClick={handleMarkReceived}
                                            className="mt-4 h-10 text-base font-semibold sm:h-11"
                                        >
                                            Received Order
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {order.can_cancel ? (
                            <div className="rounded-2xl border border-red-100 bg-white p-3 shadow-sm sm:p-4 md:p-5">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 sm:h-11 sm:w-11 sm:rounded-2xl">
                                        <X size={20} className="text-red-700 sm:h-5.5 sm:w-5.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">Cancel Order</h3>
                                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                            This will cancel the full store order and restore all item stock.
                                        </p>
                                        <Button
                                            danger
                                            block
                                            icon={<X size={16} />}
                                            onClick={() => setCancelOpen(true)}
                                            className="mt-4 h-10 text-base font-semibold sm:h-11"
                                        >
                                            Cancel Order
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
                                        {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-800">{formatPeso(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium text-gray-800">{formatPeso(order.shipping_cost)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-3">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-green-600">{formatPeso(order.total_price)}</span>
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
                title="Cancel Store Order"
                open={cancelOpen}
                onCancel={closeCancelModal}
                onOk={handleCancel}
                okText="Cancel Order"
                okButtonProps={{ danger: true, loading: cancellationLoading }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for cancelling this order from {order.store?.store_name || "the store"}.
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
                item={selectedReviewItem}
                submitting={reviewSubmitting}
                onCancel={() => {
                    setReviewModalOpen(false)
                    setSelectedReviewItem(null)
                }}
                onSubmit={handleReviewSubmit}
            />
        </div>
    )
}
