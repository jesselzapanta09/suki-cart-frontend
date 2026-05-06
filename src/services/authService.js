import api from './api';
import { appendUploadFile, debugFormData, extractSingleUploadFile } from '../utils/upload';

async function resolveRequiredUpload(uploadValue, fieldLabel) {
    const file = await extractSingleUploadFile(uploadValue);

    if (!file) {
        throw new Error(`Please choose ${fieldLabel} again before submitting.`);
    }

    return file;
}

export async function registerCustomer(values) {
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

    const pic = await resolveRequiredUpload(values.profilePicture, 'a profile picture');
    appendUploadFile(fd, 'profile_picture', pic, 'profile-picture.jpg');

    debugFormData(fd, 'register-customer');
    return api.post('/register/customer', fd);
}

export async function registerSeller(values) {
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

    const pic = await resolveRequiredUpload(values.profilePicture, 'a profile picture');
    appendUploadFile(fd, 'profile_picture', pic, 'profile-picture.jpg');

    const banner = await resolveRequiredUpload(values.storeBanner, 'a store banner');
    appendUploadFile(fd, 'store_banner', banner, 'store-banner.jpg');

    debugFormData(fd, 'register-seller');
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
