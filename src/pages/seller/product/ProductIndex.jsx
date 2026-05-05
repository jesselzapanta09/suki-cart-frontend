import React, { useEffect, useState, useCallback, useRef } from "react"
import { Table, Button, Popconfirm, Input, Tag, Tooltip, App, Grid } from "antd"
import { useNavigate } from "react-router-dom"
import { Plus, Edit, Trash2, Search, Package, Layers } from "lucide-react"
import { getCategories as getPublicCategories } from "../../../services/authService"
import * as productService from "../../../services/productService"
import { getStorageUrl } from "../../../utils/storage"

export default function ProductIndex() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [sorter, setSorter] = useState({ field: "id", order: "descend" })
  const [statusFilter, setStatusFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)

  const searchTimer = useRef(null)

  const fetchProducts = useCallback(async (page, pageSize, sortField, sortOrder, searchValue, status, category) => {
    setLoading(true)
    try {
      const data = await productService.getProducts({
        page,
        per_page: pageSize,
        search: searchValue || undefined,
        sort_field: sortField || undefined,
        sort_order: sortOrder || undefined,
        status: status ?? undefined,
        category_id: category ?? undefined,
      })
      // Support both direct and nested paginated responses
      const paginated = data.data && Array.isArray(data.data)
        ? data
        : (data.products && data.products.data ? data.products : null)
      setProducts(paginated?.data || [])
      setTotal(paginated?.total || 0)
      setPagination((prev) => ({ ...prev, current: paginated?.current_page || 1, pageSize: paginated?.per_page || 10 }))
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    getPublicCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    fetchProducts(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter, categoryFilter)
    return () => clearTimeout(searchTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTableChange = (nextPagination, filters, sort) => {
    const nextSorter = sort.order ? { field: sort.field, order: sort.order } : sorter
    const nextStatus = filters.status?.[0] ?? null
    const nextCategory = filters.category_id?.[0] ?? null
    const filtersOrSortChanged =
      nextSorter.field !== sorter.field ||
      nextSorter.order !== sorter.order ||
      nextStatus !== statusFilter ||
      nextCategory !== categoryFilter
    const page = filtersOrSortChanged ? 1 : nextPagination.current

    setSorter(nextSorter)
    setStatusFilter(nextStatus)
    setCategoryFilter(nextCategory)
    setPagination((prev) => ({ ...prev, current: page, pageSize: nextPagination.pageSize }))

    fetchProducts(
      page,
      nextPagination.pageSize,
      nextSorter.field,
      nextSorter.order,
      search,
      nextStatus,
      nextCategory,
    )
  }

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, current: 1 }))
      fetchProducts(1, pagination.pageSize, sorter.field, sorter.order, value, statusFilter, categoryFilter)
    }, 400)
  }

  const reload = () => {
    fetchProducts(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, statusFilter, categoryFilter)
  }

  const handleDelete = async (uuid) => {
    try {
      await productService.deleteProduct(uuid)
      message.success("Product deleted successfully!")
      reload()
    } catch (err) {
      message.error(err.message)
    }
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 72,
      sorter: true,
      render: (id) => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>,
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 ring-1 ring-green-100 overflow-hidden flex items-center justify-center">
            {record.images?.[0]?.image_path ? (
              <img src={getStorageUrl(record.images[0].image_path)} alt={record.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={20} className="text-green-700" />
            )}
          </div>
          <div>
            <div className="font-semibold text-green-950 text-sm">{record.name}</div>
            <div className="text-gray-400 text-xs">{record.variants?.length || 0} variant{record.variants?.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category_id",
      width: 160,
      filters: categories.map((category) => ({ text: category.name, value: category.id })),
      filterMultiple: false,
      filteredValue: categoryFilter !== null && categoryFilter !== undefined ? [categoryFilter] : null,
      render: (_, record) => (record.category?.name ? <Tag color="blue">{record.category.name}</Tag> : <Tag>None</Tag>),
    },
    {
      title: "Stock",
      dataIndex: "variants",
      key: "stock",
      width: 120,
      sorter: true,
      render: (variants) => {
        const totalStock = variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0
        return <span className="font-mono text-sm font-semibold">{totalStock}</span>
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      sorter: true,
      filters: [
        { text: "Active", value: "active" },
        { text: "Draft", value: "draft" },
        { text: "Out of Stock", value: "out_of_stock" },
      ],
      filterMultiple: false,
      filteredValue: statusFilter ? [statusFilter] : null,
      render: (status) => {
        if (status === "active") return <Tag color="green">Active</Tag>
        if (status === "out_of_stock") return <Tag color="orange">Out of Stock</Tag>
        return <Tag>Draft</Tag>
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Manage Variants">
            <Button
              size={isMobile ? "middle" : "small"}
              type="default"
              onClick={() => navigate(`/seller/products/${record.uuid}/variants`)}
              icon={<Layers size={14} />}
              className={isMobile ? "h-9 w-9 rounded-lg" : undefined}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size={isMobile ? "middle" : "small"}
              type="primary"
              onClick={() => navigate(`/seller/products/${record.uuid}/edit`)}
              icon={<Edit size={14} />}
              className={isMobile ? "h-9 w-9 rounded-lg" : undefined}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title={`Delete ${record.name}?`}
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.uuid)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                size={isMobile ? "middle" : "small"}
                danger
                className={isMobile ? "h-9 w-9 rounded-lg" : "rounded-md"}
                icon={<Trash2 size={14} />}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">

      <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
              <Layers size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Product Management</h1>
              <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">Manage your store&apos;s products</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/seller/products/create")}
            type="primary"
            icon={<Plus size={16} />}
            size="large"
            className="h-11 w-full rounded-xl sm:w-auto"
          >
            Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="font-sora font-semibold text-sm text-green-900">All Products</span>
            <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
          </div>
          <div className="w-full">
            <Input
              placeholder="Search name, description..."
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
            dataSource={products}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: false,
              showTotal: (count) => <span className="text-gray-400 text-sm">{count} products total</span>,
            }}
            onChange={handleTableChange}
            size={isMobile ? "middle" : "large"}
            scroll={{ x: 900 }}
            className={isMobile ? "[&_.ant-table-pagination]:px-4 [&_.ant-table-cell]:align-top" : "[&_.ant-table-cell]:align-top"}
            locale={{
              emptyText: loading ? null : (
                <div className="py-8">
                  <div className="font-semibold text-gray-700 mb-1">No products found for your store</div>
                  <div className="text-sm text-gray-400">Only products linked to the currently logged-in seller account appear here.</div>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  )
}
