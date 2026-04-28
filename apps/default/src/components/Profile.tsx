import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCopyTradingStore } from '@/lib/copyTradingStore';
import {
  Edit2, Check, X, LogOut, Sun, Moon,
  Activity, Flame, Shield, Globe, Trophy, Target, Award,
  Camera, Zap, Copy, CheckCheck,
  Crown, BadgeCheck, ShoppingCart, Gift,
  User, MapPin,
  Fingerprint, Scan, Smartphone, Trash2, RefreshCw,
  ShieldCheck, ShieldOff, AlertCircle, Loader2, CheckCircle2,
  Clock, Key, Wifi,
  Receipt, ExternalLink, XCircle, HelpCircle, CalendarClock, TriangleAlert, Hash,
  Bot, Settings,
} from 'lucide-react';
import { useCpCoinsStore } from '@/lib/cpCoinsStore';
import { useStrategyStore } from '@/lib/strategyStore';
import { AdminRequestModal } from './admin/AdminRequestModal';
import { AdminPanel } from './admin/AdminPanel';
import { UpgradePaymentModal, WalletAddressBlock, PLAN_CONFIGS, type PlanId } from './UpgradePaymentModal';
import { cn } from '@/lib/utils';
import { useTradingStore } from '@/lib/tradingStore';
import { useAcademyStore } from '@/lib/academyStore';
import { useAppStore } from '@/lib/appStore';
import { useAuthStore, UserProfile } from '@/lib/authStore';
import { useI18nStore } from '@/lib/i18nStore';
import {
  useSubscriptionStore,
  PLAN_DURATION_DAYS,
  VIRTUAL_PKG_PRICE_USDT,
  TRON_NETWORK,
  TRON_CURRENCY,
  tronscanUrl,
  type PaymentRecord,
} from '@/lib/subscriptionStore';
import { LanguageSelector } from './LanguageSelector';
import { TranslationAdmin } from './TranslationAdmin';
import { CountrySelector } from './CountrySelector';
import { findCountryByName } from '@/lib/countries';
import { LoginHistorySection } from './LoginHistorySection';
import {
  isBiometricAvailable,
  getAllBiometricCredentials,
  registerBiometric,
  authenticateWithBiometric,
  removeBiometricCredential,
} from '@/lib/biometricStore';
import {
  getLoginHistory,
  getLoginStats,
  clearLoginHistory,
  type LoginEvent,
  type LoginMethod,
} from '@/lib/loginHistoryStore';

const AVATAR_SEEDS = [
  'Felix', 'Aiden', 'Luna', 'Zara', 'Kai', 'Nova',
  'Ryder', 'Ivy', 'Jax', 'Sage', 'Crew', 'Mia',
];

const NATIONS = [
  { id: 'alpha', name: 'Alpha Republic', flag: '🔷', color: '#6366f1' },
  { id: 'bull',  name: 'Bull Empire',    flag: '🟢', color: '#10b981' },
  { id: 'sigma', name: 'Sigma Order',    flag: '🟡', color: '#f59e0b' },
  { id: 'bear',  name: 'Bear Collective',flag: '🔴', color: '#ef4444' },
];

// Plans are defined in UpgradePaymentModal.tsx as PLAN_CONFIGS

// COUNTRIES list is now in src/lib/countries.ts (195 entries)

const GENDERS = [
  { value: 'male',          label: 'Male',              emoji: '♂️' },
  { value: 'female',        label: 'Female',            emoji: '♀️' },
  { value: 'other',         label: 'Non-binary / Other',emoji: '⚧️' },
  { value: 'prefer_not',   label: 'Prefer not to say', emoji: '🔒' },
] as const;

const VIRTUAL_PACKAGES = [
  { label: '$10K',  amount: 10_000,  price: '$0.99'  },
  { label: '$50K',  amount: 50_000,  price: '$3.99'  },
  { label: '$200K', amount: 200_000, price: '$9.99'  },
  { label: '$1M',   amount: 1_000_000, price: '$24.99' },
];

// ── §4.3 Copy Trader Profile Panel ───────────────────────────────────────────

function CopyTraderProfilePanel({ userId }: { userId: string }) {
  const getTopTraders      = useCopyTradingStore(s => s.getTopTraders);
  const getActiveRelationships = useCopyTradingStore(s => s.getActiveRelationships);
  const getFollowersOf     = useCopyTradingStore(s => s.getFollowersOf);
  const traders            = useCopyTradingStore(s => s.traders);
  const getTraderEarnings  = useCopyTradingStore(s => s.getTraderEarnings);

  if (!userId) return null;

  // Check if the current user is a top trader
  const myTraderProfile = Object.values(traders).find(t => t.userId === userId) ?? null;
  // Follower relationships for this user as FOLLOWER (copy-following others)
  const activeRels  = getActiveRelationships(userId);
  const topTraderList = getTopTraders().slice(0, 3);

  // Determine badge thresholds
  const isTopTrader    = myTraderProfile !== null;
  const followerCount  = myTraderProfile ? myTraderProfile.totalFollowers : 0;
  const earns          = isTopTrader ? getTraderEarnings(myTraderProfile!.id) : null;

  const badgeTier = followerCount >= 1_000 ? 'Elite' : followerCount >= 100 ? 'Popular' : followerCount >= 10 ? 'Rising' : null;

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-lg"
      style={{ borderColor: 'rgba(255,215,0,0.18)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
        style={{ background: 'linear-gradient(135deg,rgba(255,215,0,0.06),transparent)' }}>
        <h3 className="font-bold flex items-center gap-2 text-sm">
          🔄 Copy Trading
        </h3>
        {badgeTier && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)' }}>
            {badgeTier === 'Elite' ? '👑' : badgeTier === 'Popular' ? '⭐' : '🚀'} {badgeTier} Trader
          </span>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* As a FOLLOWER — who I copy */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Following</p>
          {activeRels.length === 0 ? (
            <p className="text-xs text-muted-foreground">Not copying any traders yet.</p>
          ) : (
            activeRels.slice(0, 3).map(rel => (
              <div key={rel.id} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-semibold text-foreground">{rel.traderName}</span>
                <span className="text-muted-foreground">{rel.settings.copyPct}%</span>
                <span className="ml-auto font-bold" style={{ color: rel.totalProfitUsd >= 0 ? '#34d399' : '#ef4444' }}>
                  {rel.totalProfitUsd >= 0 ? '+' : ''}${rel.totalProfitUsd.toFixed(0)}
                </span>
              </div>
            ))
          )}
          <a href="/copy-trading" className="block text-xs font-semibold mt-1" style={{ color: '#FFD700' }}>
            {activeRels.length > 0 ? `View all ${activeRels.length} →` : 'Start copy trading →'}
          </a>
        </div>

        {/* As a TRADER — my followers */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">My Followers</p>
          {isTopTrader ? (
            <>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: '#FFD700' }}>{followerCount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-emerald-400">{earns?.activeFollowers ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Active</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: '#FFD700' }}>{myTraderProfile?.totalEarningsCP.toLocaleString()} CP</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
              </div>
              <a href="/copy-trading/followers" className="block text-xs font-semibold" style={{ color: '#FFD700' }}>
                View Follower Analytics →
              </a>
            </>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Achieve a high win rate to attract followers and earn copy fees.</p>
              <a href="/copy-trading" className="block text-xs font-semibold mt-1" style={{ color: '#FFD700' }}>
                Learn more →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── §4.4 CP Coins Wallet Section ──────────────────────────────────────────────

function CpWalletSection({ userId }: { userId: string }) {
  const getBalance    = useCpCoinsStore(s => s.getBalance);
  const getHistory    = useCpCoinsStore(s => s.getHistory);
  const initUser      = useCpCoinsStore(s => s.initUser);
  const getUserPurchases = useStrategyStore(s => s.getUserPurchases);
  const getCreatorStrategies = useStrategyStore(s => s.getCreatorStrategies);

  const [showAll, setShowAll] = useState(false);

  if (!userId) return null;
  initUser(userId);

  const balance  = getBalance(userId);
  const txns     = getHistory(userId);
  const purchases = getUserPurchases(userId);
  const myStrategies = getCreatorStrategies(userId);
  const totalEarned = myStrategies.reduce((s, st) => s + st.totalRevenue, 0);
  const totalSpent  = purchases.reduce((s, p) => s + p.price, 0);

  const displayed = showAll ? txns : txns.slice(0, 5);

  const dirColor = (dir: string) => dir === 'credit' ? '#34d399' : '#ef4444';
  const dirSign  = (dir: string) => dir === 'credit' ? '+' : '−';

  const TYPE_LABELS: Record<string, string> = {
    purchase_strategy:   'Strategy Purchase',
    sell_strategy:       'Strategy Sale',
    platform_fee:        'Copy Trading Fee',   // §4.2 — copy fee deductions
    refund_strategy:     'Refund',
    admin_grant:         'Admin Grant',
    admin_deduct:        'Admin Deduction',
    referral_bonus:      'Referral Bonus',
    achievement_reward:  'Achievement / Copy Fee Earned',  // §4.2 — trader earnings
    competition_prize:   'Competition Prize',
    subscription_reward: 'Welcome Bonus',
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-lg"
      style={{ borderColor: 'rgba(255,215,0,0.15)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
        style={{ background: 'linear-gradient(135deg,rgba(255,215,0,0.06),transparent)' }}>
        <h3 className="font-bold flex items-center gap-2 text-sm">
          💰 CP Coins Wallet
        </h3>
        <span className="font-bold text-lg" style={{ color: '#FFD700' }}>
          {balance.toLocaleString()} CP
        </span>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-px" style={{ background: 'rgba(255,215,0,0.06)' }}>
        {[
          { label: 'Balance',      value: `${balance.toLocaleString()} CP`,      color: '#FFD700' },
          { label: 'Total Earned', value: `${totalEarned.toLocaleString()} CP`,   color: '#34d399' },
          { label: 'Total Spent',  value: `${totalSpent.toLocaleString()} CP`,    color: '#ef4444' },
        ].map(m => (
          <div key={m.label} className="flex flex-col items-center py-3"
            style={{ background: 'var(--card)' }}>
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
            <span className="text-xs font-bold mt-0.5" style={{ color: m.color }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div className="p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Transaction History</p>

        {txns.length === 0 ? (
          <p className="text-xs text-center py-4 text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {displayed.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-secondary/20">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: `${dirColor(tx.direction)}18`, color: dirColor(tx.direction) }}>
                  {tx.direction === 'credit' ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: dirColor(tx.direction) }}>
                    {dirSign(tx.direction)}{tx.amount.toLocaleString()} CP
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}

            {txns.length > 5 && (
              <button onClick={() => setShowAll(v => !v)}
                className="w-full text-xs font-semibold py-2 rounded-xl border border-white/5 text-muted-foreground hover:text-foreground transition-colors">
                {showAll ? '↑ Show Less' : `↓ View All ${txns.length} Transactions`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function Profile() {
  const { balance, history, positions } = useTradingStore();
  const { totalXP, completedLessons }   = useAcademyStore();
  const { theme, toggleTheme, selectedNationId, joinNation, leaveNation } = useAppStore();
  const { user, updateProfile, logout, addVirtualBalance } = useAuthStore();
  const { t } = useI18nStore();
  const { submitPayment, verifyPayment, getPayments, getActiveSubscription } = useSubscriptionStore();

  const avatarSeed   = user?.avatarSeed ?? 'Felix';
  const displayName  = user?.displayName ?? 'Trader';

  const [editingName, setEditingName]   = useState(false);
  const [draftName, setDraftName]       = useState(displayName);
  const [showLogout, setShowLogout]     = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [copiedRef, setCopiedRef]       = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<PlanId | null>(null);
  const [showAdminRequest, setShowAdminRequest] = useState(false);
  const [showAdminPanel, setShowAdminPanel]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Virtual balance payment flow
  const [virtualPayPkg,    setVirtualPayPkg]    = useState<typeof VIRTUAL_PACKAGES[number] | null>(null);
  const [virtualPayStep,   setVirtualPayStep]   = useState<'txhash' | 'waiting' | null>(null);
  const [virtualTxHash,    setVirtualTxHash]    = useState('');
  const [virtualPaymentId, setVirtualPaymentId] = useState('');
  const [virtualTouched,   setVirtualTouched]   = useState(false);
  const [virtualVerifying, setVirtualVerifying] = useState(false);
  const [virtualResult,    setVirtualResult]    = useState<'success' | 'rejected' | null>(null);
  const [virtualRejectMsg, setVirtualRejectMsg] = useState('');

  // TRC20 hash validation
  const TRC20_RE = /^[0-9a-fA-F]{64}$/;
  const virtualHashValid = TRC20_RE.test(virtualTxHash.trim());

  const handleVirtualPaste = useCallback(async () => {
    try { const t = await navigator.clipboard.readText(); setVirtualTxHash(t.trim()); setVirtualTouched(true); } catch { /* ignore */ }
  }, []);

  const handleVirtualSubmit = useCallback(() => {
    setVirtualTouched(true);
    if (!virtualHashValid || !virtualPayPkg || !user) return;
    const record = submitPayment({
      userId:   user.id,
      kind:     'virtual_balance',
      pkgLabel: virtualPayPkg.label,
      amount:   VIRTUAL_PKG_PRICE_USDT[virtualPayPkg.label] ?? 0,
      txHash:   virtualTxHash.trim(),
      network:  TRON_NETWORK,
      currency: TRON_CURRENCY,
    });
    setVirtualPaymentId(record.id);
    setVirtualPayStep('waiting');
    setVirtualVerifying(true);
    verifyPayment(record.id, user.id).then(({ ok, record: rec }) => {
      setVirtualVerifying(false);
      if (ok) {
        addVirtualBalance(virtualPayPkg.amount);
        setVirtualResult('success');
        setTimeout(() => {
          setVirtualPayPkg(null);
          setVirtualPayStep(null);
          setVirtualResult(null);
          setVirtualTxHash('');
          setVirtualTouched(false);
        }, 2500);
      } else {
        setVirtualResult('rejected');
        setVirtualRejectMsg(rec.rejectionReason ?? 'Transaction could not be verified.');
      }
    });
  }, [virtualHashValid, virtualPayPkg, user, virtualTxHash, submitPayment, verifyPayment, addVirtualBalance]);

  const closeVirtualModal = useCallback(() => {
    setVirtualPayPkg(null);
    setVirtualPayStep(null);
    setVirtualResult(null);
    setVirtualTxHash('');
    setVirtualTouched(false);
    setVirtualVerifying(false);
  }, []);

  // ── Biometric state ──
  const [bioAvailable, setBioAvailable]     = useState(false);
  const [bioCredentials, setBioCreds]       = useState(getAllBiometricCredentials());
  const [bioStatus, setBioStatus]           = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bioMessage, setBioMessage]         = useState('');
  const [bioAction, setBioAction]           = useState<'enroll' | 'test' | 'remove' | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBioAvailable);
  }, []);

  const userCredential = user ? bioCredentials.find(c => c.userId === user.id) ?? null : null;
  const isEnrolled     = !!userCredential;

  const refreshCreds = () => setBioCreds(getAllBiometricCredentials());

  const bioFeedback = (
    status: 'loading' | 'success' | 'error',
    msg: string,
    action: typeof bioAction = null,
  ) => {
    setBioStatus(status);
    setBioMessage(msg);
    setBioAction(action);
    if (status !== 'loading') {
      setTimeout(() => { setBioStatus('idle'); setBioMessage(''); setBioAction(null); }, 3500);
    }
  };

  const handleEnroll = useCallback(async () => {
    if (!user) return;
    bioFeedback('loading', 'Waiting for biometric confirmation…', 'enroll');
    const result = await registerBiometric({
      userId:      user.id,
      email:       user.email,
      displayName: user.displayName,
      provider:    'email',
    });
    if (result.ok) {
      refreshCreds();
      bioFeedback('success', 'Biometric registered successfully! You can now sign in with one touch.');
    } else {
      bioFeedback('error', result.error ?? 'Registration failed. Please try again.');
    }
  }, [user]);

  const handleReEnroll = useCallback(async () => {
    if (!user) return;
    // Remove old first, then register fresh
    removeBiometricCredential(user.id);
    bioFeedback('loading', 'Removing old credential and registering new one…', 'enroll');
    const result = await registerBiometric({
      userId:      user.id,
      email:       user.email,
      displayName: user.displayName,
      provider:    'email',
    });
    if (result.ok) {
      refreshCreds();
      bioFeedback('success', 'New biometric registered! Old credential has been replaced.');
    } else {
      refreshCreds(); // restore UI even on failure
      bioFeedback('error', result.error ?? 'Re-enrollment failed. Please try again.');
    }
  }, [user]);

  const handleRemove = useCallback(() => {
    if (!user) return;
    removeBiometricCredential(user.id);
    refreshCreds();
    setShowRemoveConfirm(false);
    bioFeedback('success', 'Biometric credential removed. Password login is now required.');
  }, [user]);

  const handleTestAuth = useCallback(async () => {
    if (!userCredential) return;
    bioFeedback('loading', 'Verifying your biometric…', 'test');
    const result = await authenticateWithBiometric(userCredential.credentialId);
    if (result.ok) {
      bioFeedback('success', '✓ Biometric verified successfully! Your credential is working.');
    } else {
      bioFeedback('error', result.error ?? 'Verification failed.');
    }
  }, [userCredential]);

  // ── Login history state ──
  const [historyEvents, setHistoryEvents]       = useState<LoginEvent[]>(() =>
    user ? getLoginHistory(user.id) : [],
  );
  const [historyFilter, setHistoryFilter]       = useState<LoginMethod | 'all'>('all');
  const [historySearch, setHistorySearch]       = useState('');
  const [expandedEvent, setExpandedEvent]       = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [historyPage, setHistoryPage]           = useState(0);
  const HISTORY_PAGE_SIZE = 8;

  const refreshHistory = useCallback(() => {
    if (user) setHistoryEvents(getLoginHistory(user.id));
  }, [user]);

  useEffect(() => { refreshHistory(); }, [refreshHistory]);

  const historyStats = user ? getLoginStats(user.id) : null;

  const filteredHistory = historyEvents.filter(e => {
    const matchMethod = historyFilter === 'all' || e.method === historyFilter;
    const q = historySearch.toLowerCase();
    const matchSearch = !q || [e.browser, e.os, e.timezone, e.method, e.language]
      .some(v => v.toLowerCase().includes(q));
    return matchMethod && matchSearch;
  });

  const pagedHistory    = filteredHistory.slice(0, (historyPage + 1) * HISTORY_PAGE_SIZE);
  const hasMoreHistory  = filteredHistory.length > pagedHistory.length;

  const handleClearHistory = () => {
    if (!user) return;
    clearLoginHistory(user.id);
    setHistoryEvents([]);
    setShowClearConfirm(false);
  };

  // ── Extended profile fields ──
  const [editingInfo, setEditingInfo]   = useState(false);
  const [draftBio, setDraftBio]         = useState(user?.bio ?? '');
  const [draftCountry, setDraftCountry] = useState(user?.country ?? '');
  const [draftGender, setDraftGender]   = useState<UserProfile['gender']>(user?.gender);
  const [draftAge, setDraftAge]         = useState<string>(user?.age ? String(user.age) : '');
  const [savedInfo, setSavedInfo]       = useState(false);
  // CountrySelector manages its own open/query state internally

  // Sync drafts when user changes (e.g. after a save round-trip)
  useEffect(() => {
    setDraftBio(user?.bio ?? '');
    setDraftCountry(user?.country ?? '');
    setDraftGender(user?.gender);
    setDraftAge(user?.age ? String(user.age) : '');
  }, [user?.bio, user?.country, user?.gender, user?.age]);



  const saveInfo = () => {
    const ageNum = parseInt(draftAge, 10);
    // Normalize: CountrySelector gives us the plain name, but legacy values
    // might have the old "🇺🇸 United States" format — strip the flag if present
    const countryFound = findCountryByName(draftCountry);
    const countryName  = countryFound ? countryFound.name : (draftCountry || undefined);
    updateProfile({
      bio:     draftBio.trim() || undefined,
      country: countryName,
      gender:  draftGender,
      age:     !isNaN(ageNum) && ageNum > 0 ? ageNum : undefined,
    });
    setEditingInfo(false);
    setSavedInfo(true);
    setTimeout(() => setSavedInfo(false), 2500);
  };



  const closedTrades = history.filter(r => r.action === 'close');
  const winners      = closedTrades.filter(r => r.pnl > 0);
  const winRate      = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
  const totalPnl     = closedTrades.reduce((a, r) => a + r.pnl, 0);
  const totalFees    = history.reduce((a, r) => a + r.fee, 0);

  const xpLevel    = Math.floor(totalXP / 500) + 1;
  const xpProgress = (totalXP % 500) / 500;

  const selectedNation = NATIONS.find(n => n.id === selectedNationId) ?? null;

  // Live subscription info — drives countdown on the plan card
  const activeSub = user ? getActiveSubscription(user.id) : null;

  const saveName = () => {
    if (draftName.trim()) updateProfile({ displayName: draftName.trim() });
    setEditingName(false);
  };

  const handleAvatarSeed = (seed: string) => {
    updateProfile({ avatarSeed: seed, avatarUrl: undefined });
    setShowAvatarPicker(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateProfile({ avatarUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
    setShowAvatarPicker(false);
  };

  const copyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode).catch(() => {});
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Virtual balance is now gated behind a USDT payment — see virtualPayPkg flow above

  const avatarSrc = user?.avatarUrl
    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* ── Profile Card ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 border-2 border-card overflow-hidden shadow-lg">
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setShowAvatarPicker(p => !p)}
              className="absolute -bottom-2 -right-2 p-1.5 bg-primary rounded-lg shadow-lg hover:bg-primary/80 transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            </button>
          </div>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="absolute mt-28 ml-4 z-50 bg-card border border-white/10 rounded-2xl p-4 shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200">
              {/* Upload photo */}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Camera className="h-4 w-4" /> {t('profile.uploadPhoto')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

              <p className="text-xs text-muted-foreground mb-2 text-center">or choose an avatar</p>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_SEEDS.map(seed => (
                  <button
                    key={seed}
                    onClick={() => handleAvatarSeed(seed)}
                    className={cn(
                      'rounded-xl overflow-hidden border-2 transition-all hover:scale-105',
                      seed === avatarSeed && !user?.avatarUrl ? 'border-primary' : 'border-transparent',
                    )}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      alt={seed}
                      className="w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name + Nation */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {editingName ? (
                <>
                  <input
                    autoFocus
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className="bg-secondary/40 border border-white/15 rounded-lg px-3 py-1 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button onClick={saveName} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"><X className="h-4 w-4" /></button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  {user?.isAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold border border-yellow-500/30">Admin</span>
                  )}
                  <button onClick={() => { setDraftName(displayName); setEditingName(true); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-1">{user?.email}</p>

            {selectedNation ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span className="text-lg">{selectedNation.flag}</span>
                <span className="text-sm font-medium" style={{ color: selectedNation.color }}>{selectedNation.name}</span>
                <button onClick={leaveNation} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">(leave)</button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No nation — join one below</p>
            )}

            {/* XP bar */}
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-400" /> Level {xpLevel}</span>
                <span>{totalXP} XP</span>
              </div>
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(xpProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Info ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> {t('profile.editProfile')}
          </h3>
          <div className="flex items-center gap-2">
            {savedInfo && (
              <span className="text-xs text-green-400 flex items-center gap-1 animate-in fade-in duration-200">
                <Check className="h-3.5 w-3.5" /> {t('common.success')}
              </span>
            )}
            {editingInfo ? (
              <>
                <button
                  onClick={saveInfo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/25 hover:bg-green-500/25 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" /> {t('common.save')}
                </button>
                <button
                  onClick={() => setEditingInfo(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground text-xs font-semibold hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingInfo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground text-xs font-semibold hover:text-foreground border border-white/5 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" /> {t('profile.editProfile')}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('profile.bio')}
            </label>
            {editingInfo ? (
              <textarea
                value={draftBio}
                onChange={e => setDraftBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tell the community about yourself…"
                className="w-full bg-secondary/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground resize-none"
              />
            ) : (
              <p className={cn(
                'text-sm px-4 py-2.5 rounded-xl bg-secondary/20 border border-white/5 min-h-[60px]',
                !user?.bio && 'text-muted-foreground italic',
              )}>
                {user?.bio ?? 'No bio yet. Tell the community about yourself!'}
              </p>
            )}
            {editingInfo && (
              <p className="text-right text-[10px] text-muted-foreground mt-1">{draftBio.length}/200</p>
            )}
          </div>

          {/* Country + Age row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t('profile.country')}</span>
              </label>
              {editingInfo ? (
                <CountrySelector
                  value={draftCountry}
                  onChange={setDraftCountry}
                />
              ) : (
                <div className={cn(
                  'flex items-center gap-2.5 text-sm px-4 py-2.5 rounded-xl bg-secondary/20 border border-white/5',
                  !user?.country && 'text-muted-foreground italic',
                )}>
                  {(() => {
                    if (!user?.country) return <span>Not set</span>;
                    const found = findCountryByName(user.country);
                    return found
                      ? <><span className="text-xl">{found.flag}</span><span>{found.name}</span></>
                      : <span>{user.country}</span>;
                  })()}
                </div>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('profile.age')}
              </label>
              {editingInfo ? (
                <input
                  type="number"
                  min={13}
                  max={120}
                  value={draftAge}
                  onChange={e => setDraftAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full bg-secondary/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                />
              ) : (
                <p className={cn(
                  'text-sm px-4 py-2.5 rounded-xl bg-secondary/20 border border-white/5',
                  !user?.age && 'text-muted-foreground italic',
                )}>
                  {user?.age ? `${user.age} years old` : 'Not set'}
                </p>
              )}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              {t('profile.gender')}
            </label>
            {editingInfo ? (
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setDraftGender(g.value as UserProfile['gender'])}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                      draftGender === g.value
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-secondary/20 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground',
                    )}
                  >
                    <span>{g.emoji}</span>
                    <span className="truncate">{g.label}</span>
                    {draftGender === g.value && <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ) : (
              <p className={cn(
                'text-sm px-4 py-2.5 rounded-xl bg-secondary/20 border border-white/5 flex items-center gap-2',
                !user?.gender && 'text-muted-foreground italic',
              )}>
                {user?.gender
                  ? (() => {
                      const g = GENDERS.find(g => g.value === user.gender);
                      return g ? <><span>{g.emoji}</span><span>{g.label}</span></> : 'Not set';
                    })()
                  : 'Not set'}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Balance', value: `$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Activity, color: 'text-primary' },
          { label: 'All-Time P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, icon: Trophy, color: totalPnl >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Win Rate', value: closedTrades.length > 0 ? `${winRate.toFixed(1)}%` : '—', icon: Target, color: 'text-blue-400' },
          { label: 'Lessons Done', value: completedLessons.size.toString(), icon: Award, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-white/5 rounded-2xl p-4 shadow-lg text-center">
            <Icon className={cn('h-5 w-5 mx-auto mb-2', color)} />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-lg font-bold font-mono', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Nation Selection ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Choose Your Nation
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {NATIONS.map(nation => {
            const isMember = selectedNationId === nation.id;
            return (
              <button
                key={nation.id}
                onClick={() => isMember ? leaveNation() : joinNation(nation.id)}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200',
                  isMember
                    ? 'border-opacity-60 bg-opacity-10'
                    : 'border-white/5 bg-secondary/20 hover:border-white/15',
                )}
                style={isMember ? { borderColor: nation.color + '80', backgroundColor: nation.color + '15' } : {}}
              >
                <span className="text-2xl">{nation.flag}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={isMember ? { color: nation.color } : {}}>
                    {nation.name}
                  </p>
                  {isMember && <p className="text-xs text-muted-foreground">✓ Member</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Referral ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> {t('profile.inviteFriend')}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-secondary/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm tracking-widest">
            {user?.referralCode ?? '—'}
          </div>
          <button
            onClick={copyReferral}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
              copiedRef
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-secondary/50 text-muted-foreground border-white/10 hover:text-foreground',
            )}
          >
            {copiedRef ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedRef ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{user?.referralCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('profile.referralCount')}</p>
          </div>
          <div className="bg-secondary/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-400">${(user?.referralBonus ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('profile.referralBonus')}</p>
          </div>
        </div>
      </div>

      {/* ── Subscription Plans ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" /> {t('subscription.title')}
          </h3>
          {/* Global expiry pill — shown in header when a paid sub is active */}
          {activeSub && !activeSub.isExpired && activeSub.planId !== 'bronze' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                activeSub.daysLeft <= 5
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  : 'bg-green-500/10 border-green-500/20 text-green-400',
              )}
            >
              <CalendarClock className="h-3 w-3" />
              {activeSub.daysLeft === 0 ? 'Expires today' : `${activeSub.daysLeft}d left`}
            </motion.div>
          )}
          {activeSub?.isExpired && activeSub.planId !== 'bronze' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
              <XCircle className="h-3 w-3" /> Expired
            </span>
          )}
        </div>

        {/* Warning strip — ≤ 5 days remaining */}
        <AnimatePresence>
          {activeSub && !activeSub.isExpired && activeSub.daysLeft <= 5 && activeSub.planId !== 'bronze' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2.5 px-3.5 py-2.5 mb-4 rounded-xl bg-amber-500/8 border border-amber-500/20"
            >
              <TriangleAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Your{' '}
                <span className="font-semibold capitalize">{activeSub.planId}</span>{' '}
                plan expires in{' '}
                <span className="font-bold">
                  {activeSub.daysLeft === 0 ? 'less than 24 hours' : `${activeSub.daysLeft} day${activeSub.daysLeft === 1 ? '' : 's'}`}
                </span>
                . Renew now to avoid losing premium access.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLAN_CONFIGS.map(plan => {
            const Icon      = plan.icon;
            const isCurrent = (user?.plan ?? 'bronze') === plan.id;
            const isFree    = plan.priceUSD === 0;
            const isPaidActive = isCurrent && !isFree && activeSub && !activeSub.isExpired;

            // Progress ratio for the countdown bar (0 → 1 as days tick down)
            const totalDays   = 30; // all paid plans are 30-day cycles
            const daysLeft    = isPaidActive ? activeSub.daysLeft : 0;
            const barProgress = isPaidActive ? Math.max(0, Math.min(1, daysLeft / totalDays)) : 0;

            // Colour shifts amber ≤ 5 days, red ≤ 2 days
            const barColor = daysLeft <= 2
              ? '#ef4444'
              : daysLeft <= 5
                ? '#f59e0b'
                : plan.color;

            const expiryDate = activeSub?.expiresAt && isCurrent && !isFree
              ? new Date(activeSub.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
              : null;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl p-4 border transition-all duration-200',
                  isCurrent
                    ? 'border-opacity-60 ring-1'
                    : 'border-white/5 bg-secondary/20',
                )}
                style={isCurrent ? { borderColor: plan.color + '60', boxShadow: `0 0 0 1px ${plan.color}40` } : {}}
              >
                {/* ── Current plan badge ── */}
                {isCurrent && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: plan.color + '30', color: plan.color }}
                  >
                    {t('subscription.currentPlan')}
                  </span>
                )}

                <Icon className="h-5 w-5 mb-2" style={{ color: plan.color }} />
                <p className="font-bold text-sm mb-0.5" style={isCurrent ? { color: plan.color } : {}}>
                  {plan.label}
                </p>
                <p className="text-xs text-muted-foreground font-mono mb-3">{plan.price}</p>

                {/* ── Expiry countdown (active paid plan only) ── */}
                {isPaidActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 space-y-1.5"
                  >
                    {/* Bar */}
                    <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(barProgress * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}80` }}
                      />
                    </div>

                    {/* Days left + expiry date */}
                    <div className="flex items-center justify-between">
                      <span
                        className="flex items-center gap-1 text-[10px] font-semibold tabular-nums"
                        style={{ color: barColor }}
                      >
                        <CalendarClock className="h-3 w-3" />
                        {daysLeft === 0
                          ? 'Expires today'
                          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                      </span>
                      {expiryDate && (
                        <span className="text-[10px] text-muted-foreground/60">
                          until {expiryDate}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Expired notice on the card itself */}
                {isCurrent && !isFree && activeSub?.isExpired && (
                  <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-[11px] text-red-400 font-medium">Subscription expired</span>
                  </div>
                )}

                {/* Perks list */}
                <ul className="space-y-1 mb-3">
                  {plan.perks.map(p => (
                    <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-400" />{p}
                    </li>
                  ))}
                </ul>

                {/* CTA buttons */}
                {!isCurrent && !isFree && (
                  <button
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: plan.color + '20', color: plan.color, border: `1px solid ${plan.color}40` }}
                    onClick={() => setUpgradingPlanId(plan.id)}
                  >
                    {t('subscription.upgrade')}
                  </button>
                )}
                {/* Renew button — shown when current paid plan has expired */}
                {isCurrent && !isFree && activeSub?.isExpired && (
                  <button
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: plan.color + '20', color: plan.color, border: `1px solid ${plan.color}40` }}
                    onClick={() => setUpgradingPlanId(plan.id)}
                  >
                    Renew Plan
                  </button>
                )}
                {!isCurrent && isFree && (
                  <button
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: plan.color + '20', color: plan.color, border: `1px solid ${plan.color}40` }}
                    onClick={() => updateProfile({ plan: plan.id })}
                  >
                    Downgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Upgrade Payment Modal ── */}
      {upgradingPlanId && (() => {
        const activePlan = PLAN_CONFIGS.find(p => p.id === upgradingPlanId);
        if (!activePlan) return null;
        return (
          <UpgradePaymentModal
            plan={activePlan}
            currentPlan={user?.plan ?? 'bronze'}
            onClose={() => setUpgradingPlanId(null)}
            onConfirmed={(planId) => {
              const durDays = PLAN_DURATION_DAYS[planId] ?? 30;
              const expiry  = new Date(Date.now() + durDays * 86_400_000).toISOString();
              updateProfile({ plan: planId, planExpiry: expiry });
              setUpgradingPlanId(null);
            }}
          />
        );
      })()}

      {/* ── Buy Virtual USD ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" /> {t('currency.buyVirtual')}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Pay USDT (TRC20) → get virtual trading balance. Current:{' '}
          <span className="font-mono text-foreground">${(user?.virtualBalance ?? 0).toLocaleString()}</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VIRTUAL_PACKAGES.map(pkg => (
            <button
              key={pkg.label}
              onClick={() => { setVirtualPayPkg(pkg); setVirtualPayStep('txhash'); setVirtualTxHash(''); setVirtualTouched(false); setVirtualResult(null); }}
              className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl border border-white/10 bg-secondary/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
            >
              <span className="text-lg font-bold text-primary">{pkg.label}</span>
              <span className="text-xs text-muted-foreground">{pkg.price} USDT</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Virtual Balance Payment Modal ── */}
      <AnimatePresence>
        {virtualPayPkg && virtualPayStep && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ duration: 0.28, ease: [0.34, 1.06, 0.64, 1] }}
              className="relative w-full max-w-sm bg-card border border-white/8 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-primary/5">
                <div>
                  <h3 className="font-bold text-sm">Buy {virtualPayPkg.label} Virtual USD</h3>
                  <p className="text-xs text-muted-foreground">Pay {virtualPayPkg.price} USDT via TRC20</p>
                </div>
                {virtualPayStep !== 'waiting' && (
                  <button onClick={closeVirtualModal}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-secondary/40 hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* TX hash step */}
                {virtualPayStep === 'txhash' && (
                  <>
                    {/* Wallet address block — bold address, copy, QR, warning, min/max */}
                    <WalletAddressBlock
                      accentColor="hsl(var(--primary))"
                      requiredAmount={VIRTUAL_PKG_PRICE_USDT[virtualPayPkg.label]}
                      currency="USDT"
                    />

                    {/* Hash input */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Transaction Hash (TRC20)
                      </label>
                      <div className={cn(
                        'flex items-center gap-2 rounded-xl border transition-all overflow-hidden',
                        virtualTouched && !virtualHashValid && virtualTxHash
                          ? 'border-red-500/50 bg-red-500/5'
                          : virtualHashValid
                            ? 'border-green-500/40 bg-green-500/5'
                            : 'border-white/10 bg-secondary/30 focus-within:border-white/25',
                      )}>
                        <div className="pl-3 flex-shrink-0">
                          {virtualHashValid
                            ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                            : <Hash className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <input
                          value={virtualTxHash}
                          onChange={e => { setVirtualTxHash(e.target.value); setVirtualTouched(true); }}
                          onKeyDown={e => { if (e.key === 'Enter') handleVirtualSubmit(); }}
                          placeholder="64-character hex…"
                          spellCheck={false}
                          autoComplete="off"
                          className="flex-1 bg-transparent py-2.5 pr-2 text-xs font-mono focus:outline-none placeholder:text-muted-foreground/50"
                        />
                        <button onClick={handleVirtualPaste}
                          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground border-l border-white/8 transition-colors">
                          <Copy className="h-3 w-3" /> Paste
                        </button>
                      </div>
                      {virtualTouched && virtualTxHash && !virtualHashValid && (
                        <p className="text-[11px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Must be exactly 64 hex characters (no 0x)
                        </p>
                      )}
                    </div>

                    {/* Tronscan preview */}
                    {virtualHashValid && (
                      <a href={tronscanUrl(virtualTxHash)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/15 transition-all group text-xs">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                        <span className="text-muted-foreground group-hover:text-foreground">Verify on Tronscan</span>
                        <span className="font-mono text-muted-foreground/50 ml-auto">{virtualTxHash.slice(0,12)}…</span>
                      </a>
                    )}

                    <button
                      onClick={handleVirtualSubmit}
                      disabled={!virtualHashValid}
                      className={cn(
                        'w-full py-3 rounded-2xl font-bold text-sm transition-all',
                        virtualHashValid
                          ? 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20'
                          : 'bg-secondary/40 text-muted-foreground cursor-not-allowed',
                      )}
                    >
                      Submit for Verification
                    </button>
                  </>
                )}

                {/* Waiting / result step */}
                {virtualPayStep === 'waiting' && (
                  <div className="flex flex-col items-center text-center space-y-4 py-2">
                    {virtualResult === null && (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div>
                          <p className="font-bold">Verifying on TRC20…</p>
                          <p className="text-xs text-muted-foreground mt-1">Checking your transaction on the TRON blockchain</p>
                        </div>
                        <a href={tronscanUrl(virtualTxHash)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View on Tronscan
                        </a>
                      </>
                    )}
                    {virtualResult === 'success' && (
                      <>
                        <CheckCircle2 className="h-12 w-12 text-green-400" />
                        <div>
                          <p className="font-bold text-green-400">Payment Confirmed! 🎉</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {virtualPayPkg.label} added to your virtual balance
                          </p>
                        </div>
                      </>
                    )}
                    {virtualResult === 'rejected' && (
                      <>
                        <XCircle className="h-12 w-12 text-red-400" />
                        <div>
                          <p className="font-bold text-red-400">Verification Failed</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{virtualRejectMsg}</p>
                        </div>
                        <div className="flex gap-3 w-full">
                          <button onClick={() => { setVirtualPayStep('txhash'); setVirtualResult(null); setVirtualTxHash(''); setVirtualTouched(false); }}
                            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all">
                            Try Again
                          </button>
                          <button onClick={closeVirtualModal}
                            className="flex-1 py-2.5 rounded-xl bg-secondary/40 text-muted-foreground text-sm hover:bg-secondary/60 transition-all">
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Payment History ── */}
      {(() => {
        const payments = user ? getPayments(user.id) : [];
        if (payments.length === 0) return null;

        const statusMeta: Record<PaymentRecord['status'], { label: string; color: string; icon: React.ElementType }> = {
          pending:  { label: 'Pending',  color: '#f59e0b', icon: Clock         },
          verified: { label: 'Verified', color: '#22c55e', icon: CheckCircle2  },
          rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle       },
          expired:  { label: 'Expired',  color: '#6b7280', icon: HelpCircle    },
        };

        return (
          <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> {t('currency.purchaseHistory')}
            </h3>
            <div className="space-y-2.5">
              {payments.map(p => {
                const meta     = statusMeta[p.status];
                const StatusIcon = meta.icon;
                const date     = new Date(p.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
                const isSubPay = p.kind === 'subscription';
                return (
                  <div key={p.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/10 transition-all">
                    {/* Status icon */}
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: meta.color + '18', border: `1px solid ${meta.color}30` }}>
                      <StatusIcon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {isSubPay
                            ? `${(p.planId ?? '').charAt(0).toUpperCase() + (p.planId ?? '').slice(1)} Plan`
                            : `Virtual ${p.pkgLabel ?? ''}`}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: meta.color + '18', color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] font-mono text-muted-foreground">{p.amount.toFixed(2)} USDT · {p.network}</span>
                        <span className="text-[10px] text-muted-foreground/60">{date}</span>
                      </div>
                      {p.rejectionReason && (
                        <p className="text-[10px] text-red-400/80 mt-1 leading-relaxed">{p.rejectionReason}</p>
                      )}
                    </div>

                    {/* TX link */}
                    <a href={tronscanUrl(p.txHash)} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 p-1.5 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all mt-0.5"
                      title="View on Tronscan">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── §4.3 Copy Trader Panel ── */}
      <CopyTraderProfilePanel userId={user?.id ?? ''} />

      {/* ── §4.4 CP Coins Wallet ── */}
      <CpWalletSection userId={user?.id ?? ''} />

      {/* ── Preferences ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg space-y-1">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Preferences
        </h3>

        {/* Theme toggle */}
        <div className="flex items-center justify-between px-1 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-amber-400" />}
            <span className="text-sm font-medium">Appearance</span>
          </div>
          <button
            onClick={toggleTheme}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
              theme === 'dark' ? 'bg-primary' : 'bg-amber-400',
            )}
          >
            <span className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1',
            )} />
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between px-1 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">Language</span>
          </div>
          <LanguageSelector />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between px-1 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-medium">Total Fees Paid</span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">${totalFees.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between px-1 py-3">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">Open Positions</span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">{positions.length}</span>
        </div>
      </div>

      {/* ── Biometric Management ── */}
      <div className="bg-card border border-white/5 rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'h-8 w-8 rounded-xl flex items-center justify-center',
              isEnrolled
                ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/20'
                : 'bg-secondary/50 border border-white/10',
            )}>
              <Fingerprint className={cn('h-4 w-4', isEnrolled ? 'text-yellow-400' : 'text-muted-foreground')} />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">Biometric & Passkeys</h3>
              <p className="text-xs text-muted-foreground leading-tight">
                Passwordless login — Touch ID · Face ID · Windows Hello
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
            !bioAvailable
              ? 'bg-secondary/40 border-white/10 text-muted-foreground'
              : isEnrolled
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          )}>
            {!bioAvailable ? (
              <><ShieldOff className="h-3 w-3" /> Not available</>
            ) : isEnrolled ? (
              <><ShieldCheck className="h-3 w-3" /> Active</>
            ) : (
              <><ShieldOff className="h-3 w-3" /> Not enrolled</>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Not supported message */}
          {!bioAvailable && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-white/8">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Not available on this device</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Biometric login requires a device with a platform authenticator such as Touch ID, Face ID, or Windows Hello.
                </p>
              </div>
            </div>
          )}

          {/* Enrolled credential card */}
          {bioAvailable && isEnrolled && userCredential && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 rounded-xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 to-orange-500/5 overflow-hidden"
            >
              {/* Glow blob */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-3">
                {/* Animated fingerprint */}
                <div className="relative h-12 w-12 flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/25 flex items-center justify-center">
                    <Fingerprint className="h-6 w-6 text-yellow-400" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-yellow-400/30"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {userCredential.email
                      .replace('oauth.google@cryptoplay.ai', 'Google Account')
                      .replace('oauth.apple@cryptoplay.ai', 'Apple Account')}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    Registered {new Date(userCredential.registeredAt).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Provider badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 capitalize">
                    {userCredential.provider}
                  </span>
                </div>
              </div>

              {/* Method icons */}
              <div className="flex items-center gap-2 mb-3">
                {[
                  { icon: Fingerprint, label: 'Touch ID' },
                  { icon: Scan,        label: 'Face ID' },
                  { icon: Smartphone,  label: 'Passkey' },
                  { icon: Key,         label: 'Windows Hello' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/8">
                    <Icon className="h-3 w-3 text-yellow-400/70" />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {/* Credential ID preview */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/5 mb-3">
                <Key className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                <span className="text-[10px] font-mono text-muted-foreground/50 truncate">
                  {userCredential.credentialId.slice(0, 32)}…
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestAuth}
                  disabled={bioStatus === 'loading'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {bioAction === 'test' && bioStatus === 'loading'
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ShieldCheck className="h-3.5 w-3.5" />
                  }
                  Test Auth
                </button>

                <button
                  onClick={handleReEnroll}
                  disabled={bioStatus === 'loading'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {bioAction === 'enroll' && bioStatus === 'loading'
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />
                  }
                  Re-enroll
                </button>

                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={bioStatus === 'loading'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all ml-auto disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </motion.div>
          )}

          {/* Remove confirmation */}
          <AnimatePresence>
            {showRemoveConfirm && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{ opacity: 0,    y: -6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">Remove biometric credential?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You'll need to use your password to sign in until you re-enroll a device.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemove}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Yes, remove it
                  </button>
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-secondary/60 text-muted-foreground text-xs font-semibold hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Not enrolled — enroll prompt */}
          {bioAvailable && !isEnrolled && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-dashed border-white/15 bg-secondary/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-secondary/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Fingerprint className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No biometric registered</p>
                  <p className="text-xs text-muted-foreground">Set up once — sign in with one touch forever.</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-1.5 mb-4">
                {[
                  { icon: Zap,        color: 'text-yellow-400', text: 'Sign in instantly — no password needed' },
                  { icon: ShieldCheck,color: 'text-green-400',  text: 'Your biometric never leaves this device' },
                  { icon: Wifi,       color: 'text-blue-400',   text: 'Works offline — no server verification' },
                ].map(({ icon: Icon, color, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', color)} />
                    <span className="text-xs text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleEnroll}
                disabled={bioStatus === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm hover:opacity-90 shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-60"
              >
                {bioStatus === 'loading' && bioAction === 'enroll'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Fingerprint className="h-4 w-4" />
                }
                {bioStatus === 'loading' && bioAction === 'enroll'
                  ? 'Waiting for confirmation…'
                  : 'Register Biometric / Passkey'
                }
              </button>
            </motion.div>
          )}

          {/* Status feedback toast */}
          <AnimatePresence>
            {bioStatus !== 'idle' && bioMessage && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1    }}
                exit={{ opacity: 0,    y: 6, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border text-sm',
                  bioStatus === 'loading' && 'bg-blue-500/10 border-blue-500/20 text-blue-300',
                  bioStatus === 'success' && 'bg-green-500/10 border-green-500/20 text-green-400',
                  bioStatus === 'error'   && 'bg-red-500/10  border-red-500/20  text-red-400',
                )}
              >
                {bioStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 mt-0.5" />}
                {bioStatus === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                {bioStatus === 'error'   && <AlertCircle  className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                <span className="text-xs leading-relaxed">{bioMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info strip */}
          <div className="flex items-center gap-2 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground/50 leading-snug">
              Secured by FIDO2 / WebAuthn. Your biometric data is processed locally by your operating system and never sent to any server.
            </p>
          </div>

        </div>
      </div>

      {/* ── Login History ── */}
      <LoginHistorySection
        events={historyEvents}
        filteredEvents={filteredHistory}
        pagedEvents={pagedHistory}
        hasMore={hasMoreHistory}
        stats={historyStats}
        filter={historyFilter}
        search={historySearch}
        expandedEvent={expandedEvent}
        showClearConfirm={showClearConfirm}
        onFilterChange={(f) => { setHistoryFilter(f); setHistoryPage(0); }}
        onSearchChange={(s) => { setHistorySearch(s); setHistoryPage(0); }}
        onToggleExpand={(id) => setExpandedEvent(prev => prev === id ? null : id)}
        onLoadMore={() => setHistoryPage(p => p + 1)}
        onClearRequest={() => setShowClearConfirm(true)}
        onClearConfirm={handleClearHistory}
        onClearCancel={() => setShowClearConfirm(false)}
      />

      {/* ── Admin Request ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-primary" /> Admin Status
        </h3>

        {user?.isAdmin ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4" /> Admin access active
            </div>
            {/* Super Admin Panel button */}
            <button
              onClick={() => setShowAdminPanel(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/25 text-red-400 hover:from-red-500/25 hover:to-orange-500/25 text-sm font-bold transition-all shadow-lg shadow-red-500/5"
            >
              <Settings className="h-4 w-4" />
              Open Admin Control Center
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Apply for an admin role. Our AI will evaluate your eligibility based on your activity, trades, and community contributions.
            </p>
            <button
              onClick={() => setShowAdminRequest(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/15 to-purple-500/15 border border-primary/25 text-primary hover:from-primary/25 hover:to-purple-500/25 text-sm font-bold transition-all shadow-lg shadow-primary/5"
            >
              <Bot className="h-4 w-4" />
              🤖 Request Admin Status
            </button>
          </div>
        )}
      </div>

      {/* ── Admin Request Modal ── */}
      <AdminRequestModal open={showAdminRequest} onClose={() => setShowAdminRequest(false)} />

      {/* ── Admin Control Center Panel ── */}
      <AdminPanel open={showAdminPanel} onClose={() => setShowAdminPanel(false)} />

      {/* ── Translation System ── */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        <TranslationAdmin />
      </div>

      {/* ── Logout ── */}
      <div className="bg-card border border-red-500/10 rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold mb-3 text-red-400 flex items-center gap-2">
          <LogOut className="h-4 w-4" /> Session
        </h3>
        {showLogout ? (
          <div className="flex items-center gap-3 animate-in fade-in duration-200">
            <p className="text-sm text-muted-foreground flex-1">Are you sure? Your data will persist.</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {t('nav.logout')}
            </button>
            <button
              onClick={() => setShowLogout(false)}
              className="px-4 py-2 bg-secondary/60 text-muted-foreground text-sm rounded-xl hover:bg-secondary transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-all"
          >
            <LogOut className="h-4 w-4" /> {t('nav.logout')}
          </button>
        )}
      </div>
    </div>
  );
}
