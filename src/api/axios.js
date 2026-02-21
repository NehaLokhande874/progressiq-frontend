import axios from 'axios';

/**
 * 🚀 PROPER AXIOS CONFIGURATION FOR PRODUCTION
 * Backend: Render (Live)
 * Frontend: ProgressIQ
 */

const API = axios.create({
    // Important: Render chi link quotes madhe asavi lagte
    baseURL: "https://progressiq-backend.onrender.com", 
    
    // Timeout vadhvla aahe karan Render free tier la uthayla vel lagto
    timeout: 30000, 
    
    headers: {
        "Content-Type": "application/json"
    }
});

// 🔒 REQUEST INTERCEPTOR: Token pathvnya sathi
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        // 'Bearer ' space sobt nehami vapra
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debugging sathi (Development madhe useful aahe)
    console.log(`📡 Sending Request to: ${config.baseURL}${config.url}`);
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🛠️ RESPONSE INTERCEPTOR: Error handling sathi
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Render "Spin down" asel tar ha error yeu shakto
            console.error("❌ Network Error: Server 'sleep' mode madhe asu shakto. 50 sec thamba.");
        } else if (error.response.status === 401) {
            // Jar token expired jhala tar
            console.warn("⚠️ Unauthorized! Please login again.");
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export default API;