/**
 * lib/api.ts — API utility functions
 */
import axiosInstance from './axiosInstance';
import { v4 as uuidv4 } from 'uuid';

// ─── Auth API ─────────────────────────────────────────────────────────
export const authApi = {
    login: (email: string, password: string) =>
        axiosInstance.post('/auth/login', { email, password }),
    getMe: () => axiosInstance.get('/auth/me'),
    logout: () => axiosInstance.post('/auth/logout'),
};

// ─── Beneficiary API ──────────────────────────────────────────────────
export const beneficiaryApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
        axiosInstance.get('/beneficiaries', { params }),
    getById: (id: string) => axiosInstance.get(`/beneficiaries/${id}`),
    create: (data: object) => axiosInstance.post('/beneficiaries', data),
    delete: (id: string) => axiosInstance.delete(`/beneficiaries/${id}`),
};

// ─── Payout API ───────────────────────────────────────────────────────
export const payoutApi = {
    getHistory: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
        axiosInstance.get('/payouts', { params }),
    getById: (id: string) => axiosInstance.get(`/payouts/${id}`),
    getDashboardStats: () => axiosInstance.get('/payouts/stats/dashboard'),
    initiate: (data: {
        beneficiaryId: string;
        amount: number;
        purpose?: string;
        narration?: string;
        mode?: string;
    }) => axiosInstance.post('/payouts', data, {
        headers: { 'X-Idempotency-Key': uuidv4() },
    }),
};
