import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { App, Button, Form, Input, InputNumber, Select, Spin, Tag, Upload, Grid as AntGrid } from "antd"
import { ArrowLeft, Grid, ImagePlus, Layers, Package, RotateCcw, Save, Sliders, Trash2 } from "lucide-react"
import { UploadOutlined } from "@ant-design/icons"
import { getCategories as getPublicCategories } from "../../../services/authService"
import * as productService from "../../../services/productService"
import { getStorageUrl } from "../../../utils/storage"
import { cloneFileForUpload, debugFormData } from "../../../utils/upload"

function getStatusTag(status) {
  if (status === "active") return <Tag color="green">Active</Tag>
  if (status === "out_of_stock") return <Tag color="orange">Out of Stock</Tag>
  return <Tag>Draft</Tag>
}

function getTotalVariantStock(variants = []) {
  return variants.reduce((total, variant) => total + Number(variant?.stock || 0), 0)
}

function getStatusStockError(status, totalVariantStock) {
  if (status === "active" && totalVariantStock <= 0) {
    return "Active products must have at least one variant with stock greater than 0"
  }

  if (status === "out_of_stock" && totalVariantStock > 0) {
    return "Out of Stock products cannot have variant stock greater than 0"
  }

  return null
}

function mapProductToForm(product) {
  // Convert specs object to array of {key, value} pairs for the form
  const specsArray = product.specs ? Object.entries(product.specs).map(([key, value]) => ({ key, value })) : [];

  // Convert variants array to form structure
  const variantsArray = product.variants ? product.variants.map(variant => ({
    id: variant.id,
    name: variant.name,
    price: variant.price !== undefined && variant.price !== null ? Number(variant.price) : null,
    stock: variant.stock ?? 0,
  })) : [];

  return {
    name: product.name ?? "",
    category_id: product.category_id ?? undefined,
    description: product.description ?? "",
    weight: product.weight ?? "",
    dimension: product.dimension ?? "",
    specs: specsArray,
    status: product.status ?? "active",
    variants: variantsArray,
    images: [],
  }
}

const DEFAULT_FORM_VALUES = {
  name: "",
  category_id: undefined,
  description: "",
  weight: "",
  dimension: "",
  specs: [{ key: "", value: "" }], // Default one spec row
  status: "active",
  variants: [{ name: "", price: null, stock: 0 }], // Default one variant row
  images: [],
}

export default function ProductFormPage({ mode }) {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const screens = AntGrid.useBreakpoint()
  const isMobile = !screens.md

  const isEdit = mode === "edit"
  const [categories, setCategories] = useState([])
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [imagePreparingCount, setImagePreparingCount] = useState(0)
  const [imageList, setImageList] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [product, setProduct] = useState(null)
  const stableUploadFilesRef = useRef(new Map())
  const imagesPreparing = imagePreparingCount > 0
  const totalImageCount = existingImages.length + imageList.length
  const hasUploadSlots = totalImageCount < 5

  const categoryOptions = useMemo(() => categories.map((category) => ({
    label: category.name,
    value: category.id,
  })), [categories])

  useEffect(() => {
    getPublicCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit) {
      stableUploadFilesRef.current = new Map()
      setProduct(null)
      setExistingImages([])
      setDeletedImageIds([])
      setImageList([])
      setImagePreparingCount(0)
      return
    }

    setPageLoading(true)
    productService.getProduct(uuid)
      .then((data) => {
        const nextProduct = data.product
        stableUploadFilesRef.current = new Map()
        setProduct(nextProduct)
        setExistingImages(nextProduct.images || [])
        setDeletedImageIds([])
        setImageList([])
        setImagePreparingCount(0)
      })
      .catch((err) => {
        console.error("Failed to load product:", err)
        message.error('Failed to load product details. It may have been removed.')
        navigate("/seller/products", { replace: true })
      })
      .finally(() => setPageLoading(false))
  }, [form, uuid, isEdit, message, navigate])

  useEffect(() => {
    if (isEdit) {
      if (pageLoading || !product) return
      form.setFieldsValue(mapProductToForm(product))
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_FORM_VALUES)
  }, [form, isEdit, pageLoading, product])

  const getCurrentVariantsForValidation = () => {
    if (isEdit) {
      return product?.variants || []
    }

    return form.getFieldValue("variants") || []
  }

  const applyBackendErrors = (errors = {}) => {
    const fields = Object.entries(errors).map(([name, errorList]) => ({
      name,
      errors: Array.isArray(errorList) ? errorList : [String(errorList)],
    }))
    if (fields.length > 0) form.setFields(fields)
  }

  const handleBeforeUpload = async (file) => {
    if (existingImages.length + imageList.length >= 5) {
      message.warning("A product can only have up to 5 images")
      return Upload.LIST_IGNORE
    }

    setImagePreparingCount((count) => count + 1)

    try {
      const stableFile = await cloneFileForUpload(file)

      if (!stableFile) {
        message.error(`Failed to prepare ${file.name || "the selected image"}. Please choose it again.`)
        return Upload.LIST_IGNORE
      }

      stableUploadFilesRef.current.set(file.uid, stableFile)

      setImageList((prev) => {
        const nextList = [
          ...prev.filter((item) => item.uid !== file.uid),
          {
            uid: file.uid,
            status: "done",
            name: file.name || stableFile.name || `image-${prev.length + 1}`,
            originFileObj: stableFile,
          },
        ].slice(0, Math.max(0, 5 - existingImages.length))

        form.setFieldValue("images", nextList)
        return nextList
      })

      form.validateFields(["images"]).catch(() => { })
    } catch (error) {
      console.error("Failed to prepare product images:", error)
      message.error(`Failed to prepare ${file.name || "the selected image"}. Please choose it again.`)
    } finally {
      setImagePreparingCount((count) => Math.max(0, count - 1))
    }

    return Upload.LIST_IGNORE
  }

  const handleRemoveSelectedImage = (file) => {
    stableUploadFilesRef.current.delete(file.uid)
    setImageList((prev) => {
      const nextList = prev.filter((item) => item.uid !== file.uid)
      form.setFieldValue("images", nextList)
      return nextList
    })
    form.validateFields(["images"]).catch(() => { })
    message.success("Selected image removed.")
    return true
  }

  const handleRemoveExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((image) => image.id !== imageId))
    setDeletedImageIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]))
    message.success("Image removed. Save the product to apply this change.")
  }

  const handleSubmit = async (values) => {
    if (imagesPreparing) {
      message.warning("Please wait for the selected images to finish preparing.")
      return
    }

    const formData = new FormData()
    const variants = isEdit ? (product?.variants || []) : (values.variants || [])
    const totalVariantStock = getTotalVariantStock(variants)
    const requestedStatus = values.status
    const initialCreateStatus = !isEdit && requestedStatus === "active" ? "draft" : requestedStatus
    const statusStockError = getStatusStockError(requestedStatus, totalVariantStock)

    if (statusStockError) {
      form.setFields([
        {
          name: ["status"],
          errors: [statusStockError],
        },
        {
          name: ["variants"],
          errors: requestedStatus === "active"
            ? ["Add stock to at least one variant before setting the product to Active"]
            : ["Set all variant stock to 0 before marking the product as Out of Stock"],
        },
      ])
      message.error(statusStockError)
      return
    }

    Object.entries(values).forEach(([key, value]) => {
      if (key === "images") return
      if (key === "variants") return // Handle separately
      if (key === "specs") {
        // Convert specs array to FormData object format (specs[key]=value)
        if (Array.isArray(value) && value.length > 0) {
          const specsObj = value.reduce((acc, spec) => {
            if (spec.key && spec.value) {
              acc[spec.key] = spec.value
            }
            return acc
          }, {})
          // Append each spec as a form array item
          Object.entries(specsObj).forEach(([specKey, specValue]) => {
            formData.append(`specs[${specKey}]`, specValue)
          })
        }
        return
      }
      if (key === "status") {
        formData.append("status", initialCreateStatus)
        return
      }
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value)
      }
    })

    let uploadIndex = 0

    imageList.forEach((file) => {
      const stableFile = stableUploadFilesRef.current.get(file.uid)

      if (stableFile instanceof Blob) {
        const filename = stableFile instanceof File && stableFile.name
          ? stableFile.name
          : file.name || `image-${file.uid || "upload"}`

        formData.append(`images[${uploadIndex}]`, stableFile, filename)
        uploadIndex += 1
      }
    })

    deletedImageIds.forEach((imageId) => {
      formData.append("deleted_image_ids[]", imageId)
    })

    const preparedUploadCount = uploadIndex

    if (existingImages.length + preparedUploadCount < 1) {
      form.setFields([
        {
          name: ["images"],
          errors: ["At least one image is required"],
        },
      ])
      message.error("At least one image is required")
      return
    }

    console.debug("[product-upload] submit state", {
      existingImageCount: existingImages.length,
      deletedImageIds,
      selectedImageCount: imageList.length,
      preparedUploadCount,
      selectedImages: imageList.map((file) => ({
        uid: file.uid,
        name: file.name,
        hasOriginFileObj: Boolean(file.originFileObj),
      })),
    })
    debugFormData(formData, "product-upload")

    setSubmitLoading(true)
    try {
      let productId = uuid

      if (isEdit) {
        await productService.updateProduct(uuid, formData)
      } else {
        const response = await productService.addProduct(formData)
        productId = response.product.uuid
      }

      // Handle variants separately
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          if (variant.id) {
            // Update existing variant
            await productService.updateProductVariant(productId, variant.id, {
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
            })
          } else {
            // Create new variant
            await productService.addProductVariant(productId, {
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
            })
          }
        }

        if (requestedStatus !== initialCreateStatus) {
          const statusFormData = new FormData()
          statusFormData.append("status", requestedStatus)
          await productService.updateProduct(productId, statusFormData)
        }
      }

      message.success(isEdit ? "Product updated successfully!" : "Product created successfully!")
      navigate("/seller/products")
    } catch (err) {
      applyBackendErrors(err.errors)
      console.error("Failed to submit product form:", err)
      message.error('Failed to save product. Please check the form for errors and try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">

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
              <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">
                {isEdit ? "Edit Product" : "Add Product"}
              </h1>
              <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                {isEdit ? "Update your product details and images" : "Create a new product for your store"}
              </p>
            </div>
          </div>
          {!isMobile && (
            <div className="self-start sm:self-auto">
              {isEdit && product ? getStatusTag(product.status) : <Tag color="green">New</Tag>}
            </div>
          )}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        size="large"
        onFinish={handleSubmit}
        initialValues={DEFAULT_FORM_VALUES}
      >
        {pageLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Spin size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center">
                    <Package size={20} className="text-green-700" />
                  </div>
                  <div>
                    <h2 className="font-sora font-bold text-lg text-gray-900">Product Details</h2>
                    <p className="text-sm text-gray-400">Fill in the basic information customers will see.</p>
                  </div>
                </div>

                <Form.Item
                  name="name"
                  label="Product Name"
                  rules={[{ required: true, message: "Product name is required" }]}
                >
                  <Input placeholder="e.g. Lucky Me Noodles" className="rounded-xl" />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="weight"
                    label="Weight (kg)"
                    rules={[
                      { required: true, message: "Weight is required" },
                      {
                        pattern: /^[0-9]+(\.[0-9]{1,4})?$/,
                        message: "Weight must be a valid number (e.g., 1.5, 0.005)",
                      },
                    ]}
                  >
                    <Input
                      placeholder="e.g. 1.5 or 0.005"
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="rounded-xl"
                    />
                  </Form.Item>

                  <Form.Item
                    name="dimension"
                    label="Dimension"
                    rules={[{ required: true, message: "Dimension is required" }]}
                  >
                    <Input placeholder="e.g. 10x10x10cm" className="rounded-xl" />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="category_id"
                    label="Category"
                    rules={[{ required: true, message: "Category is required" }]}
                  >
                    <Select
                      placeholder="Select category"
                      options={categoryOptions}
                      notFoundContent="No categories found"
                      className="rounded-xl"
                    />
                  </Form.Item>

                  <Form.Item
                    name="status"
                    label="Status"
                    dependencies={!isEdit ? ["variants"] : []}
                    rules={[
                      { required: true, message: "Status is required" },
                      () => ({
                        validator(_, value) {
                          const variants = getCurrentVariantsForValidation()
                          const error = getStatusStockError(value, getTotalVariantStock(variants))

                          if (!error) {
                            return Promise.resolve()
                          }

                          return Promise.reject(new Error(error))
                        },
                      }),
                    ]}
                  >
                    <Select
                      options={[
                        { label: "Active", value: "active" },
                        { label: "Draft", value: "draft" },
                        { label: "Out of Stock", value: "out_of_stock" },
                      ]}
                      className="rounded-xl"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[{ required: true, message: "Description is required" }]}
                >
                  <Input.TextArea rows={6} placeholder="Describe the product..." className="rounded-xl" />
                </Form.Item>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center">
                    <Grid size={20} className="text-purple-700" />
                  </div>
                  <div>
                    <h2 className="font-sora font-bold text-lg text-gray-900">Product Variants</h2>
                    <p className="text-sm text-gray-400">Create different versions (sizes, colors, etc.) with their own prices and stock levels.</p>
                  </div>
                </div>

                {isEdit ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-4 py-3 text-sm">
                      Manage variants on a dedicated page.
                    </div>
                    <Link to={`/seller/products/${uuid}/variants`}>
                      <Button type="primary" size="large" block className="h-11 rounded-xl">
                        Update Variants
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Form.List
                    name="variants"
                    rules={[
                      {
                        validator: async (_, variants) => {
                          if (!variants || variants.length < 1) {
                            return Promise.reject(new Error('At least one variant is required'))
                          }
                          // Check all variants have name, price, and stock
                          for (const variant of variants) {
                            if (!variant.name || variant.price === null || variant.price === undefined || variant.stock === null || variant.stock === undefined) {
                              return Promise.reject(new Error('All variants must have a name, price, and stock'))
                            }
                          }
                        },
                      },
                    ]}
                  >
                    {(fields, { add, remove, }) => (
                      <div className="space-y-3">
                        {fields.map(({ key, name, ...restField }) => (
                          <div key={key} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="Variant Name"
                              rules={[{ required: true, message: 'Name required' }]}
                              className="w-full mb-0"
                            >
                              <Input placeholder="e.g. Size M, Color Red" className="rounded-xl" />
                            </Form.Item>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <Form.Item
                                {...restField}
                                name={[name, 'price']}
                                label="Price"
                                rules={[{ required: true, message: 'Price required' }]}
                                className="flex-1 mb-0"
                                style={{ width: '100%' }}
                              >
                                <InputNumber
                                  min={0}
                                  step={0.01}
                                  style={{ width: '100%' }}
                                  placeholder="0.00"
                                  prefix="PHP"
                                  className="rounded-xl"
                                />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'stock']}
                                label="Stock"
                                rules={[{ required: true, message: 'Stock required' }]}
                                className="flex-1 mb-0"
                                style={{ width: '100%' }}
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                  placeholder="0"
                                  onChange={() => form.validateFields(["status"]).catch(() => { })}
                                  className="rounded-xl"
                                />
                              </Form.Item>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => {
                                  form.setFieldValue(["variants", name], { name: "", price: null, stock: 0 })
                                }}
                                icon={<RotateCcw size={16} />}
                                className="h-10 rounded-xl"
                              />
                              <Button
                                danger
                                disabled={fields.length === 1}
                                onClick={() => {
                                  if (fields.length === 1) {
                                    message.warning("At least one variant is required and cannot be removed")
                                  } else {
                                    remove(name)
                                  }
                                }}
                                icon={<Trash2 size={16} />}
                                className="h-10 rounded-xl"
                                title={fields.length === 1 ? "Cannot remove the last variant" : ""}
                              />
                            </div>
                          </div>
                        ))}
                        <Button type="dashed" onClick={() => add()} className="h-11 w-full rounded-xl">
                          + Add Variant
                        </Button>
                      </div>
                    )}
                  </Form.List>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                    <Sliders size={20} className="text-blue-700" />
                  </div>
                  <div>
                    <h2 className="font-sora font-bold text-lg text-gray-900">Product Specifications</h2>
                    <p className="text-sm text-gray-400">Add optional details like material, brand, weight,  etc.</p>
                  </div>
                </div>

                <Form.List
                  name="specs"
                  rules={[
                    {
                      validator: async (_, specs) => {
                        if (!isEdit && (!specs || specs.length < 1)) {
                          return Promise.reject(new Error('At least one specification is required'))
                        }
                        // Check all specs have key and value if any are provided
                        if (specs && specs.length > 0) {
                          for (const spec of specs) {
                            if (!spec.key || !spec.value) {
                              return Promise.reject(new Error('All specifications must have a name and value'))
                            }
                          }
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }) => (
                    <div className="space-y-3">
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Form.Item
                              {...restField}
                              name={[name, 'key']}
                              label="Specifications Name"
                              rules={[{ required: true, message: 'Specifications name required' }]}
                              className="flex-1 mb-0"
                            >
                              <Input placeholder="e.g. Color, Size, Material" className="rounded-xl" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'value']}
                              label="Spec Value"
                              rules={[{ required: true, message: 'Spec value required' }]}
                              className="flex-1 mb-0"
                            >
                              <Input placeholder="e.g. Red, Large, Cotton" className="rounded-xl" />
                            </Form.Item>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                form.setFieldValue(["specs", name], { key: "", value: "" })
                              }}
                              icon={<RotateCcw size={16} />}
                              className="h-10 rounded-xl"
                            />
                            <Button
                              danger
                              disabled={fields.length === 1}
                              onClick={() => {
                                if (fields.length === 1) {
                                  message.warning("At least one specification is required and cannot be removed")
                                } else {
                                  remove(name)
                                }
                              }}
                              icon={<Trash2 size={16} />}
                              className="h-10 rounded-xl"
                              title={fields.length === 1 ? "Cannot remove the last specification" : ""}
                            />
                          </div>
                        </div>
                      ))}
                      <Button type="dashed" onClick={() => add()} className="h-11 w-full rounded-xl">
                        + Add Specification
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 ring-1 ring-orange-100 flex items-center justify-center">
                    <ImagePlus size={20} className="text-orange-700" />
                  </div>
                  <div>
                    <h2 className="font-sora font-bold text-lg text-gray-900">Product Images</h2>
                    <p className="text-sm text-gray-400">Upload up to 5 high-quality images to showcase your product.</p>
                  </div>
                </div>

                {isEdit && existingImages.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-3">Current Images</div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {existingImages.map((image) => (
                        <div key={image.id} className="relative rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-50 aspect-square">
                          <img src={getStorageUrl(image.image_path)} alt="Product" className="w-full h-full object-cover" />
                          <div className="absolute! top-2 right-2 flex gap-2">
                            <Button
                              danger
                              size="small"
                              type="primary"
                              icon={<Trash2 size={14} />}
                              onClick={() => handleRemoveExistingImage(image.id)}
                              className="h-8 rounded-lg!"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Form.Item
                  name="images"
                  label={isEdit ? "Add More Images" : "Upload Images"}
                  valuePropName="fileList"
                  getValueFromEvent={(event) => (Array.isArray(event) ? event : event?.fileList)}
                  rules={[
                    {
                      validator: (_, value) => {
                        const totalImages = existingImages.length + (value?.length || 0)
                        if (totalImages < 1) return Promise.reject(new Error("At least one image is required"))
                        if (totalImages > 5) return Promise.reject(new Error("A product can only have up to 5 images"))
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Upload
                    listType="picture-card"
                    fileList={imageList}
                    onRemove={handleRemoveSelectedImage}
                    beforeUpload={handleBeforeUpload}
                    multiple
                    accept="image/*"
                    disabled={!hasUploadSlots || imagesPreparing}
                  >
                    <div className={!hasUploadSlots || imagesPreparing ? "opacity-60" : ""}>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>
                        {imagesPreparing ? "Preparing..." : hasUploadSlots ? "Upload" : "Max 5 images"}
                      </div>
                    </div>
                  </Upload>
                </Form.Item>

                {imagesPreparing && (
                  <div className="-mt-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 ring-1 ring-blue-200">
                    Preparing selected images for upload...
                  </div>
                )}

                {isEdit && (
                  <div className="-mt-2 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-4 py-3 text-sm">
                    New uploads will be added to this product. Remove any current image above if you want it deleted.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 lg:hidden">
                <Button block size="large" onClick={() => navigate("/seller/products")} className="h-11 rounded-xl">
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitLoading} disabled={submitLoading || imagesPreparing} icon={<Save size={16} />} block size="large" className="h-11 rounded-xl">
                  {isEdit ? "Update Product" : "Save Product"}
                </Button>
              </div>
            </div>

            <div className="hidden space-y-5 lg:block">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="text-xs font-semibold text-gray-700">Product</div>
                <div className="text-sm text-gray-500">
                  Products with <span className="font-semibold text-gray-700">Active</span> status are ready to appear in your store.
                </div>
                <div className="text-sm text-gray-500">
                  Use <span className="font-semibold text-gray-700">Draft</span> if you want to save details first and finish later.
                </div>
                <div className="text-sm text-gray-500">
                  Choose <span className="font-semibold text-gray-700">Out of Stock</span> when the product should stay listed but unavailable.
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
                <div className="text-xs font-semibold text-gray-700">Actions</div>
                <Button type="primary" htmlType="submit" loading={submitLoading} disabled={submitLoading || imagesPreparing} icon={<Save size={16} />} block size="large">
                  {isEdit ? "Update Product" : "Save Product"}
                </Button>
                <Button block size="large" onClick={() => navigate("/seller/products")}>
                  Cancel
                </Button>
              </div>
            </div>

          </div>
        )}
      </Form>
    </div>
  )
}
