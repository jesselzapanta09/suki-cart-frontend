import api from './api';
import { getPublicProduct } from './productService';

// Cart operations (authenticated customer only)
export function getCart(params = {}) {
    return api.get('/customer/cart', { params });
}

export function addToCart(productId, quantity = 1, variantId = null) {
    return api.post('/customer/cart', {
        product_id: productId,
        product_variant_id: variantId,
        quantity,
    });
}

export function updateCartItem(cartId, quantity) {
    return api.put(`/customer/cart/${cartId}`, {
        quantity,
    });
}

export function removeCartItem(cartId) {
    return api.delete(`/customer/cart/${cartId}`);
}

export function clearCart() {
    return api.delete('/customer/cart');
}

// Handle pending add-to-cart from session storage (guest checkout flow)
export async function processPendingAddToCart() {
    const pendingAddToCart = sessionStorage.getItem("pendingAddToCart");
    
    if (!pendingAddToCart) {
        return null;
    }

    try {
        const pending = JSON.parse(pendingAddToCart);
        
        // Fetch the full product data to ensure we have all details
        const productResponse = await getPublicProduct(pending.product_uuid);
        const product = productResponse.product;
        
        // Find the variant in the fetched product
        const variant = product.variants?.find(v => v.id === pending.variant_id) || pending.variant;
        
        // Transform to cart format
        const cartProduct = {
            ...product,
            rating: product.rating || 4.5,
            sold: product.sold || 0,
            category: product.category?.name || "Unknown",
            price: variant.price,
            stock: variant.stock,
            variant_id: variant.id,
            variant: variant,
        };
        
        // Clear the pending data
        sessionStorage.removeItem("pendingAddToCart");
        
        return {
            product: cartProduct,
            quantity: pending.quantity,
            productName: pending.product_name,
        };
    } catch (err) {
        console.error("Error processing pending add-to-cart:", err);
        throw err;
    }
}
