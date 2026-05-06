import api from './api';
import { appendUploadFile, debugFormData, extractSingleUploadFile } from '../utils/upload';

export function getProfile() {
    return api.get('/profile');
}

export async function updateInfo(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('contact_number', values.contact_number ?? '');

    const profilePicture = await extractSingleUploadFile(values.profile_picture);
    if (profilePicture) {
        appendUploadFile(fd, 'profile_picture', profilePicture, 'profile-picture.jpg');
    }

    if (values.remove_picture) {
        fd.append('remove_picture', '1');
    }

    debugFormData(fd, 'profile-info');
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

export async function updateStore(values) {
    const fd = new FormData();
    fd.append('store_name', values.store_name ?? '');
    fd.append('store_category', values.store_category ?? '');
    fd.append('store_description', values.store_description ?? '');

    const storeBanner = await extractSingleUploadFile(values.store_banner);
    if (storeBanner) {
        appendUploadFile(fd, 'store_banner', storeBanner, 'store-banner.jpg');
    }

    if (values.remove_banner) {
        fd.append('remove_banner', '1');
    }

    debugFormData(fd, 'profile-store');
    return api.post('/profile/store', fd);
}

export function changePassword(values) {
    return api.post('/profile/password', {
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
    });
}
