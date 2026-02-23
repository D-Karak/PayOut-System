'use client';
/**
 * app/login/page.tsx — Admin Login Page
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Zap, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) router.replace('/dashboard');
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        const success = await login(email, password);
        if (success) router.replace('/dashboard');
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-950 bg-mesh flex items-center justify-center p-4">
            {/* Decorative blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="glass-card rounded-3xl p-8 shadow-2xl">
                    {/* Brand */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/30 mb-4">
                            <Zap className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">PayoutSystem</h1>
                        <p className="text-sm text-slate-400 mt-1">Secure Admin Portal</p>
                    </div>

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto w-fit">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-300 font-medium">256-bit SSL • JWT Protected</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@payoutsystem.com"
                                    required
                                    autoComplete="email"
                                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            id="login-btn"
                            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    'Login to Dashboard'
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Security notice */}
                    <div className="mt-6 p-3 bg-slate-800/40 border border-white/5 rounded-xl">
                        <p className="text-xs text-slate-500 text-center">
                            🔒 Contact your system administrator for credentials.
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    RazorpayX Business Payout System • All rights reserved
                </p>
            </div>
        </main>
    );
}
