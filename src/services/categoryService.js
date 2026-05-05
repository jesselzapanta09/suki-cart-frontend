import api from './api';

export function getHomeCategories() {
    return api.get('/categories');
}

export function getCategories({ page = 1, perPage = 10, search, sortField, sortOrder, status } = {}) {
    return api.get('/admin/categories', {
        params: {
            page,
            per_page: perPage,
            ...(search && { search }),
            ...(sortField && { sort_field: sortField }),
            ...(sortOrder && { sort_order: sortOrder }),
            ...(status !== undefined && status !== null && { status }),
        },
    });
}

export function getCategory(id) {
    return api.get(`/admin/categories/${id}`);
}

export function createCategory(values) {
    return api.post('/admin/categories', {
        name: values.name ?? '',
        description: values.description ?? '',
        status: values.status ?? 1,
    });
}

export function updateCategory(id, values) {
    return api.put(`/admin/categories/${id}`, {
        name: values.name ?? '',
        description: values.description ?? '',
        status: values.status ?? 1,
    });
}

export function deleteCategory(id) {
    return api.delete(`/admin/categories/${id}`);
}
