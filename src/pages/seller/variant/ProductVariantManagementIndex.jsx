import React, { useEffect, useState, useCallback, useRef } from "react"
import { Button, Table, Popconfirm, App, Tooltip, Input, Grid } from "antd"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, Trash2, ArrowLeft, Layers, Edit, Search } from "lucide-react"
import ProductVariantModal from "./ProductVariantModal"
import * as productService from "../../../services/productService"
import { formatPeso } from "../../../utils/currency"

export default function ProductVariantManagementIndex() {
  const { uuid: productUuid } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [filteredVariants, setFilteredVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [editRecord, setEditRecord] = useState(null)
  const [mobileAddTapCount, setMobileAddTapCount] = useState(0)

  const searchTimer = useRef(null)

  const fetchProductAndVariants = useCallback(async () => {
    try {
      setLoading(true)
      const [productRes, variantsRes] = await Promise.all([
        productService.getProduct(productUuid),
        productService.getProductVariants(productUuid),
      ])
      const productData = productRes.product || productRes.data
      if (!productData) {
        message.error("Product not found. Redirecting...")
        navigate("/seller/products", { replace: true })
        return
      }
      setProduct(productData)
      const allVariants = variantsRes.data || []
      setVariants(allVariants)
      filterVariants(allVariants, search)
    } catch (error) {
      console.error("Error fetching data:", error)
      message.error("Failed to load product. Redirecting...")
      navigate("/seller/products", { replace: true })
    } finally {
      setLoading(false)
    }
  }, [productUuid, message, search, navigate])

  useEffect(() => {
    fetchProductAndVariants()
  }, [fetchProductAndVariants])

  useEffect(() => {
    if (!modalOpen) {
      setMobileAddTapCount(0)
    }
  }, [modalOpen])

  const filterVariants = (variantsList, searchValue) => {
    if (!searchValue.trim()) {
      setFilteredVariants(variantsList)
      return
    }
    const searchLower = searchValue.toLowerCase()
    const filtered = variantsList.filter((variant) => {
      const nameMatch = variant.name?.toLowerCase().includes(searchLower)
      return nameMatch
    })
    setFilteredVariants(filtered)
  }

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      filterVariants(variants, value)
    }, 300)
  }

  const openAdd = () => {
    setModalMode("add")
    setEditRecord(null)
    setModalOpen(true)
  }

  const handleMobileOpenAdd = () => {
    if (submitLoading || mobileAddTapCount >= 2) return
    setMobileAddTapCount((count) => count + 1)
    openAdd()
  }

  const openEdit = async (record) => {
    try {
      const data = await productService.getProductVariant(productUuid, record.id)
      setModalMode("edit")
      setEditRecord(data.variant || data.data)
      setModalOpen(true)
    } catch (err) {
      message.error(err.message || "Failed to load variant")
    }
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true)

      const payload = {
        name: values.name,
        price: values.price,
        stock: values.stock,
      }

      if (modalMode === "add") {
        const res = await productService.addProductVariant(productUuid, payload)
        const newVariant = res.data || res.variant || { id: Date.now(), ...payload }
        const updatedVariants = [...variants, newVariant]
        setVariants(updatedVariants)
        filterVariants(updatedVariants, search)
        message.success("Variant created successfully!")
      } else {
        await productService.updateProductVariant(productUuid, editRecord.id, payload)
        const updatedVariants = variants.map((v) =>
          v.id === editRecord.id ? { ...v, ...payload } : v
        )
        setVariants(updatedVariants)
        filterVariants(updatedVariants, search)
        message.success("Variant updated successfully!")
      }
      await fetchProductAndVariants()
      setModalOpen(false)
    } catch (err) {
      message.error(err.message || "Failed to save variant")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (variantId) => {
    try {
      await productService.deleteProductVariant(productUuid, variantId)
      message.success("Variant deleted successfully!")
      const updatedVariants = variants.filter((v) => v.id !== variantId)
      setVariants(updatedVariants)
      filterVariants(updatedVariants, search)
    } catch (error) {
      console.error("Error deleting variant:", error)
      message.error(error.message || "Failed to delete variant")
    }
  }

  const columns = [
    {
      title: "Variant Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-semibold text-gray-700">{name || "—"}</span>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price) => <span className="text-green-700 font-semibold">{formatPeso(price)}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (stock) => <span className="font-mono text-sm font-medium">{stock}</span>,
    },
    {
      title: "Actions",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Edit">
            <Button size="small" type="primary" onClick={() => openEdit(record)} icon={<Edit size={14} />} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Variant?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<Trash2 size={14} />} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
      <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            {!isMobile && (
              <Button
                onClick={() => navigate("/seller/products")}
                icon={<ArrowLeft size={16} />}
                type="text"
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:mt-0"
              />
            )}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
            <Layers size={22} className="text-white" />
          </div>
            <div className="min-w-0">
              <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">{product?.name || "Product variants"}</h1>
              <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">Variant management for this product</p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <Button
              onClick={openAdd}
              type="primary"
              icon={<Plus size={16} />}
              size="large"
              className="h-11 w-full rounded-xl sm:w-auto"
            >
              Add Variant
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="font-sora font-semibold text-sm text-green-900">All Variants</span>
            <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{filteredVariants.length}</span>
          </div>
          <div className="w-full">
            <Input
              placeholder="Search variant name..."
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
            dataSource={filteredVariants}
            loading={loading || submitLoading}
            rowKey="id"
            size={isMobile ? "middle" : "large"}
            scroll={{ x: 620 }}
            className={isMobile ? "[&_.ant-table-pagination]:px-4 [&_.ant-table-cell]:align-top" : "[&_.ant-table-cell]:align-top"}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (count) => <span className="text-gray-400 text-sm">{count} variants total</span>,
            }}
            locale={{
              emptyText: loading ? null : (
                <div className="py-8">
                  <div className="font-semibold text-gray-700 mb-1">
                    {filteredVariants.length === 0 && variants.length > 0 ? "No variants match your search" : "No variants yet"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {filteredVariants.length === 0 && variants.length > 0 ? "Try a different search term" : "Add a variant to get started"}
                  </div>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Modal */}
      <ProductVariantModal
        key={`${modalMode}-${editRecord?.id ?? "new"}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editRecord}
        loading={submitLoading}
        mode={modalMode}
      />
      {isMobile && (
        <>
          <div
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
          >
            <div className="flex flex-nowrap gap-3">
              <Button
                size="large"
                onClick={() => navigate("/seller/products")}
                className="h-12 min-w-0 flex-1 rounded-2xl"
              >
                Back
              </Button>
              <Button
                size="large"
                type="primary"
                onClick={handleMobileOpenAdd}
                icon={<Plus size={16} />}
                disabled={submitLoading || mobileAddTapCount >= 2}
                className="h-12 min-w-0 flex-1 rounded-2xl"
              >
                Add Variant
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
