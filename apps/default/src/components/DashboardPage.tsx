import React from 'react';
import { DailyRewardsWidget } from './DailyRewardsWidget';
import { SentimentWidget } from './sentiment/SentimentWidget';
import { useTradingStore } from '@/lib/tradingStore';
import { useAuthStore } from '@/lib/authStore';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { balance, positions, history } = useTradingStore();
  
  // محاسبه آمار
  const totalPnL = history.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winRate = history.length > 0 
    ? (history.filter(t => t.pnl && t.pnl > 0).length / history.length) * 100 
    : 0;
  const totalTrades = history.length;
  const openPositions = positions.length;

  return (
    <div className="p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.display_name || user?.username || 'Trader'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and discover new opportunities
          </p>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-white/10 p-4">
            <div className="text-sm text-muted-foreground">Total Balance</div>
            <div className="text-2xl font-bold text-amber-500">
              ${balance.toLocaleString()}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-white/10 p-4">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString()} USD
            </div>
          </div>
          <div className="bg-card rounded-xl border border-white/10 p-4">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-2xl font-bold text-amber-500">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalTrades} total trades
            </div>
          </div>
          <div className="bg-card rounded-xl border border-white/10 p-4">
            <div className="text-sm text-muted-foreground">Open Positions</div>
            <div className="text-2xl font-bold text-amber-500">
              {openPositions}
            </div>
          </div>
        </div>

        {/* Dashboard Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Daily Rewards Widget */}
          <DailyRewardsWidget />
          
          {/* Market Sentiment Widget */}
          <div className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span> Market Sentiment
            </h3>
            <SentimentWidget compact />
          </div>
          
          {/* Quick Links Card */}
          <div className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">🚀</span> Quick Actions
            </h3>
            <div className="space-y-2">
              <a href="/" className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <span>Start Trading</span>
                <span>→</span>
              </a>
              <a href="/academy" className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <span>Continue Learning</span>
                <span>→</span>
              </a>
              <a href="/marketplace" className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <span>Explore Strategies</span>
                <span>→</span>
              </a>
              <a href="/copy-trading" className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <span>Copy Top Traders</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-card rounded-xl border border-white/10 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">📋</span> Recent Activity
          </h3>
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No trades yet. Start trading to see your activity here!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-muted-foreground font-normal">Date</th>
                    <th className="text-left py-2 text-muted-foreground font-normal">Pair</th>
                    <th className="text-left py-2 text-muted-foreground font-normal">Side</th>
                    <th className="text-right py-2 text-muted-foreground font-normal">Price</th>
                    <th className="text-right py-2 text-muted-foreground font-normal">Amount</th>
                    <th className="text-right py-2 text-muted-foreground font-normal">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((trade, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-2 text-muted-foreground text-xs">
                        {new Date(trade.timestamp || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-2">{trade.symbol || '-'}</td>
                      <td className="py-2">
                        <span className={trade.side === 'long' || trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                          {trade.side || '-'}
                        </span>
                      </td>
                      <td className="py-2 text-right">${trade.price?.toLocaleString() || '-'}</td>
                      <td className="py-2 text-right">{trade.amount || '-'}</td>
                      <td className={`py-2 text-right ${trade.pnl && trade.pnl > 0 ? 'text-green-500' : trade.pnl && trade.pnl < 0 ? 'text-red-500' : ''}`}>
                        {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
