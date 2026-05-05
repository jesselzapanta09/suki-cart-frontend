import React, { useEffect } from "react"
import { Form, Input, Modal, Rate } from "antd"

export default function ReviewProductModal({ open, item, submitting, onCancel, onSubmit }) {
    const [form] = Form.useForm()

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                rating: 5,
                review: "",
            })
        }
    }, [form, open, item?.id])

    const handleOk = async () => {
        const values = await form.validateFields()
        onSubmit?.(values)
    }

    return (
        <Modal
            title="Rate Product"
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Submit Review"
            okButtonProps={{ loading: submitting }}
            destroyOnHidden
            forceRender
        >
            <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">{item?.product?.name || "Product"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                        Variant: {item?.variant?.name || item?.review?.variant_name || "Default"}
                    </p>
                </div>

                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item
                        name="rating"
                        label="Rating"
                        rules={[{ required: true, message: "Please select a rating" }]}
                    >
                        <Rate count={5} allowClear={false} />
                    </Form.Item>

                    <Form.Item
                        name="review"
                        label="Short Review"
                        rules={[
                            { required: true, message: "Please enter a short review" },
                            { max: 500, message: "Review must be 500 characters or less" },
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            maxLength={500}
                            placeholder="Share a short review about this product."
                        />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    )
}
