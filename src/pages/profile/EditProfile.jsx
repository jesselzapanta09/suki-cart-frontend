import React, { useState, useEffect, useCallback } from "react"
import { Form, Input, Button, App, Tabs, Upload, Spin, Select } from "antd"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/auth-context"
import Avatar from "../../components/Avatar"
import AddressSelect from "../../components/AddressSelect"
import { Upload as UploadIcon } from "lucide-react"
import * as profileService from "../../services/profileService"
import { getHomeCategories } from "../../services/categoryService"
import { getStorageUrl } from "../../utils/storage"

export default function EditProfile() {
    const { message } = App.useApp()
    const { user, updateUser, isSeller } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)

    const [infoLoading, setInfoLoading] = useState(false)
    const [addressLoading, setAddressLoading] = useState(false)
    const [storeLoading, setStoreLoading] = useState(false)
    const [passLoading, setPassLoading] = useState(false)

    const [infoForm] = Form.useForm()
    const [addressForm] = Form.useForm()
    const [storeForm] = Form.useForm()
    const [passForm] = Form.useForm()

    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [removeAvatar, setRemoveAvatar] = useState(false)

    const [bannerFile, setBannerFile] = useState(null)
    const [bannerPreview, setBannerPreview] = useState(null)
    const [removeBanner, setRemoveBanner] = useState(false)

    const [categories, setCategories] = useState([])

    useEffect(() => {
        getHomeCategories()
            .then(data => setCategories(data.map(c => ({ label: c.name, value: c.name }))))
            .catch(() => {})
    }, [])

    const populateForms = useCallback((u) => {
        infoForm.setFieldsValue({
            firstname: u.firstname,
            lastname: u.lastname,
            contact_number: u.contact_number,
        })

        if (u.store) {
            storeForm.setFieldsValue({
                store_name: u.store.store_name,
                store_category: u.store.category?.name ?? "",
                store_description: u.store.description,
            })
        }
    }, [infoForm, storeForm])

    const syncUser = (updated) => {
        setProfile(updated)
        updateUser({
            firstname: updated.firstname,
            lastname: updated.lastname,
            contact_number: updated.contact_number,
            profile_picture: updated.profile_picture,
        })
    }

    // Fetch profile on mount
    useEffect(() => {
        profileService.getProfile()
            .then(data => {
                setProfile(data.user)
            })
            .catch(() => message.error("Failed to load profile."))
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!loading && profile) {
            populateForms(profile)
        }
    }, [loading, profile, populateForms])

    // --- Avatar handlers ---
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

    const handleRemoveAvatar = () => {
        setAvatarFile(null)
        setAvatarPreview(null)
        setRemoveAvatar(true)
    }

    // --- Banner handlers ---
    const handleBannerChange = (file) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) { message.error("Only JPG, PNG, WebP allowed."); return false }
        if (file.size > 5 * 1024 * 1024) { message.error("Max 5MB."); return false }
        const reader = new FileReader()
        reader.onload = (e) => setBannerPreview(e.target.result)
        reader.readAsDataURL(file)
        setBannerFile(file)
        setRemoveBanner(false)
        return false
    }

    const handleRemoveBanner = () => {
        setBannerFile(null)
        setBannerPreview(null)
        setRemoveBanner(true)
    }

    // --- Save handlers ---
    const handleInfoSave = async (values) => {
        setInfoLoading(true)
        try {
            const payload = { ...values }
            if (avatarFile) payload.profile_picture = avatarFile
            if (removeAvatar) payload.remove_picture = true
            const data = await profileService.updateInfo(payload)
            syncUser(data.user)
            setAvatarFile(null)
            setRemoveAvatar(false)
            message.success(data.message)
        } catch (err) {
            message.error(err.message)
        } finally {
            setInfoLoading(false)
        }
    }

    const handleAddressSave = async (values) => {
        setAddressLoading(true)
        try {
            const data = await profileService.updateAddress(values)
            setProfile(data.user)
            message.success(data.message)
        } catch (err) {
            message.error(err.message)
        } finally {
            setAddressLoading(false)
        }
    }

    const handleStoreSave = async (values) => {
        setStoreLoading(true)
        try {
            const payload = { ...values }
            if (bannerFile) payload.store_banner = bannerFile
            if (removeBanner) payload.remove_banner = true
            const data = await profileService.updateStore(payload)
            setProfile(data.user)
            message.success(data.message)
        } catch (err) {
            message.error(err.message)
        } finally {
            setStoreLoading(false)
        }
    }

    const handlePasswordSave = async (values) => {
        setPassLoading(true)
        try {
            const data = await profileService.changePassword({
                current_password: values.currentPassword,
                password: values.newPassword,
                password_confirmation: values.confirmPassword,
            })
            message.success(data.message)
            passForm.resetFields()
        } catch (err) {
            message.error(err.message)
        } finally {
            setPassLoading(false)
        }
    }

    const dashPath = user?.role === "admin" ? "/admin/dashboard" : user?.role === "seller" ? "/seller/dashboard" : "/customer/dashboard"
    const labelClass = "font-medium text-gray-700"
    const inputClass = "rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none w-full"
    const btnPrimary = "h-12 rounded-xl font-semibold text-white bg-gradient-to-tr from-green-800 to-green-600 shadow-md hover:from-green-700 hover:to-green-500"
    const btnSecondary = "h-12 rounded-xl font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Spin size="large" /></div>
    }

    const currentPicture = avatarPreview && !removeAvatar
        ? avatarPreview
        : (!removeAvatar && profile?.profile_picture)
            ? getStorageUrl(profile.profile_picture)
            : null

    const currentBanner = bannerPreview && !removeBanner
        ? bannerPreview
        : (!removeBanner && profile?.store?.banner)
            ? getStorageUrl(profile.store.banner)
            : null

    const tabs = [
        {
            key: "info",
            label: <span className="font-medium">Personal Info</span>,
            forceRender: true,
            children: (
                <Form form={infoForm} layout="vertical" onFinish={handleInfoSave} requiredMark={false} size="large" className="space-y-4">
                    <Form.Item label={<span className={labelClass}>Profile Photo</span>}>
                        <div className="flex items-center gap-3">
                            <Upload beforeUpload={handleAvatarChange} showUploadList={false} accept=".jpg,.jpeg,.png,.webp">
                                <Button icon={<UploadIcon size={16} />} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                                    Change Photo
                                </Button>
                            </Upload>
                            {currentPicture && (
                                <>
                                    <img src={currentPicture} alt="preview" className="w-12 h-12 rounded-full object-cover border border-green-100" />
                                    <button type="button" onClick={handleRemoveAvatar} className="text-red-600 text-sm hover:underline">Remove</button>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · max 5MB</p>
                    </Form.Item>
                    <Form.Item name="firstname" label={<span className={labelClass}>First Name</span>} rules={[{ required: true, message: "First name is required" }]}>
                        <Input placeholder="e.g. Juan" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="lastname" label={<span className={labelClass}>Last Name</span>} rules={[{ required: true, message: "Last name is required" }]}>
                        <Input placeholder="e.g. Dela Cruz" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="contact_number" label={<span className={labelClass}>Contact Number</span>} rules={[{ required: true, message: "Contact number is required" }]}>
                        <Input placeholder="e.g. 09171234567" className={inputClass} />
                    </Form.Item>
                    <div className="flex gap-3">
                        <Button onClick={() => navigate(dashPath)} className={btnSecondary} block>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={infoLoading} className={btnPrimary} block>
                            {infoLoading ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                </Form>
            ),
        },
        {
            key: "address",
            label: <span className="font-medium">Address</span>,
            forceRender: true,
            children: (
                <Form form={addressForm} layout="vertical" onFinish={handleAddressSave} requiredMark={false} size="large" className="space-y-4">
                    <AddressSelect form={addressForm} initialValues={profile?.locations?.[0] ? {
                        region: profile.locations[0].region,
                        province: profile.locations[0].province,
                        city: profile.locations[0].city_municipality,
                        barangay: profile.locations[0].barangay,
                    } : undefined} />
                    <div className="flex gap-3 mt-4">
                        <Button onClick={() => navigate(dashPath)} className={btnSecondary} block>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={addressLoading} className={btnPrimary} block>
                            {addressLoading ? "Saving…" : "Save Address"}
                        </Button>
                    </div>
                </Form>
            ),
        },
        ...(isSeller ? [{
            key: "store",
            label: <span className="font-medium">Store</span>,
            forceRender: true,
            children: (
                <Form form={storeForm} layout="vertical" onFinish={handleStoreSave} requiredMark={false} size="large" className="space-y-4">
                    <Form.Item label={<span className={labelClass}>Store Banner</span>}>
                        <div className="flex items-center gap-3">
                            <Upload beforeUpload={handleBannerChange} showUploadList={false} accept=".jpg,.jpeg,.png,.webp">
                                <Button icon={<UploadIcon size={16} />} className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                                    Change Banner
                                </Button>
                            </Upload>
                            {currentBanner && (
                                <>
                                    <img src={currentBanner} alt="banner" className="h-12 rounded-lg object-cover border border-green-100" />
                                    <button type="button" onClick={handleRemoveBanner} className="text-red-600 text-sm hover:underline">Remove</button>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · max 5MB</p>
                    </Form.Item>
                    <Form.Item name="store_name" label={<span className={labelClass}>Store Name</span>} rules={[{ required: true, message: "Store name is required" }]}>
                        <Input placeholder="e.g. Juan's Sari-Sari Store" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="store_category" label={<span className={labelClass}>Category</span>} rules={[{ required: true, message: "Category is required" }]}>
                        <Select
                            placeholder="Select a category"
                            options={categories}
                            showSearch
                            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                        />
                    </Form.Item>
                    <Form.Item name="store_description" label={<span className={labelClass}>Description</span>}>
                        <Input.TextArea rows={3} placeholder="Describe your store…" className={inputClass} />
                    </Form.Item>
                    <div className="flex gap-3">
                        <Button onClick={() => navigate(dashPath)} className={btnSecondary} block>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={storeLoading} className={btnPrimary} block>
                            {storeLoading ? "Saving…" : "Save Store"}
                        </Button>
                    </div>
                </Form>
            ),
        }] : []),
        {
            key: "password",
            label: <span className="font-medium">Credentials</span>,
            forceRender: true,
            children: (
                <Form form={passForm} layout="vertical" onFinish={handlePasswordSave} requiredMark={false} size="large" className="space-y-4">
                    <Form.Item name="currentPassword" label={<span className={labelClass}>Current password</span>} rules={[{ required: true, message: "Current password is required" }]}>
                        <Input.Password placeholder="••••••••" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="newPassword" label={<span className={labelClass}>New password</span>} rules={[{ required: true, message: "New password is required" }, { min: 6, message: "At least 6 characters" }]}>
                        <Input.Password placeholder="••••••••" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label={<span className={labelClass}>Confirm new password</span>} dependencies={["newPassword"]} rules={[{ required: true, message: "Please confirm your password" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("newPassword") === value) return Promise.resolve(); return Promise.reject(new Error("Passwords do not match")) } })]}>
                        <Input.Password placeholder="••••••••" className={inputClass} />
                    </Form.Item>
                    <div className="flex gap-3 mt-2">
                        <Button onClick={() => passForm.resetFields()} className={btnSecondary} block>Clear</Button>
                        <Button type="primary" htmlType="submit" loading={passLoading} className={btnPrimary} block>
                            {passLoading ? "Updating…" : "Update Password"}
                        </Button>
                    </div>
                </Form>
            ),
        },
    ]

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-green-900 mb-1">Edit Profile</h1>
                <p className="text-gray-500">Manage your account information and security.</p>
            </div>

            {/* Avatar Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow mb-6">
                {currentPicture ? (
                    <img src={currentPicture} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-green-100 shrink-0" />
                ) : (
                    <Avatar user={profile} size={64} fontSize="1.4rem" />
                )}
                <div>
                    <div className="font-bold text-lg text-green-900">{profile?.firstname} {profile?.lastname}</div>
                    <div className="text-gray-500 text-sm mt-0.5">{profile?.email}</div>
                    <div className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-mono font-semibold ${user?.role === "admin" ? "bg-green-100 text-green-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {user?.role?.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow overflow-hidden">
                <Tabs defaultActiveKey="info" className="p-6" items={tabs} />
            </div>
        </div>
    )
}
