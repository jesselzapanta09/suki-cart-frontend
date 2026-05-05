import React, { useEffect, useState } from "react"
import { Modal, Form, Input, Select, Button, Upload, Steps, Row, Col, App, Grid } from "antd"
import { User2, UserPlus, ArrowLeft } from "lucide-react"
import { ArrowRightOutlined, UploadOutlined } from "@ant-design/icons"
import Avatar from "../../../components/Avatar"
import AddressSelect from "../../../components/AddressSelect"
import { getStorageUrl } from "../../../utils/storage"

const STORE_CATEGORIES = [
    { label: "Convenience Store / Sari-Sari", value: "convenience" },
    { label: "Grocery", value: "grocery" },
    { label: "Bakery / Panaderya", value: "bakery" },
    { label: "Butcher / Palengke", value: "butcher" },
    { label: "Pharmacy / Botika", value: "pharmacy" },
    { label: "Restaurant / Carinderia", value: "restaurant" },
    { label: "Clothing & Apparel", value: "clothing" },
    { label: "Electronics & Gadgets", value: "electronics" },
    { label: "Hardware", value: "hardware" },
    { label: "Beauty & Wellness", value: "beauty" },
    { label: "Fruits & Vegetables", value: "produce" },
    { label: "Other", value: "other" },
]

export default function UserModal({ open, onClose, onSubmit, initialValues, loading, mode }) {
    const { message } = App.useApp()
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.sm
    const [form] = Form.useForm()
    const [step, setStep] = useState(0)
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [removeAvatar, setRemoveAvatar] = useState(false)
    const [previewUser, setPreviewUser] = useState(null)
    const [addressInitial, setAddressInitial] = useState(null)

    const labelClass = "text-sm font-medium text-gray-700"
    const inputClass = "w-full rounded-xl border border-gray-300"

    const currentFirstname = Form.useWatch("firstname", form)
    const selectedRole = Form.useWatch("role", form)
    const isSeller = selectedRole === "seller"

    const getSteps = (seller) => seller
        ? [{ title: "About" }, { title: "Store" }, { title: "Address" }, { title: "Credentials" }]
        : [{ title: "About" }, { title: "Address" }, { title: "Credentials" }]

    const stepTitles = isSeller
        ? ["Tell us about the user", "Store information", "Address", "Secure the account"]
        : ["Tell us about the user", "Address", "Secure the account"]

    const [prevOpen, setPrevOpen] = useState(false)
    if (open && !prevOpen) {
        setPrevOpen(true)
        setStep(0)
        setAvatarFile(null)
        setRemoveAvatar(false)
        setAddressInitial(null)
        if (initialValues) {
            setAvatarPreview(initialValues.profile_picture ? getStorageUrl(initialValues.profile_picture) : null)
            setPreviewUser(initialValues)
            const loc = initialValues.locations?.[0]
            if (loc) {
                setAddressInitial({
                    region: loc.region,
                    province: loc.province,
                    city: loc.city_municipality,
                    barangay: loc.barangay,
                })
            }
        } else {
            setAvatarPreview(null)
            setPreviewUser(null)
        }
    } else if (!open && prevOpen) {
        setPrevOpen(false)
    }

    useEffect(() => {
        if (open) {
            if (initialValues) {
                const loc = initialValues.locations?.[0]
                form.setFieldsValue({
                    firstname: initialValues.firstname,
                    lastname: initialValues.lastname,
                    email: initialValues.email,
                    role: initialValues.role,
                    contact_number: initialValues.contact_number ?? "",
                    password: "",
                    store_name: initialValues.store?.store_name ?? "",
                    store_category: initialValues.store?.category?.name ?? "",
                    store_description: initialValues.store?.description ?? "",
                    region: loc?.region ?? undefined,
                    province: loc?.province ?? undefined,
                    city: loc?.city_municipality ?? undefined,
                    barangay: loc?.barangay ?? undefined,
                    store_banner: initialValues.store?.banner
                        ? [{ uid: "-1", name: "banner", status: "done", url: getStorageUrl(initialValues.store.banner) }]
                        : [],
                })
            } else {
                form.resetFields()
            }
        }
    }, [open, initialValues, form])

    const handleAvatarChange = (file) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) { message.error("Only JPG, PNG, WebP allowed."); return false }
        if (file.size > 5 * 1024 * 1024) { message.error("Max 5MB."); return false }
        const reader = new FileReader()
        reader.onload = (e) => setAvatarPreview(e.target.result)
        reader.readAsDataURL(file)
        setAvatarFile(file)
        setRemoveAvatar(false)
        return false
    }

    const getStepFields = (s) => {
        if (s === 0) return ["firstname", "lastname", "role", "contact_number"]
        if (isSeller) {
            if (s === 1) return ["store_name", "store_category", "store_description"]
            if (s === 2) return ["region", "province", "city", "barangay"]
            if (s === 3) return ["email", "password"]
        } else {
            if (s === 1) return ["region", "province", "city", "barangay"]
            if (s === 2) return ["email", "password"]
        }
        return []
    }

    const handleNext = async () => {
        try {
            await form.validateFields(getStepFields(step))
            setStep(step + 1)
        } catch { /* validation errors shown */ }
    }

    const handleOk = async () => {
        try {
            const values = await form.validateFields()
            if (mode === "edit" && !values.password) delete values.password
            if (avatarFile) values.profile_picture = avatarFile
            if (removeAvatar) values.remove_picture = "true"
            const bannerList = form.getFieldValue("store_banner")
            if (bannerList?.[0]?.originFileObj) {
                values.store_banner = bannerList[0].originFileObj
            } else {
                delete values.store_banner
            }
            onSubmit(values)
        } catch { /* validation errors shown */ }
    }

    const aboutStep = 0
    const storeStep = isSeller ? 1 : -1
    const addressStep = isSeller ? 2 : 1
    const credentialStep = isSeller ? 3 : 2
    const steps = getSteps(isSeller)

    const actionButtons = (backAction, primaryAction, primaryLabel, primaryIcon, primaryLoading = false) => (
        <Row gutter={[12, 12]} className="mt-6 border-t border-gray-100 pt-4">
            <Col xs={12} sm={12}>
                <Button
                    size="large"
                    block
                    className="h-12 rounded-xl font-semibold"
                    onClick={backAction}
                    icon={typeof backAction === "function" && backAction !== onClose ? <ArrowLeft size={16} /> : undefined}
                >
                    {backAction === onClose ? "Cancel" : "Back"}
                </Button>
            </Col>
            <Col xs={12} sm={12}>
                <Button
                    type="primary"
                    size="large"
                    block
                    className="h-12 rounded-xl font-semibold"
                    onClick={primaryAction}
                    icon={primaryIcon}
                    loading={primaryLoading}
                >
                    {primaryLabel}
                </Button>
            </Col>
        </Row>
    )

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={isMobile ? "calc(100vw - 0.75rem)" : 540}
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
                            <User2 className="h-4 w-4 text-green-700" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-sora text-base font-bold leading-tight text-gray-900">
                                {mode === "add" ? "Add New User" : "Edit User"}
                            </h3>
                            <p className="text-[11px] text-gray-500">{stepTitles[step]}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-18 sm:mt-19">
                <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50/80 px-3 py-3 sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                    {isMobile ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                                <span>Step {step + 1} of {steps.length}</span>
                                <span>{steps[step].title}</span>
                            </div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                                {steps.map((item, index) => (
                                    <div
                                        key={item.title}
                                        className={`h-2 rounded-full ${index <= step ? "bg-green-600" : "bg-gray-200"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Steps current={step} items={steps.map(s => ({ title: s.title }))} size="small" />
                    )}
                </div>

                <Form
                    layout="vertical"
                    form={form}
                    requiredMark={false}
                    size="large"
                    className="[&_.ant-form-item]:mb-4 [&_.ant-form-item-label>label]:text-sm [&_.ant-input]:min-h-12 [&_.ant-input-affix-wrapper]:min-h-12 [&_.ant-input-password]:min-h-12 [&_.ant-select-selector]:min-h-12 [&_.ant-select-selector]:items-center [&_.ant-upload-list-item-container]:w-full! [&_.ant-upload-wrapper]:w-full"
                >
                    <div style={{ display: step === aboutStep ? undefined : "none" }}>
                        <Form.Item label={<span className={labelClass}>Profile Photo <span className="font-normal text-gray-400">(optional)</span></span>}>
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        {avatarPreview && !removeAvatar ? (
                                            <img src={avatarPreview} alt="preview" className="h-14 w-14 rounded-full border border-green-100 object-cover" />
                                        ) : (
                                            <Avatar user={{ firstname: currentFirstname || previewUser?.firstname }} size={56} fontSize="1.15rem" />
                                        )}
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Upload a profile photo</div>
                                            <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP / max 5MB</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:items-end">
                                        <Upload beforeUpload={handleAvatarChange} showUploadList={false} accept=".jpg,.jpeg,.png,.webp">
                                            <Button size="large" className="h-11 rounded-xl border border-gray-300 px-4 text-sm font-medium">
                                                {avatarPreview && !removeAvatar ? "Change photo" : "Upload photo"}
                                            </Button>
                                        </Upload>
                                        {avatarPreview && !removeAvatar && (
                                            <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); setRemoveAvatar(mode === "edit") }} className="text-left text-xs font-medium text-red-500 hover:underline sm:text-right">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Form.Item>

                        <Form.Item name="role" label={<span className={labelClass}>Role</span>} rules={[{ required: true, message: "Role is required" }]}>
                            <Select
                                placeholder="Select role"
                                className="rounded-xl"
                                options={[
                                    { label: "Admin", value: "admin" },
                                    { label: "Seller", value: "seller" },
                                    { label: "Customer", value: "customer" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item name="firstname" label={<span className={labelClass}>First Name</span>} rules={[{ required: true, message: "First name is required" }]}>
                            <Input placeholder="e.g. Juan" className={inputClass} />
                        </Form.Item>

                        <Form.Item name="lastname" label={<span className={labelClass}>Last Name</span>} rules={[{ required: true, message: "Last name is required" }]}>
                            <Input placeholder="e.g. Dela Cruz" className={inputClass} />
                        </Form.Item>

                        <Form.Item name="contact_number" label={<span className={labelClass}>Contact Number <span className="font-normal text-gray-400">(optional)</span></span>}>
                            <Input placeholder="e.g. 09171234567" className={inputClass} />
                        </Form.Item>

                        {actionButtons(onClose, handleNext, "Continue", <ArrowRightOutlined />)}
                    </div>

                    <div style={{ display: step === storeStep ? undefined : "none" }}>
                        <Form.Item name="store_name" label={<span className={labelClass}>Store Name</span>} rules={[{ required: isSeller, message: "Store name is required" }]}>
                            <Input placeholder="e.g., Maria's Sari-Sari Store" className={inputClass} />
                        </Form.Item>

                        <Form.Item name="store_category" label={<span className={labelClass}>Store Category</span>} rules={[{ required: isSeller, message: "Please select a category" }]}>
                            <Select placeholder="Select category" options={STORE_CATEGORIES} className="w-full" />
                        </Form.Item>

                        <Form.Item name="store_description" label={<span className={labelClass}>Store Description</span>} rules={[{ required: isSeller, message: "Description is required" }, { max: 500, message: "Max 500 characters" }]}>
                            <Input.TextArea placeholder="Tell customers about this store..." rows={isMobile ? 5 : 4} className={inputClass} />
                        </Form.Item>

                        <Form.Item name="store_banner" label={<span className={labelClass}>Store Banner <span className="font-normal text-gray-400">(optional)</span></span>} valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
                            <Upload maxCount={1} beforeUpload={() => false} accept="image/*" listType="picture-card" onPreview={(file) => { const src = file.url || file.thumbUrl || (file.originFileObj && URL.createObjectURL(file.originFileObj)); if (src) { const w = window.open(); w.document.write(`<img src="${src}" style="max-width:100%" />`); } }} className="[&_.ant-upload-select]:h-32! [&_.ant-upload-select]:w-full! sm:[&_.ant-upload-select]:w-28!">
                                <div className="flex flex-col items-center">
                                    <UploadOutlined className="text-xl text-green-600" />
                                    <div className="mt-1 text-xs text-gray-500">Upload Banner</div>
                                </div>
                            </Upload>
                        </Form.Item>

                        {actionButtons(() => setStep(0), handleNext, "Continue", <ArrowRightOutlined />)}
                    </div>

                    <div style={{ display: step === addressStep ? undefined : "none" }}>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                            <AddressSelect form={form} initialValues={addressInitial} key={initialValues?.id || "new"} />
                        </div>
                        {actionButtons(() => setStep(step - 1), handleNext, "Continue", <ArrowRightOutlined />)}
                    </div>

                    <div style={{ display: step === credentialStep ? undefined : "none" }}>
                        <Form.Item name="email" label={<span className={labelClass}>Email address</span>} rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
                            <Input placeholder="user@example.com" className={inputClass} />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className={labelClass}>Password{mode === "edit" && <span className="font-normal text-gray-400"> (blank = keep current)</span>}</span>}
                            rules={mode === "add" ? [{ required: true, message: "Password is required" }, { min: 6, message: "At least 6 characters" }] : [{ min: 6, message: "At least 6 characters if changing" }]}
                        >
                            <Input.Password placeholder="........" className={inputClass} />
                        </Form.Item>

                        {actionButtons(
                            () => setStep(step - 1),
                            handleOk,
                            loading ? "Saving..." : mode === "add" ? "Create User" : "Save Changes",
                            <UserPlus size={16} />,
                            loading
                        )}
                    </div>
                </Form>
            </div>
        </Modal>
    )
}
