import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { App, Button, Pagination, Spin } from "antd";
import { Package, Search, ShoppingBasket, Store } from "lucide-react";
import { useAuth } from "../../context/auth-context";
import { useCart } from "../../context/CartContext";
import ProductCard from "../../components/home/ProductCard";
import ProductFiltersCard from "../../components/home/ProductFiltersCard";
import { getHomeCategories } from "../../services/categoryService";
import { searchPublicProducts } from "../../services/productService";
import { getPublicStore } from "../../services/storeService";
import { getStorageUrl } from "../../utils/storage";

export default function ProductListingPage() {
    const { categoryId, storeId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { isCustomer } = useAuth();
    const { addItem } = useCart();
    const customerActionMessage = "To perform this action, log in as a customer.";

    const isCategoryMode = Boolean(categoryId);
    const isStoreMode = Boolean(storeId);
    const numericCategoryId = useMemo(() => Number(categoryId), [categoryId]);
    const numericStoreId = useMemo(() => Number(storeId), [storeId]);
    const query = searchParams.get("q") || "";
    const sortParam = searchParams.get("sort") || "";
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const isPopularMode = !isCategoryMode && !isStoreMode && sortParam === "popular";
    const isLatestMode = !isCategoryMode && !isStoreMode && sortParam === "latest";

    const [categories, setCategories] = useState(isCategoryMode ? null : []);
    const [store, setStore] = useState(isStoreMode ? null : null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState(isPopularMode ? "popular" : "created_at");
    const [pagination, setPagination] = useState({
        current: initialPage,
        pageSize: 12,
        total: 0,
    });
    const { current: currentPage, pageSize } = pagination;

    useEffect(() => {
        setSortBy(isPopularMode ? "popular" : "created_at");
        setPagination((prev) => ({
            ...prev,
            current: initialPage,
        }));
    }, [initialPage, query, categoryId, storeId, isPopularMode, isLatestMode]);

    useEffect(() => {
        if (!isCategoryMode) {
            setCategories([]);
            return;
        }

        let active = true;
        setCategories(null);

        getHomeCategories()
            .then((data) => {
                if (active) {
                    setCategories(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setCategories([]);
                }
            });

        return () => {
            active = false;
        };
    }, [isCategoryMode]);

    useEffect(() => {
        if (!isStoreMode) {
            setStore(null);
            return;
        }

        if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
            navigate("/", { replace: true });
            return;
        }

        let active = true;
        setStore(null);

        getPublicStore(numericStoreId)
            .then((data) => {
                if (active) {
                    setStore(data.store || null);
                }
            })
            .catch((error) => {
                if (!active) {
                    return;
                }

                console.error("Error fetching store:", error);
                message.error("Failed to load store");
                navigate("/", { replace: true });
            });

        return () => {
            active = false;
        };
    }, [isStoreMode, numericStoreId, navigate, message]);

    useEffect(() => {
        if (isCategoryMode) {
            if (!Number.isInteger(numericCategoryId) || numericCategoryId <= 0) {
                navigate("/", { replace: true });
                return;
            }
        } else if (isStoreMode) {
            if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
                navigate("/", { replace: true });
                return;
            }
        } else if (!query.trim() && !isPopularMode && !isLatestMode) {
            navigate("/", { replace: true });
            return;
        }

        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await searchPublicProducts({
                    ...(isCategoryMode
                        ? { category_id: numericCategoryId }
                        : isStoreMode
                            ? { store_id: numericStoreId }
                            : isPopularMode || isLatestMode
                                ? {}
                                : { search: query }),
                    page: currentPage,
                    per_page: pageSize,
                    ...(minPrice && { min_price: minPrice }),
                    ...(maxPrice && { max_price: maxPrice }),
                    sort_field: sortBy === "price_asc" || sortBy === "price_desc"
                        ? "price"
                        : sortBy === "popular"
                            ? "sold"
                            : "created_at",
                    sort_order: sortBy === "price_asc" ? "ascend" : "desc",
                });

                setResults(response.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: response.total || 0,
                }));
            } catch (error) {
                console.error("Error fetching product listings:", error);
                message.error(
                    isCategoryMode
                        ? "Failed to load category products"
                        : isStoreMode
                            ? "Failed to load store products"
                            : "Failed to load search results"
                );
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [
        isCategoryMode,
        isStoreMode,
        numericCategoryId,
        numericStoreId,
        query,
        isPopularMode,
        isLatestMode,
        currentPage,
        pageSize,
        minPrice,
        maxPrice,
        sortBy,
        navigate,
        message,
    ]);

    const category = Array.isArray(categories)
        ? categories.find((item) => item.id === numericCategoryId)
        : null;

    const pageTitle = isCategoryMode
        ? category?.name || "Category"
        : isStoreMode
            ? store?.store_name || "Store"
            : isPopularMode
                ? "All Products"
                : isLatestMode
                    ? "Latest Products"
                : "Search Results";
    const pageSubtitle = isCategoryMode
        ? `Found ${pagination.total} product${pagination.total !== 1 ? "s" : ""} in this category`
        : isStoreMode
            ? `Found ${pagination.total} product${pagination.total !== 1 ? "s" : ""} in this store`
            : isPopularMode
                ? `Found ${pagination.total} product${pagination.total !== 1 ? "s" : ""} sorted by popularity`
                : isLatestMode
                    ? `Found ${pagination.total} product${pagination.total !== 1 ? "s" : ""} sorted by latest arrivals`
            : `Found ${pagination.total} product${pagination.total !== 1 ? "s" : ""} for "${query}"`;
    const emptyMessage = isCategoryMode
        ? (
            <>
                There are no available products in <span className="font-semibold">{pageTitle}</span> yet.
            </>
        )
        : isStoreMode
            ? (
                <>
                    There are no available products in <span className="font-semibold">{pageTitle}</span> yet.
                </>
            )
            : isPopularMode
                ? (
                    <>
                        There are no available products to show right now.
                    </>
                )
                : isLatestMode
                    ? (
                        <>
                            There are no latest products to show right now.
                        </>
                    )
            : (
                <>
                    We couldn't find any products matching <span className="font-semibold">"{query}"</span>. Try
                searching with different keywords.
            </>
        );

    const handleAddToCart = async (product) => {
        if (!isCustomer) {
            message.warning(customerActionMessage);
            return;
        }

        const variant = product.variants?.find((item) => Number(item.stock || 0) > 0);

        if (!variant) {
            message.warning("This product has no available variants.");
            navigate(`/products/${product.uuid}`, {
                state: { searchKeyword: isCategoryMode || isStoreMode ? pageTitle : query },
            });
            return;
        }

        try {
            await addItem({
                ...product,
                rating: product.rating || 0,
                sold: product.sold || 0,
                category: product.category?.name || product.category || "Unknown",
                price: variant.price,
                stock: variant.stock,
                variant_id: variant.id,
                variant,
            }, 1);
            message.success(`${product.name} added to cart!`);
        } catch (error) {
            message.error(error?.data?.error || error?.message || "Failed to add item to cart.");
        }
    };

    const handlePaginationChange = (page) => {
        setPagination((prev) => ({ ...prev, current: page }));
        window.scrollTo(0, 0);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleMinPriceChange = (value) => {
        setMinPrice(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleMaxPriceChange = (value) => {
        setMaxPrice(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleClearFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        setSortBy(isPopularMode ? "popular" : "created_at");
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <div className="flex items-center rounded-lg bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
                            {isStoreMode && store?.banner ? (
                                <img
                                    src={getStorageUrl(store.banner)}
                                    alt={store.store_name || "Store"}
                                    className="h-full w-full object-cover"
                                />
                            ) : isCategoryMode ? (
                                <ShoppingBasket size={18} className="text-white" />
                            ) : isStoreMode ? (
                                <Store size={18} className="text-white" />
                            ) : (
                                <Search size={18} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="font-sora text-base font-bold text-green-700">{pageTitle}</h1>
                            <p className="mt-0.5 text-xs text-gray-500">{pageSubtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 md:py-8">
                <div className="flex gap-6">
                    <ProductFiltersCard
                        sortBy={sortBy}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        onSortChange={handleSortChange}
                        onMinPriceChange={handleMinPriceChange}
                        onMaxPriceChange={handleMaxPriceChange}
                        onClear={handleClearFilters}
                    />

                    <div className="flex-1">
                        {loading || (isCategoryMode && categories === null) || (isStoreMode && store === null) ? (
                            <div className="flex items-center justify-center py-16">
                                <Spin size="large" />
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                <ProductFiltersCard
                                    sortBy={sortBy}
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    onSortChange={handleSortChange}
                                    onMinPriceChange={handleMinPriceChange}
                                    onMaxPriceChange={handleMaxPriceChange}
                                    onClear={handleClearFilters}
                                    mobile
                                />

                                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {results.map((product) => (
                                        <ProductCard
                                            key={product.uuid}
                                            product={{
                                                ...product,
                                                rating: Number(product.rating ?? 0),
                                                sold: product.sold || 0,
                                                category: product.category?.name || "Unknown",
                                            }}
                                            onAdd={handleAddToCart}
                                        />
                                    ))}
                                </div>

                                {pagination.total > pagination.pageSize && (
                                    <div className="flex justify-center py-8">
                                        <Pagination
                                            current={pagination.current}
                                            pageSize={pagination.pageSize}
                                            total={pagination.total}
                                            onChange={handlePaginationChange}
                                            showSizeChanger={false}
                                            showQuickJumper={false}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16">
                                <Package size={64} className="mb-4 text-gray-300" />
                                <h2 className="mb-2 text-2xl font-bold text-gray-800">No Products Found</h2>
                                <p className="mb-6 max-w-md text-center text-gray-600">{emptyMessage}</p>
                                <Button
                                    onClick={() => navigate("/")}
                                    type="primary"
                                    size="large"
                                >
                                    Back to Home
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
