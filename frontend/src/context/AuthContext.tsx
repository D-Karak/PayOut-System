'use client';
/**
 * context/AuthContext.tsx — Global Admin Auth State
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Admin {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLogin?: string;
}

interface AuthContextType {
    admin: Admin | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('payout_token');
        const storedAdmin = localStorage.getItem('payout_admin');
        if (storedToken && storedAdmin) {
            setToken(storedToken);
            setAdmin(JSON.parse(storedAdmin));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const { data } = await authApi.login(email, password);
            if (data.success) {
                setToken(data.token);
                setAdmin(data.admin);
                localStorage.setItem('payout_token', data.token);
                localStorage.setItem('payout_admin', JSON.stringify(data.admin));
                toast.success(`Welcome back, ${data.admin.name}!`);
                return true;
            }
            return false;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        authApi.logout().catch(() => { });
        setAdmin(null);
        setToken(null);
        localStorage.removeItem('payout_token');
        localStorage.removeItem('payout_admin');
        toast.success('Logged out successfully.');
        window.location.href = '/login';
    }, []);

    return (
        <AuthContext.Provider value={{
            admin,
            token,
            isLoading,
            isAuthenticated: !!token && !!admin,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
