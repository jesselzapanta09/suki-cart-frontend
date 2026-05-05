import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./auth-context";
import * as cartService from "../services/cartService";

const CartContext = createContext(null);

const getCartItemKey = (item) => {
    if (item?.cartId) {
        return `cart-${item.cartId}`;
    }

    return `product-${item?.id || item?.product_id}-${item?.variant_id || item?.product_variant_id || "none"}`;
};

const findCartItemByKey = (items, key) => {
    return items.find(item => item.itemKey === key || item.uuid === key || item.cartId === key);
};

const normalizeCartItems = (cartData = []) => {
    if (!Array.isArray(cartData)) {
        return [];
    }

    if (cartData.some(group => Array.isArray(group?.items))) {
        return cartData.flatMap(group => group.items || []);
    }

    return cartData;
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { loading: authLoading, isCustomer } = useAuth();

    // Fetch cart from API only for customers after auth is restored
    useEffect(() => {
        const fetchCart = async () => {
            try {
                setLoading(true);
                const response = await cartService.getCart();
                const cartItems = normalizeCartItems(response.data || []);
                
                // Transform API response to match cart item structure
                const transformedItems = cartItems.map(item => {
                    // Get price/stock from variant if available, otherwise from product (fallback for legacy data)
                    const price = item.variant?.price || (item.product.variants && item.product.variants.length > 0 ? item.product.variants[0].price : 0);
                    const stock = item.variant?.stock || (item.product.variants && item.product.variants.length > 0 ? item.product.variants[0].stock : 0);
                    
                    return {
                        id: item.product_id,
                        uuid: item.product.uuid,
                        cartId: item.id, // Store cart ID for updates/deletes
                        itemKey: getCartItemKey({ ...item, cartId: item.id }),
                        name: item.product.name,
                        price: price,
                        qty: item.quantity,
                        stock: stock,
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
                
                setItems(transformedItems);
            } catch (error) {
                // Silently fail on auth error (user not logged in)
                if (error?.status === 401 || error?.status === 403) {
                    setItems([]);
                } else if (error?.status !== 404) {
                    console.error("Error fetching cart:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        // Only fetch cart when auth loading is done, user is a customer
        if (!authLoading && isCustomer) {
            fetchCart();
        } else if (!authLoading) {
            // User is not a customer or not authenticated, clear cart
            setItems([]);
        }
    }, [authLoading, isCustomer]);

    const addItem = useCallback(async (product, qty = 1) => {
        try {
            const response = await cartService.addToCart(product.id, qty, product.variant_id || null);
            const cartItem = response.data;
            
            // Check if item with same product and variant already exists
            const key = product.variant_id ? `${product.uuid}-${product.variant_id}` : product.uuid;
            const existingKey = item => item.variant_id ? `${item.uuid}-${item.variant_id}` : item.uuid;
            
            setItems(prev => {
                const existingIndex = prev.findIndex(i => existingKey(i) === key);
                if (existingIndex !== -1) {
                    // Update the quantity
                    const updated = [...prev];
                    updated[existingIndex] = { 
                        ...updated[existingIndex], 
                        qty: cartItem.quantity, 
                        cartId: cartItem.id 
                    };
                    return updated;
                }
                // Add new item
                return [...prev, {
                    id: product.id,
                    uuid: product.uuid,
                    cartId: cartItem.id,
                    itemKey: getCartItemKey({ ...product, cartId: cartItem.id }),
                    name: product.name,
                    price: product.price || product.variant?.price || 0,
                    qty: cartItem.quantity,
                    stock: product.stock || product.variant?.stock || 0,
                    category: product.category || "Unknown",
                    rating: product.rating || 4.5,
                    sold: product.sold || 0,
                    images: product.images || [],
                    store: product.store || {},
                    description: product.description || "",
                    variant_id: product.variant_id || null,
                    variant: product.variant || null,
                }];
            });
        } catch (error) {
            console.error("Error adding item to cart:", error);
            throw error;
        }
    }, []);

    const removeItem = useCallback(async (key) => {
        try {
            const item = findCartItemByKey(items, key);
            if (item?.cartId) {
                await cartService.removeCartItem(item.cartId);
            }
            setItems(prev => prev.filter(i => i.itemKey !== key && i.uuid !== key && i.cartId !== key));
        } catch (error) {
            console.error("Error removing item from cart:", error);
            throw error;
        }
    }, [items]);

    const updateQty = useCallback(async (key, qty) => {
        if (qty < 1) { 
            await removeItem(key);
            return;
        }

        try {
            const item = findCartItemByKey(items, key);
            if (item?.cartId) {
                await cartService.updateCartItem(item.cartId, qty);
            }
            setItems(prev => prev.map(i => (
                i.itemKey === key || i.uuid === key || i.cartId === key ? { ...i, qty } : i
            )));
        } catch (error) {
            console.error("Error updating cart item quantity:", error);
            throw error;
        }
    }, [items, removeItem]);

    const clearCart = useCallback(async () => {
        try {
            await cartService.clearCart();
            setItems([]);
        } catch (error) {
            console.error("Error clearing cart:", error);
            throw error;
        }
    }, []);

    const removeOrderedItems = useCallback((orderedItems = []) => {
        const orderedKeys = new Set(orderedItems.map(getCartItemKey));
        setItems(prev => prev.filter(item => !orderedKeys.has(getCartItemKey(item))));
    }, []);

    const totalItems = items.length;
    const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            addItem, 
            removeItem, 
            updateQty, 
            clearCart, 
            removeOrderedItems,
            totalItems, 
            totalPrice, 
            loading 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
