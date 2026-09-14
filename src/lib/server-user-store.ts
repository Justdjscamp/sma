import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, UserRole } from '@/types';

export interface ServerUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: string;
  profile: UserProfile;
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function getAllUsers(): ServerUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Initialize default demo user (Pavel Khasanov) if file does not exist
    const defaultSalt = crypto.randomBytes(16).toString('hex');
    const defaultUser: ServerUser = {
      id: 'user-default-1',
      email: 'khasanov.pavel.trend@gmail.com',
      salt: defaultSalt,
      passwordHash: hashPassword('123456', defaultSalt),
      role: 'realtor',
      createdAt: new Date().toISOString().split('T')[0],
      profile: {
        id: 'user-default-1',
        name: 'Хасанов Павел',
        phone: '+7 (921) 781-89-12',
        email: 'khasanov.pavel.trend@gmail.com',
        company: 'Тренд Недвижимость',
        companyAddress: 'г. Санкт-Петербург, Щербаков пер. д.17/3, БЦ «Премьер», 3 этаж',
        companyWebsite: 'trendproperty.ru',
        telegram: 't.me/Khasanov_Pavel',
        position: 'Специалист по недвижимости',
        photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
        companyLogo: '',
        role: 'realtor',
      },
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify([defaultUser], null, 2), 'utf-8');
    return [defaultUser];
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read users file:', err);
    return [];
  }
}

function saveUsers(users: ServerUser[]): void {
  ensureDataDir();
  const tmpFile = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), 'utf-8');
  fs.renameSync(tmpFile, USERS_FILE);
}

export function findUserByEmail(email: string): ServerUser | null {
  const users = getAllUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id: string): ServerUser | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(params: {
  email: string;
  password: string;
  name: string;
  company?: string;
  position?: string;
  role?: UserRole;
  phone?: string;
}): { success: boolean; user?: ServerUser; error?: string } {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (findUserByEmail(normalizedEmail)) {
    return { success: false, error: 'Пользователь с таким Email уже зарегистрирован в системе.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const userId = `user-${Date.now()}`;

  const newUser: ServerUser = {
    id: userId,
    email: normalizedEmail,
    salt,
    passwordHash,
    role: params.role || 'realtor',
    createdAt: new Date().toISOString().split('T')[0],
    profile: {
      id: userId,
      name: params.name.trim(),
      phone: params.phone || '+7 (921) 000-00-00',
      email: normalizedEmail,
      company: params.company || 'Тренд Недвижимость',
      companyAddress: 'г. Санкт-Петербург, Щербаков пер. д.17/3, БЦ «Премьер», 3 этаж',
      companyWebsite: 'trendproperty.ru',
      telegram: 't.me/Khasanov_Pavel',
      position: params.position || (params.role === 'analyst' ? 'Аналитик СМА' : 'Риелтор'),
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      companyLogo: '',
      role: params.role || 'realtor',
    },
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  return { success: true, user: newUser };
}

export function verifyUserPassword(user: ServerUser, passwordAttempt: string): boolean {
  // Support both scrypt hash with salt, or legacy direct password comparison if salt is empty
  if (!user.salt) {
    return user.passwordHash === passwordAttempt;
  }
  const attemptHash = hashPassword(passwordAttempt, user.salt);
  return crypto.timingSafeEqual(Buffer.from(user.passwordHash), Buffer.from(attemptHash));
}

// Session Management
export function getAllSessions(): UserSession[] {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions: UserSession[] = JSON.parse(raw);
    // Filter out expired sessions
    const now = new Date().toISOString();
    return sessions.filter((s) => s.expiresAt > now);
  } catch {
    return [];
  }
}

function saveSessions(sessions: UserSession[]): void {
  ensureDataDir();
  const tmpFile = `${SESSIONS_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(sessions, null, 2), 'utf-8');
  fs.renameSync(tmpFile, SESSIONS_FILE);
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const sessions = getAllSessions();
  sessions.push({
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt,
  });
  saveSessions(sessions);

  return token;
}

export function getUserBySession(token: string): ServerUser | null {
  if (!token) return null;
  const sessions = getAllSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;

  return findUserById(session.userId);
}

export function deleteSession(token: string): void {
  if (!token) return;
  const sessions = getAllSessions();
  const updated = sessions.filter((s) => s.token !== token);
  saveSessions(updated);
}

export function updateUserProfile(userId: string, profileData: Partial<UserProfile>): ServerUser | null {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  users[idx].profile = {
    ...users[idx].profile,
    ...profileData,
  };

  saveUsers(users);
  return users[idx];
}
