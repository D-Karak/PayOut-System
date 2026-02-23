'use client';
/**
 * hooks/usePayout.ts — Custom hook for payout operations
 */
import { useState, useEffect, useCallback } from 'react';
import { payoutApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Transaction {
    _id: string;
    beneficiary: { name: string; email: string };
    amount: number;
    status: string;
    referenceId: string;
    idempotencyKey: string;
    mode: string;
    purpose: string;
    narration: string;
    razorpayPayoutId?: string;
    utr?: string;
    failureReason?: string;
    createdAt: string;
    processedAt?: string;
}

interface PayoutState {
    transactions: Transaction[];
    stats: any;
    pagination: { total: number; page: number; pages: number };
    isLoading: boolean;
    error: string | null;
}

export function usePayout() {
    const [state, setState] = useState<PayoutState>({
        transactions: [],
        stats: null,
        pagination: { total: 0, page: 1, pages: 1 },
        isLoading: false,
        error: null,
    });

    const fetchPayouts = useCallback(async (params?: {
        page?: number; status?: string; search?: string;
    }) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const { data } = await payoutApi.getHistory(params);
            setState(prev => ({
                ...prev,
                transactions: data.data,
                pagination: data.pagination,
                isLoading: false,
            }));
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to fetch payout history.';
            setState(prev => ({ ...prev, error: msg, isLoading: false }));
        }
    }, []);

    const initiatePayout = useCallback(async (payoutData: {
        beneficiaryId: string;
        amount: number;
        purpose?: string;
        narration?: string;
        mode?: string;
    }) => {
        const loadingToast = toast.loading('Initiating payout...');
        try {
            const { data } = await payoutApi.initiate(payoutData);
            toast.dismiss(loadingToast);
            if (data.success) {
                toast.success('Payout initiated successfully!');
                fetchPayouts();
                return { success: true, transaction: data.transaction };
            }
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || 'Payout failed.');
            return { success: false };
        }
    }, [fetchPayouts]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    return { ...state, fetchPayouts, initiatePayout };
}
