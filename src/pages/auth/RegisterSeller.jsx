import React, { useState, useEffect } from "react";
import { Form, Input, Button, Upload, Row, Col, Steps, Select, App } from "antd";
import { Link } from "react-router-dom";
import { UploadOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { ShoppingBag, Truck, TrendingUp, ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import AddressSelect from "../../components/AddressSelect";
import { registerSeller, resendVerification, getCategories } from "../../services/authService";
import { sukiCartLogoHome } from "../../utils/logos";
import { cloneFileForUpload } from "../../utils/upload";

const STEPS = [
    { title: "" },
    { title: "" },
    { title: "" },
    { title: "" },
];

const BrandPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 xl:p-20 relative overflow-hidden bg-linear-to-br from-green-950 via-green-900 to-green-700">
        {/* Decorative shapes */}
        <span className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white/5 animate-pulse" />
        <span className="absolute bottom-20 right-16 w-32 h-32 rounded-full bg-white/10" />
        <span className="absolute top-1/3 right-10 w-16 h-16 rounded-full bg-emerald-400/10" />

        <div className="relative z-10 flex flex-col h-full justify-center">
            {/* Logo & Branding */}
            <Link to="/" className="flex items-center gap-3 mb-3 no-underline">
                <img src={sukiCartLogoHome} alt="SukiCart Logo" className="w-12 h-12 rounded-2xl shadow-lg object-contain bg-white p-1" />
                <div>
                    <span className="text-2xl font-bold text-white block leading-tight">SukiCart</span>
                    <span className="text-emerald-300 text-sm font-medium">Your Neighborhood Store</span>
                </div>
            </Link>

            {/* Divider */}
            <div className="w-12 h-1 rounded-full bg-emerald-400/40 my-8" />

            {/* Heading */}
            <h2 className="text-white text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                Grow Your Business
            </h2>
            <p className="text-green-200/80 text-lg max-w-sm leading-relaxed mb-10">
                Reach more customers in your neighborhood
            </p>

            {/* Feature cards */}
            <div className="space-y-3">
                {[
                    { Icon: ShoppingBag, title: "More Visibility", desc: "Reach local customers searching nearby" },
                    { Icon: Truck, title: "Easy Delivery", desc: "Manage orders and deliveries in one place" },
                    { Icon: TrendingUp, title: "Grow Revenue", desc: "Increase sales with our trusted platform" },
                ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <item.Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm mb-0.5">{item.title}</p>
                            <p className="text-green-200/70 text-sm leading-snug">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Customer link */}
            <div className="mt-10 pt-6 border-t border-white/15">
                <p className="text-green-200/70 text-sm mb-3">Looking to shop instead?</p>
                <Link to="/register/customer" className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors no-underline">
                    Register as a Customer
                </Link>
            </div>
        </div>
    </div>
);

export default function RegisterSeller() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState(null);
    const [resending, setResending] = useState(false);
    const [categories, setCategories] = useState([]);
    const [profilePictureList, setProfilePictureList] = useState([]);
    const [storeBannerList, setStoreBannerList] = useState([]);
    const [profilePreparing, setProfilePreparing] = useState(false);
    const [bannerPreparing, setBannerPreparing] = useState(false);

    useEffect(() => {
        getCategories()
            .then((data) => setCategories(data.map((c) => ({ label: c.name, value: c.id }))))
            .catch(() => {});
    }, []);

    const STEP_FIELDS = [
        ["firstName", "lastName", "contactNumber", "profilePicture"],
        ["storeName", "storeCategory", "storeDescription", "storeBanner"],
        ["region", "province", "city", "barangay"],
        ["email", "password", "passwordConfirmation"],
    ];

    const handleNext = async () => {
        try {
            await form.validateFields(STEP_FIELDS[step]);
            setStep(s => s + 1);
        } catch { /* inline validation */ }
    };

    const handleProfilePictureBeforeUpload = async (file) => {
        setProfilePreparing(true);

        try {
            const stableFile = await cloneFileForUpload(file);

            if (!stableFile) {
                setProfilePictureList([]);
                form.setFieldValue("profilePicture", []);
                message.error("Failed to prepare the selected profile picture. Please choose it again.");
                return Upload.LIST_IGNORE;
            }

            const nextList = [{
                uid: file.uid,
                status: "done",
                originFileObj: stableFile,
                name: file.name || stableFile.name || "profile-picture.jpg",
            }];

            setProfilePictureList(nextList);
            form.setFieldValue("profilePicture", nextList);
            form.validateFields(["profilePicture"]).catch(() => { });
        } catch (error) {
            console.error("Failed to prepare seller profile picture:", error);
            setProfilePictureList([]);
            form.setFieldValue("profilePicture", []);
            message.error("Failed to prepare the selected profile picture. Please choose it again.");
        } finally {
            setProfilePreparing(false);
        }

        return Upload.LIST_IGNORE;
    };

    const handleStoreBannerBeforeUpload = async (file) => {
        setBannerPreparing(true);

        try {
            const stableFile = await cloneFileForUpload(file);

            if (!stableFile) {
                setStoreBannerList([]);
                form.setFieldValue("storeBanner", []);
                message.error("Failed to prepare the selected banner. Please choose it again.");
                return Upload.LIST_IGNORE;
            }

            const nextList = [{
                uid: file.uid,
                status: "done",
                originFileObj: stableFile,
                name: file.name || stableFile.name || "store-banner.jpg",
            }];

            setStoreBannerList(nextList);
            form.setFieldValue("storeBanner", nextList);
            form.validateFields(["storeBanner"]).catch(() => { });
        } catch (error) {
            console.error("Failed to prepare seller store banner:", error);
            setStoreBannerList([]);
            form.setFieldValue("storeBanner", []);
            message.error("Failed to prepare the selected banner. Please choose it again.");
        } finally {
            setBannerPreparing(false);
        }

        return Upload.LIST_IGNORE;
    };

    const onFinish = async () => {
        // getFieldsValue(true) returns ALL stored values including unmounted step fields
        const values = form.getFieldsValue(true);
        if (profilePreparing || bannerPreparing) {
            message.warning("Please wait for the selected images to finish preparing.");
            return;
        }
        setLoading(true);
        try {
            await registerSeller(values);
            setRegisteredEmail(values.email);
        } catch (err) {
            if (err.errors) {
                const fields = Object.entries(err.errors).map(([name, msgs]) => ({
                    name,
                    errors: Array.isArray(msgs) ? msgs : [msgs],
                }));
                form.setFields(fields);
            }
            message.error(err.message ?? "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = ["Tell us about yourself", "Tell us about your store", "Where is your store?", "Secure your account"];

    const handleResend = async () => {
        setResending(true);
        try {
            const data = await resendVerification(registeredEmail);
            message.success(data.message);
        } catch (err) {
            message.error(err.message ?? "Could not resend email.");
        } finally {
            setResending(false);
        }
    };

    if (registeredEmail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-950 via-green-900 to-green-700 p-6">
                <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
                    <div className="w-18 h-18 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="font-bold text-2xl text-green-900 mb-2">Store Account Created!</h2>
                    <p className="text-gray-500 mb-2">We sent a verification link to</p>
                    <p className="text-green-700 font-semibold mb-6">{registeredEmail}</p>
                    <p className="text-gray-400 text-sm mb-6">Please check your inbox and click the link to verify your email. The link expires in 5 minutes.</p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer border-none mb-6"
                    >
                        {resending ? <Loader2 className="animate-spin w-4 h-4" /> : <Mail className="w-4 h-4" />}
                        {resending ? "Sending…" : "Resend verification email"}
                    </button>
                    <div className="pt-4 border-t border-gray-200">
                        <Link to="/login" className="text-gray-400 text-sm hover:text-gray-600">← Back to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <BrandPanel />
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center no-underline">
                        <img src={sukiCartLogoHome} alt="SukiCart Logo" className="w-9 h-9 rounded-xl object-contain" />
                        <span className="text-xl font-bold text-green-900">SukiCart</span>
                    </Link>

                    {/* Steps */}
                    <div className="mb-6">
                        <Steps current={step} items={STEPS.map(s => ({ title: s.title }))} size="small" responsive={false} />
                    </div>

                    <div className="mb-6">
                        <h2 className="font-bold text-2xl text-green-900 mb-1">{stepTitles[step]}</h2>
                        <p className="text-gray-500 text-sm">Step {step + 1} of 4 — Create your seller account</p>
                    </div>

                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-7">
                        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} autoComplete="off">
                            {/* Step 0: Personal Info */}
                            <div style={{ display: step === 0 ? undefined : 'none' }}>
                                    <Row gutter={16} className="mb-4">
                                        <Col xs={24} sm={12}>
                                            <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: "Required" }]} className="mb-0">
                                                <Input size="large" placeholder="Maria" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: "Required" }]} className="mb-0">
                                                <Input size="large" placeholder="Santos" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item label="Contact Number" name="contactNumber" rules={[{ required: true, message: "Required" }, { pattern: /^09\d{9}$/, message: "Enter a valid PH number" }]} className="mb-4">
                                        <Input size="large" placeholder="09123456789" />
                                    </Form.Item>
                                    <Form.Item label="Profile Picture" name="profilePicture" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true, message: "Please upload a photo" }]}>
                                        <Upload
                                            maxCount={1}
                                            beforeUpload={handleProfilePictureBeforeUpload}
                                            accept="image/*"
                                            listType="picture-card"
                                            fileList={profilePictureList}
                                            onRemove={() => {
                                                setProfilePictureList([]);
                                                form.setFieldValue("profilePicture", []);
                                            }}
                                            onPreview={(file) => { const src = file.url || file.thumbUrl || (file.originFileObj && URL.createObjectURL(file.originFileObj)); if (src) { const w = window.open(); w.document.write(`<img src="${src}" style="max-width:100%" />`); } }}
                                            disabled={profilePreparing}
                                        >
                                            <div className="flex flex-col items-center">
                                                <UploadOutlined className="text-xl text-green-600" />
                                                <div className="mt-1 text-xs text-gray-500">{profilePreparing ? "Preparing..." : "Upload Photo"}</div>
                                            </div>
                                        </Upload>
                                    </Form.Item>
                                    <Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleNext} icon={<ArrowRightOutlined />} iconPlacement="end" disabled={profilePreparing}>
                                        Continue to Store Info
                                    </Button>
                            </div>

                            {/* Step 1: Store Info */}
                            <div style={{ display: step === 1 ? undefined : 'none' }}>
                                    <Form.Item label="Store Name" name="storeName" rules={[{ required: true, message: "Required" }]} className="mb-4">
                                        <Input size="large" placeholder="e.g., Maria's Sari-Sari Store" />
                                    </Form.Item>
                                    <Form.Item label="Store Category" name="storeCategory" rules={[{ required: true, message: "Please select a category" }]} className="mb-4">
                                        <Select size="large" placeholder="Select category" options={categories} className="w-full" />
                                    </Form.Item>
                                    <Form.Item label="Store Description" name="storeDescription" rules={[{ required: true, message: "Required" }, { max: 500, message: "Max 500 characters" }]} className="mb-4">
                                        <Input.TextArea size="large" placeholder="Tell customers about your store..." rows={3} />
                                    </Form.Item>
                                    <Form.Item label="Store Banner" name="storeBanner" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true, message: "Please upload a banner" }]} className="mb-6">
                                        <Upload
                                            maxCount={1}
                                            beforeUpload={handleStoreBannerBeforeUpload}
                                            accept="image/*"
                                            listType="picture-card"
                                            fileList={storeBannerList}
                                            onRemove={() => {
                                                setStoreBannerList([]);
                                                form.setFieldValue("storeBanner", []);
                                            }}
                                            onPreview={(file) => { const src = file.url || file.thumbUrl || (file.originFileObj && URL.createObjectURL(file.originFileObj)); if (src) { const w = window.open(); w.document.write(`<img src="${src}" style="max-width:100%" />`); } }}
                                            disabled={bannerPreparing}
                                        >
                                            <div className="flex flex-col items-center">
                                                <UploadOutlined className="text-xl text-green-600" />
                                                <div className="mt-1 text-xs text-gray-500">{bannerPreparing ? "Preparing..." : "Upload Banner"}</div>
                                            </div>
                                        </Upload>
                                    </Form.Item>
                                    <Row gutter={16}>
                                        <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={() => setStep(0)} icon={<ArrowLeft size={16} />}>Back</Button></Col>
                                        <Col xs={12}><Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleNext} icon={<ArrowRightOutlined />} iconPlacement="end" disabled={bannerPreparing}>Continue</Button></Col>
                                    </Row>
                            </div>

                            {/* Step 2: Address */}
                            <div style={{ display: step === 2 ? undefined : 'none' }}>
                                    <AddressSelect form={form} />
                                    <Row gutter={16} className="mt-6">
                                        <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />}>Back</Button></Col>
                                        <Col xs={12}><Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleNext} icon={<ArrowRightOutlined />} iconPlacement="end">Continue</Button></Col>
                                    </Row>
                            </div>

                            {/* Step 3: Credentials */}
                            <div style={{ display: step === 3 ? undefined : 'none' }}>
                                    <Form.Item label="Email" name="email" rules={[{ required: true, message: "Required" }, { type: "email", message: "Enter a valid email" }]} className="mb-4">
                                        <Input size="large" placeholder="store@example.com" />
                                    </Form.Item>
                                    <Form.Item label="Password" name="password" rules={[{ required: true, message: "Required" }, { min: 6, message: "At least 6 characters" }]} className="mb-4">
                                        <Input.Password size="large" placeholder="Create a strong password" />
                                    </Form.Item>
                                    <Form.Item label="Confirm Password" name="passwordConfirmation" rules={[
                                        { required: true, message: "Required" },
                                        ({ getFieldValue }) => ({ validator(_, v) { return !v || getFieldValue("password") === v ? Promise.resolve() : Promise.reject("Passwords do not match"); } }),
                                    ]} className="mb-6">
                                        <Input.Password size="large" placeholder="Confirm your password" />
                                    </Form.Item>
                                    <Row gutter={16}>
                                        <Col xs={12}><Button size="large" block className="h-12 rounded-xl font-semibold" onClick={() => setStep(2)} icon={<ArrowLeft size={16} />}>Back</Button></Col>
                                        <Col xs={12}><Button type="primary" htmlType="submit" size="large" block className="h-12 rounded-xl font-semibold" loading={loading} disabled={profilePreparing || bannerPreparing}>{loading ? "Creating…" : "Create Store"}</Button></Col>
                                    </Row>
                            </div>
                        </Form>
                    </div>

                    {/* Links */}
                    <div className="mt-6 pt-5 border-t border-gray-200">
                        <div className="lg:hidden mb-3 text-center">
                            <Link to="/register/customer" className="text-green-600 text-sm font-semibold hover:underline">Register as Customer instead →</Link>
                        </div>
                        <p className="text-center text-gray-500 text-sm">Already have an account? <Link to="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
