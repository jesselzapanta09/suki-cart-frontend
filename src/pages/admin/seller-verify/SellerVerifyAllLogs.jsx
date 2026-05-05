import React, { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Table, Button, Tag, Input, App, Tooltip } from "antd"
import { ArrowLeft, History, RotateCcw, Search, ExternalLink } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"

const STATUS_COLORS = {
    pending:   "warning",
    approved:  "success",
    rejected:  "error",
    suspended: "default",
}

export default function SellerVerifyAllLogs() {
    const navigate = useNavigate()
    const { message, modal } = App.useApp()

    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15 })
    const [reverting, setReverting] = useState(null)

    const searchTimer = useRef(null)

    const fetchLogs = useCallback(async (page, pageSize, searchVal) => {
        setLoading(true)
        try {
            const data = await storeVerificationService.getAllLogs({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
            })
            setLogs(data.data)
            setTotal(data.total)
            setPagination(prev => ({ ...prev, current: data.current_page, pageSize: data.per_page }))
        } catch (err) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [message])

    useEffect(() => {
        fetchLogs(1, pagination.pageSize, "")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchLogs(1, pagination.pageSize, val)
        }, 400)
    }

    const handleTableChange = (pag) => {
        setPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))
        fetchLogs(pag.current, pag.pageSize, search)
    }

    const handleRevert = (log) => {
        const targetStatus = log.previous_status ?? "pending"
        modal.confirm({
            title: "Revert This Action",
            content: (
                <div>
                    <p className="text-sm text-gray-600 mb-1">
                        Store: <strong>{log.store?.store_name}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                        This will set the store status back to <strong>{targetStatus}</strong>.
                    </p>
                    {targetStatus === "rejected" && log.rejection_reason && (
                        <p className="text-xs text-gray-400 mt-1">Rejection reason: "{log.rejection_reason}"</p>
                    )}
                </div>
            ),
            okText: "Revert",
            cancelText: "Cancel",
            onOk: async () => {
                setReverting(log.id)
                try {
                    await storeVerificationService.revertLog(log.id)
                    message.success(`Store reverted to "${targetStatus}".`)
                    fetchLogs(pagination.current, pagination.pageSize, search)
                } catch (err) {
                    message.error(err.message)
                } finally {
                    setReverting(null)
                }
            },
        })
    }

    const columns = [
        {
            title: "Store",
            key: "store",
            render: (_, record) => record.store ? (
                <div className="flex items-center gap-2">
                    <span
                        className="font-semibold text-green-900 text-sm cursor-pointer hover:underline"
                        onClick={() => navigate(`/admin/seller-verify/${record.store?.uuid}`)}
                    >
                        {record.store.store_name}
                    </span>
                    <span className="text-gray-400 text-xs">
                        {record.store.category?.name && `· ${record.store.category.name}`}
                    </span>
                </div>
            ) : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            title: "Status Change",
            key: "status_change",
            width: 220,
            render: (_, record) => (
                <div className="flex items-center gap-2">
                    <Tag color={STATUS_COLORS[record.previous_status] || "default"} className="m-0 font-mono text-xs">
                        {record.previous_status?.toUpperCase() || "—"}
                    </Tag>
                    <span className="text-gray-300 text-xs">→</span>
                    <Tag color={STATUS_COLORS[record.new_status] || "default"} className="m-0 font-mono text-xs">
                        {record.new_status?.toUpperCase()}
                    </Tag>
                </div>
            ),
        },
        {
            title: "Performed By",
            key: "performed_by",
            width: 190,
            render: (_, record) => record.performer ? (
                <div className="flex items-center gap-2">
                    <Avatar user={record.performer} size={26} fontSize="0.7rem" />
                    <span className="text-sm text-gray-700">
                        {record.performer.firstname} {record.performer.lastname}
                    </span>
                </div>
            ) : <span className="text-gray-400 text-sm">System / Seller</span>,
        },
        {
            title: "",
            key: "actions",
            width: 140,
            render: (_, record) => (
                <div className="flex items-center gap-1">
                    <Tooltip title={`Revert to "${record.previous_status ?? "pending"}"`}>
                        <Button
                            size="small"
                            icon={<RotateCcw size={13} />}
                            loading={reverting === record.id}
                            onClick={() => handleRevert(record)}
                        >
                            Revert
                        </Button>
                    </Tooltip>
                    <Tooltip title="View Store">
                        <Button
                            size="small"
                            icon={<ExternalLink size={13} />}
                            onClick={() => navigate(`/admin/seller-verify/${record.store?.uuid}`)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ]

    return (
       <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl px-4 sm:px-6 py-4 bg-white ring-1 ring-gray-200 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <Button onClick={() => navigate("/admin/seller-verify")} icon={<ArrowLeft size={16} />} type="text" />
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-sm">
                        <History size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-sora font-bold text-lg sm:text-xl text-gray-900">Verification Logs</h1>
                        <p className="text-xs text-gray-400 mt-1">Latest action per store — click Revert to undo</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-start gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-gray-900">Action History</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <Input
                        size="large"
                        placeholder="Search by store name…"
                        prefix={<Search size={14} className="text-gray-400" />}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        allowClear
                        className="w-full sm:w-64 rounded-lg"
                    />
                </div>

                {total === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                        <History size={40} className="mb-3" />
                        <p className="text-sm">No actions logged yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table
                            dataSource={logs}
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
                                showTotal: t => <span className="text-gray-400 text-sm">{t} entries total</span>,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
