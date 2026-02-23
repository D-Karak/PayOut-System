/**
 * lib/axiosInstance.ts — Axios configuration with JWT interceptors
 */
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach JWT ─────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('payout_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 (token expired) ────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('payout_token');
            localStorage.removeItem('payout_admin');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
