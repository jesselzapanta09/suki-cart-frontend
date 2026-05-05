import React, { useEffect } from "react"
import { Modal, Form, Input, InputNumber, Button, Grid } from "antd"
import { Package } from "lucide-react"

export default function ProductVariantModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const [form] = Form.useForm()
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.md
    const [submitLocked, setSubmitLocked] = React.useState(false)

    const labelClass = "font-medium text-gray-700"
    const inputClass = "rounded-xl border border-gray-300 w-full"

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name ?? "",
                    price: initialValues.price ?? 0,
                    stock: initialValues.stock ?? 0,
                })
            } else {
                form.resetFields()
                form.setFieldsValue({
                    price: 0,
                    stock: 0,
                })
            }
        }
    }, [open, initialValues, form])

    const handleFinish = (values) => {
        setSubmitLocked(true)
        onSubmit(values)
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={isMobile ? "100%" : 480}
            centered={!isMobile}
            styles={isMobile ? {
                content: {
                    margin: 0,
                    padding: 0,
                    borderRadius: 24,
                    overflow: "hidden",
                },
                body: {
                    padding: 0,
                },
            } : undefined}
        >
            <div className="absolute top-0 left-0 w-full rounded-t-xl z-10 overflow-hidden">
                <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                    <div className="w-1.5 bg-linear-to-b from-green-600 to-emerald-400 rounded-tl-xl" />
                    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 ring-1 ring-green-200">
                            <Package className="w-4 h-4 text-green-700" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-sora text-base font-bold leading-tight text-gray-900 sm:text-lg">
                                {mode === "add" ? "Add Variant" : "Edit Variant"}
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-gray-500">{mode === "add" ? "Fill in the details below" : "Modify variant info"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 px-4 pb-4 pt-6 sm:px-6 sm:pb-6">
                <Form layout="vertical" form={form} requiredMark={false} size="large" onFinish={handleFinish} className="space-y-1">
                    <Form.Item
                        name="name"
                        label={<span className={labelClass}>Variant Name</span>}
                        rules={[{ required: true, message: "Please enter variant name" }]}
                    >
                        <Input placeholder="e.g., Red, Large, Small" className={`${inputClass} min-h-12`} />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label={<span className={labelClass}>Price</span>}
                        rules={[{ required: true, message: "Please enter price" }]}
                    >
                        <InputNumber
                            placeholder="0.00"
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: "100%" }}
                            className="min-h-12 rounded-xl"
                            prefix="PHP "
                        />
                    </Form.Item>

                    <Form.Item
                        name="stock"
                        label={<span className={labelClass}>Stock</span>}
                        rules={[{ required: true, message: "Please enter stock" }]}
                    >
                        <InputNumber
                            placeholder="0"
                            min={0}
                            style={{ width: "100%" }}
                            className="min-h-12 rounded-xl"
                        />
                    </Form.Item>

                    <div className="flex flex-nowrap gap-3 pt-2 sm:justify-end">
                        <Button size="large" onClick={onClose} disabled={loading || submitLocked} className="h-12 min-w-0 flex-1 rounded-2xl sm:h-11 sm:flex-none sm:rounded-xl">Cancel</Button>
                        <Button size="large" type="primary" htmlType="submit" loading={loading || submitLocked} disabled={loading || submitLocked} className="h-12 min-w-0 flex-1 rounded-2xl sm:h-11 sm:flex-none sm:rounded-xl">
                            {mode === "add" ? "Create" : "Update"}
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}
