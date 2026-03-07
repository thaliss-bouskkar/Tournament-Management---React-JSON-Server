import { api } from './api';

export const adminService = {
    // جلب جميع الإداريين
    getAll: () => api.get('/admins'),

    // إضافة إداري جديد
    create: (data) => api.post('/admins', data),

    // جلب الإداري الحالي (simulate logged-in admin)
    getCurrent: () => api.get('/admins/1')
};