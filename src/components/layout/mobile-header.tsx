'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Menu,
  X,
  LayoutDashboard,
  FilePlus2,
  Clock,
  User,
  Settings,
  Activity,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INITIAL_USER } from '@/lib/mock-data';
import { getStoredProfile } from '@/lib/user-store';
import { UserProfile } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

const NAV_ITEMS = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
  { title: 'Новый СМА', href: '/new-cma', icon: FilePlus2, badge: 'Новое' },
  { title: 'История', href: '/history', icon: Clock, badge: null },
  { title: 'Профиль', href: '/profile', icon: User, badge: null },
  { title: 'Настройки', href: '/settings', icon: Settings, badge: null },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);

  useEffect(() => {
    const updateProfile = () => {
      const loaded = getStoredProfile();
      if (loaded) setUserProfile(loaded);
    };

    updateProfile();
    window.addEventListener('cma_user_profile_updated', updateProfile);
    return () => window.removeEventListener('cma_user_profile_updated', updateProfile);
  }, []);

  // Close mobile drawer when navigating to a new route
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 select-none">
      {/* Top Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight">CMA Expert</span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              CRM
            </span>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-between animate-in fade-in duration-200">
          <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
            <div className="px-2 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Меню управления
            </div>

            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all',
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile Footer in Mobile Drawer */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-200 hover:text-white"
            >
              <img
                src={userProfile.photo || INITIAL_USER.photo}
                alt={userProfile.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
              <div className="text-xs font-semibold">
                <div className="text-white truncate">{userProfile.name}</div>
                <div className="text-slate-400 text-[11px] truncate">{userProfile.position}</div>
              </div>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              title="Выйти из аккаунта"
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
