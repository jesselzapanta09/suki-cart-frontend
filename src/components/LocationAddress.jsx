import React, { useEffect, useState } from "react"
import addressService from "../services/addressService"

/**
 * Displays location information and resolves PSGC codes into readable names.
 * Props:
 *   location - { region, province, city_municipality, barangay }
 *   className - optional extra class for the wrapper
 *   inline - renders a single comma-separated line when true
 */
export default function LocationAddress({ location, className = "", inline = false }) {
    const locationKey = [
        location?.barangay || "",
        location?.city_municipality || "",
        location?.province || "",
        location?.region || "",
    ].join("|")
    const [resolvedState, setResolvedState] = useState(() => ({
        key: locationKey,
        value: location,
    }))

    useEffect(() => {
        let active = true

        const resolveLocation = async () => {
            if (!location) {
                if (active) {
                    setResolvedState({
                        key: locationKey,
                        value: null,
                    })
                }
                return
            }

            const resolved = await addressService.resolveLocationParts(location)
            if (active) {
                setResolvedState({
                    key: locationKey,
                    value: resolved || location,
                })
            }
        }

        resolveLocation()

        return () => {
            active = false
        }
    }, [location, locationKey])

    const resolvedLocation = resolvedState.key === locationKey ? resolvedState.value : location

    if (!resolvedLocation) return null

    const parts = [
        resolvedLocation.barangay && { label: "Barangay", value: resolvedLocation.barangay },
        resolvedLocation.city_municipality && { label: "City / Municipality", value: resolvedLocation.city_municipality },
        resolvedLocation.province && { label: "Province", value: resolvedLocation.province },
        resolvedLocation.region && { label: "Region", value: resolvedLocation.region },
    ].filter(Boolean)

    if (parts.length === 0) return null

    if (inline) {
        return (
            <span className={className}>
                {addressService.formatLocation(resolvedLocation)}
            </span>
        )
    }

    return (
        <div className={className}>
            {parts.map((part) => (
                <div key={part.label} className="flex items-baseline gap-1.5">
                    <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide w-28 shrink-0">{part.label}</span>
                    <span className="text-gray-700 text-xs">{part.value}</span>
                </div>
            ))}
        </div>
    )
}
