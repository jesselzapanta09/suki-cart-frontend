import React, { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Tag, Spin, App, Input } from "antd"
import { ArrowLeft, Store, CheckCircle, XCircle, RotateCcw, Pencil, History } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"
import LocationAddress from "../../../components/LocationAddress"
import { getStorageUrl } from "../../../utils/storage"

export default function SellerVerifyShow() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message, modal } = App.useApp()

    const [store, setStore] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const isMountedRef = useRef(true)

    const fetchStore = useCallback(async () => {
        setLoading(true)
        try {
            const data = await storeVerificationService.getStoreVerification(id)
            if (isMountedRef.current) setStore(data.store)
        } catch (err) {
            if (isMountedRef.current) {
                const errorMessage = err.status === 404 ? "Store not found" : err.message
                message.error(errorMessage)
                navigate("/admin/seller-verify")
            }
        } finally {
            if (isMountedRef.current) setLoading(false)
        }
    }, [id, message, navigate])

    useEffect(() => {
        isMountedRef.current = true
        fetchStore()

        return () => {
            isMountedRef.current = false
        }
    }, [fetchStore])

    const handleApprove = () => {
        modal.confirm({
            title: "Approve Store",
            content: "Are you sure you want to approve this store? The seller will be able to start selling.",
            okText: "Approve",
            cancelText: "Cancel",
            onOk: async () => {
                setActionLoading(true)
                try {
                    await storeVerificationService.approveStore(id)
                    message.success("Store approved successfully!")
                    fetchStore()
                } catch (err) {
                    message.error(err.message)
                } finally {
                    setActionLoading(false)
                }
            },
        })
    }

    const handleReject = () => {
        let reason = ""
        modal.confirm({
            title: "Reject Store",
            content: (
                <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-2">Please provide a reason for rejection:</p>
                    <Input.TextArea
                        rows={3}
                        placeholder="Enter rejection reason..."
                        onChange={e => { reason = e.target.value }}
                    />
                </div>
            ),
            okText: "Reject",
            okButtonProps: { danger: true },
            cancelText: "Cancel",
            onOk: async () => {
                if (!reason.trim()) {
                    message.error("Rejection reason is required.")
                    throw new Error("Rejection reason is required")
                }
                await storeVerificationService.rejectStore(id, reason)
                message.success("Store rejected.")
                fetchStore()
            },
        })
    }

    const handlePending = () => {
        modal.confirm({
            title: "Back to Pending",
            content: "Are you sure you want to set this store back to pending? This will clear the current review.",
            okText: "Set Pending",
            cancelText: "Cancel",
            onOk: async () => {
                setActionLoading(true)
                try {
                    await storeVerificationService.setStorePending(id)
                    message.success("Store set back to pending.")
                    fetchStore()
                } catch (err) {
                    message.error(err.message)
                } finally {
                    setActionLoading(false)
                }
            },
        })
    }

    const handleEditRejection = () => {
        let reason = store.verification?.rejection_reason || ""
        modal.confirm({
            title: "Edit Rejection Reason",
            content: (
                <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-2">Update the rejection reason:</p>
                    <Input.TextArea
                        rows={3}
                        defaultValue={reason}
                        placeholder="Enter rejection reason..."
                        onChange={e => { reason = e.target.value }}
                    />
                </div>
            ),
            okText: "Update",
            cancelText: "Cancel",
            onOk: async () => {
                if (!reason.trim()) {
                    message.error("Rejection reason is required.")
                    throw new Error("Rejection reason is required")
                }
                await storeVerificationService.rejectStore(id, reason)
                message.success("Rejection reason updated.")
                fetchStore()
            },
        })
    }

    const getStatusTag = (verification) => {
        if (!verification) return <Tag color="warning">PENDING</Tag>
        const colors = { pending: "warning", approved: "success", rejected: "error", suspended: "default" }
        return <Tag color={colors[verification.store_status] || "default"}>{verification.store_status.toUpperCase()}</Tag>
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>
    }

    if (!store) return null

    const status = store.verification?.store_status || "pending"

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            {/* Header */}
            <div className="rounded-xl px-4 sm:px-6 py-4 bg-white ring-1 ring-gray-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block">
                            <Button onClick={() => navigate("/admin/seller-verify")} icon={<ArrowLeft size={16} />} type="text" />
                        </div>
                        <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
                            <Store size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-sora font-bold text-lg sm:text-xl text-gray-900">Store Details</h1>
                            <p className="text-xs text-gray-400 mt-1">Review seller store application</p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <Button icon={<History size={15} />} onClick={() => navigate(`/admin/seller-verify/${id}/logs`)} size="large">
                            <span className="sm:inline">View Logs</span>
                        </Button>
                    </div>
                </div>
                <div className="sm:hidden flex justify-end">
                    <Button icon={<History size={15} />} onClick={() => navigate(`/admin/seller-verify/${id}/logs`)} size="large" className="w-full">
                        <span>View Logs</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Store banner */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {store.banner ? (
                                <img src={getStorageUrl(store.banner)} alt="Store banner" className="w-full h-40 sm:h-48 object-cover" />
                            ) : (
                                <div className="w-full h-40 sm:h-48 bg-linear-to-br from-green-600 to-emerald-400 flex items-center justify-center">
                                    <Store size={44} className="text-white/60" />
                                </div>
                            )}
                        </div>

                    {/* Store info card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-sora font-bold text-lg text-gray-900">{store.store_name}</h2>
                                <div className="text-gray-400 text-sm mt-1">{store.category?.name || "No category"}</div>
                            </div>
                            {getStatusTag(store.verification)}
                        </div>

                        {store.description && (
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Description</div>
                                <div className="text-sm text-gray-500">{store.description}</div>
                            </div>
                        )}

                        <div className="text-sm text-gray-500">
                            Submitted: {new Date(store.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                    </div>

                    {/* Rejection reason */}
                    {store.verification?.store_status === "rejected" && store.verification?.rejection_reason && (
                        <div className="bg-red-50 rounded-2xl p-4 sm:p-5 ring-1 ring-red-200">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-semibold text-red-700">Rejection Reason</div>
                                <Button type="text" size="small" icon={<Pencil size={13} />} onClick={handleEditRejection} className="text-red-600 hover:text-red-800">Edit</Button>
                            </div>
                            <div className="text-sm text-red-600">{store.verification.rejection_reason}</div>
                        </div>
                    )}

                    {/* Reviewed by */}
                    {store.verification?.reviewer && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Reviewed By</div>
                            <div className="flex items-center gap-3">
                                <Avatar user={store.verification.reviewer} size={34} fontSize="0.85rem" />
                                <div>
                                    <div className="text-sm font-medium text-gray-800">{store.verification.reviewer.firstname} {store.verification.reviewer.lastname}</div>
                                    {store.verification.reviewed_at && (
                                        <div className="text-gray-400 text-xs">
                                            {new Date(store.verification.reviewed_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Owner card */}
                    {store.user && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="text-xs font-semibold text-gray-700">Store Owner</div>
                            <div className="flex items-center gap-3">
                                <Avatar user={store.user} size={44} fontSize="1rem" />
                                <div>
                                    <div className="font-semibold text-gray-800">{store.user.firstname} {store.user.lastname}</div>
                                    <div className="text-gray-400 text-sm">{store.user.email}</div>
                                </div>
                            </div>
                            {store.user.contact_number && (
                                <div className="text-sm text-gray-500">Contact: {store.user.contact_number}</div>
                            )}
                            {store.user.locations?.length > 0 && (
                                <div className="text-sm text-gray-500">
                                    <div className="font-medium text-gray-700 text-xs mb-1">Address</div>
                                    {store.user.locations.map((loc, i) => (
                                        <LocationAddress key={i} location={loc} className="text-xs" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Actions</div>
                        <div className="flex gap-2 flex-nowrap sm:flex-col sm:gap-3">
                            {status !== "approved" && (
                                <div className="flex-1 min-w-0 sm:flex-none">
                                    <Button type="primary" icon={<CheckCircle size={14} />} loading={actionLoading} onClick={handleApprove} block size="large">
                                        Approve Store
                                    </Button>
                                </div>
                            )}
                            {status !== "rejected" && (
                                <div className="flex-1 min-w-0 sm:flex-none">
                                    <Button danger icon={<XCircle size={14} />} onClick={handleReject} block size="large">
                                        Reject Store
                                    </Button>
                                </div>
                            )}
                            {status !== "pending" && (
                                <div className="flex-1 min-w-0 sm:flex-none">
                                    <Button icon={<RotateCcw size={14} />} loading={actionLoading} onClick={handlePending} block size="large">
                                        Back to Pending
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
