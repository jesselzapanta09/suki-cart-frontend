import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { App, Spin, InputNumber, Button } from "antd";
import { ShoppingCart, ShoppingBag, Package, ArrowLeft, ChevronLeft, ChevronRight, Store, Star } from "lucide-react";
import { getPublicProduct, getSimilarPublicProducts } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/auth-context";
import SimilarProducts from "../../components/home/SimilarProducts";
import ProductReviewsSection from "../../components/home/ProductReviewsSection";
import { formatPeso } from "../../utils/currency";
import { getStorageUrl } from "../../utils/storage";

export default function ProductDetailPage() {
    const { uuid } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { addItem } = useCart();
    const { isCustomer } = useAuth();
    const customerActionMessage = "To perform this action, log in as a customer.";

    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedReviewRating, setSelectedReviewRating] = useState("all");
    const [reviewPage, setReviewPage] = useState(1);
    const hasLoadedProductRef = useRef(false);

    useEffect(() => {
        hasLoadedProductRef.current = false;
        setProduct(null);
        setLoading(true);
        setReviewLoading(false);
        setCurrentImageIndex(0);
        setSelectedReviewRating("all");
        setReviewPage(1);
    }, [uuid]);

    useEffect(() => {
        const fetchProduct = async () => {
            const isInitialLoad = !hasLoadedProductRef.current;

            try {
                if (isInitialLoad) {
                    setLoading(true);
                } else {
                    setReviewLoading(true);
                }

                const response = await getPublicProduct(uuid, {
                    review_rating: selectedReviewRating,
                    review_page: reviewPage,
                    review_per_page: 5,
                });
                setProduct(response.product);
                hasLoadedProductRef.current = true;
            } catch (error) {
                console.error("Error fetching product:", error);
                message.error("Failed to load product");
            } finally {
                if (isInitialLoad) {
                    setLoading(false);
                } else {
                    setReviewLoading(false);
                }
            }
        };

        fetchProduct();
    }, [uuid, message, selectedReviewRating, reviewPage]);

    useEffect(() => {
        const fetchSimilar = async () => {
            if (!product?.uuid) return;

            try {
                setSimilarLoading(true);
                const response = await getSimilarPublicProducts(product.uuid, {
                    limit: 3,
                });
                setSimilarProducts(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error("Error fetching similar products:", error);
                setSimilarProducts([]);
            } finally {
                setSimilarLoading(false);
            }
        };

        fetchSimilar();
    }, [product?.uuid]);

    useEffect(() => {
        if (!product?.variants?.length) {
            setSelectedVariant(null);
            return;
        }

        setSelectedVariant((currentVariant) => {
            if (currentVariant) {
                const matchedVariant = product.variants.find((variant) => variant.id === currentVariant.id);

                if (matchedVariant) {
                    return matchedVariant;
                }
            }

            return product.variants.find((variant) => Number(variant.stock || 0) > 0) || product.variants[0] || null;
        });
    }, [product?.uuid, product?.variants]);

    const renderStars = (rating, size = 18) => {
        const roundedRating = Math.round(Number(rating || 0));

        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={size}
                className={i < roundedRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
            />
        ));
    };

    const validateSelectedQuantity = () => {
        if (!selectedVariant) {
            message.warning("This product has no available variants.");
            return false;
        }

        const stock = Number(selectedVariant.stock || 0);

        if (stock < 1) {
            message.warning("This variant is out of stock.");
            return false;
        }

        if (quantity > stock) {
            message.warning(`Only ${stock} item${stock !== 1 ? "s" : ""} available for this variant.`);
            return false;
        }

        return true;
    };

    const handleQuantityChange = (value) => {
        const nextQuantity = Number(value || 1);

        if (!selectedVariant) {
            setQuantity(Math.max(nextQuantity, 1));
            return;
        }

        const stock = Number(selectedVariant.stock || 0);

        if (stock > 0 && nextQuantity > stock) {
            message.warning(`Only ${stock} item${stock !== 1 ? "s" : ""} available for this variant.`);
            setQuantity(stock);
            return;
        }

        setQuantity(Math.max(nextQuantity, 1));
    };

    const handleVariantSelect = (variant) => {
        setSelectedVariant(variant);

        if (quantity > variant.stock) {
            message.warning(`Only ${variant.stock} item${variant.stock !== 1 ? "s" : ""} available for this variant.`);
            setQuantity(Math.max(Number(variant.stock || 0), 1));
        }
    };

    const handleAddToCart = async () => {
        if (!validateSelectedQuantity()) {
            return;
        }

        if (!isCustomer) {
            message.warning(customerActionMessage);
            return;
        }

        const cartProduct = {
            ...product,
            rating: product.rating || 0,
            sold: product.sold || 0,
            category: product.category?.name || "Unknown",
            price: selectedVariant.price,
            stock: selectedVariant.stock,
            variant_id: selectedVariant.id,
            variant: selectedVariant,
        };

        try {
            await addItem(cartProduct, quantity);
            message.success(`${product.name} added to cart!`);
            setQuantity(1);
        } catch (error) {
            message.error(error?.data?.error || error?.message || "Failed to add item to cart.");
        }
    };

    const buildCheckoutItem = () => ({
        ...product,
        rating: product.rating || 0,
        sold: product.sold || 0,
        category: product.category?.name || "Unknown",
        price: selectedVariant.price,
        stock: selectedVariant.stock,
        qty: quantity,
        variant_id: selectedVariant.id,
        variant: selectedVariant,
    });

    const handleBuyNow = () => {
        if (!validateSelectedQuantity()) {
            return;
        }

        if (!isCustomer) {
            message.warning(customerActionMessage);
            return;
        }

        const checkoutItem = buildCheckoutItem();
        const price = Number(selectedVariant.price || 0);

        navigate("/customer/checkout", {
            state: {
                items: [checkoutItem],
                total: price * quantity,
            },
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spin size="large" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <Package size={48} className="text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
                <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or is no longer available.</p>
                <Button
                    onClick={() => navigate("/")}
                    type="primary"
                    size="large"
                    style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                >
                    Back to Home
                </Button>
            </div>
        );
    }

    const images = product.images && product.images.length > 0 ? product.images : [];
    const currentImagePath = images.length > 0 ? (images[currentImageIndex]?.full_url || images[currentImageIndex]?.image_path) : null;
    const currentImage = currentImagePath ? getStorageUrl(currentImagePath) : null;
    const reviewSummary = product.review_summary || { average_rating: 0, review_count: 0, distribution: [] };
    const reviewFilters = product.review_filters || { selected_rating: "all" };
    const reviewPagination = product.review_pagination || { current_page: 1, per_page: 5, total: 0, last_page: 1 };
    const averageRating = Number(reviewSummary.average_rating || 0);
    const reviewCount = Number(reviewSummary.review_count || 0);
    const storeRating = Number(product.store?.rating || 0);
    const storeReviewCount = Number(product.store?.review_count || 0);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto mt-3 px-4 ">
                <div className="mb-8 grid grid-cols-1 gap-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2 md:gap-8 lg:p-8">
                    <div className="mt-3 flex flex-col gap-4 sm:mt-4">
                        <div className="flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100 rounded-xl w-full h-auto aspect-square relative group">
                            {currentImage ? (
                                <>
                                    <img
                                        src={currentImage}
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-xl"
                                    />

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all shadow-lg"
                                                title="Previous image"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all shadow-lg"
                                                title="Next image"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Package size={80} className="text-green-300" />
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`shrink-0 w-16 h-16 rounded-lg border-2 transition-all overflow-hidden ${
                                            idx === currentImageIndex
                                                ? "border-green-600 shadow-lg"
                                                : "border-gray-300 hover:border-green-400"
                                        }`}
                                    >
                                        <img
                                            src={getStorageUrl(img.full_url || img.image_path)}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {images.length > 0 && (
                            <p className="text-center text-sm text-gray-600">
                                {currentImageIndex + 1} of {images.length}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-3">
                                {product.category?.name || "Uncategorized"}
                            </p>

                            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {renderStars(averageRating)}
                                        </div>
                                        <span className="text-lg font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-4xl font-bold text-green-700">
                                        {formatPeso(selectedVariant?.price)}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <p className={`text-sm font-semibold ${(selectedVariant?.stock || 0) > 10 ? "text-green-600" : "text-orange-600"}`}>
                                        {(selectedVariant?.stock || 0) > 0
                                            ? `${selectedVariant.stock} items in stock`
                                            : "Out of stock"}
                                    </p>
                                </div>
                            </div>

                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">Available Options</h3>
                                    <div className="space-y-3">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(variant)}
                                                disabled={variant.stock === 0}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                    selectedVariant?.id === variant.id
                                                        ? "border-green-600 bg-green-50"
                                                        : "border-gray-200 hover:border-green-400"
                                                } ${variant.stock === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{variant.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {formatPeso(variant.price)} • {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                                                        </p>
                                                    </div>
                                                    {selectedVariant?.id === variant.id && (
                                                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                                            <span className="text-white text-xs">✓</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">Quantity</h3>
                                <div className="w-32">
                                    <InputNumber
                                        mode="spinner"
                                        min={1}
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        size="large"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleAddToCart}
                                    size="large"
                                    className="flex-1"
                                    icon={<ShoppingCart size={20} />}
                                >
                                    Add to Cart
                                </Button>
                                <Button
                                    onClick={handleBuyNow}
                                    type="primary"
                                    size="large"
                                    className="flex-1"
                                    icon={<ShoppingBag size={20} />}
                                >
                                    Buy Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {product.store && (
                    <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                        <div className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-3 sm:flex sm:items-center sm:gap-6">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-green-600 bg-gray-100 sm:h-24 sm:w-24">
                                {product.store.banner ? (
                                    <img
                                        src={getStorageUrl(product.store.banner)}
                                        alt={product.store.store_name || product.store.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100">
                                        <Package size={32} className="text-green-300" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 w-full flex-1">
                                <div className="mb-3">
                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded mb-2">Official Store</span>
                                    <h3 className="wrap-break-word text-base font-bold text-gray-800 sm:text-lg">{product.store.store_name || product.store.name}</h3>
                                </div>

                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center gap-0.5">
                                            {renderStars(storeRating)}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">{storeRating.toFixed(1)}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                        <span>{storeReviewCount} store review{storeReviewCount !== 1 ? "s" : ""}</span>
                                        <span className="hidden text-gray-400 sm:inline">&middot;</span>
                                        <span>Trusted Seller</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="default"
                                size="large"
                                onClick={() => navigate(`/stores/${product.store.id}`)}
                                className="col-span-2 w-full whitespace-nowrap sm:w-auto"
                                icon={<Store size={20} />}
                            >
                                View Store
                            </Button>
                        </div>
                    </div>
                )}

                {(product.description || (product.specs && Object.keys(product.specs).length > 0)) && (
                    <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                            {product.description && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-4 text-lg">Description</h3>
                                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {product.specs && Object.keys(product.specs).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-4 text-lg">Specifications</h3>
                                    <div className="space-y-3">
                                        {Object.entries(product.specs).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-start">
                                                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">{key}</p>
                                                <p className="text-sm font-semibold text-gray-800 text-right">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <ProductReviewsSection
                    reviewSummary={reviewSummary}
                    reviews={product.reviews || []}
                    loading={reviewLoading}
                    selectedRating={reviewFilters.selected_rating}
                    currentPage={reviewPagination.current_page}
                    totalReviews={reviewPagination.total}
                    pageSize={reviewPagination.per_page}
                    onFilterChange={(rating) => {
                        setSelectedReviewRating(rating);
                        setReviewPage(1);
                    }}
                    onPageChange={setReviewPage}
                />

                <SimilarProducts
                    similarProducts={similarProducts}
                    similarLoading={similarLoading}
                    onAddToCart={async (p) => {
                        if (!isCustomer) {
                            message.warning(customerActionMessage);
                            return;
                        }

                        const variant = p.variants?.find((item) => Number(item.stock || 0) > 0);

                        if (!variant) {
                            message.warning("This product has no available variants.");
                            navigate(`/products/${p.uuid}`, { state: { searchKeyword: state?.searchKeyword } });
                            return;
                        }

                        try {
                            await addItem({
                                ...p,
                                rating: p.rating || 0,
                                sold: p.sold || 0,
                                category: p.category?.name || "Unknown",
                                price: variant.price,
                                stock: variant.stock,
                                variant_id: variant.id,
                                variant,
                            }, 1);
                            message.success(`${p.name} added to cart!`);
                        } catch (error) {
                            message.error(error?.data?.error || error?.message || "Failed to add item to cart.");
                        }
                    }}
                />
            </div>
        </div>
    );
}
