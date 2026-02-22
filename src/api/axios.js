import axios from 'axios';

const API = axios.create({
    baseURL: 'https://progressiq-backend.onrender.com',
    timeout: 60000,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Sending Request to: ${config.baseURL}${config.url}`);
    return config;
}, (error) => Promise.reject(error));

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