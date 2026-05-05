import api from './api';

export function getProfile() {
    return api.get('/profile');
}

export function updateInfo(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('contact_number', values.contact_number ?? '');

    if (values.profile_picture instanceof File) {
        fd.append('profile_picture', values.profile_picture);
    }
    if (values.remove_picture) {
        fd.append('remove_picture', '1');
    }

    return api.post('/profile/info', fd);
}

export function updateAddress(values) {
    return api.post('/profile/address', {
        region: values.region ?? '',
        province: values.province ?? '',
        city: values.city ?? '',
        barangay: values.barangay ?? '',
    });
}

export function updateStore(values) {
    const fd = new FormData();
    fd.append('store_name', values.store_name ?? '');
    fd.append('store_category', values.store_category ?? '');
    fd.append('store_description', values.store_description ?? '');

    if (values.store_banner instanceof File) {
        fd.append('store_banner', values.store_banner);
    }
    if (values.remove_banner) {
        fd.append('remove_banner', '1');
    }

    return api.post('/profile/store', fd);
}

export function changePassword(values) {
    return api.post('/profile/password', {
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
    });
}
