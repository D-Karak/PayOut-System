'use client';
/**
 * components/Navbar.tsx — Admin Dashboard Navigation
 */
import { useAuth } from '@/context/AuthContext';
import { LogOut, Zap, User, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/beneficiaries', label: 'Beneficiaries' },
    { href: '/payouts', label: 'Payouts' },
];

export default function Navbar() {
    const { admin, logout } = useAuth();
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Brand */}
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg group-hover:shadow-violet-500/25 transition-shadow">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">
                            Payout<span className="text-violet-400">System</span>
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === link.href
                                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold">
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-white leading-none">{admin?.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{admin?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="ml-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 border border-transparent hover:border-red-400/20"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
