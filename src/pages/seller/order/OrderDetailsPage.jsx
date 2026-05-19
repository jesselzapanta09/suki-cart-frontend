import React, { useCallback, useEffect, useMemo, useState } from "react"
import { App, Button, Empty, Form, Input, Modal, Spin, Tag } from "antd"
import { ArrowLeft, CheckCircle, Clock, Package, Truck, User, X, MapPin, ShoppingBag } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import {
    cancelSellerOrder,
    getSellerOrder,
    updateSellerOrderStatus,
    updateSellerOrderShipment,
} from "../../../services/sellerService"
import LocationAddress from "../../../components/LocationAddress"
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

const statusOptions = [
    {
        value: "processing",
        label: "Preparing to ship",
    },
    {
        value: "shipped",
        label: "Shipped out",
    },
]

const nextStatusMap = {
    pending: "processing",
    processing: "shipped",
}

const customerName = (customer) => `${customer?.firstname || ""} ${customer?.lastname || ""}`.trim() || customer?.email || "Customer"
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
    const [form] = Form.useForm()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [savingStatus, setSavingStatus] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")
    const [cancelLoading, setCancelLoading] = useState(false)

    const currentStatus = order?.status || "pending"
    const suggestedStatus = nextStatusMap[currentStatus] || currentStatus
    const availableStatusOptions = useMemo(() => {
        const nextStatus = nextStatusMap[currentStatus]
        return statusOptions.filter((option) => option.value === nextStatus)
    }, [currentStatus])
    const selectedStatus = Form.useWatch("status", form)

    const fetchOrder = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSellerOrder(identifier)
            setOrder(data?.data || null)
        } catch (err) {
            message.error(err.message || "Failed to fetch order")
        } finally {
            setLoading(false)
        }
    }, [identifier, message])

    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    useEffect(() => {
        if (!order) {
            return
        }

        form.setFieldsValue({
            status: suggestedStatus,
            courier_name: order?.shipment?.courier_name || "",
            tracking_number: order?.shipment?.tracking_number || "",
        })
    }, [form, order, suggestedStatus])

    const handleStatusSave = async () => {
        try {
            const activeStatus = selectedStatus || suggestedStatus
            const fieldsToValidate = activeStatus === "shipped"
                ? ["status", "courier_name", "tracking_number"]
                : ["status"]
            const values = await form.validateFields(fieldsToValidate)

            setSavingStatus(true)
            const data = currentStatus === "shipped"
                ? await updateSellerOrderShipment(order?.uuid || identifier, {
                    courier_name: values.courier_name,
                    tracking_number: values.tracking_number,
                })
                : await updateSellerOrderStatus(order?.uuid || identifier, {
                    status: values.status,
                    ...(values.status === "shipped"
                        ? {
                            courier_name: values.courier_name,
                            tracking_number: values.tracking_number,
                        }
                        : {}),
                })

            setOrder(data?.data || null)
            message.success(currentStatus === "shipped" ? "Shipment details updated" : "Order status updated")
        } catch (err) {
            if (!err?.errorFields) {
                message.error(err.message || "Failed to update order status")
            }
        } finally {
            setSavingStatus(false)
        }
    }

    const closeCancelModal = () => {
        setCancelOpen(false)
        setCancelReason("")
    }

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            message.warning("Please provide a cancellation reason")
            return
        }

        setCancelLoading(true)
        try {
            const data = await cancelSellerOrder(order?.uuid || identifier, cancelReason)
            setOrder(data?.data || null)
            message.success("Order cancelled")
            closeCancelModal()
        } catch (err) {
            message.error(err.message || "Failed to cancel order")
        } finally {
            setCancelLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
                <Spin size="large" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4 py-8">
                <div className="text-center">
                    <Empty description="Order not found" />
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate("/seller/orders")}
                        className="mt-4 h-10 sm:h-11 text-base font-semibold px-6 active:scale-95 transition-transform"
                    >
                        Back to Orders
                    </Button>
                </div>
            </div>
        )
    }

    const statusInfo = statusConfig[currentStatus] || statusConfig.pending
    const currentStep = currentStatus === "cancelled" ? 0 : Math.max(statusSteps.indexOf(currentStatus), 0)
    const timelineItems = statusSteps.map((status, index) => ({
        status,
        index,
        isCompleted: index < currentStep,
        isCurrent: status === currentStatus,
        isUpcoming: index > currentStep,
        Icon: statusConfig[status].icon,
        label: statusConfig[status].label,
    }))
    const activeStatus = selectedStatus || suggestedStatus
    const activeStatusInfo = statusConfig[activeStatus] || statusInfo
    const showShipmentFields = activeStatus === "shipped"
    const isShipmentEditing = currentStatus === "shipped"
    const actionButtonLabel = isShipmentEditing
        ? "Save Shipment Details"
        : `Mark as ${activeStatusInfo.label}`

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="w-full max-w-6xl mx-auto">
                <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 px-3 sm:px-4">
                    <button
                        onClick={() => navigate("/seller/orders")}
                        className="p-2 sm:p-2.5 hover:bg-gray-200 rounded-lg transition-colors touch-target active:bg-gray-300 shrink-0"
                        aria-label="Back to orders"
                    >
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Order #{String(order.uuid || order.id || "").slice(0, 8)}</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 mx-3 sm:mx-0">
                    <div className="flex items-start justify-between gap-4 mb-4 sm:mb-5">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">Order Timeline</h2>
                        </div>
                    </div>

                    {order.status === "cancelled" ? (
                        <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs sm:text-sm text-red-700">
                            <p>This store order was cancelled by {getCancelledByLabel(order.cancelled_by)}.</p>
                            {order.cancellation_reason && (
                                <p className="mt-2 text-xs text-red-600">Reason: {order.cancellation_reason}</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-2 sm:pb-0">
                            {timelineItems.map((item) => (
                                <div key={item.status} className="relative shrink-0 sm:shrink">
                                    {item.index < timelineItems.length - 1 && (
                                        <div
                                            className={`hidden md:block absolute top-6 left-[calc(50%+2rem)] right-4 h-1 rounded-full ${item.index < currentStep ? "bg-green-400" : "bg-gray-200"}`}
                                        />
                                    )}

                                    <div
                                        className={`relative h-full rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 transition-all ${item.isCurrent
                                            ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                                            : item.isCompleted
                                                ? "border-green-200 bg-green-50"
                                                : "border-gray-200 bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div
                                                className={`flex h-10 sm:h-12 w-10 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl ${item.isCurrent
                                                    ? "bg-blue-600 text-white"
                                                    : item.isCompleted
                                                        ? "bg-green-600 text-white"
                                                        : "bg-white text-gray-400 border border-gray-200"
                                                    }`}
                                            >
                                                <item.Icon size={18} className="sm:w-5 sm:h-5" />
                                            </div>

                                            <div className="min-w-0 flex flex-col items-start gap-1.5">
                                                <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">{item.label}</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 sm:gap-4 md:gap-6">
                    <div className="space-y-3 sm:space-y-4 md:space-y-5 px-3 sm:px-0">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 md:p-5">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                        <User size={18} className="sm:w-5 sm:h-5 text-green-700" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-lg font-bold text-gray-900">Customer</h2>
                                        <p className="text-sm font-semibold text-gray-800 mt-1 sm:mt-2 truncate">{customerName(order.customer)}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">{order.customer?.email}</p>
                                        <p className="text-xs sm:text-sm text-gray-500">{order.customer?.contact_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 sm:gap-3">
                                    <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="sm:w-5 sm:h-5 text-blue-700" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-lg font-bold text-gray-900">Delivery</h2>
                                        <LocationAddress location={order.location} inline className="text-xs sm:text-sm text-gray-700 mt-1 sm:mt-2 inline-block" />
                                        {order.address_extra && <p className="text-xs sm:text-sm text-gray-500 mt-1">{order.address_extra}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-gray-950">Ordered Item/s</h2>
                                    <p className="text-xs text-gray-500">{order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}</p>
                                </div>
                                <p className="text-lg sm:text-xl font-bold text-green-700 shrink-0">{formatPeso(order.total_price)}</p>
                            </div>

                            {order.shipment?.courier_name && (
                                <div className="mx-3 mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-xs text-cyan-800 sm:mx-4 sm:text-sm md:mx-5 md:mt-4">
                                    <p><span className="font-semibold">Courier:</span> {order.shipment.courier_name}</p>
                                    {order.shipment?.tracking_number && (
                                        <p><span className="font-semibold">Tracking Number:</span> {order.shipment.tracking_number}</p>
                                    )}
                                </div>
                            )}

                            <div className="divide-y divide-gray-100 overflow-x-auto">
                                {(order.order_items || []).map((item) => (
                                    <div key={item.id} className="p-3 sm:p-4 md:p-5">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                                            <div className="h-24 w-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 sm:h-20 sm:w-20">
                                                {item.product?.images?.length ? (
                                                    <img
                                                        src={getStorageUrl(item.product.images[0].full_url || item.product.images[0].image_path)}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package size={28} className="sm:w-7 sm:h-7 text-gray-400" />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2">
                                                            {item.product?.name}
                                                        </h3>
                                                        {item.variant && (
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                                Variant: {item.variant.name}
                                                            </p>
                                                        )}
                                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                            Qty: {item.quantity}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                            Line total: {formatPeso(item.line_total)}
                                                        </p>
                                                        {item.message ? (
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-2">
                                                                Message: {item.message}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    {/* <Tag
                                                        color={statusConfig[item.status]?.color || "default"}
                                                        className="m-0 w-fit shrink-0 text-xs"
                                                    >
                                                        {statusConfig[item.status]?.label || item.status}
                                                    </Tag> */}
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
                            {order.status === "delivered" ? (
                                <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-3 sm:p-4 md:p-5">
                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-lg sm:rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                                            <CheckCircle size={20} className="sm:w-5.5 sm:h-5.5 text-green-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base text-gray-900">Order Delivered</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                This store order has already been delivered. No further seller action is needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : order.status === "cancelled" ? (
                                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 sm:p-4 md:p-5">
                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-lg sm:rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                            <X size={20} className="sm:w-5.5 sm:h-5.5 text-red-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base text-gray-900">Order Cancelled</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                This store order has already been cancelled. No further seller action is needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 md:p-5">
                                    <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                                        <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                            <ShoppingBag size={18} className="sm:w-5 sm:h-5 text-green-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base text-gray-900">Seller Actions</h3>
                                            <p className="text-xs text-gray-500">Update the whole store order.</p>
                                        </div>
                                    </div>

                                    <Form form={form} size="large" layout="vertical" requiredMark={false} className="ant-form-mobile">
                                        <Form.Item name="status" hidden rules={[{ required: true, message: "Status is required" }]}>
                                            <Input />
                                        </Form.Item>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                                                <span className="text-xs font-medium text-gray-500">Current status</span>
                                                <Tag color={statusInfo.color} className="m-0 w-fit text-xs">
                                                    {statusInfo.label}
                                                </Tag>
                                            </div>

                                            {availableStatusOptions.map((option) => {
                                                const isSelected = activeStatus === option.value
                                                const OptionIcon = statusConfig[option.value]?.icon || Package

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => form.setFieldsValue({ status: option.value })}
                                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${isSelected
                                                            ? "border-emerald-400 bg-emerald-50"
                                                            : "border-gray-200 bg-white hover:border-emerald-300"
                                                            }`}
                                                    >
                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                                                            <OptionIcon size={18} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-gray-500">Next step</p>
                                                            <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                                                        </div>
                                                    </button>
                                                )
                                            })}

                                            {showShipmentFields && (
                                                <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                                                    <p className="mb-3 text-sm font-semibold text-gray-900">Shipping details</p>

                                                    <div className="grid gap-3">
                                                        <Form.Item name="courier_name" label="Courier Name" rules={[{ required: true, message: "Courier name is required" }]}>
                                                            <Input placeholder="e.g. LBC, J&T, Flash Express" className="h-10 sm:h-11 text-base" />
                                                        </Form.Item>
                                                        <Form.Item name="tracking_number" label="Tracking Number" rules={[{ required: true, message: "Tracking number is required" }]}>
                                                            <Input placeholder="Tracking number" className="h-10 sm:h-11 text-base" />
                                                        </Form.Item>
                                                    </div>
                                                </div>
                                            )}

                                            {order.can_cancel !== false && currentStatus === "pending" ? (
                                                <Button
                                                    danger
                                                    block
                                                    onClick={() => setCancelOpen(true)}
                                                    className="h-10 sm:h-11 text-base font-semibold active:scale-95 transition-transform"
                                                >
                                                    Cancel Order
                                                </Button>
                                            ) : null}

                                            <Button
                                                type="primary"
                                                block
                                                loading={savingStatus}
                                                disabled={!activeStatus || availableStatusOptions.length === 0 && !isShipmentEditing}
                                                onClick={handleStatusSave}
                                                className="h-10 sm:h-11 text-base font-semibold active:scale-95 transition-transform"
                                            >
                                                {actionButtonLabel}
                                            </Button>
                                        </div>
                                    </Form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title="Cancel Order"
                open={cancelOpen}
                onCancel={closeCancelModal}
                onOk={handleCancelOrder}
                okText="Cancel Order"
                okButtonProps={{ danger: true, loading: cancelLoading }}
                centered
            >
                <div className="space-y-3 sm:space-y-4">
                    <p className="text-xs sm:text-sm text-gray-600">
                        Please provide a reason for cancelling this store order.
                    </p>
                    <Input.TextArea
                        placeholder="Enter cancellation reason..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        className="text-base"
                    />
                </div>
            </Modal>
        </div>
    )
}
