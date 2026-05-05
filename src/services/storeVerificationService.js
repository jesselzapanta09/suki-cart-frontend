import api from './api';

export function getStoreVerifications({ page = 1, perPage = 10, search, sortField, sortOrder, status } = {}) {
    return api.get('/admin/store-verifications', {
        params: {
            page,
            per_page: perPage,
            ...(search && { search }),
            ...(sortField && { sort_field: sortField }),
            ...(sortOrder && { sort_order: sortOrder }),
            ...(status && { status }),
        },
    });
}

export function getStoreVerification(id) {
    return api.get(`/admin/store-verifications/${id}`);
}

export function approveStore(id) {
    return api.post(`/admin/store-verifications/${id}/approve`);
}

export function rejectStore(id, rejectionReason) {
    return api.post(`/admin/store-verifications/${id}/reject`, {
        rejection_reason: rejectionReason,
    });
}

export function setStorePending(id) {
    return api.post(`/admin/store-verifications/${id}/pending`);
}

export function getStoreLogs(storeId) {
    return api.get(`/admin/store-verifications/${storeId}/logs`);
}

export function getAllLogs({ page = 1, perPage = 15, search } = {}) {
    return api.get('/admin/store-verification-logs', {
        params: {
            page,
            per_page: perPage,
            ...(search && { search }),
        },
    });
}

export function revertLog(logId) {
    return api.post(`/admin/store-verification-logs/${logId}/revert`);
}
