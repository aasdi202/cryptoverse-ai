import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2, Lock, Mail, KeyRound, AlertCircle, ChevronRight } from 'lucide-react';
import { useAdminAuthStore } from '@/lib/adminAuthStore';
import { cn } from '@/lib/utils';
import { CryptoVerseLogo } from '@/components/CryptoVerseLogo';

export function AdminLogin() {
  const { login, verify2fa, twoFaPending } = useAdminAuthStore();
  const [email, setEmail]       = useState('superadmin@cryptoverse.ai');
  const [password, setPassword] = useState('SuperAdmin@2026!');
  const [code, setCode]         = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const res = login(email, password);
    setLoading(false);
    if (!res.success) setError(res.error || 'Login failed.');
  };

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const res = verify2fa(code);
    setLoading(false);
    if (!res.success) setError(res.error || '2FA failed.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <CryptoVerseLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CryptoVerse Admin</h1>
          <p className="text-sm text-white/40 mt-1">Secure administrative portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {!twoFaPending ? (
              /* ── Step 1: Credentials ── */
              <motion.form
                key="creds"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
                  <p className="text-xs text-white/40">Admin credentials required</p>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {loading ? 'Authenticating…' : 'Continue'}
                </button>

                {/* Demo hint */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/30">Demo credentials pre-filled · 2FA code: <span className="text-white/50 font-mono font-bold">123456</span></p>
                </div>
              </motion.form>
            ) : (
              /* ── Step 2: 2FA ── */
              <motion.form
                key="2fa"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handle2fa}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center gap-3 mb-2">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <KeyRound className="h-7 w-7 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Two-Factor Auth</h2>
                    <p className="text-xs text-white/40 mt-1">Enter the 6-digit code from your authenticator app</p>
                  </div>
                </div>

                {/* OTP input */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/15 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  {loading ? 'Verifying…' : 'Verify & Enter'}
                </button>

                <p className="text-center text-[11px] text-white/30">
                  Session timeout: 30 minutes · Concurrent sessions blocked
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          Unauthorized access is prohibited and logged · All activity is audited
        </p>
      </motion.div>
    </div>
  );
}
