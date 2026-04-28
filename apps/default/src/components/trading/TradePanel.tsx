import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CoinMeta } from '@/lib/coins';
import { useTradingStore } from '@/lib/tradingStore';
import { OrderBook as OBType } from '@/lib/marketEngine';
import { OrderBook } from './OrderBook';
import { ChevronDown, ChevronUp, Link2, CheckCircle, XCircle } from 'lucide-react';

type OrderTab  = 'Limit' | 'Market' | 'Stop-Limit';
type TradeSide = 'buy' | 'sell';

interface Props {
  coin: CoinMeta;
  currentPrice: number;
  prevPrice: number;
  book: OBType;
}

const PCT_STEPS = [25, 50, 75, 100];

export function TradePanel({ coin, currentPrice, prevPrice, book }: Props) {
  const { balance, openPosition } = useTradingStore();

  const [tab,       setTab]      = useState<OrderTab>('Limit');
  const [side,      setSide]     = useState<TradeSide>('buy');
  const [price,     setPrice]    = useState('');
  const [amount,    setAmount]   = useState('');   // in coin units
  const [usdInput,  setUsdInput] = useState('');   // in USDT
  const [amountMode,setAmountMode] = useState<'coin' | 'usdt'>('coin');
  const [leverage,  setLeverage] = useState(10);
  const [stopPrice, setStopPrice]= useState('');
  const [tpsl,      setTpsl]     = useState(false);
  const [tp,        setTp]       = useState('');
  const [sl,        setSl]       = useState('');
  const [flash, setFlash]        = useState<{ ok: boolean; msg: string } | null>(null);

  // Sync price input to market when switching to Market tab
  useEffect(() => {
    if (tab === 'Market') setPrice(currentPrice.toFixed(2));
  }, [tab, currentPrice]);

  // Derive values
  const priceNum  = tab === 'Market' ? currentPrice : (parseFloat(price)  || 0);
  const amountNum = parseFloat(amount) || 0;
  const usdNum    = amountMode === 'coin'
    ? amountNum * priceNum
    : (parseFloat(usdInput) || 0);
  const coinQty   = amountMode === 'coin'
    ? amountNum
    : priceNum > 0 ? usdNum / priceNum : 0;
  const total     = coinQty * priceNum;
  const maxUsdt   = balance;

  const setPct = useCallback((pct: number) => {
    const usd = (maxUsdt * pct) / 100;
    if (amountMode === 'usdt') {
      setUsdInput(usd.toFixed(2));
    } else {
      const qty = priceNum > 0 ? usd / priceNum : 0;
      setAmount(qty.toFixed(6));
    }
  }, [maxUsdt, priceNum, amountMode]);

  const handleSubmit = () => {
    const usdAmount = amountMode === 'coin' ? coinQty * priceNum : usdNum;

    if (usdAmount <= 0) {
      setFlash({ ok: false, msg: 'Enter a valid amount' });
      setTimeout(() => setFlash(null), 2500);
      return;
    }

    const result = openPosition({
      coinId:       coin.id,
      symbol:       coin.symbol,
      name:         coin.name,
      side:         side === 'buy' ? 'long' : 'short',
      usdAmount,
      currentPrice: priceNum || currentPrice,
      leverage,
      color:        coin.color,
      takeProfit:   tpsl && tp ? parseFloat(tp) : undefined,
      stopLoss:     tpsl && sl ? parseFloat(sl) : undefined,
    });

    if (result.success) {
      setFlash({ ok: true, msg: `${side === 'buy' ? 'Buy' : 'Sell'} order placed · ${coin.symbol}` });
      setAmount(''); setUsdInput(''); setTp(''); setSl('');
    } else {
      setFlash({ ok: false, msg: result.error ?? 'Order failed' });
    }
    setTimeout(() => setFlash(null), 2500);
  };

  const isBuy   = side === 'buy';
  const btnCls  = isBuy
    ? 'bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-black'
    : 'bg-[#f6465d] hover:bg-[#f6465d]/90 text-white';

  const fmtBal = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Order type tabs ── */}
      <div className="flex border-b border-white/5 flex-shrink-0">
        {(['Limit', 'Market', 'Stop-Limit'] as OrderTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-[12px] font-medium transition-colors border-b-2',
              t === tab
                ? 'border-[#f0b90b] text-[#f0b90b]'
                : 'border-transparent text-[#848e9c] hover:text-[#eaecef]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 px-3 pt-3 pb-2 space-y-3">

        {/* ── Buy / Sell switch ── */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#2b2f36] rounded-lg">
          <button
            onClick={() => setSide('buy')}
            className={cn(
              'py-1.5 rounded text-[12px] font-semibold transition-colors',
              side === 'buy' ? 'bg-[#0ecb81] text-black' : 'text-[#848e9c] hover:text-[#0ecb81]',
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            className={cn(
              'py-1.5 rounded text-[12px] font-semibold transition-colors',
              side === 'sell' ? 'bg-[#f6465d] text-white' : 'text-[#848e9c] hover:text-[#f6465d]',
            )}
          >
            Sell
          </button>
        </div>

        {/* ── Available balance ── */}
        <div className="flex justify-between text-[11px]">
          <span className="text-[#848e9c]">Avail.</span>
          <span className="text-[#eaecef] font-mono">{fmtBal(balance)} <span className="text-[#848e9c]">USDT</span></span>
        </div>

        {/* ── Stop price (Stop-Limit only) ── */}
        {tab === 'Stop-Limit' && (
          <div>
            <label className="block text-[10px] text-[#848e9c] mb-1">Stop Price</label>
            <div className="flex items-center bg-[#2b2f36] border border-white/5 rounded-lg px-2 py-1.5 focus-within:border-[#f0b90b]/50 transition-colors">
              <input
                type="number"
                value={stopPrice}
                onChange={e => setStopPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-[12px] font-mono text-[#eaecef] outline-none placeholder-[#4a4e57]"
              />
              <span className="text-[11px] text-[#848e9c] ml-1">USDT</span>
            </div>
          </div>
        )}

        {/* ── Price ── */}
        {tab !== 'Market' && (
          <div>
            <label className="block text-[10px] text-[#848e9c] mb-1">Price</label>
            <div className="flex items-center bg-[#2b2f36] border border-white/5 rounded-lg px-2 py-1.5 focus-within:border-[#f0b90b]/50 transition-colors group">
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-[12px] font-mono text-[#eaecef] outline-none placeholder-[#4a4e57]"
              />
              <button
                onClick={() => setPrice(currentPrice.toFixed(2))}
                className="flex items-center gap-0.5 text-[10px] text-[#f0b90b] hover:text-[#f0b90b]/80 transition-colors ml-1 flex-shrink-0"
                title="Use market price"
              >
                <Link2 className="w-2.5 h-2.5" />
                Mkt
              </button>
              <span className="text-[11px] text-[#848e9c] ml-1">USDT</span>
            </div>
          </div>
        )}

        {tab === 'Market' && (
          <div className="flex items-center bg-[#2b2f36] border border-white/5 rounded-lg px-2 py-1.5">
            <span className="text-[11px] text-[#848e9c] flex-1">Market Price</span>
            <span className={cn('text-[12px] font-mono font-bold', currentPrice >= prevPrice ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
              {currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-[#848e9c] ml-1">USDT</span>
          </div>
        )}

        {/* ── Amount + mode toggle ── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-[#848e9c]">Amount</label>
            <div className="flex items-center gap-0 bg-[#2b2f36] rounded overflow-hidden border border-white/5">
              <button
                onClick={() => setAmountMode('coin')}
                className={cn('px-2 py-0.5 text-[10px] transition-colors', amountMode === 'coin' ? 'bg-[#f0b90b]/20 text-[#f0b90b]' : 'text-[#848e9c]')}
              >
                {coin.symbol}
              </button>
              <button
                onClick={() => setAmountMode('usdt')}
                className={cn('px-2 py-0.5 text-[10px] transition-colors', amountMode === 'usdt' ? 'bg-[#f0b90b]/20 text-[#f0b90b]' : 'text-[#848e9c]')}
              >
                USDT
              </button>
            </div>
          </div>
          <div className="flex items-center bg-[#2b2f36] border border-white/5 rounded-lg px-2 py-1.5 focus-within:border-[#f0b90b]/50 transition-colors">
            <input
              type="number"
              value={amountMode === 'coin' ? amount : usdInput}
              onChange={e => amountMode === 'coin' ? setAmount(e.target.value) : setUsdInput(e.target.value)}
              placeholder="0.00000"
              className="flex-1 bg-transparent text-[12px] font-mono text-[#eaecef] outline-none placeholder-[#4a4e57]"
            />
            <span className="text-[11px] text-[#848e9c] ml-1">{amountMode === 'coin' ? coin.symbol : 'USDT'}</span>
          </div>
        </div>

        {/* ── Percent quick-fill ── */}
        <div className="grid grid-cols-4 gap-1">
          {PCT_STEPS.map(p => (
            <button
              key={p}
              onClick={() => setPct(p)}
              className="py-1 text-[10px] font-medium text-[#848e9c] bg-[#2b2f36] hover:bg-white/10 hover:text-[#eaecef] rounded transition-colors border border-white/5"
            >
              {p}%
            </button>
          ))}
        </div>

        {/* ── Total ── */}
        <div className="flex items-center bg-[#2b2f36] border border-white/5 rounded-lg px-2 py-1.5">
          <span className="text-[11px] text-[#848e9c] flex-1">Total</span>
          <span className="text-[12px] font-mono text-[#eaecef] tabular-nums">
            {total > 0 ? total.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
          <span className="text-[11px] text-[#848e9c] ml-1">USDT</span>
        </div>

        {/* ── Leverage slider ── */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[#848e9c]">Leverage</span>
            <span className="text-[#f0b90b] font-bold font-mono">{leverage}x</span>
          </div>
          <input
            type="range" min={1} max={100} value={leverage}
            onChange={e => setLeverage(Number(e.target.value))}
            className="w-full h-1 accent-[#f0b90b] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#4a4e57] mt-0.5">
            {[1, 25, 50, 75, 100].map(v => <span key={v}>{v}x</span>)}
          </div>
        </div>

        {/* ── TP/SL collapsible ── */}
        <div>
          <button
            onClick={() => setTpsl(o => !o)}
            className="flex items-center gap-1.5 text-[11px] text-[#848e9c] hover:text-[#eaecef] transition-colors w-full"
          >
            {tpsl ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            TP / SL
            <span className="text-[10px] text-[#4a4e57]">(Take Profit / Stop Loss)</span>
          </button>
          {tpsl && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { label: 'Take Profit', val: tp, set: setTp, cls: 'focus-within:border-[#0ecb81]/50', textCls: 'text-[#0ecb81]', ph: 'USDT' },
                { label: 'Stop Loss',   val: sl, set: setSl, cls: 'focus-within:border-[#f6465d]/50', textCls: 'text-[#f6465d]', ph: 'USDT' },
              ].map(({ label, val, set, cls, textCls, ph }) => (
                <div key={label}>
                  <label className="block text-[9px] text-[#848e9c] mb-1">{label}</label>
                  <div className={cn('flex items-center bg-[#2b2f36] border border-white/5 rounded-lg px-2 py-1.5 transition-colors', cls)}>
                    <input
                      type="number"
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder="0.00"
                      className={cn('flex-1 bg-transparent text-[11px] font-mono outline-none placeholder-[#4a4e57]', textCls)}
                    />
                    <span className="text-[10px] text-[#848e9c] ml-1">{ph}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Order summary ── */}
        {total > 0 && (
          <div className="bg-[#2b2f36] rounded-lg px-3 py-2 space-y-1 text-[11px]">
            {[
              { label: 'Order Value', val: `${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT` },
              { label: 'Qty',         val: `${coinQty.toFixed(6)} ${coin.symbol}` },
              { label: 'Leverage',    val: `${leverage}x` },
              { label: 'Fee (0.1%)', val: `${(total * 0.001).toFixed(4)} USDT` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[#848e9c]">{label}</span>
                <span className="text-[#eaecef] font-mono">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Flash message ── */}
        {flash && (
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border animate-in fade-in duration-200',
            flash.ok
              ? 'bg-[#0ecb81]/10 border-[#0ecb81]/30 text-[#0ecb81]'
              : 'bg-[#f6465d]/10 border-[#f6465d]/30 text-[#f6465d]',
          )}>
            {flash.ok
              ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              : <XCircle    className="w-3.5 h-3.5 flex-shrink-0" />}
            {flash.msg}
          </div>
        )}

        {/* ── Submit button ── */}
        <button
          onClick={handleSubmit}
          className={cn(
            'w-full py-3 rounded-lg text-[13px] font-bold transition-all active:scale-95 shadow-lg',
            btnCls,
          )}
        >
          {isBuy ? `Buy ${coin.symbol}` : `Sell ${coin.symbol}`}
        </button>

        {/* ── Mini order book ── */}
        <div className="mt-2 border-t border-white/5 pt-3">
          <div className="text-[10px] text-[#848e9c] mb-1.5 font-semibold uppercase tracking-wide">Order Book</div>
          <OrderBook
            book={book}
            currentPrice={currentPrice}
            prevPrice={prevPrice}
            compact
          />
        </div>
      </div>
    </div>
  );
}
