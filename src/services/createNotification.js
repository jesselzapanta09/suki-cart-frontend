import api from './api';

export function createNotification({ type, title, message }) {
    return api.post('/notifications', { type, title, message });
}
