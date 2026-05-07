import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Popconfirm, Input, Tag, Tooltip, App, Modal, Spin, Grid } from "antd"
import { Plus, Edit, Trash2, Search, Grid3x3 } from "lucide-react"
import CategoryModal from "./CategoryModal"
import * as categoryService from "../../../services/categoryService"

export default function CategoryIndex() {
    const { message } = App.useApp()
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.md

    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [sorter, setSorter] = useState({ field: "id", order: "descend" })
    const [statusFilter, setStatusFilter] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState("add")
    const [editRecord, setEditRecord] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)

    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [viewCategory, setViewCategory] = useState(null)
    const [viewLoading, setViewLoading] = useState(false)

    const searchTimer = useRef(null)

    const fetchCategories = useCallback(async (page, pageSize, sortField, sortOrder, searchVal, status) => {
        setLoading(true)
        try {
            const data = await categoryService.getCategories({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
                sortField: sortField || undefined,
                sortOrder: sortOrder || undefined,
                status: status !== null && status !== undefined ? status : undefined,
            })
            setCategories(data.data)
            setTotal(data.total)
            setPagination(prev => ({ ...prev, current: data.current_page, pageSize: data.per_page }))
        } catch (err) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [message])

    const openView = (id) => {
        setViewModalOpen(true)
        setViewLoading(true)
        categoryService.getCategory(id)
            .then(data => {
                setViewCategory(data.category)
            })
            .catch(err => {
                message.error(err.message)
                setViewModalOpen(false)
            })
            .finally(() => {
                setViewLoading(false)
            })
    }

    useEffect(() => {
        fetchCategories(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTableChange = (pag, filters, sort) => {
        const newSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
        const newStatus = filters.status?.[0] ?? null
        const filtersOrSortChanged = newSorter.field !== sorter.field || newSorter.order !== sorter.order || newStatus !== statusFilter
        const page = filtersOrSortChanged ? 1 : pag.current
        setSorter(newSorter)
        setStatusFilter(newStatus)
        setPagination(prev => ({ ...prev, current: page, pageSize: pag.pageSize }))
        fetchCategories(page, pag.pageSize, newSorter.field, newSorter.order, search, newStatus)
    }

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchCategories(1, pagination.pageSize, sorter.field, sorter.order, val, statusFilter)
        }, 400)
    }

    const reload = () => {
        fetchCategories(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter)
    }

    const openAdd = () => { setModalMode("add"); setEditRecord(null); setModalOpen(true) }
    const openEdit = async (record) => {
        try {
            const data = await categoryService.getCategory(record.id)
            setModalMode("edit")
            setEditRecord(data.category)
            setModalOpen(true)
        } catch (err) {
            message.error(err.message)
        }
    }

    const handleSubmit = async (values) => {
        setSubmitLoading(true)
        try {
            if (modalMode === "add") {
                await categoryService.createCategory(values)
                message.success("Category created successfully!")
            } else {
                await categoryService.updateCategory(editRecord.id, values)
                message.success("Category updated successfully!")
            }
            setModalOpen(false)
            reload()
        } catch (err) {
            message.error(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await categoryService.deleteCategory(id)
            message.success("Category deleted successfully!")
            reload()
        } catch (err) {
            message.error(err.message)
        }
    }

    const actionButtonClass = "!h-9 rounded-lg !px-3 md:!h-8"

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 64,
            sorter: true,
            defaultSortOrder: "descend",
            render: id => <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-xs font-semibold text-green-800">#{id}</span>
        },
        {
            title: "Name", dataIndex: "name", key: "name",
            sorter: true,
            render: (name, record) => (
                <span
                    onClick={() => openView(record.id)}
                    className="cursor-pointer text-sm font-semibold text-green-900 hover:underline"
                >
                    {name}
                </span>
            )
        },
        {
            title: "Description", dataIndex: "description", key: "description",
            render: desc => <span className="text-xs text-gray-500">{desc || "-"}</span>
        },
        {
            title: "Stores", dataIndex: "stores_count", key: "stores_count", width: 90,
            render: count => <span className="text-sm font-medium text-gray-600">{count ?? 0}</span>
        },
        {
            title: "Status", dataIndex: "status", key: "status", width: 110,
            sorter: true,
            filters: [
                { text: "Active", value: 1 },
                { text: "Inactive", value: 0 },
            ],
            filterMultiple: false,
            filteredValue: statusFilter !== null && statusFilter !== undefined ? [statusFilter] : null,
            render: status => (
                <Tag color={status ? "green" : "red"}>{status ? "Active" : "Inactive"}</Tag>
            )
        },
        {
            title: "Created", dataIndex: "created_at", key: "created_at", width: 130,
            sorter: true,
            render: d => <span className="text-xs text-gray-400">{new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
        },
        {
            title: "Actions", width: 100,
            render: (_, record) => (
                <div className="flex gap-2">
                    <Tooltip title="Edit">
                        <Button
                            size={isMobile ? "middle" : "small"}
                            type="primary"
                            onClick={() => openEdit(record)}
                            icon={<Edit size={14} />}
                            className={actionButtonClass}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm title={`Delete "${record.name}"?`} description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
                            <Button
                                size={isMobile ? "middle" : "small"}
                                danger
                                className={actionButtonClass}
                                icon={<Trash2 size={14} />}
                            />
                        </Popconfirm>
                    </Tooltip>
                </div>
            )
        }
    ]

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-500 shadow-sm sm:h-12 sm:w-12">
                            <Grid3x3 size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Category Management</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">Manage store categories</p>
                        </div>
                    </div>
                    <Button
                        onClick={openAdd}
                        type="primary"
                        icon={<Plus size={16} />}
                        size="large"
                        className="h-11 w-full rounded-xl px-4 font-semibold sm:w-auto"
                    >
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-2">
                        <span className="font-sora text-sm font-semibold text-green-900">All Categories</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">{total}</span>
                    </div>
                    <Input
                        placeholder="Search name, description..."
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
                        dataSource={categories}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        onChange={handleTableChange}
                        size={isMobile ? "middle" : "large"}
                        scroll={{ x: 760 }}
                        className={isMobile ? "[&_.ant-table-pagination]:px-4" : undefined}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: t => <span className="text-sm text-gray-400">{t} categories total</span>,
                        }}
                    />
                </div>
            </div>

            <CategoryModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                initialValues={editRecord}
                loading={submitLoading}
                mode={modalMode}
            />

            <Modal
                open={viewModalOpen}
                onCancel={() => setViewModalOpen(false)}
                footer={null}
                width={isMobile ? "calc(100vw - 1rem)" : 520}
                centered
                className="max-w-[calc(100vw-1rem)] sm:max-w-130"
                styles={{
                    body: {
                        padding: isMobile ? "16px" : "24px",
                        paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 16px)" : "24px",
                    },
                }}
            >
                {viewLoading ? (
                    <div className="flex justify-center py-10"><Spin /></div>
                ) : viewCategory && (
                    <div className="space-y-4 pt-18 sm:pt-20">
                        <div className="absolute top-0 left-0 z-10 w-full overflow-hidden rounded-t-xl">
                            <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                                <div className="w-1.5 rounded-tl-xl bg-linear-to-b from-green-600 to-emerald-400" />
                                <div className="px-4 py-4 sm:px-5">
                                    <h3 className="font-sora text-base font-bold text-gray-900">Category Details</h3>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-4">
                            <div className="font-semibold text-green-900">{viewCategory.name}</div>
                            <div className="mt-1 text-sm leading-6 text-gray-500">{viewCategory.description || "-"}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Tag color={viewCategory.status ? "green" : "red"}>{viewCategory.status ? "Active" : "Inactive"}</Tag>
                            <span className="text-sm text-gray-600">Stores: {viewCategory.stores_count ?? 0}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Created: {new Date(viewCategory.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
