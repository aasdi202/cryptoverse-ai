import React, { useState } from 'react';
import { Search, UserX, UserCheck, Shield, Filter, Eye, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminPortalStore } from '@/lib/adminPortalStore';
import { useAdminAuthStore } from '@/lib/adminAuthStore';
import { useAdminManagementStore } from '@/lib/adminManagementStore';

const STATUS_STYLE = {
  active:    'bg-green-500/10 border-green-500/20 text-green-400',
  suspended: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  banned:    'bg-red-500/10 border-red-500/20 text-red-400',
};
const PLAN_STYLE = {
  bronze: 'text-amber-600', silver: 'text-slate-400', gold: 'text-yellow-400',
};

export function AdminUsers() {
  const { users, banUser, unbanUser, suspendUser } = useAdminPortalStore();
  const { session }  = useAdminAuthStore();
  const { logAction } = useAdminManagementStore();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const level = session?.level ?? 1;

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || u.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const selectedUser = users.find(u => u.id === selected);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" /> User Management
          <span className="text-sm font-normal text-white/30">({users.length} total)</span>
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/8 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all" />
        </div>
        {['all', 'active', 'suspended', 'banned'].map(s => (
          <button key={s} onClick={() => setFilter(s as typeof filter)}
            className={cn('px-4 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
              filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-white/3 border-white/8 text-white/40 hover:text-white/70')}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* User list */}
        <div className="xl:col-span-2 space-y-2">
          {filtered.map(user => (
            <div key={user.id}
              onClick={() => setSelected(user.id === selected ? null : user.id)}
              className={cn('flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all',
                selected === user.id ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10')}>
              {/* Avatar */}
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 overflow-hidden flex-shrink-0 border border-white/8">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="" className="w-full h-full" />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{user.flag} {user.name}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border capitalize', STATUS_STYLE[user.status])}>
                    {user.status}
                  </span>
                  <span className={cn('text-[10px] font-semibold capitalize', PLAN_STYLE[user.plan as keyof typeof PLAN_STYLE])}>
                    {user.plan}
                  </span>
                </div>
                <p className="text-xs text-white/30 truncate">{user.email}</p>
              </div>
              {/* Stats */}
              <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
                <span className="text-xs font-mono text-green-400">${user.balance.toLocaleString()}</span>
                <span className="text-[10px] text-white/30">{user.trades} trades · {user.winRate.toFixed(0)}% WR</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/20">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>

        {/* User detail */}
        <div className="space-y-4">
          {selectedUser ? (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-5 sticky top-6">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/10">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`} alt="" className="w-full h-full" />
                </div>
                <div>
                  <p className="font-bold text-white">{selectedUser.flag} {selectedUser.name}</p>
                  <p className="text-xs text-white/40">{selectedUser.email}</p>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border capitalize inline-flex mt-1', STATUS_STYLE[selectedUser.status])}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Balance', value: `$${selectedUser.balance.toLocaleString()}`, color: 'text-green-400' },
                  { label: 'Trades',  value: selectedUser.trades,                          color: 'text-blue-400'  },
                  { label: 'Win Rate',value: `${selectedUser.winRate.toFixed(1)}%`,        color: 'text-amber-400' },
                  { label: 'Plan',    value: selectedUser.plan,                            color: PLAN_STYLE[selectedUser.plan as keyof typeof PLAN_STYLE] },
                ].map(s => (
                  <div key={s.label} className="bg-white/3 rounded-xl p-3">
                    <p className="text-[10px] text-white/30 mb-0.5">{s.label}</p>
                    <p className={cn('text-sm font-bold capitalize', s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {level >= 2 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wide">Actions</p>
                  {selectedUser.status !== 'banned' ? (
                    <button onClick={() => banUser(selectedUser.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all">
                      <UserX className="h-4 w-4" /> Ban User
                    </button>
                  ) : (
                    <button onClick={() => unbanUser(selectedUser.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all">
                      <UserCheck className="h-4 w-4" /> Unban User
                    </button>
                  )}
                  {selectedUser.status === 'active' && (
                    <button onClick={() => suspendUser(selectedUser.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all">
                      <Shield className="h-4 w-4" /> Suspend
                    </button>
                  )}
                </div>
              )}

              {/* Data masking notice for low-level admins */}
              {level < 3 && (
                <div className="bg-white/3 border border-white/8 rounded-xl p-3 text-[11px] text-white/30 flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                  Financial details masked for Level {level} access
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-white/20">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
