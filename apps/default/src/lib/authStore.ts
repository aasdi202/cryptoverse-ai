import { create } from 'zustand';
import { recordLogin } from './loginHistoryStore';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarSeed: string;
  avatarUrl?: string;       // uploaded photo base64
  country?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not';
  age?: number;
  bio?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  plan: 'bronze' | 'silver' | 'gold';
  planExpiry?: string;
  referralCode: string;
  referralCount: number;
  referralBonus: number;    // virtual USD earned from referrals
  language: string;
  isFirstLogin: boolean;
  joinedAt: string;
  isAdmin: boolean;
  adminRequestStatus?: 'idle' | 'pending' | 'approved' | 'rejected';
  adminRejectReason?: string;
  virtualBalance: number;   // extra purchased virtual balance
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;

  // Auth actions
  login:              (email: string, password: string) => { success: boolean; error?: string };
  register:           (email: string, password: string, displayName: string) => { success: boolean; error?: string };
  loginWithGoogle:    () => { success: boolean; isNewUser: boolean };
  loginWithApple:     () => { success: boolean; isNewUser: boolean };
  loginWithBiometric: (email: string) => { success: boolean; error?: string };
  logout:             () => void;

  // Profile updates
  updateProfile: (partial: Partial<UserProfile>) => void;

  // Referral
  applyReferral: (code: string) => void;

  // Admin request
  requestAdmin: () => { approved: boolean; reason?: string };

  // Virtual currency purchase
  addVirtualBalance: (amount: number) => void;

  // Dismiss first-login guide
  dismissFirstLogin: () => void;

  // Password reset
  resetPassword: (email: string, newPassword: string) => { success: boolean; error?: string };
}

function makeReferralCode(name: string) {
  return `${name.replace(/\s/g, '').toUpperCase().slice(0, 6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Simple mock user store (localStorage backed)
const STORAGE_KEY = 'cryptoverse_users';
const SESSION_KEY = 'cryptoverse_session';

function getUsers(): Record<string, { password: string; profile: UserProfile }> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveUsers(u: Record<string, { password: string; profile: UserProfile }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}
function getSession(): UserProfile | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(p: UserProfile | null) {
  if (p) sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
  else sessionStorage.removeItem(SESSION_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getSession(),
  isAuthenticated: !!getSession(),

  login: (email, password) => {
    const users = getUsers();
    const key   = email.toLowerCase().trim();
    const entry = users[key];
    if (!entry) return { success: false, error: 'No account found with this email.' };
    if (entry.password !== password) return { success: false, error: 'Incorrect password.' };
    saveSession(entry.profile);
    set({ user: entry.profile, isAuthenticated: true });
    recordLogin({ userId: entry.profile.id, method: 'email' });
    return { success: true };
  },

  register: (email, password, displayName) => {
    const users = getUsers();
    const key   = email.toLowerCase().trim();
    if (users[key]) return { success: false, error: 'An account with this email already exists.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      email: key,
      displayName: displayName.trim() || email.split('@')[0],
      avatarSeed: displayName.split(' ')[0] || 'User',
      plan: 'bronze',
      referralCode: makeReferralCode(displayName || email),
      referralCount: 0,
      referralBonus: 0,
      language: navigator.language.split('-')[0] || 'en',
      isFirstLogin: true,
      joinedAt: new Date().toISOString(),
      isAdmin: false,
      virtualBalance: 0,
    };
    users[key] = { password, profile };
    saveUsers(users);
    saveSession(profile);
    set({ user: profile, isAuthenticated: true });
    recordLogin({ userId: profile.id, method: 'register', isNewUser: true });
    return { success: true };
  },

  loginWithGoogle: () => {
    const users    = getUsers();
    const key      = 'oauth.google@cryptoverse.ai';
    const existing = users[key];

    if (existing) {
      // Returning Google user — restore existing profile, mark NOT first login
      const profile = { ...existing.profile, isFirstLogin: false };
      existing.profile = profile;
      saveUsers(users);
      saveSession(profile);
      set({ user: profile, isAuthenticated: true });
      recordLogin({ userId: profile.id, method: 'google', isNewUser: false });
      return { success: true, isNewUser: false };
    }

    // New Google user — create persisted profile
    const profile: UserProfile = {
      id:            `google_${Date.now()}`,
      email:         key,
      displayName:   'Google User',
      avatarSeed:    'GoogleUser',
      plan:          'bronze',
      referralCode:  makeReferralCode('GoogleUser'),
      referralCount: 0,
      referralBonus: 0,
      language:      navigator.language.split('-')[0] || 'en',
      isFirstLogin:  true,
      joinedAt:      new Date().toISOString(),
      isAdmin:       false,
      virtualBalance: 0,
    };
    users[key] = { password: '', profile };
    saveUsers(users);
    saveSession(profile);
    set({ user: profile, isAuthenticated: true });
    recordLogin({ userId: profile.id, method: 'google', isNewUser: true });
    return { success: true, isNewUser: true };
  },

  loginWithApple: () => {
    const users    = getUsers();
    const key      = 'oauth.apple@cryptoverse.ai';
    const existing = users[key];

    if (existing) {
      const profile = { ...existing.profile, isFirstLogin: false };
      existing.profile = profile;
      saveUsers(users);
      saveSession(profile);
      set({ user: profile, isAuthenticated: true });
      recordLogin({ userId: profile.id, method: 'apple', isNewUser: false });
      return { success: true, isNewUser: false };
    }

    const profile: UserProfile = {
      id:            `apple_${Date.now()}`,
      email:         key,
      displayName:   'Apple User',
      avatarSeed:    'AppleUser',
      plan:          'bronze',
      referralCode:  makeReferralCode('AppleUser'),
      referralCount: 0,
      referralBonus: 0,
      language:      navigator.language.split('-')[0] || 'en',
      isFirstLogin:  true,
      joinedAt:      new Date().toISOString(),
      isAdmin:       false,
      virtualBalance: 0,
    };
    users[key] = { password: '', profile };
    saveUsers(users);
    saveSession(profile);
    set({ user: profile, isAuthenticated: true });
    recordLogin({ userId: profile.id, method: 'apple', isNewUser: true });
    return { success: true, isNewUser: true };
  },

  loginWithBiometric: (email: string) => {
    const users = getUsers();
    const key   = email.toLowerCase().trim();
    const entry = users[key];
    if (!entry) return { success: false, error: 'No account found for this biometric credential.' };

    const profile = { ...entry.profile, isFirstLogin: false };
    entry.profile = profile;
    saveUsers(users);
    saveSession(profile);
    set({ user: profile, isAuthenticated: true });
    recordLogin({ userId: profile.id, method: 'biometric' });
    return { success: true };
  },

  logout: () => {
    saveSession(null);
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (partial) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, ...partial };
    // Persist to users store if email-registered
    const users = getUsers();
    const key = user.email.toLowerCase();
    if (users[key]) {
      users[key].profile = updated;
      saveUsers(users);
    }
    saveSession(updated);
    set({ user: updated });
  },

  applyReferral: (code) => {
    const user = get().user;
    if (!user) return;
    // Find the referrer and give them a bonus
    const users = getUsers();
    for (const [, entry] of Object.entries(users)) {
      if (entry.profile.referralCode === code && entry.profile.id !== user.id) {
        entry.profile.referralCount += 1;
        entry.profile.referralBonus += 10000;
        saveUsers(users);
        break;
      }
    }
  },

  requestAdmin: () => {
    const user = get().user;
    if (!user) return { approved: false, reason: 'Not logged in' };
    // Simulated AI review logic
    const { balance } = JSON.parse(localStorage.getItem('trading_store') || '{}') as { balance?: number };
    const growthPct = balance ? ((balance - 100000) / 100000) * 100 : 0;
    const daysSinceJoin = Math.floor((Date.now() - new Date(user.joinedAt).getTime()) / 86400000);

    const approved = growthPct >= 20 && daysSinceJoin >= 7;
    const reason = !approved
      ? [
          growthPct < 20  && `Portfolio growth below 20% (yours: ${growthPct.toFixed(1)}%)`,
          daysSinceJoin < 7 && `Account must be at least 7 days old (yours: ${daysSinceJoin}d)`,
        ].filter(Boolean).join(' · ')
      : undefined;

    get().updateProfile({
      adminRequestStatus: approved ? 'approved' : 'rejected',
      isAdmin: approved,
      adminRejectReason: reason,
    });

    return { approved, reason };
  },

  addVirtualBalance: (amount) => {
    const user = get().user;
    if (!user) return;
    get().updateProfile({ virtualBalance: (user.virtualBalance || 0) + amount });
  },

  dismissFirstLogin: () => {
    get().updateProfile({ isFirstLogin: false });
  },

  resetPassword: (email, newPassword) => {
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const users = getUsers();
    const key   = email.toLowerCase().trim();
    if (!users[key]) {
      return { success: false, error: 'No account found with this email.' };
    }
    users[key].password = newPassword;
    saveUsers(users);
    return { success: true };
  },
}));
