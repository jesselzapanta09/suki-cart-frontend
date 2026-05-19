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
    return api.get('/seller/orders', { params });
}

export function getSellerOrder(orderUuid) {
    return api.get(`/seller/orders/${orderUuid}`);
}

export function updateSellerOrderStatus(orderUuid, data) {
    return api.put(`/seller/orders/${orderUuid}/status`, data);
}

export function updateSellerOrderShipment(orderUuid, data) {
    return api.put(`/seller/orders/${orderUuid}/shipment`, data);
}

export function cancelSellerOrder(orderUuid, reason) {
    return api.put(`/seller/orders/${orderUuid}/cancel`, {
        cancellation_reason: reason,
    });
}
