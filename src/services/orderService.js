import api from './api'

// Order operations (authenticated customer only)
export function getOrders(params = {}) {
    return api.get('/customer/order-items', { params })
}

export function getOrder(checkoutNo) {
    return api.get(`/customer/order-items/${checkoutNo}`)
}

export function createOrder(orderData) {
    return api.post('/customer/order-items', orderData)
}

export function calculateShipping(shippingData) {
    return api.post('/customer/order-items/calculate-shipping', shippingData)
}

export function markOrderItemDelivered(itemId) {
    return api.put(`/customer/order-items/${itemId}/delivered`)
}

export function cancelOrderItem(itemId, reason) {
    return api.put(`/customer/order-items/${itemId}/cancel`, {
        cancellation_reason: reason,
    })
}

export function createProductReview(itemId, payload) {
    return api.post(`/customer/order-items/${itemId}/review`, payload)
}
