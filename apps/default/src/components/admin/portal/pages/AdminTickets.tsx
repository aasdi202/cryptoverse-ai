import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeadphonesIcon, Search, CheckCircle2, ArrowUpCircle, Star, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminPortalStore } from '@/lib/adminPortalStore';

const PRIORITY_STYLE: Record<string, string> = {
  low:      'bg-slate-500/10 border-slate-500/20 text-slate-400',
  medium:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
  high:     'bg-amber-500/10 border-amber-500/20 text-amber-400',
  critical: 'bg-red-500/10 border-red-500/25 text-red-400',
};
const STATUS_STYLE: Record<string, string> = {
  open:        'bg-blue-500/10 border-blue-500/20 text-blue-400',
  in_progress: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  resolved:    'bg-green-500/10 border-green-500/20 text-green-400',
  escalated:   'bg-red-500/10 border-red-500/20 text-red-400',
};

export function AdminTickets() {
  const { tickets, resolveTicket, escalateTicket } = useAdminPortalStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'escalated'>('all');
  const [pFilter, setPFilter] = useState<'all' | 'critical' | 'high'>('all');

  const filtered = tickets.filter(t => {
    const matchS = filter === 'all' || t.status === filter;
    const matchP = pFilter === 'all' || t.priority === pFilter;
    const q = search.toLowerCase();
    const matchQ = !q || t.userName.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
    return matchS && matchP && matchQ;
  });

  const open      = tickets.filter(t => t.status === 'open').length;
  const escalated = tickets.filter(t => t.status === 'escalated').length;
  const critical  = tickets.filter(t => t.priority === 'critical').length;
  const avgRating = tickets.filter(t => t.rating).reduce((s, t) => s + (t.rating ?? 0), 0) / Math.max(tickets.filter(t => t.rating).length, 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <h1 className="text-lg font-bold text-white flex items-center gap-2">
        <HeadphonesIcon className="h-5 w-5 text-teal-400" /> Support Tickets
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open',      value: open,     color: '#60a5fa', icon: Clock },
          { label: 'Escalated', value: escalated, color: '#ef4444', icon: AlertTriangle },
          { label: 'Critical',  value: critical,  color: '#f59e0b', icon: AlertTriangle },
          { label: 'Avg Rating',value: avgRating.toFixed(1) + '★', color: '#f59e0b', icon: Star },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
            <k.icon className="h-4 w-4 mb-2" style={{ color: k.color }} />
            <p className="text-xl font-bold text-white font-mono">{k.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/8 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all" />
        </div>
        <div className="flex gap-2">
          {(['all', 'open', 'in_progress', 'escalated', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-3 py-2.5 rounded-xl text-xs font-medium border transition-all capitalize',
                filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-white/3 border-white/8 text-white/40 hover:text-white/70')}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(ticket => (
          <motion.div key={ticket.id} layout
            className={cn('flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border transition-all',
              ticket.priority === 'critical' ? 'border-red-500/20 bg-red-500/3' : 'border-white/5 bg-white/[0.02] hover:border-white/10')}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border', PRIORITY_STYLE[ticket.priority])}>
                <HeadphonesIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                <p className="text-xs text-white/40">
                  {ticket.userName} · <span className="capitalize">{ticket.category}</span>
                  {ticket.rating && <span className="ml-2 text-amber-400">★ {ticket.rating.toFixed(1)}</span>}
                </p>
              </div>
            </div>

            <p className="hidden lg:block text-[11px] text-white/25 flex-shrink-0">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </p>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full border capitalize', PRIORITY_STYLE[ticket.priority])}>
                {ticket.priority}
              </span>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full border capitalize', STATUS_STYLE[ticket.status])}>
                {ticket.status.replace('_', ' ')}
              </span>
              {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                <>
                  <button onClick={() => resolveTicket(ticket.id)}
                    className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  {ticket.status !== 'escalated' && (
                    <button onClick={() => escalateTicket(ticket.id)}
                      className="p-1.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 hover:bg-red-500/15 transition-all">
                      <ArrowUpCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
