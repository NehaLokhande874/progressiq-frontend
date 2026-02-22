import axios from 'axios';

/**
 * 🚀 OPTIMIZED AXIOS CONFIGURATION
 * Optimized for Render's Free Tier (50s+ Spin-up time)
 */

const API = axios.create({
    // ✅ FIXED: correct URL (double 'ss') + no /health at the end
    baseURL: 'https://progressiq-backend.onrender.com',
    
    // ⏳ INCREASED TIMEOUT: Render's free tier needs up to 60s to wake up.
    timeout: 60000, 
    
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

// 🔒 REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 Sending Request to: ${config.baseURL}${config.url}`);
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🛠️ RESPONSE INTERCEPTOR
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            console.error("🚨 Network Error: Check if Render backend is 'Live' or sleeping.");
        }
        
        if (error.response && error.response.status === 401) {
            console.warn("⚠️ Session Expired.");
            localStorage.clear();
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default API;