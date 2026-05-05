import React, { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "antd"
import { verifyEmail } from "../../services/authService"
import { useAuth } from "../../context/auth-context"

export default function VerifyEmail() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")
    const [status, setStatus] = useState(token ? "loading" : "error")
    const [msg, setMsg] = useState(token ? "" : "No verification token found in the link.")
    const calledRef = useRef(false)
    const navigate = useNavigate()
    const { loginUser } = useAuth()

    useEffect(() => {
        if (calledRef.current) return
        calledRef.current = true

        if (!token) return

        verifyEmail(token)
            .then(data => {
                loginUser(data.user, data.token)
                navigate("/dashboard", { replace: true })
            })
            .catch(err => {
                setStatus("error")
                setMsg(err.message ?? "Verification failed. The link may have expired.")
            })
    }, [token, loginUser, navigate])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-950 via-green-900 to-green-700 p-6">
                <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
                    <div className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100">
                        <Loader2 className="animate-spin w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="font-display font-bold text-2xl text-green-900 mb-2">Verifying your email…</h2>
                    <p className="text-gray-500">Please wait a moment.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-950 via-green-900 to-green-700 p-6">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
                <div className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-100">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="font-display font-bold text-2xl text-green-900 mb-2">Verification Failed</h2>
                <p className="text-gray-500 mb-8">{msg}</p>
                <Button type="primary" size="large" onClick={() => navigate("/login")}>Back to Login</Button>
                <p className="text-gray-400 text-sm mt-3">Need a new link? Log in and request a resend.</p>
            </div>
        </div>
    )
}
