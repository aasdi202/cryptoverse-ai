import { create } from 'zustand';

// ── Notification bridge ────────────────────────────────────────────────────────
// appStore calls registerNotifyHandler() once after it initialises so
// tradingStore can fire notifications without importing appStore (avoids
// the circular-dependency / Vite virtual-fs error).
type NotifyPayload = { type: 'trade' | 'liquidation' | 'achievement' | 'system'; title: string; message: string };
let _notifyHandler: ((n: NotifyPayload) => void) | null = null;

export function registerNotifyHandler(fn: (n: NotifyPayload) => void) {
  _notifyHandler = fn;
}

function notify(n: NotifyPayload) {
  _notifyHandler?.(n);
}

export interface Position {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;          // how many coins
  costBasis: number;         // USD spent (quantity * entryPrice)
  leverage: number;
  openedAt: string;
  color: string;
  // Optional stop-loss / take-profit (P5-B)
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradeRecord {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  side: 'long' | 'short';
  action: 'open' | 'close';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  costBasis: number;
  pnl: number;
  pnlPct: number;
  leverage: number;
  fee: number;
  timestamp: string;
  color: string;
}

interface TradingState {
  balance: number;
  positions: Position[];
  history: TradeRecord[];

  openPosition: (params: {
    coinId: string;
    symbol: string;
    name: string;
    side: 'long' | 'short';
    usdAmount: number;
    currentPrice: number;
    leverage: number;
    color: string;
    stopLoss?: number;
    takeProfit?: number;
  }) => { success: boolean; error?: string };

  closePosition: (positionId: string, currentPrice: number) => void;

  // P5-B: set stop-loss / take-profit on an open position
  updateOrderLevels: (positionId: string, stopLoss?: number, takeProfit?: number) => void;

  // P5-D: called every price tick to auto-close SL/TP triggered positions
  checkPriceAlerts: (coinId: string, currentPrice: number) => void;

  resetBalance: () => void;
}

const FEE_RATE = 0.001; // 0.1% taker fee
const INITIAL_BALANCE = 100_000;

export const useTradingStore = create<TradingState>((set, get) => ({
  balance: INITIAL_BALANCE,
  positions: [],
  history: [],

  openPosition: ({ coinId, symbol, name, side, usdAmount, currentPrice, leverage, color, stopLoss, takeProfit }) => {
    const { balance } = get();
    const fee = usdAmount * FEE_RATE;
    const totalCost = usdAmount + fee;

    if (totalCost > balance) {
      return { success: false, error: 'Insufficient balance' };
    }
    if (usdAmount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }
    if (currentPrice <= 0) {
      return { success: false, error: 'Invalid price' };
    }

    const quantity = (usdAmount * leverage) / currentPrice;

    const position: Position = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      coinId,
      symbol,
      name,
      side,
      entryPrice: currentPrice,
      quantity,
      costBasis: usdAmount,
      leverage,
      openedAt: new Date().toLocaleTimeString(),
      color,
      stopLoss,
      takeProfit,
    };

    const record: TradeRecord = {
      id: position.id,
      coinId,
      symbol,
      name,
      side,
      action: 'open',
      quantity,
      entryPrice: currentPrice,
      costBasis: usdAmount,
      pnl: -fee,
      pnlPct: -(fee / usdAmount) * 100,
      leverage,
      fee,
      timestamp: new Date().toLocaleTimeString(),
      color,
    };

    set(state => ({
      balance: Math.round((state.balance - totalCost) * 100) / 100,
      positions: [position, ...state.positions],
      history: [record, ...state.history].slice(0, 50),
    }));

    notify({
      type: 'trade',
      title: `${side === 'long' ? '📈 Long' : '📉 Short'} Opened — ${symbol}`,
      message: `${usdAmount.toLocaleString()} @ ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} · ${leverage}x leverage`,
    });

    return { success: true };
  },

  closePosition: (positionId, currentPrice) => {
    const { positions } = get();
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    // Raw P&L on the leveraged position
    const rawPnl =
      pos.side === 'long'
        ? (currentPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - currentPrice) * pos.quantity;

    const fee = pos.costBasis * FEE_RATE;
    const netPnl = rawPnl - fee;
    const pnlPct = (netPnl / pos.costBasis) * 100;

    // Return original margin + net P&L
    const returned = pos.costBasis + netPnl;

    const record: TradeRecord = {
      id: `close-${positionId}-${Date.now()}`,
      coinId: pos.coinId,
      symbol: pos.symbol,
      name: pos.name,
      side: pos.side,
      action: 'close',
      quantity: pos.quantity,
      entryPrice: pos.entryPrice,
      exitPrice: currentPrice,
      costBasis: pos.costBasis,
      pnl: Math.round(netPnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      leverage: pos.leverage,
      fee,
      timestamp: new Date().toLocaleTimeString(),
      color: pos.color,
    };

    set(state => ({
      balance: Math.round((state.balance + Math.max(0, returned)) * 100) / 100,
      positions: state.positions.filter(p => p.id !== positionId),
      history: [record, ...state.history].slice(0, 50),
    }));

    const pnlSign = netPnl >= 0 ? '+' : '';
    if (returned <= 0) {
      notify({
        type: 'liquidation',
        title: `⚠️ Position Liquidated — ${pos.symbol}`,
        message: `Your ${pos.side} position was liquidated. Margin lost: ${pos.costBasis.toLocaleString()}.`,
      });
    } else {
      notify({
        type: 'trade',
        title: `${netPnl >= 0 ? '✅' : '❌'} Position Closed — ${pos.symbol}`,
        message: `${pos.side === 'long' ? 'Long' : 'Short'} closed · P&L: ${pnlSign}${Math.abs(netPnl).toFixed(2)} (${pnlSign}${pnlPct.toFixed(2)}%)`,
      });
    }
  },

  updateOrderLevels: (positionId, stopLoss, takeProfit) => {
    set(state => ({
      positions: state.positions.map(p =>
        p.id === positionId ? { ...p, stopLoss, takeProfit } : p,
      ),
    }));
  },

  checkPriceAlerts: (coinId, currentPrice) => {
    const { positions, closePosition } = get();
    for (const pos of positions) {
      if (pos.coinId !== coinId) continue;
      const isLong = pos.side === 'long';
      // Stop-loss
      if (pos.stopLoss !== undefined) {
        const triggered = isLong ? currentPrice <= pos.stopLoss : currentPrice >= pos.stopLoss;
        if (triggered) {
          notify({
            type: 'liquidation',
            title: `🛑 Stop-Loss Hit — ${pos.symbol}`,
            message: `${isLong ? 'Long' : 'Short'} closed at ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} (SL: ${pos.stopLoss})`,
          });
          closePosition(pos.id, currentPrice);
          continue;
        }
      }
      // Take-profit
      if (pos.takeProfit !== undefined) {
        const triggered = isLong ? currentPrice >= pos.takeProfit : currentPrice <= pos.takeProfit;
        if (triggered) {
          notify({
            type: 'achievement',
            title: `🎯 Take-Profit Hit — ${pos.symbol}`,
            message: `${isLong ? 'Long' : 'Short'} closed at ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} (TP: ${pos.takeProfit})`,
          });
          closePosition(pos.id, currentPrice);
        }
      }
    }
  },

  resetBalance: () => {
    set({ balance: INITIAL_BALANCE, positions: [], history: [] });
  },
}));

// Compute live P&L for a position given current price
export function calcPositionPnl(pos: Position, currentPrice: number) {
  const rawPnl =
    pos.side === 'long'
      ? (currentPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - currentPrice) * pos.quantity;
  const pnlPct = (rawPnl / pos.costBasis) * 100;
  return { rawPnl, pnlPct };
}
