import React, { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Tag, Spin, App, Table, Tooltip, Input } from "antd"
import { ArrowLeft, History, RotateCcw, Search } from "lucide-react"
import * as storeVerificationService from "../../../services/storeVerificationService"
import Avatar from "../../../components/Avatar"

const STATUS_COLORS = {
    pending:   "warning",
    approved:  "success",
    rejected:  "error",
    suspended: "default",
}

export default function SellerVerifyLogs() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message, modal } = App.useApp()

    const [store, setStore] = useState(null)
    const [logs, setLogs] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [reverting, setReverting] = useState(null)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const data = await storeVerificationService.getStoreLogs(id)
            setStore(data.store)
            setLogs(data.logs)
        } catch (err) {
            message.error(err.message)
            navigate(`/admin/seller-verify/${id}`)
        } finally {
            setLoading(false)
        }
    }, [id, message, navigate])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    // The latest log is the first in the array (newest-first from backend)
    const latestLogId = logs[0]?.id ?? null

    const filteredLogs = search
        ? logs.filter(l =>
            l.new_status?.includes(search.toLowerCase()) ||
            l.previous_status?.includes(search.toLowerCase()) ||
            l.rejection_reason?.toLowerCase().includes(search.toLowerCase()) ||
            (l.performer && `${l.performer.firstname} ${l.performer.lastname}`.toLowerCase().includes(search.toLowerCase()))
          )
        : logs

    const handleRevert = (log) => {
        const targetStatus = log.previous_status ?? "pending"
        modal.confirm({
            title: "Revert This Action",
            content: (
                <div>
                    <p className="text-sm text-gray-500 mb-1">
                        This will set the store status back to <strong>{targetStatus}</strong>.
                    </p>
                    {targetStatus === "rejected" && log.rejection_reason && (
                        <p className="text-xs text-gray-400">Rejection reason: "{log.rejection_reason}"</p>
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
                    fetchLogs()
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
            title: "Status Change",
            key: "status_change",
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
            title: "Rejection Reason",
            dataIndex: "rejection_reason",
            key: "rejection_reason",
            render: (reason) => reason
                ? <span className="text-red-600 text-sm">{reason}</span>
                : <span className="text-gray-300 text-sm">—</span>,
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
            ) : <span className="text-gray-400 text-sm">System</span>,
        },
        {
            title: "Date & Time",
            dataIndex: "created_at",
            key: "created_at",
            width: 170,
            render: (d) => (
                <span className="text-gray-400 text-xs">
                    {new Date(d).toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                    })}
                </span>
            ),
        },
        {
            title: "",
            key: "revert",
            width: 100,
            render: (_, record) => record.id === latestLogId ? (
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
            ) : null,
        },
    ]

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>
    }

    return (
       <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl px-4 sm:px-6 py-4 bg-white ring-1 ring-gray-200 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <Button onClick={() => navigate(`/admin/seller-verify/${id}`)} icon={<ArrowLeft size={16} />} type="text" />
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-sm">
                        <History size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-sora font-bold text-lg sm:text-xl text-gray-900">Verification Logs</h1>
                        <p className="text-xs text-gray-400 mt-1">
                            {store?.store_name} · Full action history
                        </p>
                    </div>
                </div>
                {store?.verification && (
                    <Tag
                        color={STATUS_COLORS[store.verification.store_status] || "default"}
                        className="text-sm font-semibold px-3 py-1"
                    >
                        {store.verification.store_status?.toUpperCase()}
                    </Tag>
                )}
            </div>

            {/* Logs table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-start gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-gray-900">Action History</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{logs.length}</span>
                    </div>
                    <Input
                        size="large"
                        placeholder="Search status, performer…"
                        prefix={<Search size={14} className="text-gray-400" />}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        allowClear
                        className="w-full sm:w-60 rounded-lg"
                    />
                </div>

                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                        <History size={40} className="mb-3" />
                        <p className="text-sm">No actions logged yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table
                            dataSource={filteredLogs}
                            columns={columns}
                            rowKey="id"
                            size="middle"
                            scroll={{ x: 900 }}
                            pagination={{ pageSize: 5, showSizeChanger: false, showTotal: t => <span className="text-gray-400 text-sm">{t} entries</span> }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}


