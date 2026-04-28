import { create } from 'zustand';
import { AdminLevel, ADMIN_LEVEL_META } from './adminManagementStore';

const SESSION_KEY  = 'cryptoverse_admin_session';
const SESSIONS_KEY = 'cryptoverse_admin_sessions';

export interface AdminSession {
  adminId:    string;
  email:      string;
  displayName: string;
  level:      AdminLevel;
  avatarSeed: string;
  sessionId:  string;
  loginAt:    string;
  lastActive: string;
  ipAddress:  string;
  twoFaDone:  boolean;
}

// Hardcoded super-admin seed (Level 6)
const SUPER_ADMIN = {
  id:          'superadmin_001',
  email:       'superadmin@cryptoverse.ai',
  password:    'SuperAdmin@2026!',
  displayName: 'Super Admin',
  level:       6 as AdminLevel,
  avatarSeed:  'SuperAdmin',
  twoFaCode:   '123456',   // mock TOTP
};

function mockIp() {
  return '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
}
function makeSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}
function loadSession(): AdminSession | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(s: AdminSession | null) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else   sessionStorage.removeItem(SESSION_KEY);
}
function loadSessions(): AdminSession[] {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { return []; }
}
function saveSessions(ss: AdminSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(ss));
}

// Get all admin members from localStorage
function getAdminMembers(): Array<{ id: string; email: string; password?: string; displayName: string; level: AdminLevel; avatarSeed: string; status: string }> {
  try {
    const raw = JSON.parse(localStorage.getItem('cryptoverse_admin_members') || localStorage.getItem('cryptoplay_admin_members') || '[]');
    return raw;
  } catch { return []; }
}

interface AdminAuthState {
  session:   AdminSession | null;
  isAdminAuth: boolean;
  pendingEmail: string;
  pendingLevel: AdminLevel | null;
  twoFaPending: boolean;

  login:         (email: string, password: string) => { success: boolean; error?: string; needs2fa?: boolean };
  verify2fa:     (code: string) => { success: boolean; error?: string };
  logout:        () => void;
  touchSession:  () => void;
  isSessionValid: () => boolean;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  session:      loadSession(),
  isAdminAuth:  !!loadSession()?.twoFaDone,
  pendingEmail: '',
  pendingLevel: null,
  twoFaPending: false,

  login: (email, password) => {
    const e = email.toLowerCase().trim();

    // Check super admin
    let matched: { id: string; email: string; displayName: string; level: AdminLevel; avatarSeed: string } | null = null;

    if (e === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
      matched = { id: SUPER_ADMIN.id, email: SUPER_ADMIN.email, displayName: SUPER_ADMIN.displayName, level: SUPER_ADMIN.level, avatarSeed: SUPER_ADMIN.avatarSeed };
    } else {
      // Check admin members (password defaults to 'Admin@2026!' for seeded admins)
      const members = getAdminMembers();
      const member  = members.find(m => m.email.toLowerCase() === e && m.status === 'active');
      if (member) {
        const expectedPw = member.password || 'Admin@2026!';
        if (password === expectedPw) {
          matched = { id: member.id, email: member.email, displayName: member.displayName, level: member.level, avatarSeed: member.avatarSeed };
        }
      }
    }

    if (!matched) {
      return { success: false, error: 'Invalid credentials or account not found.' };
    }

    // Check for concurrent sessions (block if another session exists)
    const sessions = loadSessions().filter(s => {
      const age = Date.now() - new Date(s.lastActive).getTime();
      return s.adminId === matched!.id && age < SESSION_TIMEOUT_MS;
    });
    if (sessions.length > 0) {
      // Force-expire old sessions for same user
      const cleaned = loadSessions().filter(s => s.adminId !== matched!.id);
      saveSessions(cleaned);
    }

    // Create session awaiting 2FA
    const sess: AdminSession = {
      adminId:     matched.id,
      email:       matched.email,
      displayName: matched.displayName,
      level:       matched.level,
      avatarSeed:  matched.avatarSeed,
      sessionId:   makeSessionId(),
      loginAt:     new Date().toISOString(),
      lastActive:  new Date().toISOString(),
      ipAddress:   mockIp(),
      twoFaDone:   false,
    };

    set({ session: sess, pendingEmail: e, pendingLevel: matched.level, twoFaPending: true, isAdminAuth: false });
    return { success: true, needs2fa: true };
  },

  verify2fa: (code) => {
    const { session } = get();
    if (!session) return { success: false, error: 'No session found.' };

    // Mock 2FA: accept '123456' or any 6-digit code for demo
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return { success: false, error: 'Invalid code. Enter your 6-digit authenticator code.' };
    }
    // Accept 123456 or any code that starts with "1" as valid for demo
    if (code !== '123456' && !code.startsWith('1')) {
      return { success: false, error: 'Incorrect 2FA code. (Hint: use 123456 for demo)' };
    }

    const verified = { ...session, twoFaDone: true, lastActive: new Date().toISOString() };
    saveSession(verified);

    // Register in sessions list
    const sessions = loadSessions().filter(s => s.sessionId !== verified.sessionId);
    sessions.push(verified);
    saveSessions(sessions);

    set({ session: verified, isAdminAuth: true, twoFaPending: false });
    return { success: true };
  },

  logout: () => {
    const { session } = get();
    if (session) {
      const sessions = loadSessions().filter(s => s.sessionId !== session.sessionId);
      saveSessions(sessions);
    }
    saveSession(null);
    set({ session: null, isAdminAuth: false, twoFaPending: false, pendingEmail: '', pendingLevel: null });
  },

  touchSession: () => {
    const { session } = get();
    if (!session) return;
    const updated = { ...session, lastActive: new Date().toISOString() };
    saveSession(updated);
    set({ session: updated });
  },

  isSessionValid: () => {
    const { session } = get();
    if (!session?.twoFaDone) return false;
    const age = Date.now() - new Date(session.lastActive).getTime();
    if (age > SESSION_TIMEOUT_MS) {
      get().logout();
      return false;
    }
    return true;
  },
}));
