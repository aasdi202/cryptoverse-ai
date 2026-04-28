import { create } from 'zustand';

// ── Keys ─────────────────────────────────────────────────────────────────────
const TWO_MAN_KEY   = 'cryptoverse_twoman_requests';
const NOTIF_CTR_KEY = 'cryptoverse_portal_notifs';

// ── Two-Man Rule ──────────────────────────────────────────────────────────────
export type TwoManActionType =
  | 'delete_user'
  | 'modify_leverage'
  | 'large_balance_adjustment'
  | 'delete_competition'
  | 'suspend_super_admin';

export const TWO_MAN_ACTIONS: Record<TwoManActionType, { label: string; requiredLevels: number[]; description: string; icon: string }> = {
  delete_user:               { label: 'Delete User Account',           requiredLevels: [6, 3], description: 'Permanently deletes a user and all their data.', icon: '🗑️' },
  modify_leverage:           { label: 'Modify System Leverage',        requiredLevels: [6, 3], description: 'Changes global leverage limits affecting all trades.', icon: '⚖️' },
  large_balance_adjustment:  { label: 'Large Balance Adjustment >100k',requiredLevels: [6, 3], description: 'Adjusts virtual balance above $100,000.', icon: '💰' },
  delete_competition:        { label: 'Delete Active Competition',     requiredLevels: [6, 4], description: 'Removes a competition while users are active.', icon: '🏆' },
  suspend_super_admin:       { label: 'Suspend Super Admin',           requiredLevels: [6, 6], description: 'Requires two Super Admins to agree.', icon: '🛡️' },
};

export interface TwoManRequest {
  id:          string;
  action:      TwoManActionType;
  requesterId: string;
  requesterName: string;
  targetId:    string;
  targetLabel: string;
  reason:      string;
  status:      'pending' | 'approved' | 'rejected' | 'executed';
  approvals:   Array<{ adminId: string; adminName: string; approvedAt: string }>;
  createdAt:   string;
  executedAt?: string;
  metadata?:   Record<string, unknown>;
}

// ── Demo data ─────────────────────────────────────────────────────────────────
function makeId(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export interface DemoUser {
  id: string; name: string; email: string; plan: string;
  status: 'active' | 'suspended' | 'banned'; joinedAt: string;
  balance: number; trades: number; winRate: number; country: string; flag: string;
}
export interface DemoTransaction {
  id: string; userId: string; userName: string; type: string;
  amount: number; status: 'verified' | 'pending' | 'rejected';
  txHash: string; timestamp: string; network: string;
}
export interface DemoTicket {
  id: string; userId: string; userName: string; subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string; rating?: number; category: string;
}
export interface DemoReport {
  id: string; reporterId: string; reporterName: string;
  targetId: string; targetName: string; reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string; category: string;
}
export interface DemoLesson {
  id: string; title: string; level: number; status: 'published' | 'draft' | 'flagged';
  views: number; completions: number; rating: number; updatedAt: string; category: string;
}
export interface DemoCompetition {
  id: string; title: string; status: 'active' | 'ended' | 'upcoming';
  participants: number; prizePool: number; startDate: string; endDate: string;
  disputes: number;
}

const COUNTRIES = [
  { c: 'US', f: '🇺🇸' }, { c: 'UK', f: '🇬🇧' }, { c: 'DE', f: '🇩🇪' },
  { c: 'JP', f: '🇯🇵' }, { c: 'BR', f: '🇧🇷' }, { c: 'AU', f: '🇦🇺' },
  { c: 'CA', f: '🇨🇦' }, { c: 'FR', f: '🇫🇷' }, { c: 'IN', f: '🇮🇳' }, { c: 'SG', f: '🇸🇬' },
];
const NAMES = ['Alex Torres', 'Sarah Chen', 'Marcus Webb', 'Priya Nair', 'Jake Kim',
               'Elena Vasquez', 'Dmitri Volkov', 'Amara Osei', 'Lucas Müller', 'Yuki Tanaka',
               'Fatima Al-Hassan', 'Carlos Rivera', 'Mei Lin', 'Ivan Petrov', 'Aisha Kamara',
               'Ben Schmidt', 'Nora Johansson', 'Omar Khalil', 'Rin Yamamoto', 'Sven Eriksson'];

function genUsers(): DemoUser[] {
  return NAMES.map((name, i) => {
    const ctry = COUNTRIES[i % COUNTRIES.length];
    return {
      id:       `user_${1000 + i}`,
      name,
      email:    name.toLowerCase().replace(/\s/g, '.') + '@example.com',
      plan:     ['bronze', 'silver', 'gold'][i % 3],
      status:   i === 3 ? 'suspended' : i === 7 ? 'banned' : 'active',
      joinedAt: new Date(Date.now() - (i + 1) * 12 * 86400000).toISOString(),
      balance:  Math.floor(80000 + Math.random() * 920000),
      trades:   Math.floor(10 + Math.random() * 990),
      winRate:  40 + Math.random() * 40,
      country:  ctry.c,
      flag:     ctry.f,
    };
  });
}

function genTransactions(): DemoTransaction[] {
  const types = ['subscription', 'virtual_balance', 'subscription', 'virtual_balance'];
  const statuses: DemoTransaction['status'][] = ['verified', 'pending', 'verified', 'rejected', 'pending'];
  return Array.from({ length: 25 }, (_, i) => ({
    id:        `tx_${2000 + i}`,
    userId:    `user_${1000 + (i % 20)}`,
    userName:  NAMES[i % 20],
    type:      types[i % 4],
    amount:    [4.99, 9.99, 24.99, 49.99][i % 4],
    status:    statuses[i % 5],
    txHash:    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    timestamp: new Date(Date.now() - i * 3 * 3600000).toISOString(),
    network:   'TRC20',
  }));
}

function genTickets(): DemoTicket[] {
  const subjects = [
    'Cannot withdraw funds', 'Position stuck open', 'Wrong balance displayed',
    'Academy quiz not loading', 'Competition rank incorrect', '2FA setup issues',
    'Referral bonus missing', 'Account verification failed', 'Trade execution delay',
    'Chart data incorrect',
  ];
  const cats = ['billing', 'technical', 'account', 'trading', 'academy'];
  const priorities: DemoTicket['priority'][] = ['low', 'medium', 'high', 'critical'];
  const statuses: DemoTicket['status'][] = ['open', 'in_progress', 'resolved', 'escalated'];
  return Array.from({ length: 18 }, (_, i) => ({
    id:        `tick_${3000 + i}`,
    userId:    `user_${1000 + (i % 20)}`,
    userName:  NAMES[i % 20],
    subject:   subjects[i % subjects.length],
    status:    statuses[i % 4],
    priority:  priorities[i % 4],
    createdAt: new Date(Date.now() - i * 5 * 3600000).toISOString(),
    rating:    i % 3 === 0 ? 4 + Math.random() : undefined,
    category:  cats[i % cats.length],
  }));
}

function genReports(): DemoReport[] {
  const reasons = ['Spam', 'Harassment', 'Misinformation', 'Cheating', 'Offensive content', 'Scam attempt'];
  const cats = ['chat', 'forum', 'competition', 'profile'];
  const statuses: DemoReport['status'][] = ['pending', 'pending', 'resolved', 'dismissed'];
  return Array.from({ length: 14 }, (_, i) => ({
    id:           `rep_${4000 + i}`,
    reporterId:   `user_${1000 + (i % 20)}`,
    reporterName: NAMES[i % 20],
    targetId:     `user_${1000 + ((i + 3) % 20)}`,
    targetName:   NAMES[(i + 3) % 20],
    reason:       reasons[i % reasons.length],
    status:       statuses[i % 4],
    createdAt:    new Date(Date.now() - i * 7 * 3600000).toISOString(),
    category:     cats[i % cats.length],
  }));
}

function genLessons(): DemoLesson[] {
  const titles = [
    'Blockchain Fundamentals', 'Market Analysis Basics', 'Risk Management 101',
    'DeFi Explained', 'Technical Analysis', 'Trading Psychology', 'Options & Derivatives',
    'Portfolio Diversification', 'Crypto Security', 'Advanced Charting',
    'Leverage & Margin', 'On-Chain Analysis', 'NFT Markets', 'Yield Farming', 'DAO Governance',
  ];
  const cats = ['basics', 'analysis', 'risk', 'defi', 'advanced'];
  return titles.map((title, i) => ({
    id:          `less_${5000 + i}`,
    title,
    level:       (i % 5) + 1,
    status:      i === 2 ? 'flagged' : i % 4 === 0 ? 'draft' : 'published',
    views:       Math.floor(100 + Math.random() * 4900),
    completions: Math.floor(50 + Math.random() * 2000),
    rating:      3.5 + Math.random() * 1.5,
    updatedAt:   new Date(Date.now() - i * 4 * 86400000).toISOString(),
    category:    cats[i % cats.length],
  }));
}

function genCompetitions(): DemoCompetition[] {
  return [
    { id: 'comp_001', title: 'BTC Championship Q1', status: 'active',   participants: 847,  prizePool: 50000, startDate: new Date(Date.now() - 7 * 86400000).toISOString(),  endDate: new Date(Date.now() + 7 * 86400000).toISOString(),  disputes: 3 },
    { id: 'comp_002', title: 'ETH Masters League',  status: 'active',   participants: 512,  prizePool: 25000, startDate: new Date(Date.now() - 3 * 86400000).toISOString(),  endDate: new Date(Date.now() + 11 * 86400000).toISOString(), disputes: 1 },
    { id: 'comp_003', title: 'Altcoin Showdown',     status: 'upcoming', participants: 0,    prizePool: 10000, startDate: new Date(Date.now() + 5 * 86400000).toISOString(),  endDate: new Date(Date.now() + 19 * 86400000).toISOString(), disputes: 0 },
    { id: 'comp_004', title: 'Winter Crypto Cup',   status: 'ended',    participants: 1204, prizePool: 75000, startDate: new Date(Date.now() - 35 * 86400000).toISOString(), endDate: new Date(Date.now() - 7 * 86400000).toISOString(),  disputes: 7 },
    { id: 'comp_005', title: 'DeFi Speed Run',       status: 'ended',    participants: 331,  prizePool: 15000, startDate: new Date(Date.now() - 20 * 86400000).toISOString(), endDate: new Date(Date.now() - 2 * 86400000).toISOString(),  disputes: 0 },
  ];
}

// ── Two-man persistence ───────────────────────────────────────────────────────
function loadTwoMan(): TwoManRequest[] {
  try { return JSON.parse(localStorage.getItem(TWO_MAN_KEY) || '[]'); } catch { return []; }
}
function saveTwoMan(r: TwoManRequest[]) {
  localStorage.setItem(TWO_MAN_KEY, JSON.stringify(r));
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface AdminPortalState {
  users:         DemoUser[];
  transactions:  DemoTransaction[];
  tickets:       DemoTicket[];
  reports:       DemoReport[];
  lessons:       DemoLesson[];
  competitions:  DemoCompetition[];
  twoManRequests: TwoManRequest[];

  // Two-man rule
  requestTwoMan: (req: Omit<TwoManRequest, 'id' | 'createdAt' | 'approvals' | 'status'>) => TwoManRequest;
  approveTwoMan: (reqId: string, adminId: string, adminName: string) => TwoManRequest | null;
  rejectTwoMan:  (reqId: string, adminId: string) => void;

  // User actions
  banUser:       (userId: string) => void;
  unbanUser:     (userId: string) => void;
  suspendUser:   (userId: string) => void;

  // Ticket actions
  resolveTicket: (ticketId: string) => void;
  escalateTicket:(ticketId: string) => void;

  // Report actions
  resolveReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;

  // Lesson actions
  publishLesson: (lessonId: string) => void;
  flagLesson:    (lessonId: string) => void;

  // Transaction actions
  approveTransaction: (txId: string) => void;
  rejectTransaction:  (txId: string) => void;
}

export const useAdminPortalStore = create<AdminPortalState>((set, get) => ({
  users:          genUsers(),
  transactions:   genTransactions(),
  tickets:        genTickets(),
  reports:        genReports(),
  lessons:        genLessons(),
  competitions:   genCompetitions(),
  twoManRequests: loadTwoMan(),

  requestTwoMan: (data) => {
    const req: TwoManRequest = {
      ...data,
      id:        makeId('tm'),
      createdAt: new Date().toISOString(),
      approvals: [],
      status:    'pending',
    };
    const reqs = [req, ...get().twoManRequests];
    saveTwoMan(reqs);
    set({ twoManRequests: reqs });
    return req;
  },

  approveTwoMan: (reqId, adminId, adminName) => {
    let found: TwoManRequest | null = null;
    const reqs = get().twoManRequests.map(r => {
      if (r.id !== reqId) return r;
      if (r.approvals.find(a => a.adminId === adminId)) return r; // no double approve
      const approvals = [...r.approvals, { adminId, adminName, approvedAt: new Date().toISOString() }];
      const meta      = TWO_MAN_ACTIONS[r.action];
      const status: TwoManRequest['status'] = approvals.length >= 2 ? 'approved' : 'pending';
      const updated = { ...r, approvals, status };
      found = updated;
      return updated;
    });
    saveTwoMan(reqs);
    set({ twoManRequests: reqs });
    return found;
  },

  rejectTwoMan: (reqId, _adminId) => {
    const reqs = get().twoManRequests.map(r =>
      r.id === reqId ? { ...r, status: 'rejected' as const } : r,
    );
    saveTwoMan(reqs);
    set({ twoManRequests: reqs });
  },

  banUser:     (id) => set(s => ({ users: s.users.map(u => u.id === id ? { ...u, status: 'banned' }     : u) })),
  unbanUser:   (id) => set(s => ({ users: s.users.map(u => u.id === id ? { ...u, status: 'active' }    : u) })),
  suspendUser: (id) => set(s => ({ users: s.users.map(u => u.id === id ? { ...u, status: 'suspended' } : u) })),

  resolveTicket:  (id) => set(s => ({ tickets: s.tickets.map(t => t.id === id ? { ...t, status: 'resolved'   } : t) })),
  escalateTicket: (id) => set(s => ({ tickets: s.tickets.map(t => t.id === id ? { ...t, status: 'escalated', priority: 'critical' as const } : t) })),

  resolveReport: (id) => set(s => ({ reports: s.reports.map(r => r.id === id ? { ...r, status: 'resolved'  } : r) })),
  dismissReport: (id) => set(s => ({ reports: s.reports.map(r => r.id === id ? { ...r, status: 'dismissed' } : r) })),

  publishLesson: (id) => set(s => ({ lessons: s.lessons.map(l => l.id === id ? { ...l, status: 'published' } : l) })),
  flagLesson:    (id) => set(s => ({ lessons: s.lessons.map(l => l.id === id ? { ...l, status: 'flagged'   } : l) })),

  approveTransaction: (id) => set(s => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, status: 'verified'  } : t) })),
  rejectTransaction:  (id) => set(s => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, status: 'rejected'  } : t) })),
}));
