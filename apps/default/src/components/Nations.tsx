import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, Crown, Shield, Flame, Star, Users, Swords, TrendingUp,
  TrendingDown, Check, ChevronRight, Trophy, Zap, BarChart3,
  ArrowUp, Lock, Unlock, Target, Activity, Award, MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/appStore';
import { useTradingStore } from '@/lib/tradingStore';
import { NationsChatRoom } from './NationsChatRoom';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Nation {
  id: string;
  name: string;
  flag: string;
  color: string;
  gradient: string;
  borderColor: string;
  members: number;
  totalVolume: number;
  weeklyPnL: number;
  monthlyPnL: number;
  rank: number;
  description: string;
  trophies: number;
  winRate: number;
  avgLevel: number;
  openSlots: number;
  perks: string[];
  warScore: number;
  topTrader: { name: string; avatar: string; winRate: number };
}

interface WarStat {
  label: string;
  alpha: string | number;
  bull: string | number;
  winner: 'alpha' | 'bull' | 'tie';
}

// ─── Countdown Hook ─────────────────────────────────────────────────────────────
const WAR_END_MS = Date.now() + (2 * 86_400 + 14 * 3_600 + 22 * 60) * 1_000;

function useCountdown(endMs: number) {
  const calc = () => Math.max(0, endMs - Date.now());
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 1_000);
    return () => clearInterval(id);
  }, [endMs]);
  const d = Math.floor(remaining / 86_400_000);
  const h = Math.floor((remaining % 86_400_000) / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  return { d, h, m, s, done: remaining === 0 };
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const NATIONS: Nation[] = [
  {
    id: 'alpha',
    name: 'Alpha Republic',
    flag: '🔷',
    color: '#6366f1',
    gradient: 'from-indigo-500/25 via-violet-500/10 to-transparent',
    borderColor: '#6366f155',
    members: 2841,
    totalVolume: 94200000,
    weeklyPnL: 18.4,
    monthlyPnL: 41.2,
    rank: 1,
    description: 'The elite guild of systematic quant traders. Precision, discipline, and algorithmic mastery above all else.',
    trophies: 12,
    winRate: 78.4,
    avgLevel: 82,
    openSlots: 159,
    perks: ['Daily 5% XP boost', 'Access to Alpha signals', 'Weekly prize pool share', 'Exclusive quant tools'],
    warScore: 54200,
    topTrader: { name: 'SatoshiNakamoto99', avatar: 'SatoshiNakamoto99', winRate: 87.3 },
  },
  {
    id: 'bull',
    name: 'Bull Empire',
    flag: '🟢',
    color: '#10b981',
    gradient: 'from-emerald-500/25 via-green-500/10 to-transparent',
    borderColor: '#10b98155',
    members: 3102,
    totalVolume: 88500000,
    weeklyPnL: 14.2,
    monthlyPnL: 33.8,
    rank: 2,
    description: 'Eternal optimists. Long-only disciples of the infinite upward cycle who buy every dip without hesitation.',
    trophies: 8,
    winRate: 74.1,
    avgLevel: 75,
    openSlots: 398,
    perks: ['3% daily XP boost', 'Long position fee rebate', 'Monthly member tournaments', 'Bull signal channel'],
    warScore: 45800,
    topTrader: { name: 'WhaleRider_2025', avatar: 'WhaleRider', winRate: 83.1 },
  },
  {
    id: 'sigma',
    name: 'Sigma Order',
    flag: '🟡',
    color: '#f59e0b',
    gradient: 'from-amber-500/25 via-yellow-500/10 to-transparent',
    borderColor: '#f59e0b55',
    members: 1977,
    totalVolume: 71300000,
    weeklyPnL: 9.7,
    monthlyPnL: 27.1,
    rank: 3,
    description: 'Secretive arbitrageurs operating across multiple chains and exchanges simultaneously. Mystery is their edge.',
    trophies: 5,
    winRate: 70.8,
    avgLevel: 69,
    openSlots: 523,
    perks: ['2% daily XP boost', 'Arbitrage scanner access', 'Sigma research reports', 'Flash tournament invites'],
    warScore: 31400,
    topTrader: { name: 'AlgoPhantom_X', avatar: 'AlgoPhantom', winRate: 74.5 },
  },
  {
    id: 'bear',
    name: 'Bear Collective',
    flag: '🔴',
    color: '#ef4444',
    gradient: 'from-red-500/25 via-rose-500/10 to-transparent',
    borderColor: '#ef444455',
    members: 1430,
    totalVolume: 58900000,
    weeklyPnL: -3.2,
    monthlyPnL: 11.5,
    rank: 4,
    description: 'Short sellers and volatility hunters. They profit when others panic — the contrarians of the crypto world.',
    trophies: 3,
    winRate: 65.3,
    avgLevel: 61,
    openSlots: 1070,
    perks: ['1.5% daily XP boost', 'Short position fee rebate', 'Volatility alerts', 'Bear cave community'],
    warScore: 19600,
    topTrader: { name: 'QuantumLeverage', avatar: 'QuantumLev', winRate: 79.2 },
  },
];

const WAR_STATS: WarStat[] = [
  { label: 'Total Trades', alpha: '41,820', bull: '38,240', winner: 'alpha' },
  { label: 'Avg Win Rate', alpha: '78.4%', bull: '74.1%', winner: 'alpha' },
  { label: 'Volume (24h)', alpha: '$12.4M', bull: '$14.1M', winner: 'bull' },
  { label: 'Active Members', alpha: '1,842', bull: '2,109', winner: 'bull' },
  { label: 'Streak Bonus', alpha: '+22%', bull: '+18%', winner: 'alpha' },
  { label: 'Trophies', alpha: 12, bull: 8, winner: 'alpha' },
];

const alphaWarPct = 54.2;
const bullWarPct  = 100 - alphaWarPct;

// ─── StatPill ──────────────────────────────────────────────────────────────────
function StatPill({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex flex-col items-center bg-black/20 border border-white/5 rounded-xl px-4 py-3 min-w-[80px]">
      <Icon className="h-4 w-4 mb-1" style={{ color }} />
      <span className="font-bold text-sm font-mono">{value}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5 text-center">{label}</span>
    </div>
  );
}

// ─── NationCard ────────────────────────────────────────────────────────────────
function NationCard({
  nation,
  isMember,
  onJoin,
  onLeave,
}: {
  nation: Nation;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPositivePnL = nation.weeklyPnL >= 0;

  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer',
        'border hover:shadow-2xl hover:-translate-y-0.5',
        nation.rank === 1
          ? 'border-primary/40 shadow-lg shadow-primary/10'
          : 'border-white/5 hover:border-white/15',
        isMember && 'ring-2 shadow-lg',
      )}
      style={isMember ? { ringColor: nation.color, boxShadow: `0 0 0 2px ${nation.color}55, 0 20px 60px ${nation.color}15` } : {}}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', nation.gradient)} />

      {/* Rank crown for #1 */}
      {nation.rank === 1 && (
        <div className="absolute top-3 right-3 z-10">
          <Crown className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
        </div>
      )}

      {/* Member badge */}
      {isMember && (
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: nation.color + '30', color: nation.color, border: `1px solid ${nation.color}60` }}
        >
          <Check className="h-3 w-3" /> Member
        </div>
      )}

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl drop-shadow">{nation.flag}</span>
            <div>
              <h3 className="text-xl font-bold">{nation.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" />
                {nation.members.toLocaleString()} members
                <span className="mx-1 opacity-30">·</span>
                <span className="text-green-400">{nation.openSlots.toLocaleString()} open slots</span>
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"
            style={{ backgroundColor: nation.color + '22', color: nation.color, borderColor: nation.color + '44' }}
          >
            <Shield className="h-3.5 w-3.5" /> Rank #{nation.rank}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{nation.description}</p>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <StatPill
            label="Weekly P&L"
            value={`${isPositivePnL ? '+' : ''}${nation.weeklyPnL}%`}
            icon={isPositivePnL ? TrendingUp : TrendingDown}
            color={isPositivePnL ? '#10b981' : '#ef4444'}
          />
          <StatPill
            label="Win Rate"
            value={`${nation.winRate}%`}
            icon={Target}
            color={nation.color}
          />
          <StatPill
            label="Avg Level"
            value={`${nation.avgLevel}`}
            icon={Zap}
            color="#f59e0b"
          />
          <StatPill
            label="Trophies"
            value={`${nation.trophies}`}
            icon={Trophy}
            color="#f59e0b"
          />
        </div>

        {/* Volume bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Monthly Volume</span>
            <span className="font-mono font-semibold">${(nation.totalVolume / 1_000_000).toFixed(1)}M</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(nation.totalVolume / 94_200_000) * 100}%`, backgroundColor: nation.color }}
            />
          </div>
        </div>

        {/* Expandable perks */}
        {expanded && (
          <div className="mb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Member Perks</p>
            {nation.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: nation.color }} />
                <span className="text-foreground/80">{perk}</span>
              </div>
            ))}

            <div className="mt-4 p-3 rounded-xl border border-white/5 bg-black/20">
              <p className="text-xs text-muted-foreground mb-2">Top Trader</p>
              <div className="flex items-center gap-2">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nation.topTrader.avatar}`}
                  alt={nation.topTrader.name}
                  className="h-7 w-7 rounded-full border border-white/10"
                />
                <span className="text-sm font-semibold truncate">{nation.topTrader.name}</span>
                <span className="ml-auto text-xs font-mono" style={{ color: nation.color }}>
                  {nation.topTrader.winRate}% WR
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Toggle expand hint */}
        <p className="text-[10px] text-muted-foreground mb-3 text-center">
          {expanded ? '▲ Hide details' : '▼ Show perks & top trader'}
        </p>

        {/* Join / Leave */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isMember ? onLeave() : onJoin();
          }}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold',
            'transition-all duration-300 active:scale-95',
          )}
          style={{
            backgroundColor: isMember ? nation.color + '33' : nation.color + '18',
            borderColor: isMember ? nation.color + '88' : nation.color + '40',
            color: nation.color,
          }}
        >
          {isMember ? (
            <><Unlock className="h-4 w-4" /> Leave Nation</>
          ) : (
            <><Lock className="h-4 w-4" /> Join {nation.name} <ChevronRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Faction War Panel ─────────────────────────────────────────────────────────
function FactionWarPanel({ countdown }: { countdown: ReturnType<typeof useCountdown> }) {
  return (
    <div className="relative bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/10">
              <Swords className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Season 4 Faction War</h3>
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full animate-pulse font-mono">
                  LIVE
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Alpha Republic vs Bull Empire — 50,000 CP prize pool
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 font-mono text-sm">
            {[
              { v: countdown.d, u: 'd' },
              { v: countdown.h, u: 'h' },
              { v: countdown.m, u: 'm' },
              { v: countdown.s, u: 's' },
            ].map(({ v, u }) => (
              <div key={u} className="flex flex-col items-center bg-secondary/50 border border-white/5 rounded-xl px-3 py-2 min-w-[48px]">
                <span className="text-lg font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{u}</span>
              </div>
            ))}
          </div>
        </div>

        {/* War bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm font-semibold">
            <span className="flex items-center gap-2 text-indigo-400">
              🔷 Alpha Republic
              <span className="font-mono font-bold">{alphaWarPct}%</span>
            </span>
            <span className="text-xs text-muted-foreground font-normal">vs</span>
            <span className="flex items-center gap-2 text-emerald-400">
              <span className="font-mono font-bold">{bullWarPct}%</span>
              Bull Empire 🟢
            </span>
          </div>
          <div className="h-4 bg-secondary/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div
              className="h-full rounded-l-full transition-all duration-1000"
              style={{
                width: `${alphaWarPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              }}
            />
          </div>
        </div>

        {/* War stats table */}
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30 px-4 py-2">
            <span className="text-indigo-400">Alpha</span>
            <span className="text-center">Metric</span>
            <span className="text-emerald-400 text-right">Bull</span>
          </div>
          {WAR_STATS.map((stat, i) => {
            const alphaWins = stat.winner === 'alpha';
            const bullWins = stat.winner === 'bull';
            return (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-3 px-4 py-2.5 text-sm border-t border-white/5',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10',
                )}
              >
                <span className={cn('font-mono font-semibold', alphaWins ? 'text-indigo-400' : 'text-muted-foreground')}>
                  {alphaWins && <ArrowUp className="inline h-3 w-3 mr-1" />}
                  {stat.alpha}
                </span>
                <span className="text-center text-xs text-muted-foreground">{stat.label}</span>
                <span className={cn('font-mono font-semibold text-right', bullWins ? 'text-emerald-400' : 'text-muted-foreground')}>
                  {stat.bull}
                  {bullWins && <ArrowUp className="inline h-3 w-3 ml-1" />}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard strip ─────────────────────────────────────────────────────────
function NationRankStrip() {
  const sorted = [...NATIONS].sort((a, b) => a.rank - b.rank);
  return (
    <div className="bg-card border border-white/5 rounded-2xl overflow-hidden shadow-lg">
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Nation Rankings</h3>
        <span className="ml-auto text-xs text-muted-foreground">Season 4</span>
      </div>
      <div className="divide-y divide-white/5">
        {sorted.map((n, idx) => {
          const isPositive = n.weeklyPnL >= 0;
          return (
            <div key={n.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/20 transition-colors">
              <div className="w-8 flex justify-center">
                {idx === 0
                  ? <Crown className="h-5 w-5 text-yellow-400" />
                  : <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>}
              </div>
              <span className="text-2xl">{n.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.name}</p>
                <p className="text-xs text-muted-foreground">{n.members.toLocaleString()} members</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-right text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="font-mono font-bold">${(n.totalVolume / 1_000_000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weekly</p>
                  <p className={cn('font-mono font-bold', isPositive ? 'text-green-400' : 'text-red-400')}>
                    {isPositive ? '+' : ''}{n.weeklyPnL}%
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="font-mono font-bold text-sm">{n.trophies}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function Nations() {
  const { selectedNationId, joinNation, leaveNation } = useAppStore();
  const { balance, history } = useTradingStore();
  const countdown = useCountdown(WAR_END_MS);

  const closedTrades = history.filter(r => r.action === 'close');
  const winCount     = closedTrades.filter(r => r.pnl > 0).length;
  const myWinRate    = closedTrades.length > 0
    ? Math.round((winCount / closedTrades.length) * 1000) / 10
    : 68.5;

  const myNation = useMemo(
    () => NATIONS.find(n => n.id === selectedNationId) ?? null,
    [selectedNationId],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-8">

      {/* ── Page Header ── */}
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-3 border border-primary/20">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Nations & Clans</h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Join a faction, climb the war rankings, and claim exclusive rewards. Your Nation is your competitive home.
        </p>
      </div>

      {/* ── My Nation Banner (if member) ── */}
      {myNation && (
        <div
          className="relative rounded-2xl border overflow-hidden p-5 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300"
          style={{ borderColor: myNation.color + '50', background: myNation.color + '12' }}
        >
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', myNation.gradient)} />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-5xl drop-shadow">{myNation.flag}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: myNation.color }}>
                  Your Nation
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: myNation.color + '30', color: myNation.color }}
                >
                  Member
                </span>
              </div>
              <h3 className="text-2xl font-bold">{myNation.name}</h3>
              <p className="text-sm text-muted-foreground">{myNation.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Your Balance</p>
                <p className="font-mono font-bold text-green-400">${(balance / 1000).toFixed(1)}K</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Your Win Rate</p>
                <p className="font-mono font-bold" style={{ color: myNation.color }}>{myWinRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Nation Rank</p>
                <p className="font-mono font-bold">#{myNation.rank}</p>
              </div>
            </div>
          </div>

          {/* Active perks */}
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            <p className="w-full text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Active perks:
            </p>
            {myNation.perks.map((perk, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full border font-medium"
                style={{ borderColor: myNation.color + '40', color: myNation.color, backgroundColor: myNation.color + '15' }}
              >
                {perk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Faction War ── */}
      <FactionWarPanel countdown={countdown} />

      {/* ── Nation Chat Room ── */}
      {(() => {
        // Show the user's nation chat if they're a member, else show the #1 nation as a locked preview
        const chatNation = myNation ?? NATIONS[0];
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold">
                {myNation ? `${chatNation.flag} ${chatNation.name} Chat` : 'Nation Chat Rooms'}
              </h3>
              {!myNation && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Join a nation to unlock your clan chat
                </span>
              )}
            </div>
            <NationsChatRoom
              nationId={chatNation.id}
              nationName={chatNation.name}
              nationFlag={chatNation.flag}
              nationColor={chatNation.color}
              nationGradient={chatNation.gradient}
              isMember={!!myNation}
            />
          </div>
        );
      })()}

      {/* ── Nation Grid ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold">All Nations</h3>
          <span className="text-xs text-muted-foreground ml-auto">{NATIONS.length} active factions</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {NATIONS.map(nation => (
            <NationCard
              key={nation.id}
              nation={nation}
              isMember={selectedNationId === nation.id}
              onJoin={() => joinNation(nation.id)}
              onLeave={() => leaveNation()}
            />
          ))}
        </div>
      </div>

      {/* ── Rank Strip ── */}
      <NationRankStrip />

      <p className="text-center text-xs text-muted-foreground pb-4">
        Joining a Nation grants access to exclusive tournaments, clan bonuses, and faction war rewards.
        Nation data updates every 15 minutes.
      </p>
    </div>
  );
}
