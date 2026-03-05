import axios from 'axios';

// API ديال json-server
const API_URL = 'http://localhost:3000';

export const adminService = {
    // جلب جميع الإداريين
    getAll: () => axios.get(`${API_URL}/admins`),

    // إضافة إداري جديد
    create: (data) => axios.post(`${API_URL}/admins`, data),

    // جلب الإداري الحالي (simulate logged-in admin)
    getCurrent: () => axios.get(`${API_URL}/admins/1`)
};