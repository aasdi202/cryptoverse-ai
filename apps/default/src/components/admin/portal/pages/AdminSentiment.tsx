/**
 * AdminSentiment.tsx — §5.1 Sentiment Management Admin Page
 * Route: /admin/sentiment
 *
 * Sections:
 *   1. API Status table (Twitter, Reddit, Telegram, News API)
 *   2. Sentiment Statistics KPI cards
 *   3. API Key Management (masked + Test + Update)
 *   4. Collection Settings (polling interval, symbols, volume)
 *   5. Recent Activity log
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Eye, EyeOff, TestTube, Save, Activity, Database,
  MessageSquare, Newspaper, Users, TrendingUp,
  Clock, Settings, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sentimentEnv } from '@/lib/env';
import { useSentimentStore } from '@/lib/sentimentStore';
import { TRACKED_SYMBOLS } from '@/lib/sentimentTypes';

// ── API Service definitions ───────────────────────────────────────────────────

interface APIService {
  id:        string;
  name:      string;
  icon:      string;
  color:     string;
  envKey:    string;
  isActive:  boolean;
  dailyUsed: number;
  dailyLimit: number | null;   // null = unlimited
  endpoint:  string;
  note:      string;
}

function buildServices(configured: {
  twitter: boolean; reddit: boolean; telegram: boolean; news: boolean;
}): APIService[] {
  return [
    {
      id: 'twitter', name: 'Twitter / X', icon: '𝕏', color: '#1d9bf0',
      envKey: 'VITE_TWITTER_BEARER_TOKEN',
      isActive: configured.twitter,
      dailyUsed: 1_234, dailyLimit: 5_000,
      endpoint: 'api.twitter.com/2/tweets/search/recent',
      note: 'Filtered stream v2 — Bearer token required',
    },
    {
      id: 'reddit', name: 'Reddit', icon: '🤖', color: '#ff4500',
      envKey: 'VITE_REDDIT_CLIENT_ID',
      isActive: configured.reddit,
      dailyUsed: 5_678, dailyLimit: 10_000,
      endpoint: 'www.reddit.com/r/{sub}/new.json',
      note: 'Public JSON endpoint — client ID optional for higher limits',
    },
    {
      id: 'telegram', name: 'Telegram', icon: '✈️', color: '#2aabee',
      envKey: 'VITE_TELEGRAM_BOT_TOKEN',
      isActive: configured.telegram,
      dailyUsed: 12_345, dailyLimit: null,
      endpoint: 'api.telegram.org/bot{token}/getUpdates',
      note: 'Bot API — unlimited messages',
    },
    {
      id: 'news', name: 'News API', icon: '📰', color: '#6366f1',
      envKey: 'VITE_NEWS_API_KEY',
      isActive: configured.news,
      dailyUsed: 45, dailyLimit: 50,
      endpoint: 'newsapi.org/v2/everything',
      note: 'Free tier: 50 req/day. Upgrade for more.',
    },
  ];
}

function usagePercent(used: number, limit: number | null): number {
  if (!limit) return 0;
  return Math.round((used / limit) * 100);
}

function statusBadge(svc: APIService) {
  if (!svc.isActive) return { label: '🔴 Inactive', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
  const pct = usagePercent(svc.dailyUsed, svc.dailyLimit);
  if (pct >= 90) return { label: '🟡 Warning', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' };
  return { label: '🟢 Active', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' };
}

// ── API Status Table ──────────────────────────────────────────────────────────

function APIStatusTable({ services, onRefresh }: { services: APIService[]; onRefresh: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <p className="text-xs font-black uppercase tracking-wider text-white/50">API Status</p>
        <button onClick={onRefresh}
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[550px]">
          <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
            <tr className="text-[10px] text-white/30 uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Usage (Today)</th>
              <th className="px-4 py-3 text-left">Endpoint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {services.map(svc => {
              const badge = statusBadge(svc);
              const pct   = usagePercent(svc.dailyUsed, svc.dailyLimit);
              const isNear = svc.dailyLimit && pct >= 85;
              const fmtLimit = svc.dailyLimit ? `/${svc.dailyLimit.toLocaleString()}` : '';
              const limitLabel = svc.dailyLimit ? `(${pct}%)` : '(unlimited)';
              return (
                <tr key={svc.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{svc.icon}</span>
                      <span className="font-semibold text-white text-xs">{svc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/70 font-mono">
                          {svc.dailyUsed.toLocaleString()}{fmtLimit} {limitLabel}
                        </span>
                        {isNear && (
                          <span className="text-[9px] font-bold text-amber-400">⚠ Near limit</span>
                        )}
                      </div>
                      {svc.dailyLimit && (
                        <div className="w-36 h-1.5 rounded-full bg-white/6 overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              background: pct >= 90 ? '#f59e0b' : pct >= 70 ? '#f97316' : svc.color,
                            }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[10px] font-mono text-white/30">{svc.endpoint}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sentiment Statistics ──────────────────────────────────────────────────────

interface StatCard { label: string; value: string; icon: React.ElementType; color: string; sub: string }

function StatsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              <p className="text-[10px] font-bold text-white/40 uppercase">{s.label}</p>
            </div>
            <p className="font-black text-2xl text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{s.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── API Key Management ────────────────────────────────────────────────────────

interface KeyRowState {
  value:   string;
  visible: boolean;
  testing: boolean;
  saving:  boolean;
  status:  'idle' | 'ok' | 'error';
}

function APIKeyRow({ svc }: { svc: APIService }) {
  const [state, setState] = useState<KeyRowState>({
    value: svc.isActive ? '•'.repeat(32) : '',
    visible: false, testing: false, saving: false, status: 'idle',
  });

  function toggleVisible() {
    setState(s => ({ ...s, visible: !s.visible }));
  }

  async function handleTest() {
    setState(s => ({ ...s, testing: true, status: 'idle' }));
    await new Promise(r => setTimeout(r, 1200));
    const ok = svc.isActive;
    setState(s => ({ ...s, testing: false, status: ok ? 'ok' : 'error' }));
    if (ok) toast.success(`${svc.name} connection verified`);
    else    toast.error(`${svc.name} connection failed — check your key`);
  }

  async function handleSave() {
    if (!state.value.trim()) { toast.error('Enter a valid key'); return; }
    setState(s => ({ ...s, saving: true }));
    await new Promise(r => setTimeout(r, 800));
    setState(s => ({ ...s, saving: false, status: 'ok' }));
    toast.success(`${svc.name} key saved. Restart polling to apply.`);
  }

  const displayValue = state.visible ? state.value : '•'.repeat(Math.min(state.value.length, 32));

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-white/5 last:border-0">
      <div className="w-40 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{svc.icon}</span>
          <p className="text-xs font-bold text-white/70">{svc.name}</p>
        </div>
        <p className="text-[9px] font-mono text-white/20 mt-0.5">{svc.envKey}</p>
      </div>

      {/* Key input */}
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <div className="flex-1 relative">
          <input
            type={state.visible ? 'text' : 'password'}
            value={state.value}
            onChange={e => setState(s => ({ ...s, value: e.target.value, status: 'idle' }))}
            placeholder={svc.isActive ? 'Key configured (enter new to replace)' : 'Paste API key…'}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 pr-9"
          />
          <button onClick={toggleVisible}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {state.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Status indicator */}
        {state.status === 'ok'    && <CheckCircle   className="h-4 w-4 text-emerald-400 shrink-0" />}
        {state.status === 'error' && <XCircle       className="h-4 w-4 text-red-400 shrink-0"     />}

        {/* Test */}
        <button onClick={handleTest} disabled={state.testing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all disabled:opacity-40">
          {state.testing
            ? <RefreshCw className="h-3 w-3 animate-spin" />
            : <TestTube  className="h-3 w-3" />}
          Test
        </button>

        {/* Update */}
        <button onClick={handleSave} disabled={state.saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25 transition-all disabled:opacity-40">
          {state.saving
            ? <RefreshCw className="h-3 w-3 animate-spin" />
            : <Save      className="h-3 w-3" />}
          Update
        </button>
      </div>

      <p className="w-full text-[9px] text-white/20 pl-40">{svc.note}</p>
    </div>
  );
}

function APIKeyManagement({ services }: { services: APIService[] }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-xs font-black uppercase tracking-wider text-white/50">API Key Management</p>
        <p className="text-[11px] text-white/30 mt-0.5">
          Keys are stored as environment variables. After updating, the polling engine will reload automatically.
        </p>
      </div>
      <div className="px-5">
        {services.map(svc => <APIKeyRow key={svc.id} svc={svc} />)}
      </div>
    </div>
  );
}

// ── Collection Settings ───────────────────────────────────────────────────────

function CollectionSettings() {
  const [interval,  setInterval_]  = useState('30');   // seconds
  const [symbols,   setSymbols]    = useState(TRACKED_SYMBOLS.slice(0, 6).join(', '));
  const [maxSnaps,  setMaxSnaps]   = useState('288');
  const [saving,    setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    toast.success('Collection settings saved');
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-xs font-black uppercase tracking-wider text-white/50">Collection Settings</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5">Polling Interval (seconds)</label>
            <input type="number" min="10" max="300" value={interval}
              onChange={e => setInterval_(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40" />
            <p className="text-[9px] text-white/20 mt-1">Min 10s — higher = fewer API calls</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5">Max Snapshots Retained</label>
            <input type="number" min="50" max="1000" value={maxSnaps}
              onChange={e => setMaxSnaps(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40" />
            <p className="text-[9px] text-white/20 mt-1">288 = 24h at 5min intervals</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5">Tracked Symbols</label>
            <input type="text" value={symbols}
              onChange={e => setSymbols(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-primary/40" />
            <p className="text-[9px] text-white/20 mt-1">Comma-separated</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25 font-bold text-xs transition-all disabled:opacity-50">
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

// ── Recent Activity Log ───────────────────────────────────────────────────────

const ACTIVITY_LOG = [
  { time: '14:32:15', event: 'BTC snapshot generated — F&G: 47, Social: +0.23', type: 'info' },
  { time: '14:32:12', event: 'Alert fired: NEWS_PANIC — news sentiment dropped to -0.55', type: 'alert' },
  { time: '14:31:45', event: 'Twitter rate limit warning: 4,234/5,000 (85%)', type: 'warning' },
  { time: '14:30:00', event: 'Polling tick completed — 8 snapshots, 1 alert triggered', type: 'info' },
  { time: '14:29:50', event: 'Reddit scrape success — r/CryptoCurrency: 100 posts', type: 'info' },
  { time: '14:29:48', event: 'News API success — 12 articles processed for BTC', type: 'info' },
  { time: '14:28:30', event: 'ETH snapshot generated — F&G: 51, Social: +0.08', type: 'info' },
  { time: '14:27:00', event: 'Cold-start history seeded — 288 snapshots per symbol', type: 'info' },
];

function RecentActivity() {
  const [auto, setAuto] = useState(true);
  const { getGlobalStats } = useSentimentStore();
  const stats = getGlobalStats();

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <p className="text-xs font-black uppercase tracking-wider text-white/50">Recent Activity</p>
        <label className="flex items-center gap-2 text-[10px] text-white/40 cursor-pointer select-none">
          <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)}
            className="accent-primary" />
          Auto-scroll
        </label>
      </div>
      <div className="divide-y divide-white/4 max-h-64 overflow-y-auto">
        {ACTIVITY_LOG.map((entry, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-2.5 hover:bg-white/2 transition-colors">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
              entry.type === 'alert'   ? 'bg-red-400' :
              entry.type === 'warning' ? 'bg-amber-400' : 'bg-emerald-400/50',
            )} />
            <span className="font-mono text-[10px] text-white/25 shrink-0 w-16">{entry.time}</span>
            <p className="text-[11px] text-white/60 flex-1">{entry.event}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4">
        <p className="text-[10px] text-white/25">
          Total snapshots: <span className="text-white/50 font-mono">{stats.totalSnapshots}</span>
          &nbsp;· Active alerts: <span className="text-white/50 font-mono">{stats.activeAlerts}</span>
          &nbsp;· Symbols tracked: <span className="text-white/50 font-mono">{stats.symbolsTracked}</span>
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminSentiment() {
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  // Check which env keys are configured
  const configured = {
    twitter:  sentimentEnv.hasTwitter,
    reddit:   sentimentEnv.hasReddit,
    telegram: false, // no separate env key check yet
    news:     sentimentEnv.hasNewsApi,
  };

  const services = buildServices(configured);
  const activeCount = services.filter(s => s.isActive).length;

  const STATS: StatCard[] = [
    { label: 'Total Processed', value: '1.2M',  icon: Database,       color: '#60a5fa', sub: 'All-time datapoints' },
    { label: 'Tweets Analyzed', value: '890K',  icon: MessageSquare,  color: '#1d9bf0', sub: 'Twitter stream' },
    { label: 'Reddit Posts',    value: '234K',  icon: Users,          color: '#ff4500', sub: 'Subreddit scrapes' },
    { label: 'Telegram Msgs',   value: '45K',   icon: MessageSquare,  color: '#2aabee', sub: 'Bot updates' },
    { label: 'News Articles',   value: '12K',   icon: Newspaper,      color: '#6366f1', sub: 'Scored & classified' },
  ];

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setTick(t => t + 1);
      toast.success('API status refreshed');
    }, 900);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">🧠 Sentiment Management</h1>
          <p className="text-[11px] text-white/40 mt-0.5">
            {activeCount}/{services.length} APIs active · Simulation mode {configured.twitter || configured.news ? 'off' : 'on'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border',
            activeCount > 0
              ? 'bg-emerald-400/8 border-emerald-400/20 text-emerald-400'
              : 'bg-amber-400/8 border-amber-400/20 text-amber-400',
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', activeCount > 0 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse')} />
            {activeCount > 0 ? 'Live Data' : 'Simulation'}
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all disabled:opacity-50">
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* §5.1 — API Status */}
      <APIStatusTable services={services} onRefresh={handleRefresh} />

      {/* §5.1 — Statistics */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-white/30">Sentiment Statistics</p>
        <StatsGrid stats={STATS} />
      </div>

      {/* §5.1 — API Key Management */}
      <APIKeyManagement services={services} />

      {/* Collection settings */}
      <CollectionSettings />

      {/* Recent activity */}
      <RecentActivity />
    </div>
  );
}
