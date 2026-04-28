/**
 * nftUtils.ts — Shared helpers for the NFT Analytics feature
 */
import type { NFTChain, NFTMarketplace, CollectionCategory, RarityTier } from '../../lib/nftTypes';

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtNative(value: number, decimals = 4): string {
  if (value >= 1000) return value.toFixed(0);
  if (value >= 100)  return value.toFixed(1);
  if (value >= 1)    return value.toFixed(decimals > 2 ? 2 : decimals);
  return value.toFixed(decimals);
}

export function fmtUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)         return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function fmtPct(v: number, showSign = true): string {
  const sign = showSign && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

export function fmtAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000)      return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000)   return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000)  return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

// ── Chain display ─────────────────────────────────────────────────────────────

export const CHAIN_DISPLAY: Record<NFTChain, { name: string; icon: string; color: string; symbol: string }> = {
  ethereum: { name: 'Ethereum', icon: 'Ξ',  color: '#627eea', symbol: 'ETH' },
  solana:   { name: 'Solana',   icon: '◎',  color: '#9945ff', symbol: 'SOL' },
  polygon:  { name: 'Polygon',  icon: '⬡', color: '#8247e5', symbol: 'MATIC' },
};

// ── Marketplace display ───────────────────────────────────────────────────────

export const MARKETPLACE_DISPLAY: Record<NFTMarketplace, { name: string; color: string; icon: string }> = {
  'OpenSea':    { name: 'OpenSea',    color: '#2081e2', icon: '🌊' },
  'Blur':       { name: 'Blur',       color: '#ff6600', icon: '🔥' },
  'LooksRare':  { name: 'LooksRare',  color: '#0ce466', icon: '👀' },
  'Magic Eden': { name: 'Magic Eden', color: '#e42575', icon: '🪄' },
  'X2Y2':       { name: 'X2Y2',       color: '#8bc5ff', icon: '✕' },
  'Tensor':     { name: 'Tensor',     color: '#a3e635', icon: '⚡' },
};

// ── Category display ──────────────────────────────────────────────────────────

export const CATEGORY_DISPLAY: Record<CollectionCategory, { name: string; icon: string; color: string }> = {
  pfp:         { name: 'PFP',         icon: '🖼️', color: '#60a5fa' },
  art:         { name: 'Art',          icon: '🎨', color: '#f472b6' },
  gaming:      { name: 'Gaming',       icon: '🎮', color: '#34d399' },
  utility:     { name: 'Utility',      icon: '🔑', color: '#fbbf24' },
  metaverse:   { name: 'Metaverse',    icon: '🌐', color: '#a78bfa' },
  collectible: { name: 'Collectible',  icon: '🃏', color: '#fb923c' },
};

// ── Rarity display ────────────────────────────────────────────────────────────

export const RARITY_DISPLAY: Record<RarityTier, { label: string; color: string; bg: string; icon: string }> = {
  common:    { label: 'Common',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: '⚪' },
  uncommon:  { label: 'Uncommon',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: '🟢' },
  rare:      { label: 'Rare',      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '🔵' },
  epic:      { label: 'Epic',      color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: '🟣' },
  legendary: { label: 'Legendary', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🟡' },
};

// ── NFT virtual trading (local only) ─────────────────────────────────────────

export interface VirtualNFTPosition {
  collectionId:   string;
  collectionName: string;
  collectionSlug: string;
  chain:          NFTChain;
  tokenId:        string;
  buyPrice:       number;    // native
  buyPriceUsd:    number;
  currentFloor:   number;
  currentFloorUsd: number;
  quantity:       number;
  purchasedAt:    string;   // ISO
}

export interface VirtualNFTPortfolio {
  balance:         number;  // USD (virtual cash)
  totalInvested:   number;  // USD
  positions:       VirtualNFTPosition[];
  closedTrades:    ClosedNFTTrade[];
  totalPnl:        number;  // USD (realized)
}

export interface ClosedNFTTrade {
  collectionName: string;
  tokenId:        string;
  buyPrice:       number;
  sellPrice:      number;
  pnl:            number;
  pnlPct:         number;
  closedAt:       string;
}

const PORTFOLIO_KEY = 'cryptoverse_nft_virtual_portfolio_v1';

export function loadPortfolio(): VirtualNFTPortfolio {
  try {
    return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || 'null') ?? {
      balance: 50_000,
      totalInvested: 0,
      positions: [],
      closedTrades: [],
      totalPnl: 0,
    };
  } catch {
    return { balance: 50_000, totalInvested: 0, positions: [], closedTrades: [], totalPnl: 0 };
  }
}

export function savePortfolio(p: VirtualNFTPortfolio) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p));
}
