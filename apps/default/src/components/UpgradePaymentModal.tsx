import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, CheckCheck, Star, BadgeCheck, Crown,
  Clock, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Wallet, ShieldCheck, Zap, ChevronRight, Hash, Search,
  ArrowLeft, CircleCheck, TriangleAlert, QrCode, Sparkles,
  Mail, RefreshCcw, Activity, Cpu, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { encodeQR } from '@/lib/qrcode';
import {
  EVM_WALLET, TX_MIN_USDT, TX_MAX_USDT,
  TRON_NETWORK, TRON_CURRENCY,
  PLAN_PRICE_USDT, tronscanUrl,
  useSubscriptionStore,
  PaymentRecord,
} from '@/lib/subscriptionStore';
import { useAuthStore } from '@/lib/authStore';
import {
  useAiPaymentVerification,
  fmtMsLeft,
} from '@/lib/useAiPaymentVerification';

// ── WalletAddressBlock ────────────────────────────────────────────────────────
// Shared component used in every payment section.
// Shows: bold address, copy button, QR code, "only send here" warning, min/max.
interface WalletAddressBlockProps {
  /** Accent colour used for borders and highlights */
  accentColor?: string;
  /** Fixed amount to pay — when provided, shows as the exact required amount */
  requiredAmount?: number;
  /** Currency label, e.g. "USDT" */
  currency?: string;
}

export function WalletAddressBlock({
  accentColor = '#6366f1',
  requiredAmount,
  currency = TRON_CURRENCY,
}: WalletAddressBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(EVM_WALLET).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);

  // ── Real QR code — computed once, memoised ────────────────────────────────
  const qr = useMemo(() => encodeQR(EVM_WALLET), []);
  const CELL     = 6;   // px per module — keeps the code compact inside the card
  const QR_SIZE  = qr.size * CELL;

  return (
    <div className="space-y-3">
      {/* ── Header row ── */}
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" style={{ color: accentColor }} />
        <p className="text-sm font-semibold">Payment Address</p>
        <button
          onClick={() => setShowQr(v => !v)}
          className={cn(
            'ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all',
            showQr
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-secondary/40 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20',
          )}
        >
          <QrCode className="h-3 w-3" />
          {showQr ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {/* ── QR code panel ── */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-col items-center gap-3 py-4 rounded-2xl border"
              style={{ backgroundColor: accentColor + '08', borderColor: accentColor + '25' }}
            >
              {/* QR SVG — real QR Code Model 2, byte mode, EC level M */}
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <svg
                  width={QR_SIZE}
                  height={QR_SIZE}
                  viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label={`QR code for wallet address ${EVM_WALLET}`}
                  shapeRendering="crispEdges"
                >
                  {qr.matrix.map((dark, i) => {
                    if (!dark) return null;
                    const r = Math.floor(i / qr.size);
                    const c = i % qr.size;
                    return (
                      <rect
                        key={i}
                        x={c * CELL}
                        y={r * CELL}
                        width={CELL}
                        height={CELL}
                        fill="#111"
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="text-center space-y-1 px-4">
                <p className="text-xs font-semibold" style={{ color: accentColor }}>
                  Scan to autofill address
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Open your wallet app and point the camera at the QR code above
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Address card ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: accentColor + '35' }}
      >
        {/* Network tag */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ backgroundColor: accentColor + '12', borderColor: accentColor + '20' }}
        >
          <ShieldCheck className="h-3 w-3" style={{ color: accentColor }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            ERC-20 · BEP-20 · Polygon — USDT accepted
          </span>
        </div>

        {/* Bold address */}
        <div className="px-4 py-3 space-y-3" style={{ backgroundColor: accentColor + '06' }}>
          <p
            className="font-mono text-sm font-bold break-all leading-relaxed tracking-wide select-all"
            style={{ color: accentColor }}
          >
            {EVM_WALLET}
          </p>

          {/* Copy Address button */}
          <button
            onClick={copyAddress}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'border',
            )}
            style={!copied ? {
              backgroundColor: accentColor + '20',
              borderColor:     accentColor + '50',
              color:           accentColor,
            } : {}}
          >
            {copied
              ? <><CheckCheck className="h-4 w-4" /> Address Copied!</>
              : <><Copy className="h-4 w-4" /> Copy Address</>
            }
          </button>
        </div>
      </div>

      {/* ── "Only send to this address" warning ── */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/8 border border-red-500/25">
        <TriangleAlert className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-red-400 uppercase tracking-wide">
            Only send to this address
          </p>
          <p className="text-[11px] text-red-300/70 leading-relaxed">
            Sending funds to any other address will result in <strong className="text-red-300">permanent loss</strong>.
            Double-check the full address before confirming your transaction.
          </p>
        </div>
      </div>

      {/* ── Min / Max transaction amounts ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/20 border border-white/5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Min Amount</span>
          <span className="font-mono text-sm font-bold text-foreground">
            {TX_MIN_USDT.toFixed(2)} <span className="text-xs text-muted-foreground">{currency}</span>
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/20 border border-white/5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Max Amount</span>
          <span className="font-mono text-sm font-bold text-foreground">
            {TX_MAX_USDT.toFixed(2)} <span className="text-xs text-muted-foreground">{currency}</span>
          </span>
        </div>
      </div>

      {requiredAmount !== undefined && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <span className="text-[11px] text-amber-300/80 font-medium">Required for this plan</span>
          <span className="font-mono text-sm font-bold text-amber-300">
            {requiredAmount.toFixed(2)} {currency}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type PlanId = 'bronze' | 'silver' | 'gold';

export interface PlanConfig {
  id: PlanId;
  label: string;
  icon: React.ElementType;
  color: string;
  price: string;
  priceUSD: number;
  perks: string[];
}

interface UpgradePaymentModalProps {
  plan: PlanConfig;
  currentPlan: PlanId;
  onClose: () => void;
  /** Called only after verifyPayment returns ok=true */
  onConfirmed: (planId: PlanId) => void;
}

// ── Plan Configs ──────────────────────────────────────────────────────────────
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    icon: Star,
    color: '#cd7f32',
    price: 'Free',
    priceUSD: 0,
    perks: ['Up to 10x leverage', 'Basic charts', 'Community access'],
  },
  {
    id: 'silver',
    label: 'Silver',
    icon: BadgeCheck,
    color: '#94a3b8',
    price: '$9.99/mo',
    priceUSD: PLAN_PRICE_USDT['silver'],
    perks: ['Up to 50x leverage', 'Advanced charts', 'Priority support', 'AI hints'],
  },
  {
    id: 'gold',
    label: 'Gold',
    icon: Crown,
    color: '#f59e0b',
    price: '$24.99/mo',
    priceUSD: PLAN_PRICE_USDT['gold'],
    perks: ['Up to 100x leverage', 'Twin League access', 'Exclusive badges', 'Early features'],
  },
];

// ── Step: Plan Details + Wallet ───────────────────────────────────────────────
function PaymentStep({
  plan,
  onPaid,
  onClose,
}: {
  plan: PlanConfig;
  onPaid: () => void;
  onClose: () => void;
}) {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const Icon = plan.icon;

  const copyAmount = useCallback(() => {
    navigator.clipboard.writeText(plan.priceUSD.toFixed(2)).catch(() => {});
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  }, [plan.priceUSD]);

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Plan badge */}
      <div
        className="flex items-center gap-4 p-4 rounded-2xl border"
        style={{
          backgroundColor: plan.color + '12',
          borderColor: plan.color + '35',
        }}
      >
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: plan.color + '25', border: `1px solid ${plan.color}40` }}
        >
          <Icon className="h-6 w-6" style={{ color: plan.color }} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base" style={{ color: plan.color }}>
            {plan.label} Plan
          </p>
          <p className="text-sm text-muted-foreground">Monthly subscription</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono" style={{ color: plan.color }}>
            ${plan.priceUSD.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">per month</p>
        </div>
      </div>

      {/* Perks */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          What you get
        </p>
        <div className="grid grid-cols-2 gap-2">
          {plan.perks.map(perk => (
            <div
              key={perk}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/20 border border-white/5"
            >
              <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.color }} />
              <span className="text-xs text-muted-foreground leading-tight">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Payment instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Payment Instructions</p>
        </div>

        {/* Network + Currency info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-secondary/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Network</p>
            <p className="text-xs font-semibold">{TRON_NETWORK}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Accepted</p>
            <p className="text-xs font-semibold">{TRON_CURRENCY}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium">Amount to send</p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-white/10">
            <span className="flex-1 font-mono text-sm font-bold">
              {plan.priceUSD.toFixed(2)} USDT
            </span>
            <button
              onClick={copyAmount}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                copiedAmount
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-secondary/50 text-muted-foreground border border-white/10 hover:text-foreground hover:border-white/20',
              )}
            >
              {copiedAmount ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedAmount ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Wallet address — full block with QR, copy, warning, min/max */}
        <WalletAddressBlock
          accentColor={plan.color}
          requiredAmount={plan.priceUSD}
          currency={TRON_CURRENCY}
        />
      </div>

      {/* CTA */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onPaid}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
            boxShadow: `0 8px 24px ${plan.color}40`,
            color: '#000',
          }}
        >
          I've Sent the Payment
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/50 transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── Helpers: TX Hash validation ───────────────────────────────────────────────
// TRC20 TX hash: exactly 64 hex characters (no 0x prefix)
const TRC20_HASH_RE = /^[0-9a-fA-F]{64}$/;

function isValidTxHash(v: string): boolean {
  return TRC20_HASH_RE.test(v.trim());
}

// ── Step: TX Hash Submission ──────────────────────────────────────────────────
function TxHashStep({
  plan,
  onSubmit,
  onBack,
}: {
  plan: PlanConfig;
  onSubmit: (txHash: string) => void;
  onBack: () => void;
}) {
  const [txHash, setTxHash]         = useState('');
  const [touched, setTouched]       = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const trimmed  = txHash.trim();
  const isValid  = isValidTxHash(trimmed);
  const showErr  = touched && trimmed.length > 0 && !isValid;

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTxHash(text.trim());
      setTouched(true);
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = useCallback(() => {
    setTouched(true);
    if (!isValid) return;
    setVerifying(true);
    setError(null);
    // Pass hash up; parent will call submitPayment then verifyPayment
    setTimeout(() => {
      setVerifying(false);
      onSubmit(trimmed);
    }, 600);
  }, [isValid, trimmed, onSubmit]);

  return (
    <motion.div
      key="txhash"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Back */}
      <button
        onClick={onBack}
        disabled={verifying}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to payment details
      </button>

      {/* Header copy */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" style={{ color: plan.color }} />
          <h3 className="font-bold text-base">Submit Transaction ID</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste your transaction hash so our team can verify your payment on-chain
          and activate your plan immediately.
        </p>
      </div>

      {/* Summary chip */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl border"
        style={{ backgroundColor: plan.color + '10', borderColor: plan.color + '30' }}
      >
        <span className="text-xs text-muted-foreground">Upgrading to</span>
        <span className="text-xs font-bold" style={{ color: plan.color }}>
          {plan.label} — ${plan.priceUSD.toFixed(2)} USDT
        </span>
      </div>

      {/* TX Hash input */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Transaction Hash (TX ID)
        </label>

        <div className="relative">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border transition-all duration-200 overflow-hidden',
              showErr
                ? 'border-red-500/50 bg-red-500/5'
                : isValid
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-white/10 bg-secondary/30 focus-within:border-white/25',
            )}
          >
            {/* Hash icon */}
            <div className="pl-3 flex-shrink-0">
              {verifying
                ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                : showErr
                  ? <TriangleAlert className="h-4 w-4 text-red-400" />
                  : isValid
                    ? <CircleCheck className="h-4 w-4 text-green-400" />
                    : <Hash className="h-4 w-4 text-muted-foreground" />
              }
            </div>

            <input
              ref={inputRef}
              value={txHash}
              onChange={e => { setTxHash(e.target.value); setTouched(true); setError(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="64-character TRC20 hex hash…"
              disabled={verifying}
              spellCheck={false}
              autoComplete="off"
              className={cn(
                'flex-1 bg-transparent py-3 pr-2 text-xs font-mono focus:outline-none placeholder:text-muted-foreground/50',
                'disabled:opacity-50',
              )}
            />

            {/* Paste button */}
            <button
              onClick={handlePaste}
              disabled={verifying}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground border-l border-white/8 transition-colors disabled:opacity-40"
            >
              <Copy className="h-3 w-3" /> Paste
            </button>
          </div>

          {/* Char counter */}
          {trimmed.length > 0 && (
            <p className={cn(
              'absolute -bottom-4 right-1 text-[10px] tabular-nums transition-colors',
              isValid ? 'text-green-400' : 'text-muted-foreground/50',
            )}>
              {trimmed.length} / 64
            </p>
          )}
        </div>

        {/* Validation feedback */}
        <AnimatePresence mode="wait">
          {showErr && (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[11px] text-red-400 pt-1"
            >
              <TriangleAlert className="h-3 w-3 flex-shrink-0" />
              Invalid format. TRC20 hashes are exactly 64 hexadecimal characters (no 0x prefix).
            </motion.p>
          )}
          {isValid && !showErr && (
            <motion.p
              key="ok"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[11px] text-green-400 pt-1"
            >
              <CircleCheck className="h-3 w-3 flex-shrink-0" />
              Valid transaction hash detected
            </motion.p>
          )}
          {error && (
            <motion.p
              key="api-err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[11px] text-red-400 pt-1"
            >
              <TriangleAlert className="h-3 w-3 flex-shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tronscan preview link */}
      <AnimatePresence>
        {isValid && (
          <motion.a
            href={tronscanUrl(trimmed)}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/15 transition-all group"
          >
            <div className="h-6 w-6 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
              <Search className="h-3 w-3 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground/80">Verify on Tronscan</p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">{trimmed.slice(0, 20)}…{trimmed.slice(-8)}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </motion.a>
        )}
      </AnimatePresence>

      {/* How to find TX hash guide */}
      <div className="p-3.5 rounded-xl bg-secondary/20 border border-white/5 space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" /> Where to find your TRC20 TX Hash
        </p>
        <ul className="space-y-1.5">
          {[
            'Open your TRC20 wallet (TronLink, Bitget Wallet, Trust Wallet, etc.)',
            'Go to transaction history and find this USDT payment',
            'Tap the transaction → copy the "Transaction Hash" or "TX ID" (64 hex chars, no 0x)',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span
                className="flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                style={{ backgroundColor: plan.color + '25', color: plan.color }}
              >
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Submit */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!isValid || verifying}
          className={cn(
            'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg',
            isValid && !verifying
              ? 'hover:brightness-110 active:scale-[0.98]'
              : 'opacity-40 cursor-not-allowed',
          )}
          style={{
            background: isValid
              ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`
              : undefined,
            boxShadow: isValid ? `0 8px 24px ${plan.color}40` : undefined,
            backgroundColor: !isValid ? undefined : undefined,
            color: isValid ? '#000' : undefined,
          }}
        >
          {verifying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Verifying Transaction…</>
          ) : (
            <><CheckCheck className="h-4 w-4" /> Submit for Verification</>
          )}
        </button>
        <button
          onClick={onBack}
          disabled={verifying}
          className="w-full py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/50 transition-all disabled:opacity-40"
        >
          Back
        </button>
      </div>
    </motion.div>
  );
}

// ── AI verification step tracker config ──────────────────────────────────────
const VERIFY_STEPS = [
  { id: 'submitted',    label: 'Payment submitted',        icon: CheckCircle2 },
  { id: 'scanning',     label: 'Scanning blockchain',      icon: Eye          },
  { id: 'confirming',   label: 'Confirming on-chain',      icon: Cpu          },
  { id: 'activating',   label: 'Activating plan',          icon: Sparkles     },
] as const;

type VerifyStepId = typeof VERIFY_STEPS[number]['id'];

function stepProgress(phase: string, attempt: number): VerifyStepId {
  if (phase === 'confirming' || phase === 'success') return 'activating';
  if (attempt >= 4) return 'confirming';
  if (attempt >= 1) return 'scanning';
  return 'submitted';
}

// ── Pulsing scanner rings ─────────────────────────────────────────────────────
function ScannerRings({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{ borderColor: color + '40' }}
          animate={active ? {
            width:   ['60px', '140px'],
            height:  ['60px', '140px'],
            opacity: [0.6, 0],
          } : { opacity: 0 }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Rotating status message with typewriter feel ──────────────────────────────
function StatusMessage({ message, color }: { message: string; color: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 justify-center"
      >
        <Activity className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-muted-foreground font-medium">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Confetti burst for success ────────────────────────────────────────────────
function ConfettiBurst({ color }: { color: string }) {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    angle: (i / 16) * 360,
    dist:  40 + Math.random() * 40,
    size:  3 + Math.random() * 4,
    c:     i % 3 === 0 ? color : i % 3 === 1 ? '#22c55e' : '#f59e0b',
  }));
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx  = Math.cos(rad) * p.dist;
        const ty  = Math.sin(rad) * p.dist;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{ width: p.size, height: p.size, backgroundColor: p.c }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: Math.random() * 0.2 }}
          />
        );
      })}
    </div>
  );
}

// ── Step: Waiting / AI Verification Screen ────────────────────────────────────
function WaitingStep({
  plan,
  txHash,
  paymentId,
  userId,
  kind,
  pkgLabel,
  onConfirmed,
  onClose,
  onRetry,
}: {
  plan: PlanConfig;
  txHash: string;
  paymentId: string;
  userId: string;
  kind: 'subscription' | 'virtual_balance';
  pkgLabel?: string;
  onConfirmed: () => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  const [showBurst, setShowBurst] = useState(false);

  const verification = useAiPaymentVerification({
    paymentId,
    userId,
    txHash,
    expectedUSDT: plan.priceUSD,
    kind,
    planId:   kind === 'subscription' ? plan.id : undefined,
    pkgLabel: kind === 'virtual_balance' ? pkgLabel : undefined,
    onSuccess: () => {
      setShowBurst(true);
      setTimeout(onConfirmed, 2200);
    },
  });

  const {
    phase, attempt, maxAttempts, msLeft,
    statusMessage, rejectionReason, activatedRecord,
    confirmedChain, confirmedAmount,
  } = verification;

  const isScanning   = phase === 'scanning';
  const isConfirming = phase === 'confirming';
  const isSuccess    = phase === 'success';
  const isRejected   = phase === 'rejected';
  const isTimeout    = phase === 'timeout';
  const isTerminal   = isSuccess || isRejected || isTimeout;

  const activeStepId    = stepProgress(phase, attempt);
  const activeStepIndex = VERIFY_STEPS.findIndex(s => s.id === activeStepId);
  const progressFraction = Math.min(1, attempt / maxAttempts);

  return (
    <motion.div
      key="waiting"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center text-center space-y-6 py-2"
    >

      {/* ── Central orb ─────────────────────────────────────────── */}
      <div className="relative h-40 w-40 flex items-center justify-center">

        {/* Pulsing rings — only while scanning */}
        <ScannerRings color={plan.color} active={isScanning || isConfirming} />

        {/* Success confetti */}
        {showBurst && <ConfettiBurst color={plan.color} />}

        {/* SVG progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 144 144">
          {/* Track */}
          <circle cx="72" cy="72" r="62" fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="6" />

          {/* Active arc */}
          <AnimatePresence mode="wait">
            {(isScanning || isConfirming) && (
              <motion.circle
                key="scan-arc"
                cx="72" cy="72" r="62"
                fill="none" strokeWidth="6"
                stroke={plan.color}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 62 * progressFraction} ${2 * Math.PI * 62 * (1 - progressFraction)}`}
                style={{ filter: `drop-shadow(0 0 8px ${plan.color}90)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
            {isSuccess && (
              <motion.circle
                key="success-arc"
                cx="72" cy="72" r="62"
                fill="none" strokeWidth="6"
                stroke="#22c55e"
                strokeDasharray={`${2 * Math.PI * 62}`}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 10px #22c55e90)' }}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
            {isRejected && (
              <circle key="rejected-arc" cx="72" cy="72" r="62"
                fill="none" strokeWidth="6" stroke="#ef4444"
                strokeDasharray={`${2 * Math.PI * 62}`} strokeLinecap="round" />
            )}
            {isTimeout && (
              <circle key="timeout-arc" cx="72" cy="72" r="62"
                fill="none" strokeWidth="6" stroke="#f59e0b"
                strokeDasharray={`${2 * Math.PI * 62 * 0.6} ${2 * Math.PI * 62 * 0.4}`}
                strokeLinecap="round" />
            )}
          </AnimatePresence>
        </svg>

        {/* Centre content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
          <AnimatePresence mode="wait">
            {(isScanning || isConfirming) && (
              <motion.div key="scanning-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Cpu className="h-5 w-5 mb-0.5" style={{ color: plan.color }} />
                <span className="text-2xl font-bold font-mono tabular-nums leading-none"
                  style={{ color: plan.color }}>
                  {fmtMsLeft(msLeft)}
                </span>
                <span className="text-[10px] text-muted-foreground tracking-wide uppercase">remaining</span>
              </motion.div>
            )}
            {isSuccess && (
              <motion.div key="success-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              >
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </motion.div>
            )}
            {isRejected && (
              <motion.div key="rejected-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              >
                <AlertCircle className="h-12 w-12 text-red-400" />
              </motion.div>
            )}
            {isTimeout && (
              <motion.div key="timeout-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              >
                <Clock className="h-12 w-12 text-amber-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Status message (rotating) ────────────────────────────── */}
      {(isScanning || isConfirming) && (
        <StatusMessage message={statusMessage} color={plan.color} />
      )}

      {/* ── Headline ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(isScanning || isConfirming) && (
          <motion.div key="hd-scanning"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-1.5"
          >
            <h3 className="text-lg font-bold">
              {isConfirming
                ? confirmedChain
                  ? `Found on ${confirmedChain}!`
                  : 'Transaction Found!'
                : 'Scanning Blockchain…'
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {isConfirming
                ? 'Your USDT transfer is confirmed on-chain. Activating your plan now…'
                : 'Querying Ethereum, Polygon, and BSC simultaneously. This may take 30–60 seconds while blocks confirm.'
              }
            </p>
          </motion.div>
        )}
        {isSuccess && (
          <motion.div key="hd-success"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-1.5"
          >
            <h3 className="text-xl font-bold text-green-400">Payment Confirmed! 🎉</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Your{' '}
              <span className="font-semibold" style={{ color: plan.color }}>{plan.label}</span>
              {' '}plan is now active. Enjoy your upgrade!
            </p>
          </motion.div>
        )}
        {isRejected && (
          <motion.div key="hd-rejected"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-1.5"
          >
            <h3 className="text-lg font-bold text-red-400">Verification Failed</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {rejectionReason}
            </p>
          </motion.div>
        )}
        {isTimeout && (
          <motion.div key="hd-timeout"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-1.5"
          >
            <h3 className="text-lg font-bold text-amber-400">Still Verifying…</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The blockchain is taking longer than usual. We've saved your transaction and will notify you by email once it's confirmed.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step tracker (scanning / confirming only) ────────────── */}
      {(isScanning || isConfirming) && (
        <div className="w-full max-w-xs space-y-2">
          {/* Attempt progress bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: plan.color,
                         boxShadow: `0 0 8px ${plan.color}80` }}
                animate={{ width: `${progressFraction * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
              {attempt}/{maxAttempts}
            </span>
          </div>

          {VERIFY_STEPS.map((vstep, i) => {
            const isDone   = i < activeStepIndex;
            const isActive = i === activeStepIndex;
            const StepIcon = vstep.icon;
            return (
              <motion.div
                key={vstep.id}
                className="flex items-center gap-3"
                animate={{ opacity: i > activeStepIndex + 1 ? 0.35 : 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
                  isDone   ? 'bg-green-500/20 border border-green-500/40'
                  : isActive ? 'border-2'
                  : 'bg-secondary/30 border border-white/8',
                )}
                  style={isActive ? { borderColor: plan.color,
                    boxShadow: `0 0 8px ${plan.color}50` } : {}}
                >
                  {isDone
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    : isActive
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: plan.color }} />
                      : <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
                  }
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className={cn(
                    'text-xs transition-colors duration-300',
                    isDone   ? 'text-green-400 font-medium'
                    : isActive ? 'font-semibold text-foreground'
                    : 'text-muted-foreground/50',
                  )}>
                    {vstep.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="flex gap-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map(d => (
                        <motion.div key={d}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: plan.color }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
                {isDone && (
                  <StepIcon className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Success: activation details card ────────────────────── */}
      {isSuccess && activatedRecord && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-xs rounded-2xl border p-4 space-y-2.5"
          style={{ backgroundColor: plan.color + '0c', borderColor: plan.color + '30' }}
        >
          {/* Blockchain confirmed badge */}
          {confirmedChain && (
            <div className="flex items-center gap-2 pb-2 border-b border-white/6">
              <ShieldCheck className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">
                Verified on {confirmedChain}
              </span>
            </div>
          )}

          {kind === 'subscription' && activatedRecord.expiresAt && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Plan activated</span>
                <span className="text-[11px] font-bold" style={{ color: plan.color }}>
                  {plan.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Valid until</span>
                <span className="text-[11px] font-mono font-semibold text-foreground">
                  {new Date(activatedRecord.expiresAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
            </>
          )}
          {kind === 'virtual_balance' && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Balance credited</span>
              <span className="text-[11px] font-bold text-green-400">{pkgLabel ?? ''}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] text-muted-foreground">Amount verified</span>
            <span className="text-[11px] font-mono font-semibold text-green-400">
              {(confirmedAmount ?? activatedRecord.amount).toFixed(2)} USDT
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Timeout: manual review notice ───────────────────────── */}
      {isTimeout && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30
                            flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-left space-y-0.5">
              <p className="text-xs font-semibold text-amber-300">Queued for manual review</p>
              <p className="text-[11px] text-amber-300/70 leading-relaxed">
                Your transaction has been saved. Our team will verify it within 24 hours and activate your plan automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-amber-500/15">
            <Hash className="h-3 w-3 text-amber-400/60 flex-shrink-0" />
            <span className="text-[10px] font-mono text-amber-300/50 truncate">
              {txHash.slice(0, 18)}…{txHash.slice(-8)}
            </span>
          </div>
        </motion.div>
      )}

      {/* ── TX hash reference link ───────────────────────────────── */}
      {txHash && !isTimeout && (
        <a
          href={tronscanUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-xs flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/15 transition-all group"
        >
          <div className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: plan.color + '20', border: `1px solid ${plan.color}30` }}>
            <Hash className="h-3 w-3" style={{ color: plan.color }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[10px] text-muted-foreground">TX Reference · Block Explorer</p>
            <p className="text-[11px] font-mono text-foreground/70 truncate">
              {txHash.slice(0, 16)}…{txHash.slice(-8)}
            </p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
        </a>
      )}

      {/* ── Trust badges ────────────────────────────────────────── */}
      {!isTerminal && (
        <div className="w-full max-w-xs space-y-2">
          {/* Chain badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['ETH', 'Polygon', 'BSC'].map(chain => (
              <div
                key={chain}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/30 border border-white/8"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-muted-foreground/60">{chain}</span>
              </div>
            ))}
          </div>
          {/* Security note */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <ShieldCheck className="h-3 w-3" /><span>Read-only scan</span>
            </div>
            <div className="h-2.5 w-px bg-white/8" />
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <ShieldCheck className="h-3 w-3" /><span>AI never touches funds</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Terminal CTAs ────────────────────────────────────────── */}
      {isRejected && (
        <div className="flex items-center gap-3 w-full max-w-xs">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#000' }}
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Try Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm text-muted-foreground bg-secondary/30 hover:bg-secondary/50 transition-all"
          >
            Close
          </button>
        </div>
      )}
      {isTimeout && (
        <button
          onClick={onClose}
          className="w-full max-w-xs py-3 rounded-2xl text-sm font-semibold text-foreground bg-secondary/40 hover:bg-secondary/60 transition-all border border-white/8"
        >
          Got it — close
        </button>
      )}
    </motion.div>
  );
}

// ── Step meta ─────────────────────────────────────────────────────────────────
type ModalStep = 'payment' | 'txhash' | 'waiting';

const STEP_META: Record<ModalStep, { title: (planLabel: string) => string; subtitle: string }> = {
  payment: {
    title: (l) => `Upgrade to ${l}`,
    subtitle: 'Crypto payment · USDT / USDC',
  },
  txhash: {
    title: () => 'Submit Transaction',
    subtitle: 'Paste your TX hash for verification',
  },
  waiting: {
    title: () => 'AI Verifying Payment',
    subtitle: 'Monitoring wallet for incoming USDT…',
  },
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ current, color }: { current: ModalStep; color: string }) {
  const steps: ModalStep[] = ['payment', 'txhash', 'waiting'];
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width:  i === idx ? 16 : 6,
            height: 6,
            backgroundColor: i <= idx ? color : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function UpgradePaymentModal({
  plan,
  currentPlan,
  onClose,
  onConfirmed,
}: UpgradePaymentModalProps) {
  const [step, setStep]           = useState<ModalStep>('payment');
  const [txHash, setTxHash]       = useState('');
  const [paymentId, setPaymentId] = useState('');
  // kind / pkgLabel: set by the caller when this modal is used for
  // virtual-balance purchases; defaults to subscription flow.
  const [payKind, setPayKind]     = useState<'subscription' | 'virtual_balance'>('subscription');
  const [pkgLabel, setPkgLabel]   = useState<string | undefined>(undefined);
  const Icon = plan.icon;

  const user              = useAuthStore(s => s.user);
  const { submitPayment } = useSubscriptionStore();

  const handleConfirmed = useCallback(() => {
    onConfirmed(plan.id);
  }, [onConfirmed, plan.id]);

  const handleTxSubmit = useCallback((hash: string) => {
    if (!user) return;
    // Determine kind from plan — bronze is free so this modal is only reached
    // for silver/gold (subscription) or virtual-balance top-ups.
    const kind: 'subscription' | 'virtual_balance' = payKind;
    const record = submitPayment({
      userId:   user.id,
      kind,
      planId:   kind === 'subscription' ? plan.id : undefined,
      pkgLabel: kind === 'virtual_balance' ? pkgLabel : undefined,
      amount:   plan.priceUSD,
      txHash:   hash,
      network:  TRON_NETWORK,
      currency: TRON_CURRENCY,
    });
    setTxHash(hash);
    setPaymentId(record.id);
    setStep('waiting');
  }, [user, plan, payKind, pkgLabel, submitPayment]);

  // Only allow backdrop-close on payment step
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && step === 'payment') onClose();
  }, [step, onClose]);

  const meta = STEP_META[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.28, ease: [0.34, 1.06, 0.64, 1] }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-white/8 rounded-3xl shadow-2xl shadow-black/60"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* ── Header ── */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5"
            style={{
              background: `linear-gradient(135deg, ${plan.color}12, transparent)`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: plan.color + '25', border: `1px solid ${plan.color}40` }}
              >
                <Icon className="h-5 w-5" style={{ color: plan.color }} />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">
                  {meta.title(plan.label)}
                </h2>
                <p className="text-xs text-muted-foreground leading-tight">{meta.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StepDots current={step} color={plan.color} />
              {step === 'payment' && (
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-secondary/40 hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5">
            <AnimatePresence mode="wait">
              {step === 'payment' && (
                <PaymentStep
                  key="payment"
                  plan={plan}
                  onPaid={() => setStep('txhash')}
                  onClose={onClose}
                />
              )}
              {step === 'txhash' && (
                <TxHashStep
                  key="txhash"
                  plan={plan}
                  onSubmit={handleTxSubmit}
                  onBack={() => setStep('payment')}
                />
              )}
              {step === 'waiting' && (
                <WaitingStep
                  key={paymentId}
                  plan={plan}
                  txHash={txHash}
                  paymentId={paymentId}
                  userId={user?.id ?? ''}
                  kind={payKind}
                  pkgLabel={pkgLabel}
                  onConfirmed={handleConfirmed}
                  onClose={onClose}
                  onRetry={() => setStep('txhash')}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
