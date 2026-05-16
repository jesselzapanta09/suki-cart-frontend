import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, InputNumber, App, Checkbox, Tooltip, Popconfirm, Pagination, Spin } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Package, ShoppingBag, Store } from "lucide-react";
import { useCart } from "../../../context/CartContext";
import * as cartService from "../../../services/cartService";
import { formatPeso } from "../../../utils/currency";
import { getStorageUrl } from "../../../utils/storage";

const PAGE_SIZE = 10;

const getCartItemKey = (item) => item.itemKey || item.cartId || `${item.uuid}-${item.variant_id || "none"}`;

const normalizeCartItems = (cartData = []) => {
    if (!Array.isArray(cartData)) {
        return [];
    }

    if (cartData.some(group => Array.isArray(group?.items))) {
        return cartData.flatMap(group => group.items || []);
    }

    return cartData;
};

const transformCartItems = (cartItems = []) => {
    return cartItems.map(item => {
        const price = item.variant?.price || (item.product?.variants && item.product.variants.length > 0 ? item.product.variants[0].price : 0);
        const stock = item.variant?.stock || (item.product?.variants && item.product.variants.length > 0 ? item.product.variants[0].stock : 0);

        return {
            id: item.product_id,
            uuid: item.product.uuid,
            cartId: item.id,
            itemKey: getCartItemKey({ ...item, cartId: item.id }),
            name: item.product.name,
            price,
            qty: item.quantity,
            stock,
            category: item.product.category?.name || "Unknown",
            rating: item.product.rating || 4.5,
            sold: item.product.sold || 0,
            images: item.product.images || [],
            store: item.product.store || {},
            description: item.product.description || "",
            variant_id: item.product_variant_id,
            variant: item.variant || null,
        };
    });
};

export default function CartIndex() {
    const { removeItem, updateQty, clearCart, totalItems } = useCart();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState({});
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE });

    const getPrice = (item) => {
        const price = item.price ?? item.variant?.price ?? 0;
        return typeof price === "number" ? price : Number(price || 0);
    };

    const getStoreKey = (item) => item.store?.id || item.store?.uuid || "unknown";
    const getStoreName = (store) => store?.store_name || store?.name || "Unknown Seller";
    const getStock = (item) => Number(item.stock ?? item.variant?.stock ?? 0);

    const fetchCartPage = useCallback(async (page = 1) => {
        setLoading(true);

        try {
            const response = await cartService.getCart({ page, per_page: PAGE_SIZE });
            const nextItems = transformCartItems(normalizeCartItems(response.data || []));
            const nextPagination = response.pagination || {};

            setCartItems(nextItems);
            setTotal(nextPagination.total || 0);
            setPagination({
                current: nextPagination.current_page || page,
                pageSize: nextPagination.per_page || PAGE_SIZE,
            });

            setCheckedItems(prev => {
                const visibleKeys = new Set(nextItems.map(item => getCartItemKey(item)));
                return Object.fromEntries(
                    Object.entries(prev).filter(([key]) => visibleKeys.has(key))
                );
            });

            return {
                items: nextItems,
                pagination: {
                    current: nextPagination.current_page || page,
                    total: nextPagination.total || 0,
                },
            };
        } catch (error) {
            message.error(error.message || "Failed to fetch cart");
            return null;
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchCartPage(1);
    }, [fetchCartPage]);

    const cartGroups = useMemo(() => {
        const groups = new Map();

        cartItems.forEach((item) => {
            const storeKey = getStoreKey(item);

            if (!groups.has(storeKey)) {
                groups.set(storeKey, {
                    key: storeKey,
                    store: item.store || null,
                    items: [],
                });
            }

            groups.get(storeKey).items.push(item);
        });

        return Array.from(groups.values()).map(group => ({
            ...group,
            subtotal: group.items.reduce((sum, item) => sum + (getPrice(item) * item.qty), 0),
        }));
    }, [cartItems]);

    const getCheckedItems = () => {
        return cartItems.filter(item => checkedItems[getCartItemKey(item)]);
    };

    const getCheckedTotal = () => {
        return getCheckedItems().reduce((sum, item) => sum + (getPrice(item) * item.qty), 0);
    };

    const handleRemoveItem = async (item, itemName) => {
        try {
            await removeItem(getCartItemKey(item));
            message.success(`${itemName} removed from cart`);

            const nextPage = await fetchCartPage(pagination.current);
            if (nextPage && nextPage.items.length === 0 && nextPage.pagination.total > 0 && pagination.current > 1) {
                await fetchCartPage(pagination.current - 1);
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const handleProceedToCheckout = () => {
        const checkedItemsList = getCheckedItems();

        if (checkedItemsList.length === 0) {
            message.warning("Please select items to order");
            return;
        }

        const missingVariant = checkedItemsList.find(item => !item.variant_id);
        if (missingVariant) {
            message.warning(`Please select a variant for ${missingVariant.name}.`);
            return;
        }

        const overStockItem = checkedItemsList.find(item => item.qty > getStock(item));
        if (overStockItem) {
            const stock = getStock(overStockItem);
            message.warning(`Only ${stock} item${stock !== 1 ? "s" : ""} available for ${overStockItem.name}.`);
            return;
        }

        navigate("/customer/checkout", {
            state: {
                items: checkedItemsList,
                total: getCheckedTotal(),
            },
        });
    };

    const handleProductClick = (uuid) => {
        navigate(`/products/${uuid}`);
    };

    const toggleItemCheck = (item) => {
        const key = getCartItemKey(item);

        setCheckedItems(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const toggleStoreCheck = (group, checked) => {
        setCheckedItems(prev => {
            const next = { ...prev };

            group.items.forEach(item => {
                const key = getCartItemKey(item);

                if (checked) {
                    next[key] = true;
                } else {
                    delete next[key];
                }
            });

            return next;
        });
    };

    const handleCheckAll = (checked) => {
        if (checked) {
            const newCheckedItems = {};
            cartItems.forEach(item => {
                newCheckedItems[getCartItemKey(item)] = true;
            });
            setCheckedItems(newCheckedItems);
            return;
        }

        setCheckedItems({});
    };

    const handlePageChange = (page) => {
        fetchCartPage(page);
    };

    const handleQtyChange = async (itemKey, value, stock, itemName) => {
        if (value === null || value === undefined || value < 1) return;
        if (stock > 0 && value > stock) {
            message.warning(`Only ${stock} item${stock !== 1 ? "s" : ""} available for ${itemName}.`);
            return;
        }

        try {
            await updateQty(itemKey, value);
            await fetchCartPage(pagination.current);
        } catch (error) {
            message.error(error.message || "Failed to update quantity");
        }
    };

    const isAllChecked = cartItems.length > 0 && cartItems.every(item => checkedItems[getCartItemKey(item)]);
    const isIndeterminate = cartItems.some(item => checkedItems[getCartItemKey(item)]) && !isAllChecked;

    return (
        <div className="mx-auto max-w-7xl space-y-4 px-3 pb-6 pt-3 sm:space-y-5 sm:px-4 sm:pb-8 sm:pt-4 lg:px-8">
                {/* header */}
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 sm:px-6 sm:py-5">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
                            <ShoppingCart size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-sora text-lg font-bold text-gray-900 sm:text-xl">Your SukiCart</h1>
                            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                                {totalItems} item{totalItems !== 1 ? "s" : ""} ready for checkout
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    {loading ? (
                        <div className="min-h-64 flex items-center justify-center">
                            <Spin size="large" />
                        </div>
                    ) : totalItems === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart size={36} className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-green-900 mb-2">Your cart is empty</h2>
                                <p className="text-gray-500 text-sm mb-6">Add some products to get started.</p>
                                <Link to="/">
                                    <Button type="primary" size="large" className="rounded-xl font-semibold" icon={<ShoppingBag size={16} />}>
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <Checkbox
                                    checked={isAllChecked}
                                    indeterminate={isIndeterminate}
                                    onChange={(e) => handleCheckAll(e.target.checked)}
                                >
                                    <span className="font-semibold text-gray-800">Select all items</span>
                                </Checkbox>
                                <span className="text-xs md:text-sm text-gray-500">
                                    {cartGroups.length} store{cartGroups.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {cartGroups.map(group => {
                                const storeChecked = group.items.every(item => checkedItems[getCartItemKey(item)]);
                                const storeIndeterminate = group.items.some(item => checkedItems[getCartItemKey(item)]) && !storeChecked;

                                return (
                                    <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <Checkbox
                                                    checked={storeChecked}
                                                    indeterminate={storeIndeterminate}
                                                    onChange={(e) => toggleStoreCheck(group, e.target.checked)}
                                                />
                                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                                    <Store size={20} className="text-green-700" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="font-bold text-green-950 truncate">{getStoreName(group.store)}</h2>
                                                    <p className="text-xs text-gray-500">
                                                        {group.items.length} item{group.items.length !== 1 ? "s" : ""} from this store
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-left md:text-right pl-8 md:pl-0">
                                                <p className="text-xs text-gray-500">Store subtotal</p>
                                                <p className="font-bold text-green-700">{formatPeso(group.subtotal)}</p>
                                            </div>
                                        </div>

                                        <div className="hidden md:grid p-4 gap-4 items-center grid-cols-[20px_1fr_150px_150px_150px_60px] border-b border-gray-100">
                                            <div />
                                            <div className="text-xs md:text-sm font-semibold text-gray-700">Products</div>
                                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Unit Price</div>
                                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Quantity</div>
                                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Total Price</div>
                                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-right">Action</div>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {group.items.map(item => {
                                                const itemKey = getCartItemKey(item);
                                                const stock = getStock(item);
                                                const isOverStock = item.variant_id && Number(item.qty || 0) > stock;

                                                return (
                                                    <div
                                                        key={itemKey}
                                                        className={`p-4 gap-4 items-center grid grid-cols-1 md:grid-cols-[20px_1fr_150px_150px_150px_60px] ${isOverStock ? "bg-orange-50" : ""}`}
                                                    >
                                                        <div className="hidden md:flex justify-start md:justify-center items-center">
                                                            <Checkbox
                                                                checked={checkedItems[itemKey] || false}
                                                                onChange={() => toggleItemCheck(item)}
                                                            />
                                                        </div>

                                                        <div className="flex gap-4 items-start md:items-center cursor-pointer hover:opacity-75 transition-opacity" onClick={() => handleProductClick(item.uuid)}>
                                                            <div
                                                                className="flex md:hidden items-center pt-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Checkbox
                                                                    checked={checkedItems[itemKey] || false}
                                                                    onChange={() => toggleItemCheck(item)}
                                                                />
                                                            </div>
                                                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {item.images && item.images.length > 0 ? (
                                                                    <img src={getStorageUrl(item.images[0].full_url || item.images[0].image_path)} alt={item.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package size={28} className="text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                                                                {item.variant && (
                                                                    <p className="text-xs text-gray-500 mt-1">{item.variant.name}</p>
                                                                )}
                                                                <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between md:justify-center items-center">
                                                            <span className="md:hidden text-xs font-medium text-gray-500">Unit Price</span>
                                                            <span className="text-sm font-semibold text-green-700">
                                                                {formatPeso(getPrice(item))}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between md:justify-center items-center gap-4">
                                                            <span className="md:hidden text-xs font-medium text-gray-500">Quantity</span>
                                                            <div className="w-32" onKeyDown={(e) => e.stopPropagation()}>
                                                                <InputNumber
                                                                    mode="spinner"
                                                                    min={1}
                                                                    value={item.qty}
                                                                    onChange={(v) => handleQtyChange(itemKey, v, stock, item.name)}
                                                                    className="w-full"
                                                                />
                                                                {isOverStock && (
                                                                    <p className="text-xs text-orange-600 mt-1">
                                                                        Only {stock} item{stock !== 1 ? "s" : ""} available
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between md:justify-center items-center">
                                                            <span className="md:hidden text-xs font-medium text-gray-500">Total Price</span>
                                                            <span className="text-sm font-bold text-gray-800">
                                                                {formatPeso(getPrice(item) * item.qty)}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-end items-center">
                                                            <Tooltip title="Delete">
                                                                <Popconfirm
                                                                    title={`Delete ${item.name}?`}
                                                                    onConfirm={() => handleRemoveItem(item, item.name)}
                                                                    okText="Delete"
                                                                    cancelText="Cancel"
                                                                    okButtonProps={{ danger: true }}
                                                                >
                                                                    <Button size="small" danger className="rounded-md" icon={<Trash2 size={14} />} />
                                                                </Popconfirm>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    onClick={async () => {
                                        await clearCart();
                                        setCheckedItems({});
                                        await fetchCartPage(1);
                                        message.success("Cart cleared");
                                    }}
                                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 mt-2"
                                >
                                    <Trash2 size={14} /> Clear cart
                                </button>
                                <div className="flex justify-center sm:justify-end">
                                    <Pagination
                                        current={pagination.current}
                                        pageSize={pagination.pageSize}
                                        total={total}
                                        onChange={handlePageChange}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>


                {totalItems > 0 && (
                    <div
                        className="fixed left-0 right-0 z-110 border-t-2 border-green-200 bg-linear-to-r from-green-50 to-emerald-50 shadow-2xl bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] md:bottom-0"
                    >
                        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-600 font-medium">Order Total</p>
                                        <p className="text-2xl md:text-3xl font-bold text-green-900">
                                            {formatPeso(getCheckedTotal())}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {getCheckedItems().length} item{getCheckedItems().length !== 1 ? "s" : ""} selected
                                        </p>
                                    </div>
                                </div>

                                <div className="ml-auto shrink-0">
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="h-11 rounded-lg font-semibold w-40 bg-green-600 hover:bg-green-700 border-green-600"
                                        onClick={handleProceedToCheckout}
                                        disabled={getCheckedItems().length === 0}
                                        icon={<ShoppingCart size={18} />}
                                    >
                                        Place Order
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}
