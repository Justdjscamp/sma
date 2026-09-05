import { UserProfile } from '@/types';
import { INITIAL_USER } from './mock-data';

const PROFILE_STORAGE_KEY = 'cma_expert_user_profile';
const SETTINGS_STORAGE_KEY = 'cma_expert_system_settings';

export interface SystemSettings {
  language: string;
  currency: string;
  timezone: string;
  emailNotify: boolean;
  pushNotify: boolean;
  smsNotify: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  language: 'ru',
  currency: 'RUB',
  timezone: 'Europe/Moscow',
  emailNotify: true,
  pushNotify: true,
  smsNotify: false,
};

// Profile persistence
export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return INITIAL_USER;
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(INITIAL_USER));
      return INITIAL_USER;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load user profile from localStorage', e);
    return INITIAL_USER;
  }
}

export function saveProfile(profile: UserProfile): UserProfile {
  if (typeof window === 'undefined') return profile;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    // Dispatch custom event so reactive components (sidebar, modals) update immediately
    window.dispatchEvent(new Event('cma_user_profile_updated'));
    return profile;
  } catch (e) {
    console.error('Failed to save user profile to localStorage', e);
    return profile;
  }
}

// Settings persistence
export function getStoredSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SystemSettings): SystemSettings {
  if (typeof window === 'undefined') return settings;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('cma_settings_updated'));
    return settings;
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
    return settings;
  }
}
