import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
});

export const groupService = {
    getAll: () => api.get('/groups'),
    getById: (id) => api.get(`/groups/${id}`),
    create: (data) => api.post('/groups', data),
    update: (id, data) => api.patch(`/groups/${id}`, data),
    delete: (id) => api.delete(`/groups/${id}`),
};

export const teamService = {
    getAll: () => api.get('/teams'),
    getById: (id) => api.get(`/teams/${id}`),
    getByGroup: (groupId) => api.get(`/teams?groupId=${groupId}`),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.patch(`/teams/${id}`, data),
    delete: (id) => api.delete(`/teams/${id}`),
};

export const matchService = {
    getAll: () => api.get('/matches'),
    getById: (id) => api.get(`/matches/${id}`),
    getToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return api.get(`/matches?date=${today}`);
    },
    getFinished: () => api.get('/matches?status=finished'),
    getPending: () => api.get('/matches?status=pending'),
    create: (data) => api.post('/matches', data),
    update: (id, data) => api.patch(`/matches/${id}`, data),
    delete: (id) => api.delete(`/matches/${id}`),
};

export const playerService = {
    getAll: () => api.get('/players'),
    getById: (id) => api.get(`/players/${id}`),
    getByTeam: (teamId) => api.get(`/players?teamId=${teamId}`),
    create: (data) => api.post('/players', data),
    update: (id, data) => api.patch(`/players/${id}`, data),
    delete: (id) => api.delete(`/players/${id}`),
};

export const statService = {
    getAll: () => api.get('/statistics'),
    getByMatch: (matchId) => api.get(`/statistics?matchId=${matchId}`),
    getByPlayer: (playerId) => api.get(`/statistics?playerId=${playerId}`),
    create: (data) => api.post('/statistics', data),
    update: (id, data) => api.patch(`/statistics/${id}`, data),
    delete: (id) => api.delete(`/statistics/${id}`),
};

export const adminService = {
    getAll: () => api.get('/admins'),
    create: (data) => api.post('/admins', data),
    update: (id, data) => api.patch(`/admins/${id}`, data),
    delete: (id) => api.delete(`/admins/${id}`),
};

export const settingService = {
    get: () => api.get('/settings'),
    update: (data) => api.patch('/settings', data),
};

export const logService = {
    getAll: () => api.get('/logs'),
    create: (data) => api.post('/logs', { ...data, timestamp: new Date().toISOString() }),
};

export default api;
