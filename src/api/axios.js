import axios from 'axios';

const API = axios.create({
    // This will prioritize the Vercel Environment Variable, or fall back to your Render URL
    baseURL: process.env.REACT_APP_API_URL || 'https://progressiq-backend.onrender.com/api', 
    timeout: 60000,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

// Request interceptor for token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Sending Request to: ${config.baseURL}${config.url}`);
    return config;
}, (error) => Promise.reject(error));

// Response interceptor
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            console.error("Network Error: Check if Render backend is Live or sleeping.");
        }
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;