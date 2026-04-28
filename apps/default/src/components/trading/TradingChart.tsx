import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  Candle, Timeframe, OrderBook as OBType, generateCandles, tickCandles,
  calcSMA, calcRSI, calcMACD, IndicatorPoint,
} from '@/lib/marketEngine';
import {
  Layers, ChevronDown, ChevronUp,
  BarChart2, Activity, Zap,
} from 'lucide-react';
import { DrawingOverlay } from './DrawingOverlay';
import { DrawingToolbar } from './DrawingToolbar';
import { useDrawingStore } from '@/lib/drawingStore';
import { usePriceAlertStore } from '@/lib/priceAlertStore';
import {
  VolumeProfileBars,
  VolumeProfileOverlay,
  type VPCoordSystem,
} from './VolumeProfile';
import {
  PatternSVGLayer,
  PatternOverlay,
  scanPatterns,
  type PatternMatch,
  type PatternBias,
} from './PatternOverlay';
import { MultiTimeframePanel } from './MultiTimeframePanel';

type ChartType = 'candle' | 'line' | 'depth';

interface Props {
  currentPrice: number;
  prevPrice: number;
  coinColor: string;
  coinSymbol: string;
  coinId: string;
  basePrice: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  orderBook?: OBType;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

// ─── Candlestick SVG Renderer ─────────────────────────────────────────────────
function CandlestickSVG({
  candles,
  width,
  height,
  sma20,
  sma50,
  showSMA,
  showVP,
  numVPBins,
  onHoverVPBin,
  onHoverVPMove,
  showPatterns,
  patterns,
  filterBias,
  onPatternHover,
}: {
  candles:        Candle[];
  width:          number;
  height:         number;
  sma20:          IndicatorPoint[];
  sma50:          IndicatorPoint[];
  showSMA:        boolean;
  showVP:         boolean;
  numVPBins:      number;
  onHoverVPBin:   (idx: number | null) => void;
  onHoverVPMove:  (x: number, y: number) => void;
  showPatterns:   boolean;
  patterns:       PatternMatch[];
  filterBias:     PatternBias | 'all';
  onPatternHover: (p: PatternMatch | null, x: number, y: number) => void;
}) {
  if (candles.length === 0 || width === 0) return null;

  const visible = candles.slice(-80);
  const n = visible.length;
  const pad = { l: 4, r: 60, t: 12, b: 24 };
  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;

  const prices = visible.flatMap(c => [c.high, c.low]);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const priceRange = priceMax - priceMin || 1;
  const pricePad = priceRange * 0.06;

  const yMin = priceMin - pricePad;
  const yMax = priceMax + pricePad;
  const yRange = yMax - yMin;

  const toY = (p: number) => pad.t + ((yMax - p) / yRange) * chartH;
  const candleW = Math.max(1, (chartW / n) * 0.6);
  const gap     = chartW / n;

  const toX = (i: number) => pad.l + i * gap + gap / 2;

  // Y-axis labels
  const yTicks = 5;
  const yLabels: { y: number; val: number }[] = [];
  for (let i = 0; i <= yTicks; i++) {
    const val = yMin + (yRange / yTicks) * i;
    yLabels.push({ y: toY(val), val });
  }

  // Format price label
  const fmtY = (v: number) => {
    if (v > 10_000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (v > 100)    return v.toFixed(2);
    return v.toFixed(4);
  };

  // SMA lines — map to visible candles
  const visibleStart = candles.length - visible.length;
  const sma20pts = sma20.slice(visibleStart).filter(p => p.value !== null);
  const sma50pts = sma50.slice(visibleStart).filter(p => p.value !== null);

  const ptToPath = (pts: IndicatorPoint[], startIdx: number) => {
    let d = '';
    pts.forEach((pt, i) => {
      const idx = candles.findIndex(c => c.time === pt.time) - visibleStart;
      if (idx < 0) return;
      const x = toX(idx);
      const y = toY(pt.value as number);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return d;
  };

  // Volume Profile coordinate system (matches CandlestickSVG exactly)
  const vpCS: VPCoordSystem = {
    yMin, yMax, yRange,
    padT: pad.t, padB: pad.b,
    chartH, height,
  };
  // Profile bars sit in the padR zone: 4px gap from chart edge, 56px wide
  const vpOffsetX  = pad.l + chartW + 4;
  const vpPanelW   = pad.r - 4;          // 56px

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid */}
      {yLabels.map(({ y, val }, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y} x2={pad.l + chartW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <text x={pad.l + chartW + 6} y={y + 4} fontSize={10} fill="#848e9c" textAnchor="start">
            {fmtY(val)}
          </text>
        </g>
      ))}

      {/* Candles */}
      {visible.map((c, i) => {
        const x    = toX(i);
        const open = toY(c.open);
        const close= toY(c.close);
        const high = toY(c.high);
        const low  = toY(c.low);
        const isGreen = c.close >= c.open;
        const fill  = isGreen ? '#0ecb81' : '#f6465d';
        const bodyTop    = Math.min(open, close);
        const bodyHeight = Math.max(1, Math.abs(open - close));

        return (
          <g key={c.time}>
            {/* Wick */}
            <line x1={x} y1={high} x2={x} y2={low} stroke={fill} strokeWidth={1} />
            {/* Body */}
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={bodyHeight}
              fill={fill}
              fillOpacity={isGreen ? 0.9 : 0.9}
            />
          </g>
        );
      })}

      {/* SMA lines */}
      {showSMA && sma20pts.length > 1 && (
        <path d={ptToPath(sma20pts, 0)} fill="none" stroke="#f0b90b" strokeWidth={1} />
      )}
      {showSMA && sma50pts.length > 1 && (
        <path d={ptToPath(sma50pts, 0)} fill="none" stroke="#00bcd4" strokeWidth={1} />
      )}

      {/* ── Volume Profile bars (inside padR zone, aligned to same Y-axis) ── */}
      {showVP && (
        <VolumeProfileBars
          candles={candles}
          numBins={numVPBins}
          cs={vpCS}
          offsetX={vpOffsetX}
          panelW={vpPanelW}
          onHoverBin={onHoverVPBin}
          onHoverMove={onHoverVPMove}
        />
      )}

      {/* ── Pattern Detection badges ── */}
      {showPatterns && patterns.length > 0 && (
        <PatternSVGLayer
          patterns={patterns}
          visibleLen={visible.length}
          toX={toX}
          toY={toY}
          candles={visible}
          svgW={width}
          onHover={onPatternHover}
          filterBias={filterBias}
        />
      )}

      {/* Time X-axis labels */}
      {visible.map((c, i) => {
        if (i % Math.max(1, Math.floor(n / 6)) !== 0) return null;
        const d = new Date(c.time);
        const label = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        return (
          <text key={c.time} x={toX(i)} y={height - 6} fontSize={9} fill="#848e9c" textAnchor="middle">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── RSI Panel ────────────────────────────────────────────────────────────────
function RSIPanel({ rsi }: { rsi: IndicatorPoint[] }) {
  const visible = rsi.slice(-80).filter(p => p.value !== null);
  const data = visible.map(p => ({ time: new Date(p.time).toLocaleDateString(), rsi: p.value }));

  return (
    <div className="h-[80px]">
      <div className="text-[10px] text-[#848e9c] px-2 mb-0.5 flex items-center gap-3">
        <span className="text-[#e6b858] font-semibold">RSI(14)</span>
        {visible.length > 0 && (
          <span className={cn(
            'font-bold',
            (visible.at(-1)?.value ?? 50) > 70 ? 'text-[#f6465d]' :
            (visible.at(-1)?.value ?? 50) < 30 ? 'text-[#0ecb81]' : 'text-[#eaecef]',
          )}>
            {(visible.at(-1)?.value ?? 0).toFixed(2)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={70} stroke="#f6465d" strokeDasharray="2 2" strokeWidth={1} />
          <ReferenceLine y={30} stroke="#0ecb81" strokeDasharray="2 2" strokeWidth={1} />
          <Line type="monotone" dataKey="rsi" stroke="#e6b858" dot={false} strokeWidth={1.5} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MACD Panel ───────────────────────────────────────────────────────────────
function MACDPanel({ macd, signal, hist }: {
  macd: IndicatorPoint[];
  signal: IndicatorPoint[];
  hist: IndicatorPoint[];
}) {
  const visible = macd.slice(-80);
  const data = visible.map((m, i) => ({
    t: i,
    macd:   m.value,
    signal: signal[macd.length - visible.length + i]?.value,
    hist:   hist[macd.length - visible.length + i]?.value,
  }));

  const lastMacd   = macd.findLast(p => p.value !== null)?.value ?? 0;
  const lastSignal = signal.findLast(p => p.value !== null)?.value ?? 0;

  return (
    <div className="h-[80px]">
      <div className="text-[10px] text-[#848e9c] px-2 mb-0.5 flex items-center gap-3">
        <span className="text-[#00bcd4] font-semibold">MACD(12,26,9)</span>
        <span className="text-[#00bcd4]">MACD {(lastMacd as number).toFixed(4)}</span>
        <span className="text-[#f0b90b]">Signal {(lastSignal as number).toFixed(4)}</span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <ComposedChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis hide />
          <Bar dataKey="hist" fill="#f0b90b" fillOpacity={0.6} isAnimationActive={false}
            shape={(props: any) => {
              const { x, y, width, height, value } = props;
              const fill = value >= 0 ? '#0ecb81' : '#f6465d';
              return <rect x={x} y={y} width={width} height={Math.abs(height)} fill={fill} fillOpacity={0.5} />;
            }}
          />
          <Line type="monotone" dataKey="macd"   stroke="#00bcd4" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          <Line type="monotone" dataKey="signal" stroke="#f0b90b" dot={false} strokeWidth={1.5} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Depth Chart ─────────────────────────────────────────────────────────────
function DepthChart({
  bids, asks, midPrice,
}: {
  bids: { price: number; total: number }[];
  asks: { price: number; total: number }[];
  midPrice: number;
}) {
  const bidData = bids.slice().reverse().map(b => ({ price: b.price, bid: b.total }));
  const askData = asks.slice().reverse().map(a => ({ price: a.price, ask: a.total }));
  const data = [...bidData, ...askData].sort((a, b) => a.price - b.price);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="price"
          tickFormatter={v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          fontSize={10} stroke="#848e9c" tickLine={false} axisLine={false}
        />
        <YAxis fontSize={10} stroke="#848e9c" tickLine={false} axisLine={false} width={55} />
        <Tooltip
          contentStyle={{ background: '#1e2026', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          labelStyle={{ color: '#848e9c', fontSize: 10 }}
          formatter={(v: number, n: string) => [v.toFixed(4), n === 'bid' ? 'Bids' : 'Asks']}
        />
        <ReferenceLine x={midPrice} stroke="#f0b90b" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'Mid', fill: '#f0b90b', fontSize: 10 }} />
        <Area type="stepAfter" dataKey="bid"  stroke="#0ecb81" fill="#0ecb81" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
        <Area type="stepBefore" dataKey="ask" stroke="#f6465d" fill="#f6465d" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main TradingChart ────────────────────────────────────────────────────────
export function TradingChart({
  currentPrice,
  prevPrice,
  coinColor,
  coinSymbol,
  coinId,
  basePrice,
  priceChange24h,
  high24h,
  low24h,
  vol24h,
  orderBook,
}: Props) {
  const [tf, setTf]           = useState<Timeframe>('1h');
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [showSMA, setShowSMA] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [indicOpen, setIndicOpen] = useState(false);
  const [svgSize, setSvgSize]  = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Volume Profile state
  const [showVP,        setShowVP]        = useState(true);
  const [numVPBins,     setNumVPBins]     = useState(36);
  const [hoveredVPBin,  setHoveredVPBin]  = useState<number | null>(null);
  const [vpTooltipPos,  setVpTooltipPos]  = useState({ x: 0, y: 0 });

  // Pattern Detection state
  const [showPatterns,     setShowPatterns]     = useState(true);
  const [patternFilterBias, setPatternFilterBias] = useState<PatternBias | 'all'>('all');
  const [hoveredPattern,   setHoveredPattern]   = useState<PatternMatch | null>(null);
  const [patternTipPos,    setPatternTipPos]    = useState({ x: 0, y: 0 });

  // Generate initial candles
  useEffect(() => {
    setCandles(generateCandles(basePrice, tf, 120));
  }, [tf, basePrice]);

  // Tick candles on price update
  useEffect(() => {
    if (candles.length === 0 || currentPrice === 0) return;
    setCandles(prev => tickCandles(prev, currentPrice, tf));
  }, [currentPrice]);

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSvgSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Drawing store
  const { activeTool } = useDrawingStore();

  // Alert engine — check on every price tick
  const { checkAlerts } = usePriceAlertStore();
  useEffect(() => {
    if (currentPrice > 0) {
      checkAlerts(coinId, coinSymbol, coinColor, currentPrice);
    }
  }, [currentPrice, coinId, coinSymbol, coinColor, checkAlerts]);

  // Indicators
  const sma20 = useMemo(() => calcSMA(candles, 20), [candles]);
  const sma50 = useMemo(() => calcSMA(candles, 50), [candles]);
  const rsi   = useMemo(() => calcRSI(candles, 14), [candles]);
  const macdData = useMemo(() => calcMACD(candles), [candles]);

  // Pattern detection — scans last 80 visible candles
  const patterns = useMemo(() => scanPatterns(candles.slice(-80)), [candles]);

  // Visible price range for drawing coordinate system
  const visiblePrices = useMemo(() => {
    const visible = candles.slice(-80);
    return visible.flatMap(c => [c.high, c.low]);
  }, [candles]);
  const visibleCount = Math.min(candles.length, 80);

  // VP Y-axis extents (same padding as CandlestickSVG)
  const { vpYMin, vpYMax } = useMemo(() => {
    const prices = visiblePrices;
    if (prices.length === 0) return { vpYMin: 0, vpYMax: 1 };
    const mn  = Math.min(...prices);
    const mx  = Math.max(...prices);
    const rng = mx - mn || 1;
    return { vpYMin: mn - rng * 0.06, vpYMax: mx + rng * 0.06 };
  }, [visiblePrices]);

  // Line chart data
  const lineData = useMemo(() => candles.slice(-80).map(c => ({
    t: new Date(c.time).toLocaleTimeString(),
    price: c.close,
  })), [candles]);

  const isUp = currentPrice >= prevPrice;
  const lineColor = isUp ? '#0ecb81' : '#f6465d';

  const fmtPrice = (p: number) => {
    if (p > 10_000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (p > 100)    return p.toFixed(4);
    return p.toFixed(6);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e2026]">

      {/* ── Ticker bar ── */}
      <div className="flex items-center gap-6 px-3 py-2 border-b border-white/5 flex-shrink-0 overflow-x-auto scrollbar-thin">
        <div>
          <div className={cn('text-[22px] font-bold tabular-nums leading-none', isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
            {fmtPrice(currentPrice)}
          </div>
          <div className={cn('text-[12px] tabular-nums', isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
            {isUp ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}%
          </div>
        </div>
        {[
          { label: '24h Change', val: `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`, cls: priceChange24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]' },
          { label: '24h High',   val: fmtPrice(high24h),  cls: 'text-[#eaecef]' },
          { label: '24h Low',    val: fmtPrice(low24h),   cls: 'text-[#eaecef]' },
          { label: '24h Vol',    val: `${(vol24h / 1e6).toFixed(2)}M`,  cls: 'text-[#eaecef]' },
        ].map(item => (
          <div key={item.label} className="flex-shrink-0">
            <div className="text-[10px] text-[#848e9c]">{item.label}</div>
            <div className={cn('text-[12px] font-semibold tabular-nums', item.cls)}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar row ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 flex-shrink-0 flex-wrap gap-y-1">
        {/* Timeframes */}
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded transition-colors',
                t === tf
                  ? 'bg-[#f0b90b]/20 text-[#f0b90b]'
                  : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-white/5',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Chart type */}
          {([
            { type: 'candle', icon: BarChart2, label: 'Candles' },
            { type: 'line',   icon: Activity,  label: 'Line' },
            { type: 'depth',  icon: Layers,    label: 'Depth' },
          ] as { type: ChartType; icon: any; label: string }[]).map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              title={label}
              className={cn(
                'p-1.5 rounded transition-colors',
                type === chartType
                  ? 'bg-[#f0b90b]/20 text-[#f0b90b]'
                  : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-white/5',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          {/* Separator */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Drawing tools */}
          <DrawingToolbar />

          {/* Separator */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Indicators toggle */}
          <button
            onClick={() => setIndicOpen(o => !o)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ml-1',
              indicOpen ? 'bg-[#f0b90b]/20 text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-white/5',
            )}
          >
            <Zap className="w-3 h-3" />
            Indicators
            {indicOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ── Drawing tool hint bar ── */}
      {activeTool !== 'none' && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-white/5 bg-[#161a1e] flex-shrink-0">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0',
            activeTool === 'hline'     ? 'bg-[#f0b90b]' :
            activeTool === 'trendline' ? 'bg-[#00bcd4]' : 'bg-[#9945FF]',
          )} />
          <span className="text-[11px] text-[#848e9c]">
            {activeTool === 'hline'     && 'Click anywhere on the chart to place a horizontal line'}
            {activeTool === 'trendline' && 'Click the first point, then click the second point to draw a trend line'}
            {activeTool === 'fibonacci' && 'Click and drag from swing high → swing low — releases 23.6%, 38.2%, 50%, 61.8%, 78.6% levels'}
          </span>
          <span className="text-[10px] text-[#4a4e57] ml-auto">Esc to cancel</span>
        </div>
      )}

      {/* ── Indicator selector (collapsible) ── */}
      {indicOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-[#161a1e] flex-shrink-0 flex-wrap">
          {[
            { key: 'ma',   label: 'MA(20/50)', active: showSMA,  toggle: () => setShowSMA(p => !p)  },
            { key: 'rsi',  label: 'RSI(14)',   active: showRSI,  toggle: () => setShowRSI(p => !p)  },
            { key: 'macd', label: 'MACD',      active: showMACD, toggle: () => setShowMACD(p => !p) },
          ].map(({ key, label, active, toggle }) => (
            <button
              key={key}
              onClick={toggle}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded-full border transition-colors',
                active
                  ? 'border-[#f0b90b] text-[#f0b90b] bg-[#f0b90b]/10'
                  : 'border-white/10 text-[#848e9c] hover:border-white/20 hover:text-[#eaecef]',
              )}
            >
              {label}
            </button>
          ))}
          {showSMA && (
            <div className="flex items-center gap-3 ml-2">
              <span className="flex items-center gap-1 text-[10px]">
                <span className="w-4 h-[2px] bg-[#f0b90b] inline-block" />MA20
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <span className="w-4 h-[2px] bg-[#00bcd4] inline-block" />MA50
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Main chart area ── */}
      <div className="flex-1 min-h-0 relative" ref={containerRef}>
        {chartType === 'candle' && (
          <CandlestickSVG
            candles={candles}
            width={svgSize.w}
            height={svgSize.h}
            sma20={sma20}
            sma50={sma50}
            showSMA={showSMA}
            showVP={showVP}
            numVPBins={numVPBins}
            onHoverVPBin={setHoveredVPBin}
            onHoverVPMove={(x, y) => setVpTooltipPos({ x, y })}
            showPatterns={showPatterns}
            patterns={patterns}
            filterBias={patternFilterBias}
            onPatternHover={(p, x, y) => {
              setHoveredPattern(p ?? null);
              if (p) setPatternTipPos({ x, y });
            }}
          />
        )}

        {/* Pattern Detection HTML overlays (toggle, legend, tooltip) */}
        {chartType === 'candle' && svgSize.w > 0 && (
          <PatternOverlay
            candles={candles}
            visible={showPatterns}
            onToggle={() => setShowPatterns(v => !v)}
            svgW={svgSize.w}
            svgH={svgSize.h}
            filterBias={patternFilterBias}
            onFilterBias={setPatternFilterBias}
            patterns={patterns}
          />
        )}

        {/* Volume Profile HTML overlays (toggle button, legend, tooltip) */}
        {chartType === 'candle' && svgSize.w > 0 && (
          <VolumeProfileOverlay
            candles={candles}
            chartHeight={svgSize.h}
            padT={12}
            padB={24}
            yMin={vpYMin}
            yMax={vpYMax}
            svgWidth={svgSize.w}
            padR={60}
            profileWidth={56}
            visible={showVP}
            onToggle={() => setShowVP(v => !v)}
            numBins={numVPBins}
            onNumBins={setNumVPBins}
          />
        )}

        {/* Drawing overlay — candle mode only (SVG coordinates are defined here) */}
        {chartType === 'candle' && svgSize.w > 0 && (
          <DrawingOverlay
            width={svgSize.w}
            height={svgSize.h}
            prices={visiblePrices}
            nCandles={visibleCount}
            coinId={coinId}
            coinSymbol={coinSymbol}
            coinColor={coinColor}
          />
        )}

        {chartType === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData} margin={{ left: 4, right: 60, top: 12, bottom: 24 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="t" fontSize={9} stroke="#848e9c" tickLine={false} axisLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                fontSize={9}
                stroke="#848e9c"
                tickLine={false}
                axisLine={false}
                width={55}
                tickFormatter={v => v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              />
              <Tooltip
                contentStyle={{ background: '#1e2026', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 4 })}`, coinSymbol]}
                labelStyle={{ color: '#848e9c' }}
              />
              <Area
                type="monotone" dataKey="price"
                stroke={lineColor} strokeWidth={1.5}
                fill="url(#lineGrad)"
                dot={false} activeDot={{ r: 4, fill: lineColor }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === 'depth' && (
          <DepthChart
            bids={orderBook ? orderBook.bids.map(b => ({ price: b.price, total: b.total })) : []}
            asks={orderBook ? orderBook.asks.map(a => ({ price: a.price, total: a.total })) : []}
            midPrice={currentPrice}
          />
        )}
      </div>

      {/* ── Indicator panels ── */}
      {showRSI && (
        <div className="flex-shrink-0 border-t border-white/5 pt-1 px-1">
          <RSIPanel rsi={rsi} />
        </div>
      )}
      {showMACD && (
        <div className="flex-shrink-0 border-t border-white/5 pt-1 px-1">
          <MACDPanel {...macdData} />
        </div>
      )}

      {/* ── Multi-Timeframe Analysis Panel ── */}
      <MultiTimeframePanel
        basePrice={basePrice}
        currentPrice={currentPrice}
        activeTF={tf}
        onTFClick={(newTf) => setTf(newTf)}
      />
    </div>
  );
}
