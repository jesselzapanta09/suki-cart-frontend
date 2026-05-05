import React, { useCallback, useEffect, useRef, useState } from "react";
import { App, Grid, Input, Table, Tag } from "antd";
import { History, Search } from "lucide-react";
import * as adminLogService from "../../../services/adminLogService";

function getRecipientName(user) {
    if (!user) return "Unknown user";

    const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
    return fullName || user.email || "Unknown user";
}

function truncateText(value, max = 110) {
    if (!value) return "No message";
    return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function AdminLogsIndex() {
    const { message } = App.useApp();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

    const searchTimer = useRef(null);

    const fetchLogs = useCallback(async (page, pageSize, searchValue) => {
        setLoading(true);
        try {
            const data = await adminLogService.getAdminLogs({
                page,
                per_page: pageSize,
                search: searchValue || undefined,
            });

            setLogs(data.data || []);
            setTotal(data.total || 0);
            setPagination((prev) => ({
                ...prev,
                current: data.current_page || 1,
                pageSize: data.per_page || pageSize,
            }));
        } catch (err) {
            message.error(err.message || "Failed to load logs");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchLogs(1, pagination.pageSize, "");
        return () => clearTimeout(searchTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value) => {
        setSearch(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPagination((prev) => ({ ...prev, current: 1 }));
            fetchLogs(1, pagination.pageSize, value);
        }, 400);
    };

    const handleTableChange = (nextPagination) => {
        setPagination((prev) => ({
            ...prev,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
        }));

        fetchLogs(nextPagination.current, nextPagination.pageSize, search);
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: isMobile ? 88 : 80,
            render: (id) => <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-xs font-semibold">#{id}</span>,
        },
        {
            title: "Recipient",
            key: "user",
            width: isMobile ? 240 : 220,
            render: (_, record) => (
                <div className="min-w-45">
                    <div className="font-medium text-gray-800 text-sm">{getRecipientName(record.user)}</div>
                    <div className="text-gray-400 text-xs">{record.user?.email || "No email"}</div>
                </div>
            ),
        },
        {
            title: "Role",
            key: "role",
            width: 120,
            render: (_, record) => (
                <Tag color="blue" className="capitalize">
                    {record.user?.role || "unknown"}
                </Tag>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 140,
            render: (type) => <Tag color="green" className="font-mono">{type || "system"}</Tag>,
        },
        {
            title: "Details",
            key: "details",
            render: (_, record) => (
                <div className="min-w-60">
                    <div className="font-semibold text-gray-900 text-sm">{record.title || "Untitled notification"}</div>
                    <div className="text-gray-500 text-xs mt-1">{truncateText(record.message)}</div>
                </div>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 110,
            render: (_, record) => (
                <Tag color={record.read_at ? "default" : "gold"}>
                    {record.read_at ? "Read" : "Unread"}
                </Tag>
            ),
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            width: 190,
            render: (value) => (
                <span className="text-gray-500 text-xs">
                    {new Date(value).toLocaleString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            ),
        },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-400 shadow-sm sm:h-12 sm:w-12">
                            <History size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Logs</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">Review recent system logs and activity</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-gray-900">All Notification Logs</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <div className="w-full">
                        <Input
                            placeholder="Search user, type, title, message..."
                            prefix={<Search size={14} className="text-gray-400" />}
                            value={search}
                            onChange={(event) => handleSearch(event.target.value)}
                            allowClear
                            size="large"
                            className="w-full rounded-xl"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={logs}
                        loading={loading}
                        rowKey="id"
                        scroll={{ x: 1080 }}
                        size={isMobile ? "middle" : "large"}
                        className={isMobile ? "[&_.ant-table-pagination]:px-4" : undefined}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showLessItems: true,
                            showTotal: (count) => <span className="text-gray-400 text-sm">{count} log entries total</span>,
                        }}
                        onChange={handleTableChange}
                        locale={{
                            emptyText: loading ? null : (
                                <div className="py-8">
                                    <div className="font-semibold text-gray-700 mb-1">No logs found</div>
                                    <div className="text-sm text-gray-400">Try adjusting the search term.</div>
                                </div>
                            ),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
