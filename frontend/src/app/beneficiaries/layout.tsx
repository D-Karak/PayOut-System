'use client';
/**
 * app/beneficiaries/layout.tsx — Layout wrapper for beneficiaries
 */
import DashboardLayout from '@/app/dashboard/layout';

export default function BeneficiariesLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
