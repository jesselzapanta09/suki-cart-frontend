import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Carousel, Spin, Grid } from "antd";
import { Package, Store, UserRound } from "lucide-react";
import * as adminProductService from "../../../services/adminProductService";
import { getStorageUrl } from "../../../utils/storage";

function formatCurrency(value) {
    return `PHP ${Number(value || 0).toFixed(2)}`;
}

function getTotalStock(variants = []) {
    return variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0);
}

function resolveMediaUrl(path) {
    if (!path) return "";
    return getStorageUrl(path);
}

export default function ActiveProductShow() {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await adminProductService.getAdminProduct(uuid);
                setProduct(data.product);
            } catch (err) {
                message.error(err.message || "Failed to load product details");
                navigate("/admin/products", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [uuid, message, navigate]);

    const images = useMemo(() => (
        Array.isArray(product?.images) ? product.images.map((image) => ({
            ...image,
            src: getStorageUrl(image.image_path),
        })) : []
    ), [product?.images]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>;
    }

    if (!product) return null;

    const ownerName = product.store?.user
        ? `${product.store.user.firstname || ""} ${product.store.user.lastname || ""}`.trim()
        : "";
    const specsEntries = product.specs ? Object.entries(product.specs) : [];
    const totalStock = getTotalStock(product.variants || []);
    const lowestPrice = product.variants?.length
        ? Math.min(...product.variants.map((variant) => Number(variant.price || 0)))
        : 0;
    const storeBanner = resolveMediaUrl(product.store?.banner);
    const sellerProfilePicture = resolveMediaUrl(product.store?.user?.profile_picture);

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="bg-linear-to-r from-green-50 via-white to-emerald-50 px-4 py-4 sm:hidden">
                    <div className="mt-4 flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-green-500 shadow-sm">
                            <Package size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900">Product Details</h1>
                            <p className="mt-1 text-sm leading-5 text-gray-500">Read-only admin product overview</p>
                        </div>
                    </div>
                </div>

                <div className="hidden px-6 py-5 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-green-500 shadow-sm">
                            <Package size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-xl font-bold text-gray-900">Product Details</h1>
                            <p className="mt-1 text-sm text-gray-500">Read-only admin product overview</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
                <div className="space-y-4 lg:col-span-2 lg:space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {images.length > 0 ? (
                            <Carousel dots={images.length > 1} className="bg-gray-100">
                                {images.map((image) => (
                                    <div key={image.id}>
                                        <div className="flex h-44 items-center justify-center bg-gray-100 sm:h-72 md:h-96">
                                            <img src={image.src} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <div className="flex h-44 items-center justify-center bg-linear-to-br from-green-50 to-emerald-100 sm:h-72 md:h-96">
                                <Package size={56} className="text-green-300" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                                    {product.category?.name || "Uncategorized"}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{product.name}</h2>
                            </div>
                            <div className={`${isMobile ? "rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-left" : "text-right"}`}>
                                <div className="text-sm text-gray-400">Lowest variant price</div>
                                <div className="text-xl font-bold text-green-700">{formatCurrency(lowestPrice)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Total Stock</div>
                                <div className="font-bold text-lg text-gray-900">{totalStock}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Variants</div>
                                <div className="font-bold text-lg text-gray-900">{product.variants?.length || 0}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Created</div>
                                <div className="font-medium text-gray-800">
                                    {new Date(product.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-700 mb-2">Description</div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                {product.description || "No product description provided."}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Weight</div>
                                <div className="text-sm text-gray-600">{product.weight || "N/A"} kg</div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">Dimension</div>
                                <div className="text-sm text-gray-600">{product.dimension || "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                                <Package size={18} className="text-emerald-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Variants</h3>
                                <p className="text-sm text-gray-400">Current sellable options for this product</p>
                            </div>
                        </div>

                        {product.variants?.length ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {product.variants.map((variant) => (
                                    <div
                                        key={variant.id}
                                        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                                    Variant
                                                </div>
                                                <div className="mt-1 wrap-break-word font-semibold text-gray-900">
                                                    {variant.name || "Unnamed variant"}
                                                </div>
                                            </div>
                                            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                                                Stock: {Number(variant.stock || 0)}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-gray-200">
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Price
                                                </div>
                                                <div className="mt-1 font-mono text-base font-semibold text-gray-900">
                                                    {formatCurrency(variant.price)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Quantity
                                                </div>
                                                <div className="mt-1 font-mono text-base font-semibold text-emerald-700">
                                                    {Number(variant.stock || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400">No variants found.</div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="text-xs font-semibold text-gray-700 mb-4">Specifications</div>
                        {specsEntries.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                                {specsEntries.map(([key, value]) => (
                                    <div key={key} className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                                        <div className="text-xs uppercase tracking-wide text-gray-500">{key}</div>
                                        <div className="text-sm font-medium text-gray-800 mt-1">{value}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400">No specifications provided.</div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 lg:space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="h-28 bg-gray-100 sm:h-36">
                            {storeBanner ? (
                                <img src={storeBanner} alt={product.store?.store_name || "Store banner"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                                    <Store size={36} className="text-emerald-400" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 p-4 sm:p-6">
                            <div className="text-xs font-semibold text-gray-700">Store</div>
                            <div>
                                <div className="font-semibold text-gray-900">{product.store?.store_name || "No store name"}</div>
                                <div className="text-sm text-gray-400">{product.store?.category?.name || "No store category"}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                                {product.store?.description || "No store description provided."}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="text-xs font-semibold text-gray-700">Seller</div>
                        <div className="flex items-center gap-3">
                            {sellerProfilePicture ? (
                                <img
                                    src={sellerProfilePicture}
                                    alt={ownerName || product.store?.user?.email || "Seller"}
                                    className="w-14 h-14 rounded-full object-cover border border-green-200"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-50 to-green-100 flex items-center justify-center border border-green-200">
                                    <UserRound size={24} className="text-emerald-500" />
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-gray-900">{ownerName || "No owner name"}</div>
                                <div className="text-sm text-gray-400">{product.store?.user?.email || "No email"}</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {product.store?.user?.contact_number || "No contact number provided."}
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="text-xs font-semibold text-gray-700">Quick Info</div>
                        <div className="text-sm text-gray-500">
                            Product UUID: <span className="font-mono text-gray-700 break-all">{product.uuid}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Store UUID: <span className="font-mono text-gray-700 break-all">{product.store?.uuid || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
