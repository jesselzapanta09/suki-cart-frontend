import api from './api';

export function getUsers({ page = 1, perPage = 10, search, sortField, sortOrder, role, verified } = {}) {
    return api.get('/admin/users', {
        params: {
            page,
            per_page: perPage,
            ...(search && { search }),
            ...(sortField && { sort_field: sortField }),
            ...(sortOrder && { sort_order: sortOrder }),
            ...(role && { role }),
            ...(verified !== undefined && verified !== null && { verified }),
        },
    });
}

export function getUser(id) {
    return api.get(`/admin/users/${id}`);
}

export function createUser(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('email', values.email ?? '');
    fd.append('role', values.role ?? '');
    fd.append('contact_number', values.contact_number ?? '');
    fd.append('password', values.password ?? '');
    if (values.profile_picture instanceof File) {
        fd.append('profile_picture', values.profile_picture);
    }
    // Address
    if (values.region) fd.append('region', values.region);
    if (values.province) fd.append('province', values.province);
    if (values.city) fd.append('city', values.city);
    if (values.barangay) fd.append('barangay', values.barangay);
    // Store (seller)
    if (values.store_name) fd.append('store_name', values.store_name);
    if (values.store_category) fd.append('store_category', values.store_category);
    if (values.store_description) fd.append('store_description', values.store_description);
    if (values.store_banner instanceof File) {
        fd.append('store_banner', values.store_banner);
    }
    return api.post('/admin/users', fd);
}

export function updateUser(id, values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('email', values.email ?? '');
    fd.append('role', values.role ?? '');
    fd.append('contact_number', values.contact_number ?? '');
    if (values.password) fd.append('password', values.password);
    if (values.profile_picture instanceof File) {
        fd.append('profile_picture', values.profile_picture);
    }
    if (values.remove_picture) {
        fd.append('remove_picture', '1');
    }
    // Address
    if (values.region) fd.append('region', values.region);
    if (values.province) fd.append('province', values.province);
    if (values.city) fd.append('city', values.city);
    if (values.barangay) fd.append('barangay', values.barangay);
    // Store (seller)
    if (values.store_name) fd.append('store_name', values.store_name);
    if (values.store_category) fd.append('store_category', values.store_category);
    if (values.store_description !== undefined) fd.append('store_description', values.store_description ?? '');
    if (values.store_banner instanceof File) {
        fd.append('store_banner', values.store_banner);
    }
    return api.post(`/admin/users/${id}`, fd);
}

export function deleteUser(id) {
    return api.delete(`/admin/users/${id}`);
}

