import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTradingStore, calcPositionPnl } from '@/lib/tradingStore';
import { CoinMeta } from '@/lib/coins';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  selectedCoin: CoinMeta;
  currentPrice: number;
}

type Tab = 'positions' | 'orders' | 'trades' | 'funds';

const TABS: { id: Tab; label: string }[] = [
  { id: 'positions', label: 'Open Positions' },
  { id: 'orders',    label: 'Order History' },
  { id: 'trades',    label: 'Trade History' },
  { id: 'funds',     label: 'Funds' },
];

function fmtPrice(p: number, ref: number) {
  if (ref > 10_000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (ref > 100)    return p.toFixed(4);
  return p.toFixed(6);
}

export function BottomPanel({ selectedCoin, currentPrice }: Props) {
  const [tab, setTab] = useState<Tab>('positions');
  const { balance, positions, history, closePosition } = useTradingStore();

  const openRecords  = history.filter(h => h.action === 'open');
  const closeRecords = history.filter(h => h.action === 'close');

  const totalUnrealPnl = positions.reduce((acc, pos) => {
    const price = pos.coinId === selectedCoin.id ? currentPrice : pos.entryPrice;
    return acc + calcPositionPnl(pos, price).rawPnl;
  }, 0);

  const totalMarginUsed = positions.reduce((a, p) => a + p.costBasis, 0);

  return (
    <div className="flex flex-col h-full bg-[#1e2026] border-t border-white/5">

      {/* ── Tab bar ── */}
      <div className="flex items-center border-b border-white/5 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-[12px] font-medium whitespace-nowrap transition-colors border-b-2',
              t.id === tab
                ? 'border-[#f0b90b] text-[#f0b90b]'
                : 'border-transparent text-[#848e9c] hover:text-[#eaecef]',
            )}
          >
            {t.label}
            {t.id === 'positions' && positions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#f0b90b]/20 text-[#f0b90b] text-[10px] rounded-full font-bold">
                {positions.length}
              </span>
            )}
          </button>
        ))}

        {positions.length > 0 && (
          <div className="ml-auto pr-4 flex-shrink-0 text-[11px] flex items-center gap-1">
            <span className="text-[#848e9c]">Unrealized PnL:</span>
            <span className={cn('font-mono font-bold', totalUnrealPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
              {totalUnrealPnl >= 0 ? '+' : ''}{totalUnrealPnl.toFixed(2)} USDT
            </span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto scrollbar-thin">

        {/* ── Open Positions ── */}
        {tab === 'positions' && (
          positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#848e9c] gap-2">
              <AlertTriangle className="w-7 h-7 opacity-30" />
              <p className="text-[12px]">No open positions</p>
            </div>
          ) : (
            <table className="w-full text-[11px] min-w-[700px]">
              <thead className="sticky top-0 bg-[#1e2026] z-10">
                <tr className="text-[#848e9c] border-b border-white/5">
                  {['Symbol', 'Side', 'Size', 'Entry Price', 'Mark Price', 'Liq. Price', 'Margin', 'Unrealized PnL', 'TP / SL', 'Close'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  const markPrice = pos.coinId === selectedCoin.id ? currentPrice : pos.entryPrice;
                  const { rawPnl, pnlPct } = calcPositionPnl(pos, markPrice);
                  const isLong   = pos.side === 'long';
                  const liqPrice = isLong
                    ? pos.entryPrice * (1 - 1 / Math.max(pos.leverage, 1.001))
                    : pos.entryPrice * (1 + 1 / Math.max(pos.leverage, 1.001));
                  const isProfit = rawPnl >= 0;

                  return (
                    <tr key={pos.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2.5 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pos.color }} />
                          {pos.symbol}/USDT
                          <span className="text-[9px] text-[#848e9c] border border-white/10 rounded px-1 py-px">{pos.leverage}x</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          isLong ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]',
                        )}>
                          {isLong ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{pos.quantity.toFixed(6)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{fmtPrice(pos.entryPrice, pos.entryPrice)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-[#eaecef]">{fmtPrice(markPrice, markPrice)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-[#f6465d]">{fmtPrice(liqPrice, liqPrice)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{pos.costBasis.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2.5">
                        <div className={cn('font-mono font-bold tabular-nums', isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                          {isProfit ? '+' : ''}{rawPnl.toFixed(2)}
                        </div>
                        <div className={cn('text-[10px] font-mono tabular-nums', isProfit ? 'text-[#0ecb81]/70' : 'text-[#f6465d]/70')}>
                          {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px]">
                        <div className="text-[#0ecb81]">TP: {pos.takeProfit ? fmtPrice(pos.takeProfit, pos.entryPrice) : '—'}</div>
                        <div className="text-[#f6465d]">SL: {pos.stopLoss   ? fmtPrice(pos.stopLoss,  pos.entryPrice) : '—'}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => closePosition(pos.id, markPrice)}
                          className="px-2 py-1 bg-[#f6465d]/10 hover:bg-[#f6465d]/25 text-[#f6465d] rounded text-[10px] font-semibold transition-colors border border-[#f6465d]/20 flex items-center gap-1"
                        >
                          <X className="w-2.5 h-2.5" />Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* ── Order History ── */}
        {tab === 'orders' && (
          openRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#848e9c] gap-2">
              <AlertTriangle className="w-7 h-7 opacity-30" />
              <p className="text-[12px]">No order history</p>
            </div>
          ) : (
            <table className="w-full text-[11px] min-w-[600px]">
              <thead className="sticky top-0 bg-[#1e2026] z-10">
                <tr className="text-[#848e9c] border-b border-white/5">
                  {['Time', 'Symbol', 'Type', 'Side', 'Price', 'Qty', 'Cost (USDT)', 'Lev.', 'Fee', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openRecords.slice(0, 50).map(rec => (
                  <tr key={rec.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 text-[#848e9c] tabular-nums">{rec.timestamp}</td>
                    <td className="px-3 py-2.5 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: rec.color }} />
                        {rec.symbol}/USDT
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#848e9c]">Limit</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-bold',
                        rec.side === 'long' ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]',
                      )}>
                        {rec.side === 'long' ? 'Buy/Long' : 'Sell/Short'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{fmtPrice(rec.entryPrice, rec.entryPrice)}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{rec.quantity.toFixed(6)}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{rec.costBasis.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{rec.leverage}x</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[#848e9c]">{rec.fee.toFixed(4)}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 bg-[#0ecb81]/15 text-[#0ecb81] rounded text-[10px]">Filled</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* ── Trade History ── */}
        {tab === 'trades' && (
          closeRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#848e9c] gap-2">
              <AlertTriangle className="w-7 h-7 opacity-30" />
              <p className="text-[12px]">No closed trades yet</p>
            </div>
          ) : (
            <table className="w-full text-[11px] min-w-[700px]">
              <thead className="sticky top-0 bg-[#1e2026] z-10">
                <tr className="text-[#848e9c] border-b border-white/5">
                  {['Time', 'Symbol', 'Side', 'Entry', 'Exit', 'Qty', 'Margin', 'Lev.', 'PnL (USDT)', 'ROE%', 'Fee'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closeRecords.slice(0, 50).map(rec => {
                  const isProfit = rec.pnl >= 0;
                  return (
                    <tr key={rec.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2.5 text-[#848e9c] tabular-nums">{rec.timestamp}</td>
                      <td className="px-3 py-2.5 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: rec.color }} />
                          {rec.symbol}/USDT
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          rec.side === 'long' ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]',
                        )}>
                          {rec.side === 'long' ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{fmtPrice(rec.entryPrice, rec.entryPrice)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{fmtPrice(rec.exitPrice ?? 0, rec.entryPrice)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{rec.quantity.toFixed(6)}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{rec.costBasis.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{rec.leverage}x</td>
                      <td className={cn('px-3 py-2.5 font-mono font-bold tabular-nums', isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                        {isProfit ? '+' : ''}{rec.pnl.toFixed(2)}
                      </td>
                      <td className={cn('px-3 py-2.5 font-mono tabular-nums', isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                        {isProfit ? '+' : ''}{rec.pnlPct.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-[#848e9c]">{rec.fee.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* ── Funds ── */}
        {tab === 'funds' && (
          <div className="p-4">
            <table className="w-full text-[11px] min-w-[500px]">
              <thead className="sticky top-0 bg-[#1e2026] z-10">
                <tr className="text-[#848e9c] border-b border-white/5">
                  {['Asset', 'Total Balance', 'Available', 'In Margin', 'Unrealized PnL'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* USDT */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#26A17B]/20 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-[#26A17B]">₮</span>
                      </div>
                      <div>
                        <div className="font-semibold text-[#eaecef]">USDT</div>
                        <div className="text-[9px] text-[#848e9c]">Tether USD</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-[#eaecef] tabular-nums">
                    {(balance + totalMarginUsed).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3 font-mono text-[#eaecef] tabular-nums">
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3 font-mono text-[#848e9c] tabular-nums">
                    {totalMarginUsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className={cn('px-3 py-3 font-mono font-bold tabular-nums', totalUnrealPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                    {totalUnrealPnl >= 0 ? '+' : ''}{totalUnrealPnl.toFixed(2)}
                  </td>
                </tr>

                {/* Open position coin rows */}
                {positions.map(pos => {
                  const markPrice = pos.coinId === selectedCoin.id ? currentPrice : pos.entryPrice;
                  const { rawPnl } = calcPositionPnl(pos, markPrice);
                  return (
                    <tr key={pos.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: pos.color + '33' }}>
                            <span className="text-[8px] font-bold" style={{ color: pos.color }}>{pos.symbol[0]}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-[#eaecef]">{pos.symbol}</div>
                            <div className="text-[9px] text-[#848e9c]">{pos.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums text-[#eaecef]">{pos.quantity.toFixed(6)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums text-[#848e9c]">0.000000</td>
                      <td className="px-3 py-3 font-mono tabular-nums text-[#eaecef]">{pos.quantity.toFixed(6)}</td>
                      <td className={cn('px-3 py-3 font-mono font-bold tabular-nums', rawPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                        {rawPnl >= 0 ? '+' : ''}{rawPnl.toFixed(2)} USDT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
