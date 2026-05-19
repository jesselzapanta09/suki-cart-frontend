import api from './api'

// Order operations (authenticated customer only)
export function getOrders(params = {}) {
    return api.get('/customer/orders', { params })
}

export function getOrder(orderUuid) {
    return api.get(`/customer/orders/${orderUuid}`)
}

export function createOrder(orderData) {
    return api.post('/customer/orders', orderData)
}

export function calculateShipping(shippingData) {
    return api.post('/customer/orders/calculate-shipping', shippingData)
}

export function markOrderReceived(orderUuid) {
    return api.put(`/customer/orders/${orderUuid}/received`)
}

export function cancelOrder(orderUuid, reason) {
    return api.put(`/customer/orders/${orderUuid}/cancel`, {
        cancellation_reason: reason,
    })
}

export function createProductReview(itemId, payload) {
    return api.post(`/customer/orders/items/${itemId}/review`, payload)
}
