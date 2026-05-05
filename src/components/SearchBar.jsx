import React from "react";
import { Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export default function SearchBar({
    search,
    handleSearch,
    handleSearchSubmit,
    searching = false,
    children = null,
    navMode = false,
}) {
    if (navMode) {
        return (
            <div className="relative w-full">
                <Input
                    placeholder="Search products, categories..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    suffix={searching ? <Spin size="small" /> : null}
                    value={search}
                    onChange={handleSearch}
                    onKeyDown={handleSearchSubmit}
                    allowClear
                    size="large"
                    className="rounded-2xl"
                    style={{
                        fontSize: "15px",
                        borderColor: "#e5e7eb",
                        minHeight: "48px",
                    }}
                />
                {children}
            </div>
        );
    }

    return (
        <div className="py-4 px-4 bg-white border-b border-gray-200">
            <div className="max-w-2xl mx-auto relative">
                <Input
                    placeholder="Search products, categories..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    suffix={searching ? <Spin size="small" /> : null}
                    value={search}
                    onChange={handleSearch}
                    onKeyDown={handleSearchSubmit}
                    allowClear
                    size="large"
                    className="rounded-2xl"
                    style={{
                        fontSize: "15px",
                        minHeight: "48px",
                    }}
                />
                {children}
            </div>
        </div>
    );
}
