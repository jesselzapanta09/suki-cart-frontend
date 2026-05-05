import api from './api';

// Seller Products (authenticated)
export function getProducts(params = {}) {
    return api.get('/seller/products', { params });
}

export function getProduct(uuid) {
    return api.get(`/seller/products/${uuid}`);
}

export function addProduct(formData) {
    return api.post('/seller/products', formData);
}

export function updateProduct(uuid, formData) {
    return api.post(`/seller/products/${uuid}`, formData, {
        headers: { 'X-HTTP-Method-Override': 'PUT' },
    });
}

export function deleteProduct(uuid) {
    return api.delete(`/seller/products/${uuid}`);
}

// Product Variants (authenticated)
export function getProductVariants(productUuid) {
    return api.get(`/seller/products/${productUuid}/variants`);
}

export function getProductVariant(productUuid, variantId) {
    return api.get(`/seller/products/${productUuid}/variants/${variantId}`);
}

export function addProductVariant(productUuid, data) {
    return api.post(`/seller/products/${productUuid}/variants`, data);
}

export function updateProductVariant(productUuid, variantId, data) {
    return api.put(`/seller/products/${productUuid}/variants/${variantId}`, data);
}

export function deleteProductVariant(productUuid, variantId) {
    return api.delete(`/seller/products/${productUuid}/variants/${variantId}`);
}

// Public Products (no authentication required)
export function searchPublicProducts(params = {}) {
    return api.get('/products/search', { params });
}

export function getPublicProduct(uuid, params = {}) {
    return api.get(`/products/${uuid}`, { params });
}

export function getSimilarPublicProducts(uuid, params = {}) {
    return api.get(`/products/${uuid}/similar`, { params });
}

export function getPopularHomeProducts() {
    return api.get('/home/popular-products');
}

export function getLatestHomeProducts() {
    return api.get('/home/latest-products');
}
