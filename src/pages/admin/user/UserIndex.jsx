import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Popconfirm, Input, Tag, Tooltip, App, Modal, Spin, Grid } from "antd"
import { Plus, Edit, Trash2, Search, Users, User2 } from "lucide-react"
import UserModal from "./Usermodal"
import Avatar from "../../../components/Avatar"
import LocationAddress from "../../../components/LocationAddress"
import * as userService from "../../../services/userService"

export default function UserIndex() {
    const { message } = App.useApp()
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.md

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [sorter, setSorter] = useState({ field: "id", order: "descend" })
    const [roleFilter, setRoleFilter] = useState(null)
    const [emailVerifiedFilter, setEmailVerifiedFilter] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState("add")
    const [editRecord, setEditRecord] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [viewUser, setViewUser] = useState(null)
    const [viewLoading, setViewLoading] = useState(false)

    const searchTimer = useRef(null)

    const fetchUsers = useCallback(async (page, pageSize, sortField, sortOrder, searchVal, role, verified) => {
        setLoading(true)
        try {
            const data = await userService.getUsers({
                page,
                perPage: pageSize,
                search: searchVal || undefined,
                sortField: sortField || undefined,
                sortOrder: sortOrder || undefined,
                role: role || undefined,
                verified: verified ? (verified === "verified" ? "1" : "0") : undefined,
            })
            setUsers(data.data)
            setTotal(data.total)
            setPagination(prev => ({ ...prev, current: data.current_page, pageSize: data.per_page }))
        } catch (err) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [message])

    useEffect(() => {
        fetchUsers(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, roleFilter, emailVerifiedFilter)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!isMobile) return

        const nextSorter = sorter.field === "id" ? { field: "created_at", order: "descend" } : sorter
        const nextRoleFilter = roleFilter ? null : roleFilter
        const shouldUpdate = nextSorter.field !== sorter.field || nextSorter.order !== sorter.order || nextRoleFilter !== roleFilter

        if (!shouldUpdate) return

        setSorter(nextSorter)
        setRoleFilter(nextRoleFilter)
        setPagination(prev => ({ ...prev, current: 1 }))
        fetchUsers(1, pagination.pageSize, nextSorter.field, nextSorter.order, search, nextRoleFilter, emailVerifiedFilter)
    }, [isMobile, sorter, pagination.pageSize, search, roleFilter, emailVerifiedFilter, fetchUsers])

    const handleTableChange = (pag, filters, sort) => {
        const newSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
        const newRole = filters.role?.[0] || null
        const newEmailVerified = filters.email_verified_at?.[0] || null
        const filtersOrSortChanged = newSorter.field !== sorter.field || newSorter.order !== sorter.order || newRole !== roleFilter || newEmailVerified !== emailVerifiedFilter
        const page = filtersOrSortChanged ? 1 : pag.current
        setSorter(newSorter)
        setRoleFilter(newRole)
        setEmailVerifiedFilter(newEmailVerified)
        setPagination(prev => ({ ...prev, current: page, pageSize: pag.pageSize }))
        fetchUsers(page, pag.pageSize, newSorter.field, newSorter.order, search, newRole, newEmailVerified)
    }

    const handleSearch = (val) => {
        setSearch(val)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, current: 1 }))
            fetchUsers(1, pagination.pageSize, sorter.field, sorter.order, val, roleFilter, emailVerifiedFilter)
        }, 400)
    }

    const reload = () => {
        fetchUsers(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, roleFilter, emailVerifiedFilter)
    }

    const openAdd = () => { setModalMode("add"); setEditRecord(null); setModalOpen(true) }
    const openEdit = async (r) => {
        try {
            const data = await userService.getUser(r.id)
            setModalMode("edit")
            setEditRecord(data.user)
            setModalOpen(true)
        } catch (err) {
            message.error(err.message)
        }
    }

    const openView = async (id) => {
        setViewModalOpen(true)
        setViewLoading(true)
        try {
            const data = await userService.getUser(id)
            setViewUser(data.user)
        } catch (err) {
            message.error(err.message)
            setViewModalOpen(false)
        } finally {
            setViewLoading(false)
        }
    }

    const handleSubmit = async values => {
        setSubmitLoading(true)
        try {
            if (modalMode === "add") {
                await userService.createUser(values)
                message.success("User created successfully!")
            } else {
                await userService.updateUser(editRecord.id, values)
                message.success("User updated successfully!")
            }
            setModalOpen(false)
            reload()
        } catch (err) {
            message.error(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDelete = async id => {
        try {
            await userService.deleteUser(id)
            message.success("User deleted successfully!")
            reload()
        } catch (err) {
            message.error(err.message)
        }
    }

    const roleColors = { admin: "green", seller: "orange", customer: "cyan" }
    const mobileColumnWidth = width => (isMobile ? undefined : width)

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: mobileColumnWidth(64),
            sorter: true,
            render: id => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>
        },
        {
            title: "User", dataIndex: "firstname", key: "firstname",
            sorter: true,
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar user={record} size={34} fontSize="0.85rem" />
                    <div>
                        <div onClick={() => openView(record.id)} className="font-semibold text-green-900 text-sm cursor-pointer hover:underline">
                            {record.firstname} {record.lastname}
                        </div>
                        <div className="text-gray-400 text-xs">{record.email}</div>
                    </div>
                </div>
            )
        },
        {
            title: "Role", dataIndex: "role", key: "role", width: mobileColumnWidth(110),
            sorter: true,
            filters: isMobile ? undefined : [
                { text: "Admin", value: "admin" },
                { text: "Seller", value: "seller" },
                { text: "Customer", value: "customer" },
            ],
            filterMultiple: false,
            filteredValue: isMobile ? null : (roleFilter ? [roleFilter] : null),
            render: role => <Tag variant="filled" color={roleColors[role] || "default"}>{role.toUpperCase()}</Tag>
        },
        {
            title: "Email Verified", dataIndex: "email_verified_at", key: "email_verified_at", width: mobileColumnWidth(150),
            sorter: false,
            filters: [
                { text: "Verified", value: "1" },
                { text: "Not Verified", value: "0" },
            ],
            filterMultiple: false,
            filteredValue: emailVerifiedFilter ? [emailVerifiedFilter] : null,
            render: val => (
                <span className={`flex items-center gap-1 text-xs ${val ? "text-green-600" : "text-red-600"}`}>
                    <span className={`h-2 w-2 rounded-full ${val ? "bg-green-600" : "bg-red-600"}`}></span>
                    {val ? "Verified" : "Not Verified"}
                </span>
            )
        },
        {
            title: "Joined", dataIndex: "created_at", key: "created_at", width: mobileColumnWidth(130),
            sorter: true,
            render: d => <span className="text-gray-400 text-xs">{new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
        },
        {
            title: "Actions", width: mobileColumnWidth(100),
            render: (_, record) => (
                <div className="flex gap-2">
                    <Tooltip title="Edit">
                        <Button
                            size={isMobile ? "middle" : "small"}
                            type="primary"
                            onClick={() => openEdit(record)}
                            icon={<Edit size={14} />}
                            className="min-h-9 rounded-lg px-3"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm title={`Delete ${record.firstname}?`} description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
                            <Button size={isMobile ? "middle" : "small"} danger className="min-h-9 rounded-lg px-3" icon={<Trash2 size={14} />} />
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
                            <Users size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">User Management</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">Manage all user accounts and roles</p>
                        </div>
                    </div>
                    <Button onClick={openAdd} type="primary" icon={<Plus size={16} />} size="large" className="h-11 w-full rounded-xl px-4 font-semibold sm:w-auto">
                        Add User
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-green-900">All Users</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <div className="w-full">
                        <Input
                            placeholder="Search name, email, role..."
                            prefix={<Search size={14} className="text-gray-400" />}
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            allowClear
                            size="large"
                            className="w-full rounded-xl"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        onChange={handleTableChange}
                        scroll={{ x: 980 }}
                        size={isMobile ? "middle" : "large"}
                        className={isMobile ? "[&_.ant-table-pagination]:px-4" : undefined}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: t => <span className="text-gray-400 text-sm">{t} users total</span>,
                        }}
                    />
                </div>
            </div>

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
                ) : viewUser && (
                    <div className="space-y-4 pt-18 sm:pt-20">
                        <div className="absolute top-0 left-0 z-10 w-full overflow-hidden rounded-t-xl">
                            <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                                <div className="w-1.5 rounded-tl-xl bg-linear-to-b from-green-600 to-emerald-400" />
                                <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 ring-1 ring-green-200">
                                        <User2 className="h-4 w-4 text-green-700" />
                                    </div>
                                    <h3 className="font-sora text-base font-bold text-gray-900">User Details</h3>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                            <Avatar user={viewUser} size={52} fontSize="1rem" />
                            <div className="min-w-0">
                                <div className="font-semibold text-green-900">{viewUser.firstname} {viewUser.lastname}</div>
                                <div className="truncate text-sm text-gray-500">{viewUser.email}</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Tag color={viewUser.role === "admin" ? "green" : viewUser.role === "seller" ? "orange" : "cyan"}>{viewUser.role.toUpperCase()}</Tag>
                            <Tag color={viewUser.email_verified_at ? "green" : "red"}>{viewUser.email_verified_at ? "Verified" : "Not Verified"}</Tag>
                        </div>
                        {viewUser.contact_number && (
                            <div className="text-sm text-gray-500">Contact: {viewUser.contact_number}</div>
                        )}
                        <div className="text-sm text-gray-500">
                            Joined: {new Date(viewUser.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                        {viewUser.locations?.length > 0 && (
                            <div className="text-sm text-gray-500">
                                <div className="mb-1 font-medium text-gray-700">Address:</div>
                                {viewUser.locations.map((loc, i) => (
                                    <LocationAddress key={i} location={loc} />
                                ))}
                            </div>
                        )}
                        {viewUser.store && (
                            <div className="text-sm text-gray-500">
                                <div className="mb-1 font-medium text-gray-700">Store:</div>
                                <div>{viewUser.store.store_name} - {viewUser.store.category?.name}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <UserModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} initialValues={editRecord} loading={submitLoading} mode={modalMode} />
        </div>
    )
}
