import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Input, Tag, Tooltip, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Search, Store, ShieldCheck, Eye, History } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"

export default function SellerVerifyIndex() {
    const { message } = App.useApp()
    const navigate = useNavigate()

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 5 })
    const [sorter, setSorter] = useState({ field: "created_at", order: "descend" })
    const [statusFilter] = useState("pending")

    const searchTimer = useRef(null)

    const fetchStores = useCallback(async (page, pageSize, sortField, sortOrder, searchVal, status) => {
        setLoading(true)
        try {
            const data = await storeVerificationService.getStoreVerifications({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
                sortField: sortField || undefined,
                sortOrder: sortOrder || undefined,
                status: status || undefined,
            })
            setStores(data.data)
            setTotal(data.total)
            setPagination(prev => ({ ...prev, current: data.current_page, pageSize: data.per_page }))
        } catch (err) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [message])

    useEffect(() => {
        fetchStores(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTableChange = (pag, filters, sort) => {
        const newSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
        const sortChanged = newSorter.field !== sorter.field || newSorter.order !== sorter.order
        const page = sortChanged ? 1 : pag.current
        setSorter(newSorter)
        setPagination(prev => ({ ...prev, current: page, pageSize: pag.pageSize }))
        fetchStores(page, pag.pageSize, newSorter.field, newSorter.order, search, statusFilter)
    }

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchStores(1, pagination.pageSize, sorter.field, sorter.order, val, statusFilter)
        }, 400)
    }

    const getStatusTag = (verification) => {
        if (!verification) return <Tag color="warning">PENDING</Tag>
        const colors = { pending: "warning", approved: "success", rejected: "error", suspended: "default" }
        return <Tag color={colors[verification.store_status] || "default"}>{verification.store_status.toUpperCase()}</Tag>
    }

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 64,
            sorter: true,
            render: id => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>
        },
        {
            title: "Store", dataIndex: "store_name", key: "store_name",
            sorter: true,
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center ring-1 ring-orange-200">
                        <Store size={16} className="text-orange-600" />
                    </div>
                    <div>
                        <div onClick={() => navigate(`/admin/seller-verify/${record.uuid}`)} className="font-semibold text-green-900 text-sm cursor-pointer hover:underline">{record.store_name}</div>
                        <div className="text-gray-400 text-xs">{record.category?.name || "—"}</div>
                    </div>
                </div>
            )
        },
        {
            title: "Owner", key: "owner", width: 200,
            render: (_, record) => record.user ? (
                <div className="flex items-center gap-2">
                    <Avatar user={record.user} size={28} fontSize="0.75rem" />
                    <div>
                        <div className="text-sm font-medium text-gray-800">{record.user.firstname} {record.user.lastname}</div>
                        <div className="text-gray-400 text-xs">{record.user.email}</div>
                    </div>
                </div>
            ) : <span className="text-gray-400 text-xs">—</span>
        },
        {
            title: "Status", key: "store_status", width: 100,
            render: (_, record) => getStatusTag(record.verification)
        },
        {
            title: "Submitted", dataIndex: "created_at", key: "created_at", width: 130,
            sorter: true,
            render: d => <span className="text-gray-400 text-xs">{new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
        },
        {
            title: "Actions", width: 80,
            render: (_, record) => (
                <Tooltip title="View Details">
                    <Button size="small" onClick={() => navigate(`/admin/seller-verify/${record.uuid}`)} icon={<Eye size={14} />} />
                </Tooltip>
            )
        }
    ]

    return (
       <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            {/* Header */}
            <div className="rounded-xl px-4 sm:px-6 py-4 bg-white ring-1 ring-gray-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
                            <ShieldCheck size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-sora font-bold text-lg sm:text-xl text-gray-900">Seller Verification</h1>
                            <p className="text-xs text-gray-400 mt-1">Review and approve seller store applications</p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <Button icon={<History size={15} />} onClick={() => navigate("/admin/seller-verify/logs")} size="large">
                            <span className="sm:inline">All Logs</span>
                        </Button>
                    </div>
                </div>
                <div className="sm:hidden flex justify-end">
                    <Button icon={<History size={15} />} onClick={() => navigate("/admin/seller-verify/logs")} size="large" className="w-full">
                        <span>All Logs</span>
                    </Button>
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-start gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-green-900">
                            {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) + " Stores" : "All Stores"}
                        </span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <Input
                        size="large"
                        placeholder="Search store name, owner…"
                        prefix={<Search size={14} className="text-gray-400" />}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        allowClear
                        className="w-full sm:w-64 rounded-lg"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table
                        dataSource={stores}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        onChange={handleTableChange}
                        size="middle"
                        scroll={{ x: 900 }}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: t => <span className="text-gray-400 text-sm">{t} stores total</span>,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
