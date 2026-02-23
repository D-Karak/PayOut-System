'use client';
/**
 * components/StatusBadge.tsx — Payout Status Indicator
 */

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
    pending: {
        label: 'Pending',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400 animate-pulse',
    },
    queued: {
        label: 'Queued',
        className: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dot: 'bg-blue-400 animate-pulse',
    },
    processing: {
        label: 'Processing',
        className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dot: 'bg-cyan-400 animate-pulse',
    },
    processed: {
        label: 'Success',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-500/15 text-red-300 border-red-500/30',
        dot: 'bg-red-400',
    },
    reversed: {
        label: 'Reversed',
        className: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        dot: 'bg-orange-400',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        dot: 'bg-slate-400',
    },
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        dot: 'bg-slate-400',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}
