import React, { useEffect, useState } from 'react';
import { useRewardStore } from '../store/rewardStore';

export const DailyRewardsWidget: React.FC = () => {
  const { currentStreak, totalRewards, getCurrentReward, canClaimToday, claimDailyReward } = useRewardStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const nextReward = getCurrentReward();
  const canClaim = canClaimToday();
  
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;
    
    setIsClaiming(true);
    try {
      const { reward, isBonus } = await claimDailyReward();
      setMessage({
        text: `🎉 Earned ${reward} CP! ${isBonus ? '✨ Bonus Streak Reward! ✨' : ''}`,
        type: 'success'
      });
    } catch (error: any) {
      setMessage({
        text: error.message || 'Failed to claim reward',
        type: 'error'
      });
    } finally {
      setIsClaiming(false);
    }
  };
  
  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">🎁 Daily Rewards</h3>
        <span className="text-xs text-muted-foreground">
          Total: {totalRewards} CP
        </span>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-amber-500">
          {currentStreak}
        </div>
        <div className="text-xs text-muted-foreground">Day Streak</div>
      </div>
      
      <div className="bg-amber-500/10 rounded-lg p-3 text-center mb-4">
        <div className="text-xs text-muted-foreground">Today's Reward</div>
        <div className="text-xl font-bold text-amber-500">
          {nextReward} CP
          {currentStreak + 1 === 7 && <span className="text-xs ml-2">🎯 Weekly Bonus</span>}
          {(currentStreak + 1 === 30) && <span className="text-xs ml-2">🏆 Monthly Champion</span>}
        </div>
      </div>
      
      <button
        onClick={handleClaim}
        disabled={!canClaim || isClaiming}
        className={`w-full py-2 rounded-lg font-medium transition-colors ${
          canClaim && !isClaiming
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
        }`}
      >
        {isClaiming ? 'Claiming...' : canClaim ? 'Claim Daily Reward' : 'Already Claimed'}
      </button>
      
      {message && (
        <div className={`mt-3 text-sm text-center p-2 rounded ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-500' 
            : 'bg-red-500/20 text-red-500'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};
