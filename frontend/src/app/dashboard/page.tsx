'use client';
/**
 * app/dashboard/page.tsx — Admin Dashboard (Stats Overview)
 */
import { useState, useEffect } from 'react';
import { payoutApi } from '@/lib/api';
import {
    TrendingUp, Users, CheckCircle2, XCircle, Clock, IndianRupee, Send, Plus, Activity
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

interface Stats {
    total: number;
    beneficiaries: number;
    byStatus: Record<string, { count: number; amount: number }>;
    recentTransactions: any[];
}

function StatCard({ title, value, subtitle, icon, color, gradient }: {
    title: string; value: string | number; subtitle?: string;
    icon: React.ReactNode; color: string; gradient: string;
}) {
    return (
        <div className={`relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-2xl p-5 group hover:border-white/20 transition-all duration-300`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`} />
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                        {icon}
                    </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400 mt-1">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const { admin } = useAuth();

    useEffect(() => {
        payoutApi.getDashboardStats()
            .then(r => setStats(r.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const formatINR = (n: number) =>
        new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

    const processedAmount = stats?.byStatus?.processed?.amount || 0;
    const processedCount = stats?.byStatus?.processed?.count || 0;
    const failedCount = stats?.byStatus?.failed?.count || 0;
    const pendingCount = (stats?.byStatus?.pending?.count || 0) + (stats?.byStatus?.queued?.count || 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Good morning, <span className="gradient-text">{admin?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/beneficiaries"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all">
                        <Plus className="h-4 w-4" />
                        Add Beneficiary
                    </Link>
                    <Link href="/payouts"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
                        <Send className="h-4 w-4" />
                        New Payout
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 animate-pulse">
                            <div className="h-10 w-10 bg-slate-800 rounded-xl mb-4" />
                            <div className="h-6 w-20 bg-slate-800 rounded mb-2" />
                            <div className="h-4 w-32 bg-slate-800 rounded" />
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard
                            title="Total Payouts"
                            value={stats?.total || 0}
                            subtitle="All time"
                            icon={<Activity className="h-5 w-5 text-violet-400" />}
                            color="bg-violet-500/20"
                            gradient="bg-gradient-to-br from-violet-600/5 to-transparent"
                        />
                        <StatCard
                            title="Processed Amount"
                            value={`₹${formatINR(processedAmount)}`}
                            subtitle={`${processedCount} transactions`}
                            icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                            color="bg-emerald-500/20"
                            gradient="bg-gradient-to-br from-emerald-600/5 to-transparent"
                        />
                        <StatCard
                            title="Beneficiaries"
                            value={stats?.beneficiaries || 0}
                            subtitle="Active accounts"
                            icon={<Users className="h-5 w-5 text-blue-400" />}
                            color="bg-blue-500/20"
                            gradient="bg-gradient-to-br from-blue-600/5 to-transparent"
                        />
                        <StatCard
                            title="Pending/Failed"
                            value={pendingCount + failedCount}
                            subtitle={`${pendingCount} pending · ${failedCount} failed`}
                            icon={<Clock className="h-5 w-5 text-amber-400" />}
                            color="bg-amber-500/20"
                            gradient="bg-gradient-to-br from-amber-600/5 to-transparent"
                        />
                    </>
                )}
            </div>

            {/* Status Breakdown + Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Breakdown */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Status Breakdown</h2>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="h-6 w-20 bg-slate-800 rounded-full animate-pulse" />
                                    <div className="h-4 w-12 bg-slate-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : stats?.byStatus ? (
                        <div className="space-y-3">
                            {Object.entries(stats.byStatus).map(([status, data]) => (
                                <div key={status} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <StatusBadge status={status} />
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">{data.count}</p>
                                        <p className="text-xs text-slate-500">₹{formatINR(data.amount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
                        <Link href="/payouts" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                            View all →
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between animate-pulse">
                                    <div className="space-y-1">
                                        <div className="h-4 w-32 bg-slate-800 rounded" />
                                        <div className="h-3 w-20 bg-slate-800 rounded" />
                                    </div>
                                    <div className="h-6 w-16 bg-slate-800 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : stats?.recentTransactions?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                                <Send className="h-6 w-6 text-slate-600" />
                            </div>
                            <p className="text-sm text-slate-500">No payouts yet</p>
                            <Link href="/payouts" className="text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors">
                                Initiate your first payout
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats?.recentTransactions?.map((tx: any) => (
                                <div key={tx._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-white">{tx.beneficiary?.name || '—'}</p>
                                        <p className="text-xs text-slate-500">
                                            {format(new Date(tx.createdAt), 'dd MMM yyyy hh:mm a')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-white flex items-center gap-0.5">
                                                <IndianRupee className="h-3 w-3" />{tx.amount.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-slate-500">{tx.mode}</p>
                                        </div>
                                        <StatusBadge status={tx.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
