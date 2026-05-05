import React from "react"
import { getStorageUrl } from "../utils/storage"

/**
 * Avatar — shows username initial (image support ready for API reintegration)
 * Props: user, size (px), fontSize
 */
export default function Avatar({ user, size = 40, fontSize = "1rem", style = {} }) {
    const imagePath = user?.profile_picture || user?.profilePicture || user?.avatar || user?.avatar_url || null
    const src = imagePath ? getStorageUrl(imagePath) : null

    // Tailwind classes for avatar
    const baseClass = `rounded-full border-1 border-green-500 flex-shrink-0 object-cover`;
    const fallbackClass = `bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white font-bold font-sans`;
    const dynamicStyle = { width: size, height: size, fontSize, ...style };

    if (src) {
        return (
            <img
                src={src}
                alt={user?.firstname || "User"}
                className={baseClass}
                style={dynamicStyle}
                loading="lazy"
                decoding="async"
            />
        );
    }

    return (
        <div
            className={baseClass + ' ' + fallbackClass}
            style={dynamicStyle}
        >
            {(user?.firstname?.[0] || user?.username?.[0] || "?").toUpperCase()}
        </div>
    );
}
