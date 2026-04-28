import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, DollarSign, AlertTriangle, Play, Square, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminPortalStore } from '@/lib/adminPortalStore';
import { useAdminAuthStore } from '@/lib/adminAuthStore';

const STATUS_STYLE = {
  active:   'bg-green-500/10 border-green-500/20 text-green-400',
  ended:    'bg-white/5 border-white/10 text-white/30',
  upcoming: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

export function AdminCompetitions() {
  const { competitions, twoManRequests, requestTwoMan } = useAdminPortalStore();
  const { session } = useAdminAuthStore();
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const active   = competitions.filter(c => c.status === 'active').length;
  const upcoming = competitions.filter(c => c.status === 'upcoming').length;
  const totalParticipants = competitions.reduce((s, c) => s + c.participants, 0);
  const totalPrize = competitions.reduce((s, c) => s + c.prizePool, 0);

  const handleDeleteRequest = (comp: typeof competitions[0]) => {
    requestTwoMan({
      action:        'delete_competition',
      requesterId:   session?.adminId ?? '',
      requesterName: session?.displayName ?? '',
      targetId:      comp.id,
      targetLabel:   comp.title,
      reason:        'Admin-initiated deletion of active competition',
    });
    setRequested(prev => new Set([...prev, comp.id]));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <h1 className="text-lg font-bold text-white flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-400" /> Competition Management
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active',       value: active,           color: '#34d399', icon: Play },
          { label: 'Upcoming',     value: upcoming,         color: '#60a5fa', icon: Play },
          { label: 'Participants', value: totalParticipants, color: '#a78bfa', icon: Users },
          { label: 'Total Prize',  value: `$${totalPrize.toLocaleString()}`, color: '#f59e0b', icon: DollarSign },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
            <k.icon className="h-4 w-4 mb-2" style={{ color: k.color }} />
            <p className="text-xl font-bold text-white font-mono">{k.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Competition cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competitions.map(comp => {
          const hasDisputes = comp.disputes > 0;
          const isRequested = requested.has(comp.id);
          const hasTwoMan = twoManRequests.some(r => r.targetId === comp.id && r.status === 'pending');

          return (
            <motion.div key={comp.id} layout
              className={cn('p-5 rounded-2xl border transition-all',
                hasDisputes ? 'border-amber-500/20 bg-amber-500/3' : 'border-white/5 bg-white/[0.02]')}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{comp.title}</p>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border capitalize mt-1 inline-flex', STATUS_STYLE[comp.status])}>
                      {comp.status}
                    </span>
                  </div>
                </div>
                {hasDisputes && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-3 w-3" /> {comp.disputes} disputes
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Participants', value: comp.participants.toLocaleString(), icon: Users },
                  { label: 'Prize Pool',   value: `$${comp.prizePool.toLocaleString()}`, icon: DollarSign },
                  { label: 'Disputes',     value: comp.disputes, icon: AlertTriangle },
                ].map(s => (
                  <div key={s.label} className="bg-white/3 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-white font-mono">{s.value}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/30 mb-3">
                <span>{new Date(comp.startDate).toLocaleDateString()} →</span>
                <span>{new Date(comp.endDate).toLocaleDateString()}</span>
              </div>

              {comp.status === 'active' && (
                <div className="flex gap-2">
                  {isRequested || hasTwoMan ? (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2 w-full">
                      <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                      Two-man approval pending
                    </div>
                  ) : (
                    <button onClick={() => handleDeleteRequest(comp)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
                      <Square className="h-3.5 w-3.5" /> Request Deletion (2-man rule)
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
