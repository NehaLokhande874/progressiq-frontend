import axios from 'axios';

// ✅ Vite uses import.meta.env, NOT process.env
const BASE_URL = import.meta.env.VITE_API_URL || 'https://progressiq-backend.onrender.com/api';

const API = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// ── Request interceptor: attach JWT token ──
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle errors globally ──
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('Network Error: Render backend may be sleeping (cold start).');
        }
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;