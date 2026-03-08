import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://progressiq-backend.onrender.com/api';

const API = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// ── Request: attach JWT + email header ──
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // ✅ Only send x-user-email when logged in
            // Prevents CORS error on signup/login routes
            if (email) config.headers['x-user-email'] = email;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response: handle errors globally ──
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('Network Error: backend may be sleeping.');
        }
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;