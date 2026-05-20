import React, { useEffect, useMemo } from "react";
import { App, Button } from "antd";
import { Smartphone, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    buildAppDeepLink,
    buildWebAuthRoute,
    shouldAttemptAppOpen,
} from "../../services/deepLinks";
import { isCordovaNavigationRuntime } from "../../services/inAppNavigation";

const ACTION_COPY = {
    verifyEmail: {
        title: "Opening SukiCart...",
        description: "We are sending you to the app so you can finish verifying your email there.",
        browserLabel: "Continue in Browser",
        errorMessage: "This link is missing its verification token.",
    },
    resetPassword: {
        title: "Opening SukiCart...",
        description: "We are sending you to the app so you can finish resetting your password there.",
        browserLabel: "Reset In Browser",
        errorMessage: "This link is missing its reset token.",
    },
};

export default function AppOpenGate({ action }) {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const copy = ACTION_COPY[action] ?? ACTION_COPY.verifyEmail;
    const browserRoute = useMemo(
        () => buildWebAuthRoute(action, token ? { token } : {}),
        [action, token],
    );
    const appDeepLink = useMemo(
        () => buildAppDeepLink(action, token ? { token } : {}),
        [action, token],
    );

    useEffect(() => {
        if (!token) {
            return;
        }

        if (isCordovaNavigationRuntime()) {
            navigate(browserRoute, { replace: true });
            return;
        }

        if (!shouldAttemptAppOpen()) {
            navigate(browserRoute, { replace: true });
            return;
        }

        const timeoutId = window.setTimeout(() => {
            if (document.visibilityState === "visible") {
                navigate(browserRoute, { replace: true });
            }
        }, 1400);

        window.location.assign(appDeepLink);

        return () => window.clearTimeout(timeoutId);
    }, [appDeepLink, browserRoute, navigate, token]);

    const openApp = () => {
        if (!token) {
            message.error(copy.errorMessage);
            return;
        }

        window.location.assign(appDeepLink);
    };

    const continueInBrowser = () => {
        navigate(browserRoute, { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-950 via-green-900 to-green-700 p-6">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-8 h-8" />
                </div>

                <h2 className="font-display font-bold text-2xl text-green-900 mb-3">{copy.title}</h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                    {token ? copy.description : copy.errorMessage}
                </p>

                <div className="space-y-3">
                    {token ? (
                        <Button type="primary" size="large" block onClick={openApp} icon={<ExternalLink className="w-4 h-4" />}>
                            Open SukiCart App
                        </Button>
                    ) : null}
                    <Button size="large" block onClick={continueInBrowser} icon={<ArrowRight className="w-4 h-4" />}>
                        {copy.browserLabel}
                    </Button>
                </div>

                <p className="text-gray-400 text-sm mt-4">
                    If the app does not open automatically, use one of the buttons above.
                </p>
            </div>
        </div>
    );
}
