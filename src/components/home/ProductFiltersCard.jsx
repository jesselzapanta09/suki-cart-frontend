import React from "react";
import { Radio, InputNumber, Button, Divider } from "antd";

export default function ProductFiltersCard({
    sortBy,
    minPrice,
    maxPrice,
    onSortChange,
    onMinPriceChange,
    onMaxPriceChange,
    onClear,
    mobile = false,
}) {
    const wrapperClass = mobile
        ? "mb-6 rounded-lg border border-gray-200 bg-white p-4 md:hidden"
        : "hidden w-72 shrink-0 md:block";

    const cardClass = mobile
        ? "space-y-4"
        : "rounded-lg border border-gray-200 bg-white p-6 shadow-sm";

    const headingClass = mobile
        ? "mb-2 block text-xs font-bold text-gray-700"
        : "mb-4 text-sm font-bold uppercase text-gray-900";

    const labelClass = mobile
        ? "mb-2 block text-xs font-bold text-gray-700"
        : "mb-2 block text-xs font-semibold text-gray-700";

    const sortOptions = [
        { value: "popular", label: mobile ? "Popular" : "Most Popular" },
        { value: "created_at", label: mobile ? "Newest" : "Newest" },
        { value: "price_asc", label: mobile ? "Low to High" : "Price: Low to High" },
        { value: "price_desc", label: mobile ? "High to Low" : "Price: High to Low" },
    ];

    return (
        <div className={wrapperClass}>
            <div className={cardClass}>
                <div className={mobile ? "" : "mb-6"}>
                    <h3 className={headingClass}>Sort By</h3>
                    <Radio.Group
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        style={{
                            display: "grid",
                            gridTemplateColumns: mobile ? "repeat(2, minmax(0, 1fr))" : "1fr",
                            gap: mobile ? "8px" : "12px",
                        }}
                    >
                        {sortOptions.map((option) => (
                            <Radio key={option.value} value={option.value}>
                                {option.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </div>

                <Divider style={{ margin: mobile ? "8px 0" : "24px 0" }} />

                <div className={mobile ? "" : "mb-6"}>
                    <h3 className={mobile ? headingClass : "mb-4 text-sm font-bold uppercase text-gray-900"}>
                        Price Range
                    </h3>
                    <div className={mobile ? "grid grid-cols-2 gap-3" : "space-y-4"}>
                        <div>
                            <label className={labelClass}>Minimum Price</label>
                            <InputNumber
                                placeholder="P 0"
                                value={minPrice ? Number(minPrice) : null}
                                onChange={(value) => onMinPriceChange(value ? String(value) : "")}
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) => `P ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/P\s?|,/g, "")}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Maximum Price</label>
                            <InputNumber
                                placeholder="P Any"
                                value={maxPrice ? Number(maxPrice) : null}
                                onChange={(value) => onMaxPriceChange(value ? String(value) : "")}
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) => `P ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/P\s?|,/g, "")}
                            />
                        </div>
                    </div>

                    {(minPrice || maxPrice || sortBy !== "created_at") && (
                        <Button onClick={onClear} style={{ width: "100%", marginTop: "16px" }}>
                            {mobile ? "Clear Filters" : "Clear All Filters"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
