import { UserAccount, UserProfile, UserRole } from '@/types';
import { INITIAL_USER } from './mock-data';

const USERS_STORAGE_KEY = 'cma_expert_user_accounts';
const SESSION_STORAGE_KEY = 'cma_expert_auth_session';

export const DEMO_ACCOUNTS: UserAccount[] = [];

// Initialize users storage cache if needed
export function getRegisteredAccounts(): UserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load accounts from localStorage', e);
    return [];
  }
}

// Get active cached user account
export function getCurrentSessionUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const activeId = localStorage.getItem(SESSION_STORAGE_KEY);
    const cachedProfile = localStorage.getItem('cma_expert_user_profile');
    if (!activeId && !cachedProfile) return null;

    const users = getRegisteredAccounts();
    const found = users.find((u) => u.id === activeId);
    if (found) return found;

    if (cachedProfile) {
      const parsed = JSON.parse(cachedProfile);
      return {
        id: parsed.id || activeId || 'user-current',
        email: parsed.email || '',
        passwordHash: '',
        role: parsed.role || 'realtor',
        createdAt: new Date().toISOString().split('T')[0],
        profile: parsed,
      };
    }

    return null;
  } catch (e) {
    console.error('Failed to load active auth session', e);
    return null;
  }
}

// Check server session on mount
export async function fetchServerSessionUser(): Promise<UserAccount | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.authenticated && data.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, data.user.id);
        localStorage.setItem('cma_expert_user_profile', JSON.stringify(data.user.profile));
        window.dispatchEvent(new Event('cma_auth_state_changed'));
        window.dispatchEvent(new Event('cma_user_profile_updated'));
      }
      return data.user;
    }
    return null;
  } catch (err) {
    console.warn('Could not verify server session:', err);
    return getCurrentSessionUser();
  }
}

// Login verification (Calls Server API)
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Неверный логин или пароль.' };
    }

    const user: UserAccount = data.user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, user.id);
      localStorage.setItem('cma_expert_user_profile', JSON.stringify(user.profile));
      window.dispatchEvent(new Event('cma_auth_state_changed'));
      window.dispatchEvent(new Event('cma_user_profile_updated'));
    }

    return { success: true, user };
  } catch (err) {
    console.error('Login request failed:', err);
    return { success: false, error: 'Ошибка соединения с сервером авторизации.' };
  }
}

// Register new account (Calls Server API)
export async function registerUser(params: {
  email: string;
  passwordHash: string; // Plain password passed here
  name: string;
  company?: string;
  position?: string;
  role?: UserRole;
  phone?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email,
        password: params.passwordHash,
        name: params.name,
        company: params.company,
        position: params.position,
        role: params.role,
        phone: params.phone,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Не удалось зарегистрировать пользователя.' };
    }

    const user: UserAccount = data.user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, user.id);
      localStorage.setItem('cma_expert_user_profile', JSON.stringify(user.profile));
      window.dispatchEvent(new Event('cma_auth_state_changed'));
      window.dispatchEvent(new Event('cma_user_profile_updated'));
    }

    return { success: true, user };
  } catch (err) {
    console.error('Registration request failed:', err);
    return { success: false, error: 'Ошибка связи с сервером при регистрации.' };
  }
}

// Logout session (Calls Server API)
export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout API failed:', e);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('cma_expert_user_profile');
      window.dispatchEvent(new Event('cma_auth_state_changed'));
      window.dispatchEvent(new Event('cma_user_profile_updated'));
    }
  }
}

// Update active account profile on server
export async function updateActiveUserProfile(profileData: UserProfile): Promise<void> {
  try {
    await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
  } catch (e) {
    console.warn('Profile update API failed:', e);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cma_expert_user_profile', JSON.stringify(profileData));
      window.dispatchEvent(new Event('cma_user_profile_updated'));
    }
  }
}
