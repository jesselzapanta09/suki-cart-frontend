import React, { useState } from "react";
import { Form, Input, App } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { useCart } from "../../context/CartContext";
import { Loader2, ShoppingBag, Store, Mail, Package, Truck, Tags } from "lucide-react";
import { login as loginApi, resendVerification } from "../../services/authService";
import { syncWebPushSubscription } from "../../services/notificationService";
import { processPendingAddToCart } from "../../services/cartService";
import { isMobilePushRuntime, syncMobilePushSubscription } from "../../services/pushMobile";
import { sukiCartLogoHome } from "../../utils/logos";

export default function Login() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState(null);
    const { loginUser } = useAuth();
    const { addItem } = useCart();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const data = await loginApi(values.email, values.password);
            loginUser(data.user, data.token);

            try {
                if (isMobilePushRuntime()) {
                    await syncMobilePushSubscription();
                } else {
                    await syncWebPushSubscription();
                }
            } catch (pushErr) {
                console.warn("Push subscription failed:", pushErr);
            }
            message.success(`Welcome back, ${data.user.firstname}!`);
            
            // Check for pending add-to-cart data
            try {
                const pendingData = await processPendingAddToCart();
                if (pendingData) {
                    // Add the product to cart
                    addItem(pendingData.product, pendingData.quantity);
                    message.success(`${pendingData.productName} added to your cart!`);
                    
                    // Redirect to cart page
                    navigate("/customer/cart");
                } else {
                    // No pending cart item, go to dashboard
                    navigate("/dashboard");
                }
            } catch (err) {
                console.error("Error processing pending add-to-cart:", err);
                message.warning("Redirecting to dashboard...");
                navigate("/dashboard");
            }
        } catch (err) {
            if (err.status === 401) {
                message.error("Invalid email or password.");
            } else if (err.status === 403 && err.data?.email_unverified) {
                setUnverifiedEmail(values.email);
            } else {
                message.error(err.message ?? "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const data = await resendVerification(unverifiedEmail);
            message.success(data.message);
        } catch (err) {
            message.error(err.message ?? "Could not resend email.");
        } finally {
            setResending(false);
        }
    };

    // const demoAccounts = [
    //     { label: "Admin", email: "admin@sukicart.com", color: "bg-purple-100 text-purple-700" },
    //     { label: "Customer", email: "juan@example.com", color: "bg-green-100 text-green-700" },
    //     { label: "Seller", email: "miguel@example.com", color: "bg-blue-100 text-blue-700" },
    // ];

    const features = [
        {
            icon: <Package className="w-5 h-5 text-emerald-400" />,
            title: "Your Orders",
            desc: "Track and manage all your purchases",
        },
        {
            icon: <Truck className="w-5 h-5 text-emerald-400" />,
            title: "Fast Delivery",
            desc: "Get your orders delivered quickly",
        },
        {
            icon: <Tags className="w-5 h-5 text-emerald-400" />,
            title: "Exclusive Deals",
            desc: "Access member-only discounts",
        },
    ];

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left panel */}
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

                    {/* Welcome heading */}
                    <h2 className="text-white text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                        Welcome Back
                    </h2>
                    <p className="text-green-200/80 text-lg max-w-sm leading-relaxed mb-10">
                        Log in to access your account and continue shopping
                    </p>

                    {/* Feature cards */}
                    <div className="space-y-3">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                    {f.icon}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm mb-0.5">{f.title}</p>
                                    <p className="text-green-200/70 text-sm leading-snug">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center no-underline">
                        <img src={sukiCartLogoHome} alt="SukiCart Logo" className="w-9 h-9 rounded-xl object-contain" />
                        <span className="text-xl font-bold text-green-900">SukiCart</span>
                    </Link>

                    <div className="mb-8">
                        <h2 className="font-bold text-2xl text-green-900 mb-1">Sign in</h2>
                        <p className="text-gray-500 text-sm">Enter your credentials to continue.</p>
                    </div>

                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-7">
                        {unverifiedEmail && (
                            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <p className="text-amber-800 text-sm font-medium mb-1">Email not verified</p>
                                <p className="text-amber-700 text-xs mb-3">Please check your inbox for a verification link before signing in.</p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer border-none"
                                >
                                    {resending ? <Loader2 className="animate-spin w-3 h-3" /> : <Mail className="w-3 h-3" />}
                                    {resending ? "Sending…" : "Resend verification email"}
                                </button>
                            </div>
                        )}
                        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                            <Form.Item name="email" label={<span className="font-medium text-gray-700 text-sm">Email address</span>} rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
                                <Input placeholder="you@example.com" className="rounded-xl" />
                            </Form.Item>
                            <Form.Item name="password" label={<span className="font-medium text-gray-700 text-sm">Password</span>} rules={[{ required: true, message: "Password is required" }]}>
                                <Input.Password placeholder="••••••••" className="rounded-xl" />
                            </Form.Item>
                            <div className="text-right -mt-2 mb-5">
                                <Link to="/forgot-password" className="text-green-600 text-xs font-medium hover:underline">Forgot password?</Link>
                            </div>
                            <Form.Item className="mb-0">
                                <button type="submit" disabled={loading} className="h-12 w-full cursor-pointer rounded-xl bg-linear-to-br from-green-700 to-green-500 text-white font-semibold shadow hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all border-none">
                                    {loading && <Loader2 className="animate-spin w-4 h-4" />}
                                    {loading ? "Signing in…" : "Sign in to Dashboard"}
                                </button>
                            </Form.Item>
                        </Form>
                    </div>

                    {/* Demo accounts */}
                    {/* <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-gray-500 font-semibold mb-3">Demo accounts <span className="text-gray-400 font-normal">(tap to fill · password: password)</span></p>
                        <div className="space-y-2">
                            {demoAccounts.map(acc => (
                                <button key={acc.label} onClick={() => form.setFieldsValue({ email: acc.email, password: "password" })}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-left bg-transparent">
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${acc.color}`}>{acc.label}</span>
                                    <span className="text-gray-600 text-xs font-mono">{acc.email}</span>
                                </button>
                            ))}
                        </div>
                    </div> */}

                    <div className="mt-6 pt-5 border-t border-gray-200">
                        <p className="text-center text-gray-500 text-sm mb-3">Don't have an account?</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/register/customer" className="flex flex-col items-center gap-2 px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-300 transition-all no-underline group">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <ShoppingBag size={20} className="text-green-600" />
                                </div>
                                <span className="text-gray-800 font-semibold text-sm">As Customer</span>
                                <span className="text-gray-400 text-xs">Browse & shop</span>
                            </Link>
                            <Link to="/register/seller" className="flex flex-col items-center gap-2 px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-300 transition-all no-underline group">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <Store size={20} className="text-green-600" />
                                </div>
                                <span className="text-gray-800 font-semibold text-sm">As Seller</span>
                                <span className="text-gray-400 text-xs">Start selling</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
