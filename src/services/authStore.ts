import { UserAccount, UserRole } from '../types/market';

const AUTH_STORAGE_KEY = 'neuralstock_auth_user';
const USERS_STORAGE_KEY = 'neuralstock_users_registry';

/**
 * SHA-256 Password Hash using standard Web Crypto API with salt
 */
export async function hashPassword(password: string, salt = 'neuralstock_secure_salt_v1'): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_admin_01',
    name: 'Sarah Connor',
    email: 'admin@neuralstock.io',
    role: 'admin',
    createdAt: '2026-01-10T09:00:00Z',
    lastLogin: '2026-11-11T20:45:00Z',
  },
  {
    id: 'usr_analyst_01',
    name: 'Dr. Marcus Vance',
    email: 'analyst@neuralstock.io',
    role: 'analyst',
    createdAt: '2026-02-14T11:20:00Z',
    lastLogin: '2026-11-11T18:30:00Z',
  },
  {
    id: 'usr_trader_01',
    name: 'Ramesh Piriththi',
    email: 'rameshpiriththi@gmail.com',
    role: 'trader',
    createdAt: '2026-03-01T14:15:00Z',
    lastLogin: '2026-11-11T21:10:00Z',
  },
];

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveUsers(users: UserAccount[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to localStorage', err);
  }
}

export function getCurrentUser(): UserAccount {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  // Default to Ramesh Piriththi (Trader) matching prompt metadata
  const defaultUser = DEFAULT_USERS[2];
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setCurrentUser(user: UserAccount | null) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user in localStorage', err);
  }
}

/**
 * Role-Based Access Control (RBAC) permission helpers
 */
export function hasPermission(role: UserRole, action: 'train_model' | 'execute_trade' | 'manage_alerts' | 'manage_users' | 'view_audit_logs' | 'export_code'): boolean {
  switch (action) {
    case 'manage_users':
    case 'view_audit_logs':
      return role === 'admin';
    case 'train_model':
      return role === 'admin' || role === 'analyst';
    case 'export_code':
    case 'manage_alerts':
    case 'execute_trade':
      return true; // All authenticated roles can use trading and alerts
    default:
      return false;
  }
}
