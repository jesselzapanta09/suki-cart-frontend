import React, { useCallback, useEffect, useRef, useState } from "react";
import { Table, Button, Input, Tag, Tooltip, App, Grid } from "antd";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Package, Store } from "lucide-react";
import { getCategories as getPublicCategories } from "../../../services/authService";
import * as adminProductService from "../../../services/adminProductService";
import { getStorageUrl } from "../../../utils/storage";

function getTotalStock(variants = []) {
    return variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0);
}

export default function ActiveProductIndex() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState({ field: "created_at", order: "descend" });
    const [categoryFilter, setCategoryFilter] = useState(null);

    const searchTimer = useRef(null);

    const fetchProducts = useCallback(async (page, pageSize, sortField, sortOrder, searchValue, categoryId) => {
        setLoading(true);
        try {
            const data = await adminProductService.getAdminProducts({
                page,
                per_page: pageSize,
                search: searchValue || undefined,
                sort_field: sortField || undefined,
                sort_order: sortOrder || undefined,
                category_id: categoryId ?? undefined,
            });

            setProducts(data.data || []);
            setTotal(data.total || 0);
            setPagination((prev) => ({
                ...prev,
                current: data.current_page || 1,
                pageSize: data.per_page || 10,
            }));
        } catch (err) {
            message.error(err.message || "Failed to load active products");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        getPublicCategories()
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        fetchProducts(pagination.current, pagination.pageSize, sorter.field, sorter.order, search, categoryFilter);
        return () => clearTimeout(searchTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTableChange = (nextPagination, filters, sort) => {
        const nextSorter = sort.order ? { field: sort.field, order: sort.order } : sorter;
        const nextCategory = filters.category_id?.[0] ?? null;
        const filtersOrSortChanged =
            nextSorter.field !== sorter.field ||
            nextSorter.order !== sorter.order ||
            nextCategory !== categoryFilter;
        const page = filtersOrSortChanged ? 1 : nextPagination.current;

        setSorter(nextSorter);
        setCategoryFilter(nextCategory);
        setPagination((prev) => ({ ...prev, current: page, pageSize: nextPagination.pageSize }));

        fetchProducts(
            page,
            nextPagination.pageSize,
            nextSorter.field,
            nextSorter.order,
            search,
            nextCategory,
        );
    };

    const handleSearch = (value) => {
        setSearch(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPagination((prev) => ({ ...prev, current: 1 }));
            fetchProducts(1, pagination.pageSize, sorter.field, sorter.order, value, categoryFilter);
        }, 400);
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 72,
            sorter: true,
            render: (id) => <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">#{id}</span>,
        },
        {
            title: "Product",
            key: "product",
            sorter: true,
            dataIndex: "name",
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-50 ring-1 ring-green-100 overflow-hidden flex items-center justify-center">
                        {record.images?.[0]?.image_path ? (
                            <img src={getStorageUrl(record.images[0].image_path)} alt={record.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={20} className="text-green-700" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-green-950 text-sm">{record.name}</div>
                        <div className="text-gray-400 text-xs">{record.variants?.length || 0} variant{record.variants?.length !== 1 ? "s" : ""}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Store",
            key: "store",
            render: (_, record) => (
                <div>
                    <div className="font-medium text-gray-800 text-sm">{record.store?.store_name || "No store"}</div>
                    <div className="text-gray-400 text-xs">
                        {record.store?.user
                            ? `${record.store.user.firstname || ""} ${record.store.user.lastname || ""}`.trim() || record.store.user.email
                            : "No owner"}
                    </div>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: ["category", "name"],
            key: "category_id",
            width: 160,
            filters: categories.map((category) => ({ text: category.name, value: category.id })),
            filterMultiple: false,
            filteredValue: categoryFilter !== null && categoryFilter !== undefined ? [categoryFilter] : null,
            render: (_, record) => (record.category?.name ? <Tag color="blue">{record.category.name}</Tag> : <Tag>None</Tag>),
        },
        {
            title: "Stock",
            dataIndex: "variants",
            key: "stock",
            width: 120,
            render: (variants) => <span className="font-mono text-sm font-semibold">{getTotalStock(variants)}</span>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: () => <Tag color="green">Active</Tag>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 90,
            render: (_, record) => (
                <Tooltip title="View Details">
                    <Button
                        size="small"
                        type="default"
                        onClick={() => navigate(`/admin/products/${record.uuid}`)}
                        icon={<Eye size={14} />}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
       <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-emerald-600 to-green-500 flex items-center justify-center shadow-sm">
                        <Store size={22} className="text-white" />
                    </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Active Products</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">Read-only view of products currently marked as active</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                        <span className="font-sora font-semibold text-sm text-green-900">All Active Products</span>
                        <span className="text-gray-400 text-xs bg-gray-100 rounded-full px-2 py-0.5">{total}</span>
                    </div>
                    <div className="w-full">
                        <Input
                            placeholder="Search product, description, store..."
                            prefix={<Search size={14} className="text-gray-400" />}
                            value={search}
                            onChange={(event) => handleSearch(event.target.value)}
                            allowClear
                            size="large"
                            className="w-full rounded-xl"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={products}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total,
                            showSizeChanger: false,
                            showTotal: (count) => <span className="text-gray-400 text-sm">{count} products total</span>,
                        }}
                        onChange={handleTableChange}
                        size={isMobile ? "middle" : "large"}
                        scroll={{ x: 900 }}
                        className={isMobile ? "[&_.ant-table-pagination]:px-4" : undefined}
                        locale={{
                            emptyText: loading ? null : (
                                <div className="py-8">
                                    <div className="font-semibold text-gray-700 mb-1">No active products found</div>
                                    <div className="text-sm text-gray-400">Try adjusting the search term or category filter.</div>
                                </div>
                            ),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
