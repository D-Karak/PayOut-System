'use client';
/**
 * app/payouts/page.tsx — Payouts Management Page
 */
import { useState, useCallback, useEffect } from 'react';
import { usePayout } from '@/hooks/usePayout';
import PayoutTable from '@/components/PayoutTable';
import InitiatePayoutModal from '@/components/InitiatePayoutModal';
import { Send, Zap, IndianRupee, TrendingUp } from 'lucide-react';

export default function PayoutsPage() {
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { transactions, isLoading, pagination, fetchPayouts, initiatePayout } = usePayout();

    const handleFilterChange = useCallback((status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearch(query);
        setCurrentPage(1);
    }, []);

    useEffect(() => {
        fetchPayouts({ page: currentPage, status: statusFilter !== 'all' ? statusFilter : undefined, search });
    }, [fetchPayouts, currentPage, statusFilter, search]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Payouts</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage and track all RazorpayX payout transactions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
                >
                    <Send className="h-4 w-4" /> Initiate Payout
                </button>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/30 flex-shrink-0">
                    <Zap className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-white">Idempotency Protected</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Each payout request is automatically assigned a unique UUID key to prevent duplicate transactions.
                        Webhook callbacks from RazorpayX automatically update payout statuses.
                    </p>
                </div>
            </div>

            {/* Table */}
            <PayoutTable
                transactions={transactions}
                isLoading={isLoading}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                currentFilter={statusFilter}
                pagination={pagination}
                onPageChange={setCurrentPage}
            />

            {/* Modal */}
            {showModal && (
                <InitiatePayoutModal
                    onClose={() => setShowModal(false)}
                    onInitiate={initiatePayout}
                />
            )}
        </div>
    );
}
