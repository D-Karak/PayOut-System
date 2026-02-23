'use client';
/**
 * components/AddBeneficiaryForm.tsx
 */
import { useState } from 'react';
import { beneficiaryApi } from '@/lib/api';
import { UserPlus, X, Building2, Phone, Mail, CreditCard, Hash, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

const initialForm = {
    name: '', email: '', phone: '',
    bankAccount: { accountNumber: '', ifscCode: '', accountType: 'savings', bankName: '' }
};

export default function AddBeneficiaryForm({ onSuccess, onClose }: Props) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Valid email required';
        if (form.phone && !form.phone.match(/^\d{10}$/)) e.phone = 'Must be 10 digits';
        if (!form.bankAccount.accountNumber) e.accountNumber = 'Account number required';
        if (!form.bankAccount.ifscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/i))
            e.ifscCode = 'Invalid IFSC format (e.g. SBIN0001234)';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await beneficiaryApi.create({
                ...form,
                bankAccount: { ...form.bankAccount, ifscCode: form.bankAccount.ifscCode.toUpperCase() }
            });
            toast.success('Beneficiary added & registered with RazorpayX!');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add beneficiary.');
        } finally {
            setLoading(false);
        }
    };

    const field = (name: string, value: string, onChange: (v: string) => void, opts: {
        label: string; icon: React.ReactNode; placeholder: string; type?: string; error?: string;
    }) => (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{opts.label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    {opts.icon}
                </div>
                <input
                    type={opts.type || 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={opts.placeholder}
                    className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 ${opts.error ? 'border-red-500/60' : 'border-white/10'
                        }`}
                />
            </div>
            {opts.error && <p className="mt-1 text-xs text-red-400">{opts.error}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30">
                            <UserPlus className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Add Beneficiary</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Creates contact & fund account on RazorpayX</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {field('name', form.name, v => setForm(f => ({ ...f, name: v })), {
                        label: 'Full Name *', icon: <UserPlus className="h-4 w-4" />,
                        placeholder: 'John Doe', error: errors.name
                    })}
                    <div className="grid grid-cols-2 gap-4">
                        {field('email', form.email, v => setForm(f => ({ ...f, email: v })), {
                            label: 'Email Address *', icon: <Mail className="h-4 w-4" />,
                            placeholder: 'john@example.com', type: 'email', error: errors.email
                        })}
                        {field('phone', form.phone, v => setForm(f => ({ ...f, phone: v })), {
                            label: 'Phone Number', icon: <Phone className="h-4 w-4" />,
                            placeholder: '9876543210', error: errors.phone
                        })}
                    </div>

                    {/* Bank separator */}
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs text-slate-500 bg-slate-900 flex items-center gap-1.5">
                                <Building2 className="h-3 w-3" /> Bank Account Details
                            </span>
                        </div>
                    </div>

                    {field('accountNumber', form.bankAccount.accountNumber,
                        v => setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, accountNumber: v } })), {
                        label: 'Account Number *', icon: <CreditCard className="h-4 w-4" />,
                        placeholder: '1234567890123456', error: errors.accountNumber
                    })}
                    <div className="grid grid-cols-2 gap-4">
                        {field('ifscCode', form.bankAccount.ifscCode,
                            v => setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, ifscCode: v.toUpperCase() } })), {
                            label: 'IFSC Code *', icon: <Hash className="h-4 w-4" />,
                            placeholder: 'SBIN0001234', error: errors.ifscCode
                        })}
                        {field('bankName', form.bankAccount.bankName,
                            v => setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, bankName: v } })), {
                            label: 'Bank Name', icon: <Building2 className="h-4 w-4" />,
                            placeholder: 'State Bank of India'
                        })}
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Account Type</label>
                        <div className="flex gap-3">
                            {['savings', 'current'].map(type => (
                                <button key={type} type="button"
                                    onClick={() => setForm(f => ({ ...f, bankAccount: { ...f.bankAccount, accountType: type } }))}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${form.bankAccount.accountType === type
                                            ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                                            : 'bg-slate-800/60 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                            {loading ? 'Adding...' : 'Add Beneficiary'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
