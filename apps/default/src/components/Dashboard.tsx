import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Star, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COINS, CoinMeta } from '@/lib/coins';
import { useTradingStore } from '@/lib/tradingStore';
import { generateOrderBook, OrderBook as OBType, generateTrade, TradeFeedItem } from '@/lib/marketEngine';
import { usePriceAlertStore } from '@/lib/priceAlertStore';
import { useWatchlistStore, seedWatchlist } from '@/lib/watchlistStore';
import { OrderBook }    from './trading/OrderBook';
import { TradingChart } from './trading/TradingChart';
import { TradePanel }   from './trading/TradePanel';
import { BottomPanel }  from './trading/BottomPanel';
import { PriceAlertPanel, AlertToastStack } from './trading/PriceAlertPanel';
import { WatchlistPanel } from './trading/WatchlistPanel';

// ─── Tradeable coins ──────────────────────────────────────────────────────────
const TRADEABLE = COINS.filter(
  c => !['USDT', 'USDC', 'STETH', 'DAI'].includes(c.symbol),
).slice(0, 40);

// ─── Simulated base prices ────────────────────────────────────────────────────
const BASE_PRICES: Record<string, number> = {
  bitcoin: 67_500, ethereum: 3_420, binancecoin: 580, solana: 172,
  ripple: 0.62, dogecoin: 0.18, cardano: 0.48, tron: 0.125,
  'avalanche-2': 38, polkadot: 8.4, chainlink: 18, litecoin: 84,
  near: 7.2, 'matic-network': 0.98, uniswap: 11, cosmos: 9.5,
  fantom: 0.72, 'the-graph': 0.27, sui: 1.85, pepe: 0.0000112,
};

function getBasePrice(id: string): number {
  return BASE_PRICES[id] ?? 1.5 + Math.random() * 20;
}

// Simulated price walk (GBM-ish)
function nextPrice(current: number): number {
  const drift = 0.00005;
  const vol   = 0.0008;
  const shock = (Math.random() - 0.5) * 2;
  return Math.max(current * (1 + drift + vol * shock), 0.000001);
}

// ─── Coin Selector Dropdown ───────────────────────────────────────────────────
function CoinSelector({
  selected, onSelect,
}: { selected: CoinMeta; onSelect: (c: CoinMeta) => void }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = TRADEABLE.filter(
    c => c.symbol.toLowerCase().includes(query.toLowerCase()) ||
         c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded transition-colors"
      >
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.color }} />
        <span className="text-[14px] font-bold text-[#eaecef]">{selected.symbol}/USDT</span>
        <span className="text-[10px] text-[#848e9c] ml-0.5">Perpetual</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#848e9c] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-[#1e2026] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <div className="flex items-center gap-2 bg-[#2b2f36] rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-[#848e9c]" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search symbol..."
                className="flex-1 bg-transparent text-[12px] text-[#eaecef] outline-none placeholder-[#4a4e57]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {filtered.map(coin => (
              <button
                key={coin.id}
                onClick={() => { onSelect(coin); setOpen(false); setQuery(''); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-[12px] hover:bg-white/5 transition-colors',
                  coin.id === selected.id && 'bg-[#f0b90b]/10',
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: coin.color }} />
                <span className="font-bold text-[#eaecef] w-16 text-left">{coin.symbol}/USDT</span>
                <span className="text-[#848e9c] text-[11px] truncate flex-1 text-left">{coin.name}</span>
                {coin.id === selected.id && <Star className="w-3 h-3 text-[#f0b90b]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard (main trading terminal) ────────────────────────────────────────
// ─── Per-coin independent price simulators ────────────────────────────────────
// Each watched coin has its own independent price state, keyed by coinId.
// This lives outside the component so it persists across re-renders.
const watchPrices: Record<string, number> = {};

export function Dashboard() {
  const { checkPriceAlerts } = useTradingStore();
  const { alerts } = usePriceAlertStore();
  const { coins: watchlistCoins, updateTick } = useWatchlistStore();

  const [coin,           setCoin]           = useState<CoinMeta>(TRADEABLE[0]);
  const [currentPrice,   setCurrentPrice]   = useState(() => getBasePrice(TRADEABLE[0].id));
  const [prevPrice,      setPrevPrice]      = useState(() => getBasePrice(TRADEABLE[0].id));
  const [book,           setBook]           = useState<OBType>(() =>
    generateOrderBook(getBasePrice(TRADEABLE[0].id)),
  );
  const [trades,         setTrades]         = useState<TradeFeedItem[]>([]);
  const [high24h,        setHigh24h]        = useState(0);
  const [low24h,         setLow24h]         = useState(0);
  const [vol24h,         setVol24h]         = useState(0);
  const [change24h,      setChange24h]      = useState(0);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);

  const priceRef = useRef(currentPrice);
  priceRef.current = currentPrice;

  // Seed default watchlist once on mount
  useEffect(() => {
    seedWatchlist(getBasePrice, TRADEABLE);
  }, []);

  // Keep a ref to watchlistCoins so the interval can read it without
  // being recreated each time the list changes
  const watchlistRef = useRef(watchlistCoins);
  watchlistRef.current = watchlistCoins;

  // When coin changes, reset all state
  const handleCoinChange = useCallback((c: CoinMeta) => {
    const base = watchPrices[c.id] ?? getBasePrice(c.id);
    watchPrices[c.id] = base;
    setCoin(c);
    setCurrentPrice(base);
    setPrevPrice(base);
    setBook(generateOrderBook(base));
    setTrades([]);
    setHigh24h(base * 1.035);
    setLow24h(base  * 0.962);
    setVol24h(base  * 12_000);
    setChange24h((Math.random() - 0.5) * 6);
  }, []);

  // Select a coin from the watchlist → switch main chart
  const handleWatchlistSelect = useCallback((coinId: string) => {
    const meta = TRADEABLE.find(c => c.id === coinId) ??
                 COINS.find(c => c.id === coinId);
    if (!meta) return;
    // Reuse watchPrice if available so the chart starts at simulated price
    const p = watchPrices[coinId];
    if (p) {
      setCoin(meta);
      setCurrentPrice(p);
      setPrevPrice(p);
      setBook(generateOrderBook(p));
      setTrades([]);
      setHigh24h(p * 1.035);
      setLow24h(p  * 0.962);
      setVol24h(p  * 12_000);
      setChange24h((Math.random() - 0.5) * 6);
    } else {
      handleCoinChange(meta);
    }
  }, [handleCoinChange]);

  // Init 24h stats
  useEffect(() => {
    const base = getBasePrice(coin.id);
    setHigh24h(base * 1.035);
    setLow24h(base  * 0.962);
    setVol24h(base  * 12_000);
    setChange24h((Math.random() - 0.5) * 6);
  }, [coin.id]);

  // ── Price + order book tick every 1 second ──
  useEffect(() => {
    const id = setInterval(() => {
      const prev = priceRef.current;
      const next = nextPrice(prev);

      setPrevPrice(prev);
      setCurrentPrice(next);
      setBook(generateOrderBook(next));
      setHigh24h(h => Math.max(h, next));
      setLow24h(l  => Math.min(l, next));
      setVol24h(v  => v + next * (Math.random() * 3));
      checkPriceAlerts(coin.id, next);
      // Note: checkAlerts is now called inside TradingChart on each price tick

      // Feed trade
      setTrades(prev => [generateTrade(next), ...prev].slice(0, 40));

      // ── Tick all watched coins independently ──
      watchlistRef.current.forEach(wc => {
        // Skip the active coin — it already has the real price above
        if (wc.coinId === coin.id) {
          updateTick(wc.coinId, next);
          return;
        }
        // Each watched coin walks its own GBM path
        const cur = watchPrices[wc.coinId] ?? wc.currentPrice;
        const nxt = nextPrice(cur);
        watchPrices[wc.coinId] = nxt;
        updateTick(wc.coinId, nxt);
      });
    }, 1_000);

    return () => clearInterval(id);
  }, [coin.id]);

  const isUp = currentPrice >= prevPrice;

  return (
    <div className="flex flex-col h-full bg-[#161a1e] text-[#eaecef] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          TOP HEADER — pair selector + market stats
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 px-2 border-b border-white/5 bg-[#1e2026] flex-shrink-0 h-[52px]">
        <CoinSelector selected={coin} onSelect={handleCoinChange} />

        <div className="w-px h-6 bg-white/5 mx-1" />

        {/* Ticker stats */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none flex-1">
          <div>
            <div className={cn('text-[18px] font-bold leading-tight tabular-nums', isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
              {currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: currentPrice > 1_000 ? 2 : currentPrice > 1 ? 4 : 8,
                maximumFractionDigits: currentPrice > 1_000 ? 2 : currentPrice > 1 ? 4 : 8,
              })}
            </div>
          </div>
          {[
            { label: '24h Change', val: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`, cls: change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]' },
            { label: '24h High',   val: high24h.toLocaleString(undefined, { maximumFractionDigits: 2 }), cls: 'text-[#eaecef]' },
            { label: '24h Low',    val: low24h.toLocaleString(undefined, { maximumFractionDigits: 2 }),  cls: 'text-[#eaecef]' },
            { label: '24h Vol(USDT)', val: `${(vol24h / 1e6).toFixed(2)}M`, cls: 'text-[#eaecef]' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="flex-shrink-0">
              <div className="text-[10px] text-[#848e9c] leading-tight">{label}</div>
              <div className={cn('text-[12px] font-semibold tabular-nums leading-tight', cls)}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Alert bell button ── */}
        {(() => {
          const coinActiveAlerts = alerts.filter(a => a.coinId === coin.id && a.status === 'active');
          const hasActive = coinActiveAlerts.length > 0;
          return (
            <button
              onClick={() => setAlertPanelOpen(true)}
              title="Price Alerts"
              className={cn(
                'relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all mr-2',
                hasActive
                  ? 'border-[#f0b90b]/40 bg-[#f0b90b]/10 text-[#f0b90b] hover:bg-[#f0b90b]/18'
                  : 'border-white/8 bg-white/4 text-[#848e9c] hover:text-[#eaecef] hover:border-white/16',
              )}
            >
              <Bell className={cn('w-3.5 h-3.5', hasActive && 'animate-[bell-ring_2s_ease-in-out_infinite]')} />
              <span className="hidden sm:inline">Alerts</span>
              {hasActive && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f0b90b] text-[9px] font-bold text-black leading-none">
                  {coinActiveAlerts.length}
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN BODY — 3 columns
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT: Order Book ── */}
        <div className="w-[200px] flex-shrink-0 border-r border-white/5 bg-[#1e2026] flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-2 py-1.5 border-b border-white/5 text-[11px] text-[#848e9c] font-semibold uppercase tracking-wider flex-shrink-0">
            Order Book
          </div>
          <div className="flex-1 overflow-hidden px-1 py-1">
            <OrderBook
              book={book}
              currentPrice={currentPrice}
              prevPrice={prevPrice}
            />
          </div>

          {/* Trade feed */}
          <div className="border-t border-white/5 flex-shrink-0">
            <div className="px-2 py-1 text-[10px] text-[#848e9c] font-semibold uppercase tracking-wide border-b border-white/5">
              Trades
            </div>
            <div className="px-1 overflow-y-auto" style={{ maxHeight: 140 }}>
              <div className="flex items-center text-[9px] text-[#848e9c] px-1 py-0.5">
                <span className="w-[38%]">Price</span>
                <span className="w-[30%] text-right">Amt</span>
                <span className="w-[32%] text-right pr-1">Time</span>
              </div>
              {trades.slice(0, 20).map(t => (
                <div key={t.id} className="flex items-center text-[10px] font-mono px-1 h-[16px]">
                  <span className={cn('w-[38%] tabular-nums', t.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                    {t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="w-[30%] text-right tabular-nums text-[#eaecef]">{t.amount.toFixed(4)}</span>
                  <span className="w-[32%] text-right pr-1 tabular-nums text-[#848e9c]">{t.time.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: Chart ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-r border-white/5">
          <TradingChart
            currentPrice={currentPrice}
            prevPrice={prevPrice}
            coinColor={coin.color}
            coinSymbol={coin.symbol}
            coinId={coin.id}
            basePrice={getBasePrice(coin.id)}
            priceChange24h={change24h}
            high24h={high24h}
            low24h={low24h}
            vol24h={vol24h}
            orderBook={book}
          />
        </div>

        {/* ── RIGHT: Trade Panel ── */}
        <div className="w-[260px] flex-shrink-0 bg-[#1e2026] overflow-hidden flex flex-col">
          <TradePanel
            coin={coin}
            currentPrice={currentPrice}
            prevPrice={prevPrice}
            book={book}
          />
        </div>

        {/* ── FAR RIGHT: Watchlist ── */}
        <WatchlistPanel
          activeCoinId={coin.id}
          onSelectCoin={handleWatchlistSelect}
          getBasePrice={getBasePrice}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM PANEL — tabbed positions/history/funds
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-[220px] flex-shrink-0 border-t border-white/5">
        <BottomPanel
          selectedCoin={coin}
          currentPrice={currentPrice}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICE ALERT SYSTEM — drawer + toast stack
      ═══════════════════════════════════════════════════════════════════ */}
      <PriceAlertPanel
        open={alertPanelOpen}
        onClose={() => setAlertPanelOpen(false)}
        coin={coin}
        currentPrice={currentPrice}
      />
      <AlertToastStack />
    </div>
  );
}
