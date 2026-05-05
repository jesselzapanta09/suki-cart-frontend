import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
    const location = useLocation();
    const navigationType = useNavigationType();

    useLayoutEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.slice(1));

            if (element) {
                element.scrollIntoView({ block: "start" });
                return;
            }
        }

        // Preserve browser-like back/forward behavior, but reset scroll for new navigations.
        if (navigationType !== "POP") {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
    }, [location.pathname, location.search, location.hash, navigationType]);

    return null;
}
