import api from './api';

function extractFile(uploadValue) {
    if (!uploadValue) return null;
    const list = Array.isArray(uploadValue) ? uploadValue : uploadValue.fileList ?? [];
    return list[0]?.originFileObj ?? null;
}

export function registerCustomer(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstName ?? '');
    fd.append('lastname', values.lastName ?? '');
    fd.append('contact_number', values.contactNumber ?? '');
    fd.append('region', values.region ?? '');
    fd.append('province', values.province ?? '');
    fd.append('city', values.city ?? '');
    fd.append('barangay', values.barangay ?? '');
    fd.append('email', values.email ?? '');
    fd.append('password', values.password ?? '');
    fd.append('password_confirmation', values.passwordConfirmation ?? '');

    const pic = extractFile(values.profilePicture);
    if (pic) fd.append('profile_picture', pic);

    return api.post('/register/customer', fd);
}

export function registerSeller(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstName ?? '');
    fd.append('lastname', values.lastName ?? '');
    fd.append('contact_number', values.contactNumber ?? '');
    fd.append('store_name', values.storeName ?? '');
    fd.append('store_category', values.storeCategory ?? '');
    fd.append('store_description', values.storeDescription ?? '');
    fd.append('region', values.region ?? '');
    fd.append('province', values.province ?? '');
    fd.append('city', values.city ?? '');
    fd.append('barangay', values.barangay ?? '');
    fd.append('email', values.email ?? '');
    fd.append('password', values.password ?? '');
    fd.append('password_confirmation', values.passwordConfirmation ?? '');

    const pic = extractFile(values.profilePicture);
    if (pic) fd.append('profile_picture', pic);

    const banner = extractFile(values.storeBanner);
    if (banner) fd.append('store_banner', banner);

    return api.post('/register/seller', fd);
}

export function login(email, password) {
    return api.post('/login', { email, password });
}

export function resendVerification(email) {
    return api.post('/resend-verification', { email });
}

export function verifyEmail(token) {
    return api.get('/verify-email', { params: { token } });
}

export function forgotPassword(email) {
    return api.post('/forgot-password', { email });
}

export function resetPassword(token, password, password_confirmation) {
    return api.post('/reset-password', { token, password, password_confirmation });
}

export function getCategories() {
    return api.get('/categories');
}

