import React, { useEffect } from "react"
import { Modal, Form, Input, Select, Button, Grid } from "antd"
import { LayoutGrid } from "lucide-react"

export default function CategoryModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.sm
    const [form] = Form.useForm()

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name ?? "",
                    description: initialValues.description ?? "",
                    status: initialValues.status ?? 1,
                })
            } else {
                form.resetFields()
                form.setFieldsValue({ status: 1 })
            }
        }
    }, [open, initialValues, form])

    const handleFinish = (values) => {
        onSubmit(values)
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            forceRender
            width={isMobile ? "calc(100vw - 0.75rem)" : 480}
            centered
            className="overflow-hidden rounded-2xl"
            styles={{
                body: {
                    padding: isMobile ? "14px" : "24px",
                    paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 20px)" : "24px",
                    maxHeight: "calc(100vh - 1rem)",
                    overflowY: "auto",
                },
            }}
        >
            <div className="absolute top-0 left-0 z-10 w-full overflow-hidden rounded-t-xl">
                <div className="flex border-b border-gray-200 bg-linear-to-r from-green-50/80 to-white">
                    <div className="w-1.5 rounded-tl-xl bg-linear-to-b from-green-600 to-emerald-400" />
                    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 ring-1 ring-green-200">
                            <LayoutGrid className="h-4 w-4 text-green-700" />
                        </div>
                        <div>
                            <h3 className="font-sora text-base font-bold leading-tight text-gray-900">{mode === "add" ? "Add Category" : "Edit Category"}</h3>
                            <p className="text-[11px] text-gray-400">{mode === "add" ? "Fill in the details below" : "Modify category info"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-18 sm:pt-20">
                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handleFinish}
                    size="large"
                    className="space-y-1 [&_.ant-form-item]:mb-4 [&_.ant-form-item-label>label]:text-sm [&_.ant-input]:min-h-12 [&_.ant-input-affix-wrapper]:min-h-12 [&_.ant-select-selector]:min-h-12 [&_.ant-select-selector]:items-center"
                >
                    <Form.Item
                        name="name"
                        label={<span className="font-medium text-gray-700">Category Name</span>}
                        rules={[{ required: true, message: "Please enter category name" }]}
                    >
                        <Input placeholder="e.g. Convenience Store" className="rounded-xl" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={<span className="font-medium text-gray-700">Description</span>}
                    >
                        <Input.TextArea rows={isMobile ? 4 : 3} placeholder="Optional description" className="rounded-xl" />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label={<span className="font-medium text-gray-700">Status</span>}
                        rules={[{ required: true, message: "Please select status" }]}
                    >
                        <Select
                            options={[
                                { label: "Active", value: 1 },
                                { label: "Inactive", value: 0 },
                            ]}
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <div className="flex gap-3 pt-2">
                        <Button size="large" onClick={onClose} className="h-11 min-w-0 flex-1 rounded-xl font-semibold">Cancel</Button>
                        <Button size="large" type="primary" htmlType="submit" loading={loading} className="h-11 min-w-0 flex-1 rounded-xl font-semibold">
                            {mode === "add" ? "Create" : "Update"}
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    )
}
