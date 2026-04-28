import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RewardState {
  currentStreak: number;
  lastClaimDate: string | null;
  totalRewards: number;
  
  claimDailyReward: () => Promise<{ reward: number; isBonus: boolean }>;
  canClaimToday: () => boolean;
  getCurrentReward: () => number;
}

const getRewardForDay = (day: number): number => {
  if (day === 1) return 10;
  if (day === 2) return 15;
  if (day === 3) return 20;
  if (day === 4) return 25;
  if (day === 5) return 35;
  if (day === 6) return 50;
  if (day === 7) return 100;
  if (day === 14) return 150;
  if (day === 21) return 200;
  if (day === 30) return 300;
  if (day === 60) return 500;
  if (day === 100) return 1000;
  return 50;
};

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      lastClaimDate: null,
      totalRewards: 0,

      getCurrentReward: () => {
        const streak = get().currentStreak;
        const nextDay = streak + 1;
        return getRewardForDay(nextDay);
      },

      canClaimToday: () => {
        const lastClaim = get().lastClaimDate;
        if (!lastClaim) return true;
        const today = new Date().toDateString();
        return lastClaim !== today;
      },

      claimDailyReward: async () => {
        const canClaim = get().canClaimToday();
        if (!canClaim) {
          throw new Error('You have already claimed your reward today');
        }

        const today = new Date().toDateString();
        const lastClaim = get().lastClaimDate;
        let newStreak = get().currentStreak + 1;
        
        if (lastClaim) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastClaim !== yesterday.toDateString()) {
            newStreak = 1;
          }
        }
        
        const reward = getRewardForDay(newStreak);
        const isBonus = newStreak === 7 || newStreak === 14 || newStreak === 21 || 
                        newStreak === 30 || newStreak === 60 || newStreak === 100;
        
        set({
          currentStreak: newStreak,
          lastClaimDate: today,
          totalRewards: get().totalRewards + reward,
        });
        
        console.log(`🎁 Reward claimed: ${reward} CP (Day ${newStreak})`);
        return { reward, isBonus };
      },
    }),
    { name: 'reward-storage' }
  )
);
