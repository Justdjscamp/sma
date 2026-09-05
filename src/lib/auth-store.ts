import { UserAccount, UserProfile, UserRole } from '@/types';
import { INITIAL_USER } from './mock-data';

const USERS_STORAGE_KEY = 'cma_expert_user_accounts';
const SESSION_STORAGE_KEY = 'cma_expert_auth_session';

// Initial accounts (empty in production)
export const DEMO_ACCOUNTS: UserAccount[] = [];

// Initialize users storage if empty
export function getRegisteredAccounts(): UserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load accounts from localStorage', e);
    return [];
  }
}

// Get active logged-in user account
export function getCurrentSessionUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const activeId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!activeId) return null;
    const users = getRegisteredAccounts();
    return users.find((u) => u.id === activeId) || null;
  } catch (e) {
    console.error('Failed to load active auth session', e);
    return null;
  }
}

// Login verification
export function authenticateUser(email: string, passwordHash: string): { success: boolean; user?: UserAccount; error?: string } {
  const users = getRegisteredAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return { success: false, error: 'Пользователь с такой электронной почтой не найден.' };
  }

  if (found.passwordHash !== passwordHash) {
    return { success: false, error: 'Неверный пароль. Проверьте правильность ввода.' };
  }

  // Set active session
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, found.id);
    localStorage.setItem('cma_expert_user_profile', JSON.stringify(found.profile));
    window.dispatchEvent(new Event('cma_auth_state_changed'));
    window.dispatchEvent(new Event('cma_user_profile_updated'));
  }

  return { success: true, user: found };
}

// Register new account
export function registerUser(params: {
  email: string;
  passwordHash: string;
  name: string;
  company?: string;
  position?: string;
  role?: UserRole;
}): { success: boolean; user?: UserAccount; error?: string } {
  const users = getRegisteredAccounts();
  const normalizedEmail = params.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'Пользователь с таким Email уже зарегистрирован в системе.' };
  }

  const newId = `user-${Date.now()}`;
  const newAccount: UserAccount = {
    id: newId,
    email: normalizedEmail,
    passwordHash: params.passwordHash,
    role: params.role || 'realtor',
    createdAt: new Date().toISOString().split('T')[0],
    profile: {
      id: newId,
      name: params.name,
      phone: '+7 (900) 000-00-00',
      email: normalizedEmail,
      company: params.company || 'Агентство Недвижимости',
      position: params.position || 'Риелтор',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      companyLogo: 'https://images.unsplash.com/photo-1542744094-3a31727223ec?w=200&auto=format&fit=crop&q=80',
      role: params.role || 'realtor',
    },
  };

  const updatedUsers = [...users, newAccount];

  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
    localStorage.setItem('cma_expert_user_profile', JSON.stringify(newAccount.profile));
    window.dispatchEvent(new Event('cma_auth_state_changed'));
    window.dispatchEvent(new Event('cma_user_profile_updated'));
  }

  return { success: true, user: newAccount };
}

// Logout session
export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event('cma_auth_state_changed'));
    window.dispatchEvent(new Event('cma_user_profile_updated'));
  }
}

// Update active account profile
export function updateActiveUserProfile(profileData: UserProfile): void {
  const currentUser = getCurrentSessionUser();
  if (!currentUser || typeof window === 'undefined') return;

  const users = getRegisteredAccounts();
  const updatedUsers = users.map((u) => {
    if (u.id === currentUser.id) {
      return {
        ...u,
        profile: {
          ...u.profile,
          ...profileData,
        },
      };
    }
    return u;
  });

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  localStorage.setItem('cma_expert_user_profile', JSON.stringify(profileData));
  window.dispatchEvent(new Event('cma_user_profile_updated'));
}
