'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Clock, 
  User, 
  Settings, 
  Building2,
  Activity,
  LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { INITIAL_USER } from '@/lib/mock-data';
import { getStoredProfile } from '@/lib/user-store';
import { UserProfile } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: 'Новый СМА',
    href: '/new-cma',
    icon: FilePlus2,
    badge: 'Новое',
  },
  {
    title: 'История',
    href: '/history',
    icon: Clock,
    badge: null,
  },
  {
    title: 'Профиль',
    href: '/profile',
    icon: User,
    badge: null,
  },
  {
    title: 'Настройки',
    href: '/settings',
    icon: Settings,
    badge: null,
  },
];

export function Sidebar() {
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

  return (
    <aside className="hidden md:flex w-72 border-r border-slate-200/80 bg-slate-50/50 flex-col h-screen sticky top-0 backdrop-blur-xl z-30 select-none">
      {/* App Logo */}
      <div className="p-6 pb-4 border-b border-slate-200/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">CMA Expert</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60">CRM</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Анализ рынка недвижимости</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Меню управления
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.title}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors',
                    isActive
                      ? 'bg-blue-500/30 text-white border border-white/20'
                      : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Info Card */}
      <div className="px-4 mb-4">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>База данных</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Avito & ЦИАН подключены</p>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200/70 bg-slate-100/50 flex items-center justify-between gap-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors group flex-1 min-w-0"
        >
          <div className="relative shrink-0">
            <img
              src={userProfile.photo || INITIAL_USER.photo}
              alt={userProfile.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {userProfile.name}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {userProfile.position}
            </div>
          </div>
        </Link>

        <button
          onClick={logout}
          title="Выйти из аккаунта"
          className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
