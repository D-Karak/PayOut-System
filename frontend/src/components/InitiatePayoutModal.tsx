'use client';
/**
 * components/InitiatePayoutModal.tsx
 */
import { useState, useEffect } from 'react';
import { beneficiaryApi } from '@/lib/api';
import { Send, X, ChevronDown, IndianRupee } from 'lucide-react';

interface Props {
    onClose: () => void;
    onInitiate: (data: {
        beneficiaryId: string; amount: number; purpose?: string; narration?: string; mode?: string;
    }) => Promise<any>;
}

interface Beneficiary { _id: string; name: string; email: string; bankAccount: any; }

const PURPOSES = ['payout', 'salary', 'utility_bill', 'vendor_payment', 'cashback', 'refund'];
const MODES = ['IMPS', 'NEFT', 'RTGS']; // UPI removed — requires VPA fund account type, not bank_account

export default function InitiatePayoutModal({ onClose, onInitiate }: Props) {
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        beneficiaryId: '', amount: '', purpose: 'payout', narration: '', mode: 'IMPS'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        beneficiaryApi.getAll({ limit: 100 }).then(r => setBeneficiaries(r.data.data)).catch(() => { });
    }, []);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.beneficiaryId) e.beneficiaryId = 'Select a beneficiary';
        if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 1) e.amount = 'Enter a valid amount (min ₹1)';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        await onInitiate({
            beneficiaryId: form.beneficiaryId,
            amount: Number(form.amount),
            purpose: form.purpose,
            narration: form.narration,
            mode: form.mode,
        });
        setLoading(false);
        onClose();
    };

    const selectedBeneficiary = beneficiaries.find(b => b._id === form.beneficiaryId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30">
                            <Send className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Initiate Payout</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Funds via RazorpayX</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Beneficiary */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Beneficiary *</label>
                        <div className="relative">
                            <select
                                value={form.beneficiaryId}
                                onChange={e => setForm(f => ({ ...f, beneficiaryId: e.target.value }))}
                                className={`w-full appearance-none bg-slate-800/60 border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all ${errors.beneficiaryId ? 'border-red-500/60' : 'border-white/10'
                                    }`}
                            >
                                <option value="" className="bg-slate-800">Select beneficiary...</option>
                                {beneficiaries.map(b => (
                                    <option key={b._id} value={b._id} className="bg-slate-800">
                                        {b.name} — {b.email}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                        </div>
                        {errors.beneficiaryId && <p className="mt-1 text-xs text-red-400">{errors.beneficiaryId}</p>}
                        {selectedBeneficiary && (
                            <div className="mt-2 p-2.5 bg-slate-800/60 rounded-lg border border-white/5">
                                <p className="text-xs text-slate-400">
                                    Bank: <span className="text-white">{selectedBeneficiary.bankAccount?.bankName || 'N/A'}</span>
                                    {' · '}
                                    A/C: <span className="text-white font-mono">
                                        {'•'.repeat(8)}{selectedBeneficiary.bankAccount?.accountNumber?.slice(-4)}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (₹) *</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="number" min="1" step="0.01"
                                value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                placeholder="0.00"
                                className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all ${errors.amount ? 'border-red-500/60' : 'border-white/10'
                                    }`}
                            />
                        </div>
                        {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Purpose */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Purpose</label>
                            <div className="relative">
                                <select
                                    value={form.purpose}
                                    onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                                    className="w-full appearance-none bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all capitalize"
                                >
                                    {PURPOSES.map(p => <option key={p} value={p} className="bg-slate-800 capitalize">{p}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                        {/* Mode */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Transfer Mode</label>
                            <div className="relative">
                                <select
                                    value={form.mode}
                                    onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                                    className="w-full appearance-none bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                >
                                    {MODES.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Narration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Narration</label>
                        <input
                            type="text" maxLength={100}
                            value={form.narration}
                            onChange={e => setForm(f => ({ ...f, narration: e.target.value }))}
                            placeholder="Invoice payment for services..."
                            className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                        />
                    </div>

                    {/* Security notice */}
                    <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <span className="text-amber-400 text-xs mt-0.5">⚠️</span>
                        <p className="text-xs text-amber-300/70">
                            Payouts are irreversible. An idempotency key will be auto-generated to prevent duplicate transfers.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? 'Processing...' : <><Send className="h-4 w-4" /> Send Payout</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
