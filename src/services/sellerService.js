import api from './api';

export function getSellerDashboard() {
    return api.get('/seller/dashboard');
}

export function getStoreStatus() {
    return api.get('/seller/store-status');
}

export function resubmitStore() {
    return api.post('/seller/resubmit-store');
}

export function addProduct(formData) {
    return api.post('/seller/products', formData);
}

export function getSellerOrders(params = {}) {
    return api.get('/seller/order-items', { params });
}

export function getSellerOrder(checkoutNo) {
    return api.get(`/seller/order-items/${checkoutNo}`);
}

export function updateSellerOrderStatus(itemId, data) {
    return api.put(`/seller/order-items/${itemId}/status`, data);
}

export function updateSellerOrderShipment(itemId, data) {
    return api.put(`/seller/order-items/${itemId}/shipment`, data);
}

export function cancelSellerOrderItem(itemId, reason) {
    return api.put(`/seller/order-items/${itemId}/cancel`, {
        cancellation_reason: reason,
    });
}
