import React, { useState } from "react"
import { Form, Input, App } from "antd"
import { Lock, CheckCircle, Loader2 } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "../../services/authService"

export default function ResetPassword() {
    const { message } = App.useApp()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [form] = Form.useForm()

    const onFinish = async ({ password, confirmPassword }) => {
        const token = searchParams.get("token")
        if (!token) {
            message.error("Reset token is missing from the URL.")
            return
        }
        setLoading(true)
        try {
            const data = await resetPassword(token, password, confirmPassword)
            setSuccess(true)
            message.success(data.message)
            setTimeout(() => navigate("/login"), 2500)
        } catch (err) {
            message.error(err.message ?? "Reset failed. The link may have expired.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-950 via-green-900 to-green-700 p-6">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl">
                {!success ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-7 h-7" />
                        </div>
                        <h2 className="font-display font-bold text-2xl text-green-900 text-center mb-2">Set New Password</h2>
                        <p className="text-gray-500 text-center mb-6 leading-relaxed">Create a strong new password for your account.</p>
                        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                            <Form.Item name="password" label={<span className="font-medium text-gray-700">New password</span>} rules={[{ required: true, message: "Password is required" }, { min: 6, message: "At least 6 characters" }]}>
                                <Input.Password placeholder="••••••••" className="rounded-lg border-gray-300" />
                            </Form.Item>
                            <Form.Item name="confirmPassword" label={<span className="font-medium text-gray-700">Confirm new password</span>} dependencies={["password"]} rules={[{ required: true, message: "Please confirm your password" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) return Promise.resolve(); return Promise.reject(new Error("Passwords do not match")) } })]}>
                                <Input.Password placeholder="••••••••" className="rounded-lg border-gray-300" />
                            </Form.Item>
                            <Form.Item className="mt-2 mb-0">
                                <button type="submit" disabled={loading} className="h-12 w-full cursor-pointer rounded-lg bg-linear-to-br from-green-700 to-green-500 text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading && <Loader2 className="animate-spin w-5 h-5" />}
                                    {loading ? "Resetting…" : "Reset Password"}
                                </button>
                            </Form.Item>
                        </Form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                        <h3 className="font-display font-bold text-xl text-green-900 mb-2">Password Reset!</h3>
                        <p className="text-gray-500 leading-relaxed">Redirecting you to sign in…</p>
                    </div>
                )}
                {!success && (
                    <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                        <Link to="/login" className="text-gray-400 text-sm hover:text-gray-600">← Back to Sign In</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
