import axios from 'axios';

/**
 * 🚀 FINAL CORRECTED AXIOS CONFIGURATION
 * Backend: Render (Live)
 * Frontend: Vercel (Live)
 */

const API = axios.create({
    // ✅ FIXED: Corrected spelling from 'progressiq' to 'progresiq' to match Render URL
    baseURL: "https://progresiq-backend.onrender.com/api", 
    
    // ⏳ 30s timeout is perfect for Render's free tier "spin-up" time
    timeout: 30000, 
    
    headers: {
        "Content-Type": "application/json"
    }
});

// 🔒 REQUEST INTERCEPTOR: Automatically adds the token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debugging: Helps you see exactly where the data is going in the Console
    console.log(`📡 Sending Request to: ${config.baseURL}${config.url}`);
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🛠️ RESPONSE INTERCEPTOR: Handles server wake-up and auth errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error("❌ Network Error: Check if Render backend is 'Live' or sleeping.");
        } else if (error.response.status === 401) {
            console.warn("⚠️ Session Expired: Redirecting to login.");
            localStorage.removeItem('token');
            localStorage.removeItem('email'); // Clear email too for a clean state
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;