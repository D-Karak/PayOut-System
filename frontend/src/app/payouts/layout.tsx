'use client';
/**
 * app/payouts/layout.tsx
 */
import DashboardLayout from '@/app/dashboard/layout';

export default function PayoutsLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
