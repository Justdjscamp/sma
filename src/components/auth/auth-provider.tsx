'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserAccount, UserProfile } from '@/types';
import {
  getCurrentSessionUser,
  authenticateUser,
  registerUser,
  logoutUser,
  DEMO_ACCOUNTS,
} from '@/lib/auth-store';

interface AuthContextType {
  user: UserAccount | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: typeof authenticateUser;
  register: typeof registerUser;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshAuth = () => {
    const current = getCurrentSessionUser();
    setUser(current);
    setLoading(false);
  };

  useEffect(() => {
    refreshAuth();

    const handleAuthChange = () => {
      refreshAuth();
    };

    window.addEventListener('cma_auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('cma_auth_state_changed', handleAuthChange);
  }, []);

  // Route protection redirect
  useEffect(() => {
    if (!loading) {
      const isPublicPath = pathname === '/login';
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isPublicPath) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    router.push('/login');
  };

  const handleSwitchUser = (userId: string) => {
    const target = DEMO_ACCOUNTS.find((a) => a.id === userId);
    if (target) {
      authenticateUser(target.email, target.passwordHash);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user ? user.profile : null,
        isAuthenticated: Boolean(user),
        loading,
        login: authenticateUser,
        register: registerUser,
        logout: handleLogout,
        switchUser: handleSwitchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
