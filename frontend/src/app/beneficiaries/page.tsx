'use client';
/**
 * app/beneficiaries/page.tsx — Beneficiaries Management
 */
import { useState, useEffect, useCallback } from 'react';
import { beneficiaryApi } from '@/lib/api';
import AddBeneficiaryForm from '@/components/AddBeneficiaryForm';
import { Users, Plus, Trash2, Search, Building2, Phone, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Beneficiary {
    _id: string; name: string; email: string; phone?: string;
    bankAccount: { accountNumber: string; ifscCode: string; bankName?: string; accountType: string };
    razorpayContactId?: string; razorpayFundAccountId?: string; createdAt: string;
}

export default function BeneficiariesPage() {
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    const fetchBeneficiaries = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await beneficiaryApi.getAll({ page, limit: 12, search });
            setBeneficiaries(data.data);
            setPagination(data.pagination);
        } catch { toast.error('Failed to load beneficiaries.'); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchBeneficiaries(), 300);
        return () => clearTimeout(timer);
    }, [fetchBeneficiaries]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove ${name} as a beneficiary?`)) return;
        try {
            await beneficiaryApi.delete(id);
            toast.success(`${name} removed.`);
            fetchBeneficiaries();
        } catch { toast.error('Failed to remove beneficiary.'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Beneficiaries</h1>
                    <p className="text-slate-400 text-sm mt-1">{pagination.total} registered recipients</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"
                >
                    <Plus className="h-4 w-4" /> Add Beneficiary
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text" placeholder="Search by name or email..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 bg-slate-800 rounded-full" />
                                <div className="space-y-1.5">
                                    <div className="h-4 w-28 bg-slate-800 rounded" />
                                    <div className="h-3 w-40 bg-slate-800 rounded" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-slate-800 rounded" />
                                <div className="h-3 w-3/4 bg-slate-800 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : beneficiaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 bg-slate-900/50 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium">{search ? 'No beneficiaries found' : 'No beneficiaries yet'}</p>
                    <p className="text-slate-600 text-sm mt-1">
                        {search ? 'Try a different search term' : 'Add your first beneficiary to start sending payouts'}
                    </p>
                    {!search && (
                        <button onClick={() => setShowForm(true)}
                            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-500/30 text-sm text-violet-400 hover:bg-violet-500/10 transition-all">
                            <Plus className="h-4 w-4" /> Add Beneficiary
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {beneficiaries.map(b => (
                        <div key={b._id} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
                            {/* Avatar & Name */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 text-sm font-bold text-violet-300">
                                        {b.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{b.name}</p>
                                        <p className="text-xs text-slate-500">{b.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(b._id, b.name)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Bank Info */}
                            <div className="space-y-2 mb-4 p-3 bg-slate-800/40 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                    <p className="text-xs text-slate-400">
                                        {b.bankAccount.bankName || 'Bank'} · <span className="text-slate-500">{b.bankAccount.accountType}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-mono">
                                        {'•'.repeat(8)}{b.bankAccount.accountNumber.slice(-4)}
                                    </span>
                                    <span className="text-slate-600">·</span>
                                    <span className="text-xs font-mono text-slate-400">{b.bankAccount.ifscCode}</span>
                                </div>
                                {b.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="text-xs text-slate-400">{b.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* RazorpayX Status */}
                            <div className="flex items-center justify-between">
                                {b.razorpayFundAccountId ? (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        <span>RazorpayX Verified</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                                        <span>⏳ Pending RazorpayX</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.pages }).map((_, i) => (
                        <button key={i} onClick={() => fetchBeneficiaries(i + 1)}
                            className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${pagination.page === i + 1
                                    ? 'bg-violet-600 text-white'
                                    : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Add Form Modal */}
            {showForm && (
                <AddBeneficiaryForm
                    onSuccess={() => { setShowForm(false); fetchBeneficiaries(); }}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
}
