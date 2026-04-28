import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { OrderBook as OB, OrderBookLevel } from '@/lib/marketEngine';

interface Props {
  book: OB;
  currentPrice: number;
  prevPrice: number;
  compact?: boolean; // 5-level mini preview
}

function fmt(price: number, ref: number): string {
  const dec =
    ref > 10_000 ? 2 :
    ref > 1_000  ? 2 :
    ref > 10     ? 4 :
    ref > 1      ? 5 : 8;
  return price.toFixed(dec);
}

function fmtAmt(n: number): string {
  return n.toFixed(4);
}

function fmtTotal(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(2);
}

function Row({
  level,
  side,
  midPrice,
  flash,
}: {
  level: OrderBookLevel;
  side: 'bid' | 'ask';
  midPrice: number;
  flash?: boolean;
}) {
  const isAsk = side === 'ask';
  const barColor = isAsk ? 'rgba(246,70,93,0.15)' : 'rgba(14,203,129,0.15)';
  const textColor = isAsk ? 'text-[#f6465d]' : 'text-[#0ecb81]';

  return (
    <div
      className={cn(
        'relative flex items-center h-[18px] text-[11px] font-mono cursor-pointer group',
        'hover:bg-white/5 transition-colors',
        flash && 'animate-pulse',
      )}
    >
      {/* depth bar */}
      <div
        className="absolute inset-y-0 pointer-events-none"
        style={{
          [isAsk ? 'right' : 'left']: 0,
          width: `${level.depth * 100}%`,
          background: barColor,
        }}
      />

      {/* columns */}
      <span className={cn('w-[36%] pl-1 z-10 tabular-nums', textColor)}>
        {fmt(level.price, midPrice)}
      </span>
      <span className="w-[32%] text-right z-10 tabular-nums text-[#eaecef]">
        {fmtAmt(level.amount)}
      </span>
      <span className="w-[32%] text-right pr-1 z-10 tabular-nums text-[#848e9c]">
        {fmtTotal(level.total * level.price)}
      </span>
    </div>
  );
}

export function OrderBook({ book, currentPrice, prevPrice, compact = false }: Props) {
  const levels = compact ? 5 : 18;
  const asks = useMemo(() => book.asks.slice(0, levels), [book.asks, levels]);
  const bids = useMemo(() => book.bids.slice(0, levels), [book.bids, levels]);
  const priceUp = currentPrice >= prevPrice;

  if (compact) {
    return (
      <div className="text-[11px] font-mono">
        {/* Header */}
        <div className="flex items-center text-[10px] text-[#848e9c] mb-1 px-1">
          <span className="w-[36%]">Price(USDT)</span>
          <span className="w-[32%] text-right">Amount</span>
          <span className="w-[32%] text-right pr-1">Total</span>
        </div>

        {/* Asks (top 5) */}
        <div className="flex flex-col-reverse">
          {asks.slice().reverse().map((lvl, i) => (
            <Row key={i} level={lvl} side="ask" midPrice={currentPrice} />
          ))}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-between px-1 py-0.5 border-y border-white/5 my-0.5">
          <span className={cn('text-[12px] font-bold', priceUp ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
            {fmt(currentPrice, currentPrice)}
          </span>
          <span className="text-[10px] text-[#848e9c]">
            Spread {book.spreadPct.toFixed(3)}%
          </span>
        </div>

        {/* Bids (top 5) */}
        <div>
          {bids.map((lvl, i) => (
            <Row key={i} level={lvl} side="bid" midPrice={currentPrice} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header row */}
      <div className="flex items-center text-[10px] text-[#848e9c] px-1 pb-1 border-b border-white/5 flex-shrink-0">
        <span className="w-[36%] pl-0.5">Price(USDT)</span>
        <span className="w-[32%] text-right">Amount</span>
        <span className="w-[32%] text-right pr-1">Total</span>
      </div>

      {/* Asks — displayed reversed (lowest ask at bottom) */}
      <div className="flex-1 flex flex-col justify-end overflow-hidden">
        <div className="flex flex-col-reverse">
          {asks.map((lvl, i) => (
            <Row key={i} level={lvl} side="ask" midPrice={currentPrice} />
          ))}
        </div>
      </div>

      {/* Mid price & spread */}
      <div className="flex items-center justify-between px-1 py-1.5 border-y border-white/5 flex-shrink-0 my-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[15px] font-bold tabular-nums',
              priceUp ? 'text-[#0ecb81]' : 'text-[#f6465d]',
            )}
          >
            {fmt(currentPrice, currentPrice)}
          </span>
          <svg
            viewBox="0 0 12 12"
            className={cn('w-3 h-3 flex-shrink-0', priceUp ? 'text-[#0ecb81]' : 'text-[#f6465d] rotate-180')}
            fill="currentColor"
          >
            <path d="M6 2L11 9H1L6 2Z" />
          </svg>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#848e9c]">
            Spread&nbsp;
            <span className="text-[#eaecef]">{fmt(book.spread, currentPrice)}</span>
            &nbsp;
            <span className="text-[#f0b90b]">({book.spreadPct.toFixed(3)}%)</span>
          </span>
        </div>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-hidden">
        {bids.map((lvl, i) => (
          <Row key={i} level={lvl} side="bid" midPrice={currentPrice} />
        ))}
      </div>
    </div>
  );
}
