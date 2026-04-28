// apps/default/src/pages/DashboardPage.tsx
import React from 'react';
import { DailyRewardsWidget } from '../components/DailyRewardsWidget';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DailyRewardsWidget />
        {/* سایر ویجت‌های统计数据 بعداً اضافه می‌شوند */}
      </div>
    </div>
  );
};
