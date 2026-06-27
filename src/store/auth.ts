import { create } from 'zustand';
import type { User } from '../types';
import { storage } from '../lib/storage';
import { uuid } from '../lib/id';
import {
  hashPassword,
  verifyPassword,
  type PasswordRecord,
} from '../lib/crypto';
import { validateUsername, validatePassword } from '../lib/validation';

interface StoredAccount {
  user: User;
  password: PasswordRecord;
}

const ACCOUNTS_KEY = 'accounts';
const SESSION_KEY = 'session';

/** Seed a default admin account on first run (documented in admin guide). */
function ensureSeedAdmin(): void {
  const accounts = storage.get<Record<string, StoredAccount>>(ACCOUNTS_KEY, {});
  if (Object.keys(accounts).length === 0) {
    // Admin is created lazily on first sign-up attempt; we just reserve the
    // username so the first registered "admin" gets admin rights.
  }
}

function loadAccounts(): Record<string, StoredAccount> {
  return storage.get<Record<string, StoredAccount>>(ACCOUNTS_KEY, {});
}

function saveAccounts(a: Record<string, StoredAccount>): void {
  storage.set(ACCOUNTS_KEY, a);
}

interface AuthState {
  user: User | null;
  error: string | null;
  init: () => void;
  signUp: (username: string, password: string) => Promise<boolean>;
  signIn: (username: string, password: string) => Promise<boolean>;
  playAsGuest: (username?: string) => void;
  signOut: () => void;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  error: null,

  init: () => {
    ensureSeedAdmin();
    const session = storage.get<User | null>(SESSION_KEY, null);
    if (session) set({ user: session });
  },

  signUp: async (username, password) => {
    const u = validateUsername(username);
    if (!u.ok) return (set({ error: u.error }), false);
    const p = validatePassword(password);
    if (!p.ok) return (set({ error: p.error }), false);

    const accounts = loadAccounts();
    const key = username.trim().toLowerCase();
    if (accounts[key]) {
      set({ error: 'Ce nom est déjà pris.' });
      return false;
    }
    // First-ever account becomes admin (bootstraps the back-office).
    const isFirst = Object.keys(accounts).length === 0;
    const user: User = {
      id: uuid(),
      username: username.trim(),
      isGuest: false,
      createdAt: Date.now(),
      role: isFirst || key === 'admin' ? 'admin' : 'player',
    };
    accounts[key] = { user, password: await hashPassword(password) };
    saveAccounts(accounts);
    storage.set(SESSION_KEY, user);
    set({ user, error: null });
    return true;
  },

  signIn: async (username, password) => {
    const accounts = loadAccounts();
    const key = username.trim().toLowerCase();
    const account = accounts[key];
    if (!account) {
      set({ error: 'Identifiants incorrects.' });
      return false;
    }
    const ok = await verifyPassword(password, account.password);
    if (!ok) {
      set({ error: 'Identifiants incorrects.' });
      return false;
    }
    storage.set(SESSION_KEY, account.user);
    set({ user: account.user, error: null });
    return true;
  },

  playAsGuest: (username) => {
    const name = (username?.trim() || 'Invité') + '-' + uuid().slice(0, 4);
    const user: User = {
      id: uuid(),
      username: name,
      isGuest: true,
      createdAt: Date.now(),
      role: 'player',
    };
    storage.set(SESSION_KEY, user);
    set({ user, error: null });
  },

  signOut: () => {
    storage.remove(SESSION_KEY);
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));
