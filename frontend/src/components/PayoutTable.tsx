'use client';
/**
 * components/PayoutTable.tsx — Payout History Table
 */
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { Search, ArrowUpDown, ExternalLink, IndianRupee, Filter } from 'lucide-react';

interface Transaction {
    _id: string;
    beneficiary: { name: string; email: string };
    amount: number;
    status: string;
    referenceId: string;
    mode: string;
    purpose: string;
    narration: string;
    razorpayPayoutId?: string;
    utr?: string;
    failureReason?: string;
    createdAt: string;
}

interface Props {
    transactions: Transaction[];
    isLoading: boolean;
    onFilterChange: (status: string) => void;
    onSearch: (query: string) => void;
    currentFilter: string;
    pagination: { total: number; page: number; pages: number };
    onPageChange: (page: number) => void;
}

const STATUS_FILTERS = ['all', 'pending', 'queued', 'processed', 'failed', 'reversed'];

export default function PayoutTable({
    transactions, isLoading, onFilterChange, onSearch, currentFilter, pagination, onPageChange
}: Props) {
    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 border-b border-white/10">
                <div>
                    <h2 className="text-base font-semibold text-white">Payout History</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{pagination.total} total transactions</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search beneficiary..."
                            onChange={e => onSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 w-full sm:w-52 transition-all"
                        />
                    </div>
                    {/* Filter */}
                    <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl p-1">
                        {STATUS_FILTERS.map(s => (
                            <button key={s} onClick={() => onFilterChange(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${currentFilter === s
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['Beneficiary', 'Amount', 'Mode', 'Status', 'Reference', 'UTR', 'Date', ''].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-4 bg-slate-800 rounded-lg animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-16 text-center">
                                    <p className="text-slate-500 text-sm">No transactions found</p>
                                    <p className="text-slate-600 text-xs mt-1">Initiate a payout to see it here</p>
                                </td>
                            </tr>
                        ) : transactions.map(tx => (
                            <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-4">
                                    <p className="text-sm font-medium text-white">{tx.beneficiary?.name || '—'}</p>
                                    <p className="text-xs text-slate-500">{tx.beneficiary?.email || ''}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-0.5">
                                        <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-sm font-semibold text-white">
                                            {tx.amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                                        {tx.mode}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={tx.status} />
                                    {tx.failureReason && (
                                        <p className="text-xs text-red-400 mt-1 max-w-[160px] truncate" title={tx.failureReason}>
                                            {tx.failureReason}
                                        </p>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    <code className="text-xs text-violet-300/80 font-mono">{tx.referenceId}</code>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs text-slate-400 font-mono">{tx.utr || '—'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-xs text-slate-400">
                                        {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {format(new Date(tx.createdAt), 'hh:mm a')}
                                    </p>
                                </td>
                                <td className="px-5 py-4">
                                    {tx.razorpayPayoutId && (
                                        <a href={`https://dashboard.razorpay.com/app/payouts/${tx.razorpayPayoutId}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="text-slate-500 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
                    <p className="text-xs text-slate-500">
                        Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
