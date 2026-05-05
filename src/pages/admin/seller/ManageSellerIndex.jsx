import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Input, Tooltip, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Search, Store, Eye } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"

export default function ManageSellerIndex() {
    const { message } = App.useApp()
    const navigate = useNavigate()

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [sorter, setSorter] = useState({ field: "created_at", order: "descend" })

    const searchTimer = useRef(null)

    const fetchStores = useCallback(async (page, pageSize, sortField, sortOrder, searchVal) => {
        setLoading(true)
        try {
            const data = await storeVerificationService.getStoreVerifications({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
                sortField: sortField || undefined,
                sortOrder: sortOrder || undefined,
                status: "approved",
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
        fetchStores(pagination.current, pagination.pageSize, sorter.field, sorter.order, search)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTableChange = (pag, _filters, sort) => {
        const newSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
        const sortChanged = newSorter.field !== sorter.field || newSorter.order !== sorter.order
        const page = sortChanged ? 1 : pag.current
        setSorter(newSorter)
        setPagination(prev => ({ ...prev, current: page, pageSize: pag.pageSize }))
        fetchStores(page, pag.pageSize, newSorter.field, newSorter.order, search)
    }

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchStores(1, pagination.pageSize, sorter.field, sorter.order, val)
        }, 400)
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
                        <div className="font-semibold text-green-900 text-sm">{record.store_name}</div>
                        <div className="text-gray-400 text-xs">{record.category?.name || "—"}</div>
                    </div>
                </div>
            )
        },
        {
            title: "Owner", key: "owner", width: 220,
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
            title: "Actions", width: 80,
            render: (_, record) => (
                <Tooltip title="View Details">
                    <Button size="small" onClick={() => navigate(`/admin/sellers/${record.uuid}`)} icon={<Eye size={14} />} />
                </Tooltip>
            )
        }
    ]

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            {/* Header */}
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-400 shadow-sm sm:h-11 sm:w-11 sm:rounded-lg">
                        <Store size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-sora text-lg font-bold leading-tight text-gray-900 sm:text-xl">Verified Sellers</h1>
                        <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500 sm:text-xs">All verified and approved seller stores</p>
                    </div>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-green-900">Approved Stores</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <Input
                        placeholder="Search store name, owner…"
                        prefix={<Search size={14} className="text-gray-400" />}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        allowClear
                        size="large"
                        className="w-full rounded-xl sm:w-72"
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
                        scroll={{ x: 820 }}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: t => <span className="text-gray-400 text-sm">{t} sellers total</span>,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
