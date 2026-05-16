import { App } from "antd";
import { ShoppingCart, Package } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { formatPeso } from "../../utils/currency";
import { getStorageUrl } from "../../utils/storage";

export default function ProductCard({ product, onAdd }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const { isCustomer } = useAuth();

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const images = Array.isArray(product.images) ? product.images : [];
    const specs = product.specs && typeof product.specs === "object" ? product.specs : {};

    const primaryVariant = variants[0] || null;
    const primaryImage = images[0] || null;

    const categoryLabel =
        typeof product.category === "string"
            ? product.category
            : product.category?.name || "Product";

    const ratingValue = Number(product.rating ?? 0);
    const soldCount = Number(product.sold ?? 0);
    const stockCount = variants.length > 0
        ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
        : Number(product.stock || 0);

    const imagePath = primaryImage?.full_url || primaryImage?.image_path || null;
    const imageUrl = imagePath ? getStorageUrl(imagePath) : null;

    const rawPrice = primaryVariant?.price;
    const priceValue =
        typeof rawPrice === "number"
            ? rawPrice
            : rawPrice !== undefined && rawPrice !== null && rawPrice !== ""
                ? Number(rawPrice)
                : null;
    const hasPrice = typeof priceValue === "number" && !Number.isNaN(priceValue);

    const handleCardClick = () => {
        if (!product?.uuid) {
            return;
        }

        const searchKeyword =
            new URLSearchParams(location.search).get("q") ||
            location.state?.searchKeyword ||
            undefined;

        navigate(`/products/${product.uuid}`, {
            state: searchKeyword ? { searchKeyword } : undefined,
        });
    };

    const handleAddClick = (event) => {
        event.stopPropagation();

        if (!isCustomer) {
            message.warning("To perform this action, log in as a customer.");
            return;
        }

        onAdd(product);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                product?.uuid ? "cursor-pointer" : ""
            }`}
        >
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-green-50 to-emerald-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        onError={(event) => {
                            event.target.style.display = "none";
                            if (event.target.nextElementSibling) {
                                event.target.nextElementSibling.style.display = "flex";
                            }
                        }}
                    />
                ) : null}
                <Package
                    size={40}
                    className="text-green-400 transition-transform group-hover:scale-110"
                    style={{ display: imageUrl ? "none" : "flex" }}
                />
                <div className="absolute top-3 right-3 rounded-lg bg-white px-2 py-0.5 text-xs font-semibold text-yellow-600 shadow-sm">
                    {`★ ${ratingValue.toFixed(1)}`}
                </div>
            </div>

            <div className="flex h-44.5 flex-col p-4">
                <p className="mb-1 truncate text-xs font-semibold uppercase tracking-wide text-green-600">
                    {categoryLabel}
                </p>
                <h3
                    className="mb-2 text-sm font-bold leading-snug text-gray-800"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {product.name}
                </h3>

                {Object.keys(specs).length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                        {Object.entries(specs).slice(0, 2).map(([key, value]) => (
                            <span
                                key={key}
                                className="inline-block max-w-full truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                            >
                                {value}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {hasPrice ? (
                            <>
                                <span className="text-base font-bold text-green-700">{formatPeso(priceValue)}</span>
                                <p className="mt-0.5 truncate text-xs text-gray-400">
                                    {`${soldCount} sold • ${stockCount} in stock`}
                                </p>
                            </>
                        ) : (
                            <span className="truncate text-sm text-gray-500">No variants</span>
                        )}
                    </div>

                    <button
                        onClick={handleAddClick}
                        disabled={!hasPrice}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-none text-white shadow-sm transition-colors ${
                            hasPrice ? "cursor-pointer bg-green-600 hover:bg-green-700" : "cursor-not-allowed bg-gray-400"
                        }`}
                    >
                        <ShoppingCart size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
