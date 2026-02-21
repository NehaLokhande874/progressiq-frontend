import axios from 'axios';

/**
 * 🚀 PROPER AXIOS CONFIGURATION FOR PRODUCTION
 * Backend: Render (Live)
 */

const API = axios.create({
    // ✅ IMPORTANT: Shevti '/api' add kela aahe backend routes match karnya sathi
    baseURL: "https://progressiq-backend.onrender.com/api", 
    
    // Timeout 30s aahe, je Render free tier sathi barobar aahe
    timeout: 30000, 
    
    headers: {
        "Content-Type": "application/json"
    }
});

// 🔒 REQUEST INTERCEPTOR: Token pathvnya sathi
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debugging: Console madhe ata barobar full path disel
    console.log(`📡 Sending Request to: ${config.baseURL}${config.url}`);
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🛠️ RESPONSE INTERCEPTOR: Error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error("❌ Network Error: Server 'sleep' mode madhe asu shakto.");
        } else if (error.response.status === 401) {
            console.warn("⚠️ Unauthorized! Please login again.");
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export default API;