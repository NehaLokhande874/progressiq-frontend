import axios from 'axios';

const API = axios.create({
    // ✅ FIXED: Added '/api' at the end of baseURL to match backend routes
    baseURL: 'https://progressiq-backend.onrender.com/api', 
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
    // Debugging sathi: Console madhe full URL disel
    console.log(`Sending Request to: ${config.baseURL}${config.url}`);
    return config;
}, (error) => Promise.reject(error));

// Response interceptor for error handling
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            console.error("Network Error: Check if Render backend is Live or sleeping.");
        }
        // Redirect to login if token is invalid/expired
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;