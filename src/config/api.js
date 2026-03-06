export const getApiUrl = () => {
    // Return backend API URL or standard json-server one. In a real app we'd use environment variables
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};
