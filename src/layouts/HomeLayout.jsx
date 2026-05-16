import React, { useState, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useCart } from "../context/CartContext";
import { Badge, App, Spin } from "antd";
import { ShoppingBag, ShoppingCart, Package, LogIn, Rocket, LayoutDashboard } from "lucide-react";
import { searchPublicProducts } from "../services/productService";
import SearchBar from "../components/SearchBar";
import { sukiCartLogoHome } from "../utils/logos";
import { formatPeso } from "../utils/currency";
import { getStorageUrl } from "../utils/storage";

export default function HomeLayout() {
    const { isAuthenticated, isCustomer } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);
    const debounceTimer = useRef(null);

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearch(q);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (q.trim()) {
            setSearching(true);
            setShowResults(true);
            debounceTimer.current = setTimeout(async () => {
                try {
                    const response = await searchPublicProducts({
                        search: q,
                        per_page: 5,
                    });
                    const results = response.data || [];
                    setSearchResults(results);
                } catch (error) {
                    console.error("Error searching products:", error);
                    setSearchResults([]);
                    message.error("Failed to search products");
                } finally {
                    setSearching(false);
                }
            }, 300);
        } else {
            setShowResults(false);
            setSearchResults([]);
            setSearching(false);
        }
    };

    const handleResultClick = (product) => {
        navigate(`/products/${product.uuid}`, {
            state: { searchKeyword: search },
        });
        setShowResults(false);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === "Enter" && search.trim()) {
            navigate(`/search?q=${encodeURIComponent(search)}`);
            setShowResults(false);
        }
    };

    const isActiveRoute = (path) => location.pathname === path;
    const getMobileNavClass = (active) => `flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition-colors ${active ? "bg-green-50 text-green-700 ring-1 ring-green-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`;

    const btnGradient = "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow transition-all bg-linear-to-br from-green-700 to-green-500 hover:opacity-90 hover:-translate-y-0.5";
    const btnSecondary = "inline-flex min-h-12 items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50";
    const getProductImageUrl = (product) => {
        const imagePath = product?.images?.[0]?.full_url || product?.images?.[0]?.image_path;
        return imagePath ? getStorageUrl(imagePath) : null;
    };

    const mobileBottomNav = (
        <nav
            className="fixed bottom-0 left-0 right-0 z-120 border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        >
            <div className={`grid gap-2 ${isAuthenticated ? "grid-cols-3" : "grid-cols-4"}`}>
                <Link to="/" className={getMobileNavClass(isActiveRoute("/"))} aria-current={isActiveRoute("/") ? "page" : undefined}>
                    <ShoppingBag size={18} />
                    <span className="text-[11px] font-semibold">Home</span>
                </Link>
                <Link
                    to="/search?sort=latest"
                    className={getMobileNavClass(isActiveRoute("/search"))}
                    aria-current={isActiveRoute("/search") ? "page" : undefined}
                >
                    <Package size={18} />
                    <span className="text-[11px] font-semibold">Products</span>
                </Link>
                {isAuthenticated ? (
                    <Link to="/dashboard" className={getMobileNavClass(isActiveRoute("/dashboard"))} aria-current={isActiveRoute("/dashboard") ? "page" : undefined}>
                        <LayoutDashboard size={18} />
                        <span className="text-[11px] font-semibold">Go to Dashboard</span>
                    </Link>
                ) : (
                    <>
                        <Link to="/login" className={getMobileNavClass(isActiveRoute("/login"))} aria-current={isActiveRoute("/login") ? "page" : undefined}>
                            <LogIn size={18} />
                            <span className="text-[11px] font-semibold">Sign in</span>
                        </Link>
                        <Link to="/register/customer" className={getMobileNavClass(isActiveRoute("/register/customer"))} aria-current={isActiveRoute("/register/customer") ? "page" : undefined}>
                            <Rocket size={18} />
                            <span className="text-[11px] font-semibold">Get started</span>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );

    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden overscroll-x-none bg-gray-50 text-gray-900">
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
                {/* Desktop Layout (lg and above): 4-column grid */}
                <div className="mx-auto hidden h-20 max-w-7xl grid-cols-4 items-center gap-4 px-6 sm:px-8 lg:grid">
                    {/* Column 1: Logo */}
                    <Link to="/" className="no-underline flex items-center gap-1 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                            <img src={sukiCartLogoHome} alt="SukiCart Logo" className="h-full w-full rounded-xl object-contain" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="font-display font-bold text-green-900 text-sm sm:text-base">SukiCart</div>
                        </div>
                    </Link>
                    {/* Columns 2-3: Search Bar (spans 2 columns) */}
                    <div className="relative col-span-2">
                        <SearchBar
                            search={search}
                            setSearch={(value) => {
                                setSearch(value);
                                if (!value.trim()) {
                                    setShowResults(false);
                                    setSearchResults([]);
                                }
                            }}
                            handleSearch={handleSearch}
                            handleSearchSubmit={handleSearchSubmit}
                            searching={searching}
                            navMode={true}
                        >
                            {showResults && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                                    {searching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spin />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            {searchResults.map(p => {
                                                const price = typeof (p.variants?.[0]?.price) === 'number' ? p.variants[0].price : Number(p.variants?.[0]?.price || 0);
                                                const imageUrl = getProductImageUrl(p);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-green-50"
                                                        onMouseDown={() => handleResultClick(p)}
                                                    >
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-green-100">
                                                            {imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={p.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package size={18} className="text-green-600" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-semibold text-gray-800">{p.name}</div>
                                                            <div className="text-xs text-gray-500">{p.category?.name || "Unknown"}</div>
                                                        </div>
                                                        <div className="flex shrink-0 flex-col items-end">
                                                            <span className="text-sm font-semibold text-green-600">{formatPeso(price)}</span>
                                                            <span className="text-xs text-gray-400"> {(p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0)} in stock</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
                                                <button
                                                    onClick={() => navigate(`/search?q=${encodeURIComponent(search)}`)}
                                                    className="min-h-11 rounded-xl px-3 text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
                                                >
                                                    View all results →
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-12 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                                <Package size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-gray-600 font-medium text-sm">No products found</p>
                                            <p className="text-xs text-gray-500 mt-1">Try different keywords</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SearchBar>
                    </div>

                    {/* Column 4: CTA Buttons */}
                    <div className="flex items-center justify-end gap-3">
                        {isAuthenticated ? (
                            <>
                                {isCustomer && (
                                    <Link to="/customer/cart" className="relative flex min-h-12 min-w-12 items-center justify-center">
                                        <Badge count={totalItems} size="small" color="#16a34a" offset={[2, -2]}>
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-green-700 transition-colors hover:bg-green-100">
                                                <ShoppingCart size={18} />
                                            </div>
                                        </Badge>
                                    </Link>
                                )}
                                <button className={btnGradient} onClick={() => navigate("/dashboard")}>Dashboard</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={btnSecondary}>Sign in</Link>
                                <Link to="/register/customer" className={btnGradient + " text-sm"}>Get Started</Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile/Tablet Layout (< lg): Mobile-first stacked header */}
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:hidden">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex min-w-0 flex-1 items-center gap-3 no-underline">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                                <img src={sukiCartLogoHome} alt="SukiCart Logo" className="h-full w-full rounded-xl object-contain" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-display text-base font-bold leading-tight text-green-900">SukiCart</div>
                                <div className="truncate text-xs font-medium text-green-700/75">Your trusted online shop</div>
                            </div>
                        </Link>
                    </div>

                    <div className="relative">
                        <SearchBar
                            search={search}
                            setSearch={(value) => {
                                setSearch(value);
                                if (!value.trim()) {
                                    setShowResults(false);
                                    setSearchResults([]);
                                }
                            }}
                            handleSearch={handleSearch}
                            handleSearchSubmit={handleSearchSubmit}
                            searching={searching}
                            navMode={true}
                        >
                            {showResults && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(60vh,28rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                                    {searching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spin />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            {searchResults.map(p => {
                                                const price = typeof (p.variants?.[0]?.price) === 'number' ? p.variants[0].price : Number(p.variants?.[0]?.price || 0);
                                                const imageUrl = getProductImageUrl(p);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-green-50"
                                                        onMouseDown={() => handleResultClick(p)}
                                                    >
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-green-100">
                                                            {imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={p.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package size={18} className="text-green-600" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-semibold text-gray-800">{p.name}</div>
                                                            <div className="text-xs text-gray-500">{p.category?.name || "Unknown"}</div>
                                                        </div>
                                                        <div className="flex shrink-0 flex-col items-end">
                                                            <span className="text-sm font-semibold text-green-600">{formatPeso(price)}</span>
                                                            <span className="text-xs text-gray-400"> {(p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0)} in stock</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
                                                <button
                                                    onClick={() => navigate(`/search?q=${encodeURIComponent(search)}`)}
                                                    className="min-h-11 rounded-xl px-3 text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
                                                >
                                                    View all results →
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-12 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                                <Package size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">No products found</p>
                                            <p className="mt-1 text-xs text-gray-500">Try different keywords</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SearchBar>
                    </div>
                </div>
            </nav>


            <main className="flex-1 overflow-x-hidden"><Outlet /></main>

            <footer className="bg-green-950 px-4 py-10 text-white sm:px-6 sm:py-12">
                <div className="mx-auto flex max-w-7xl flex-col gap-10">
                    <div className="flex flex-col gap-8 text-center md:flex-row md:flex-wrap md:items-start md:justify-between md:text-left">
                        <div className="mx-auto max-w-sm md:mx-0">
                            <div className="mb-3 flex items-center justify-center gap-3 md:justify-start">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                                    <img src={sukiCartLogoHome} alt="SukiCart Logo" className="h-full w-full rounded-xl object-contain" />
                                </div>
                                <div>
                                    <span className="font-display text-lg font-bold text-white">SukiCart</span>
                                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-green-300">Mobile-ready marketplace</p>
                                </div>
                            </div>
                            <p className="text-sm leading-6 text-green-200 sm:text-[15px]">
                                Your trusted online shop for household essentials. Practical items for everyday living, delivered to your door.
                            </p>
                        </div>
                        <div className="mx-auto md:mx-0">
                            <div className="flex flex-col items-center gap-3 md:items-start">
                                {[["Home", "/"], ["Sign In", "/login"], ["Register as Customer", "/register/customer"], ["Register as Seller", "/register/seller"]].map(([label, to]) => (
                                    <Link key={label} to={to} className="text-sm text-green-200 transition hover:text-white">{label}</Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="mb-4 text-base font-bold text-white">Ready to shop?</p>
                            <Link to="/register/customer" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-linear-to-br from-green-700 to-green-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:w-auto">Create Free Account</Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 border-t border-white/20 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-left">
                        <p className="text-xs text-gray-400">© {new Date().getFullYear()} SukiCart. Educational project only, not a real commerce application.</p>
                        <div className="flex flex-wrap justify-center gap-4 sm:justify-end sm:gap-6">
                            {[
                                ["Privacy Policy", "/privacy-policy"],
                                ["Terms of Service", "/terms-of-service"],
                            ].map(([label, to]) => (
                                <Link key={label} to={to} className="text-xs text-gray-400 transition hover:text-gray-200">
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
            <div
                className="h-20 sm:hidden"
                style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
            />
            {mobileBottomNav}
        </div>
    );
}
