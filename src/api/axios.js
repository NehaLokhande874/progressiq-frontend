import axios from 'axios';

// 💡 Automatic IP Detection Logic:
// Jar tu laptop varun ughadla tar 'localhost' gheil, 
// ani mobile varun ughadla tar automatic laptop cha IP shodhel.
const currentHost = window.location.hostname || 'localhost';

const API = axios.create({
    // Backend Port 5000 aahe he confirm kara
    baseURL: `http://${currentHost}:5000/api`,
    timeout: 10000, // 10 seconds timeout jyamule "Timed Out" error kami hotil
});

// Request Interceptor: Token ani Headers manage karnyasaathi
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debugging sathi console log (optional - production madhe kadhu shakto)
    console.log(`📡 Requesting: ${config.baseURL}${config.url}`);
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Error handling sathi
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error("❌ Network Error: Backend chalu aahe ka check kara!");
        }
        return Promise.reject(error);
    }
);

export default API;