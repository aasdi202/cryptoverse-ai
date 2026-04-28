import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Trophy, BarChart2, Target,
  AlertTriangle, RefreshCcw, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Layers, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradingStore } from '@/lib/tradingStore';

const INITIAL_BALANCE = 100_000;
const PAGE_SIZE = 10;

// ─── Equity Curve ─────────────────────────────────────────────────────────────
function buildEquityCurve(history: ReturnType<typeof useTradingStore.getState>['history']) {
  let equity = INITIAL_BALANCE;
  const points: { label: string; equity: number; pnl: number }[] = [
    { label: 'Start', equity: INITIAL_BALANCE, pnl: 0 },
  ];
  // history is newest-first; reverse for chronological
  const chronological = [...history].reverse();
  for (const trade of chronological) {
    if (trade.action === 'open') {
      equity -= trade.costBasis + trade.fee;
    } else {
      equity += trade.costBasis + trade.pnl;
    }
    points.push({
      label: trade.timestamp,
      equity: Math.round(equity * 100) / 100,
      pnl: Math.round(trade.pnl * 100) / 100,
    });
  }
  return points;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
      <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500', color ?? 'from-primary/10')} />
      <div className="flex items-start gap-4">
        <div className={cn('p-2.5 rounded-xl flex-shrink-0', color ? color.replace('from-', 'bg-').replace('/10', '/20') : 'bg-primary/20')}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className="text-xl font-bold font-mono">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function EquityTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const gain = d.equity - INITIAL_BALANCE;
  const gainPct = (gain / INITIAL_BALANCE) * 100;
  const positive = gain >= 0;
  return (
    <div className="bg-card border border-white/10 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-muted-foreground text-xs mb-1">{d.label}</p>
      <p className="font-bold font-mono">${d.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
      <p className={cn('font-mono text-xs font-semibold', positive ? 'text-green-400' : 'text-red-400')}>
        {positive ? '+' : ''}{gain.toFixed(0)} ({positive ? '+' : ''}{gainPct.toFixed(2)}%)
      </p>
    </div>
  );
}

// ─── Portfolio Component ──────────────────────────────────────────────────────
export function Portfolio() {
  const { balance, history, positions, resetBalance } = useTradingStore();
  const [page, setPage] = useState(0);
  const [filterSide, setFilterSide] = useState<'all' | 'long' | 'short'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'open' | 'close'>('all');
  const [confirmReset, setConfirmReset] = useState(false);

  const closedTrades = history.filter(r => r.action === 'close');
  const winners      = closedTrades.filter(r => r.pnl > 0);
  const losers       = closedTrades.filter(r => r.pnl < 0);
  const winRate      = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
  const totalPnl     = closedTrades.reduce((a, r) => a + r.pnl, 0);
  const grossWin     = winners.reduce((a, r) => a + r.pnl, 0);
  const grossLoss    = Math.abs(losers.reduce((a, r) => a + r.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const bestTrade    = closedTrades.length > 0 ? Math.max(...closedTrades.map(r => r.pnl)) : 0;
  const worstTrade   = closedTrades.length > 0 ? Math.min(...closedTrades.map(r => r.pnl)) : 0;

  // Max drawdown from equity curve
  const equityCurve = useMemo(() => buildEquityCurve(history), [history]);
  const maxDrawdown = useMemo(() => {
    let peak = INITIAL_BALANCE, maxDD = 0;
    for (const pt of equityCurve) {
      if (pt.equity > peak) peak = pt.equity;
      const dd = ((peak - pt.equity) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }, [equityCurve]);

  const equityColor = balance >= INITIAL_BALANCE ? '#10b981' : '#ef4444';

  // Filtered + paginated history
  const filtered = history.filter(r => {
    const sideOk   = filterSide === 'all'   || r.side   === filterSide;
    const actionOk = filterAction === 'all' || r.action === filterAction;
    return sideOk && actionOk;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
    resetBalance();
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Portfolio & Performance
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {history.length} total trade records · {positions.length} open position{positions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleReset}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
            confirmReset
              ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-secondary/50 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20',
          )}
        >
          <RefreshCcw className="h-4 w-4" />
          {confirmReset ? 'Click again to confirm reset' : 'Reset Balance'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Balance"
          value={`$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)} all-time`}
          icon={Activity}
          color="from-primary/10"
        />
        <StatCard
          label="Win Rate"
          value={closedTrades.length > 0 ? `${winRate.toFixed(1)}%` : '—'}
          sub={`${winners.length}W / ${losers.length}L`}
          icon={Target}
          color="from-green-500/10"
        />
        <StatCard
          label="Profit Factor"
          value={profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
          sub={`Gross win $${grossWin.toFixed(0)}`}
          icon={TrendingUp}
          color="from-blue-500/10"
        />
        <StatCard
          label="Max Drawdown"
          value={`${maxDrawdown.toFixed(2)}%`}
          sub={`Best $${bestTrade.toFixed(0)} / Worst $${worstTrade.toFixed(0)}`}
          icon={AlertTriangle}
          color="from-orange-500/10"
        />
      </div>

      {/* Equity Curve */}
      <div className="bg-card border border-white/5 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Equity Curve
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn('font-mono font-bold', totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
              {totalPnl >= 0 ? '+' : ''}{((totalPnl / INITIAL_BALANCE) * 100).toFixed(2)}%
            </span>
            <span className="text-muted-foreground text-xs">vs start</span>
          </div>
        </div>

        {equityCurve.length <= 1 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <Layers className="h-8 w-8 mx-auto opacity-30" />
              <p>No trades yet — your equity curve will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={equityColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={equityColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  width={56}
                />
                <Tooltip content={<EquityTooltip />} />
                <ReferenceLine y={INITIAL_BALANCE} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke={equityColor}
                  strokeWidth={2.5}
                  fill="url(#eqGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: equityColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trade History Table */}
      <div className="bg-card border border-white/5 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            Trade History
            <span className="text-xs text-muted-foreground font-normal">({filtered.length} records)</span>
          </h3>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'long', 'short'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setFilterSide(s); setPage(0); }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize',
                  filterSide === s ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
                )}
              >{s}</button>
            ))}
            <span className="w-px h-4 bg-white/10" />
            {(['all', 'open', 'close'] as const).map(a => (
              <button
                key={a}
                onClick={() => { setFilterAction(a); setPage(0); }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize',
                  filterAction === a ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
                )}
              >{a === 'all' ? 'All actions' : a === 'open' ? 'Opens' : 'Closes'}</button>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2.5 bg-secondary/20 text-xs text-muted-foreground font-semibold uppercase tracking-wider border-b border-white/5">
          <div className="col-span-2">Coin</div>
          <div className="col-span-2">Side</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-2 text-right">Entry</div>
          <div className="col-span-2 text-right">Exit</div>
          <div className="col-span-1 text-right">Lev</div>
          <div className="col-span-1 text-right">P&L</div>
        </div>

        {pageRows.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No trades match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pageRows.map(trade => {
              const isClose  = trade.action === 'close';
              const isProfit = trade.pnl > 0;
              return (
                <div key={trade.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-secondary/10 transition-colors text-sm">
                  {/* Coin */}
                  <div className="col-span-4 md:col-span-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: trade.color }} />
                    <span className="font-semibold">{trade.symbol}</span>
                    <span className="text-muted-foreground text-xs hidden md:inline">{trade.timestamp}</span>
                  </div>
                  {/* Side */}
                  <div className="col-span-3 md:col-span-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-bold',
                      trade.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400',
                    )}>
                      {trade.side.toUpperCase()}
                    </span>
                  </div>
                  {/* Action */}
                  <div className="col-span-3 md:col-span-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-medium',
                      isClose ? 'bg-secondary/60 text-foreground' : 'bg-primary/15 text-primary',
                    )}>
                      {isClose ? 'CLOSE' : 'OPEN'}
                    </span>
                  </div>
                  {/* Entry */}
                  <div className="col-span-2 text-right font-mono text-xs hidden md:block">
                    ${trade.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  {/* Exit */}
                  <div className="col-span-2 text-right font-mono text-xs hidden md:block text-muted-foreground">
                    {isClose && trade.exitPrice ? `$${trade.exitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
                  </div>
                  {/* Leverage */}
                  <div className="col-span-1 text-right font-mono text-xs text-muted-foreground hidden md:block">
                    {trade.leverage}x
                  </div>
                  {/* P&L */}
                  <div className={cn(
                    'col-span-2 md:col-span-1 text-right font-mono text-xs font-bold',
                    isClose
                      ? isProfit ? 'text-green-400' : 'text-red-400'
                      : 'text-muted-foreground',
                  )}>
                    {isClose
                      ? `${isProfit ? '+' : ''}${trade.pnl.toFixed(2)}`
                      : `−${trade.fee.toFixed(2)}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg bg-secondary/50 disabled:opacity-30 hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg bg-secondary/50 disabled:opacity-30 hover:bg-secondary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
