'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { useAuth } from '@/components/auth/auth-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAuth();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="min-h-screen w-full bg-slate-950">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Загрузка сессии CMA Expert...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white w-full">
      <MobileHeader />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
