const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const config = {
    apiUrl: API_URL,
    endpoints: {
        admins: '/admins',
        players: '/players',
        teams: '/teams',
        groups: '/groups',
        matches: '/matches',
        statistics: '/statistics',
        auth: '/api/auth',
        settings: '/settings',
        logs: '/logs'
    }
};

export default config;
