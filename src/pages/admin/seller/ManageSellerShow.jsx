import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Tag, Spin, App } from "antd"
import { ArrowLeft, Store } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"
import LocationAddress from "../../../components/LocationAddress"
import { getStorageUrl } from "../../../utils/storage"

export default function ManageSellerShow() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()

    const [store, setStore] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStore = async () => {
            setLoading(true)
            try {
                const data = await storeVerificationService.getStoreVerification(id)
                setStore(data.store)
            } catch (err) {
                message.error(err.message)
                navigate("/admin/sellers")
            } finally {
                setLoading(false)
            }
        }
        fetchStore()
    }, [id, message, navigate])

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>
    }

    if (!store) return null

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            {/* Header */}
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <div className="hidden sm:block">
                            <Button onClick={() => navigate("/admin/sellers")} icon={<ArrowLeft size={16} />} type="text" />
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-400 shadow-sm sm:h-11 sm:w-11 sm:rounded-lg">
                            <Store size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold leading-tight text-gray-900 sm:text-xl">Seller Details</h1>
                            <p className="mt-1 text-sm leading-5 text-gray-500 sm:text-xs">Approved seller store information</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
                {/* Main info */}
                <div className="space-y-4 lg:col-span-2 lg:space-y-5">
                    {/* Store banner */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        {store.banner ? (
                            <img src={getStorageUrl(store.banner)} alt="Store banner" className="h-40 w-full object-cover sm:h-48" />
                        ) : (
                            <div className="flex h-40 w-full items-center justify-center bg-linear-to-br from-orange-400 to-amber-300 sm:h-48">
                                <Store size={48} className="text-white/60" />
                            </div>
                        )}
                    </div>

                    {/* Store info card */}
                    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h2 className="font-sora text-lg font-bold leading-tight text-gray-900">{store.store_name}</h2>
                                <div className="mt-1 text-sm text-gray-500">{store.category?.name || "No category"}</div>
                            </div>
                            <Tag color="success" className="m-0 self-start whitespace-nowrap text-xs">
                                APPROVED
                            </Tag>
                        </div>

                        {store.description && (
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Description</div>
                                <div className="text-sm leading-6 text-gray-500">{store.description}</div>
                            </div>
                        )}

                        <div className="text-sm leading-6 text-gray-500">
                            Registered: {new Date(store.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                    </div>

                    {/* Reviewed by */}
                    {store.verification?.reviewer && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Approved By</div>
                            <div className="flex items-center gap-3">
                                <Avatar user={store.verification.reviewer} size={34} fontSize="0.85rem" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-800">
                                        {store.verification.reviewer.firstname} {store.verification.reviewer.lastname}
                                    </div>
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

                {/* Sidebar — owner info only */}
                <div className="space-y-4 lg:space-y-5">
                    {store.user && (
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                            <div className="text-xs font-semibold text-gray-700">Store Owner</div>
                            <div className="flex items-center gap-3">
                                <Avatar user={store.user} size={44} fontSize="1rem" />
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-800">{store.user.firstname} {store.user.lastname}</div>
                                    <div className="break-all text-sm text-gray-400">{store.user.email}</div>
                                </div>
                            </div>
                            {store.user.contact_number && (
                                <div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Contact</div>
                                    <div className="text-sm leading-6 text-gray-500">{store.user.contact_number}</div>
                                </div>
                            )}
                            {store.user.locations?.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Address</div>
                                    {store.user.locations.map((loc, i) => (
                                        <LocationAddress key={i} location={loc} className="text-xs" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
