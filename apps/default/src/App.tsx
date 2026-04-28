import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Activity, BookOpen, Trophy, Swords, UserCircle,
  Menu, LogOut, Bell, Sun, Moon, BarChart2, BarChart3, Globe, FlaskConical, Bot, ShoppingBag, RefreshCw, Link2, CalendarDays, Plug,
} from 'lucide-react';
import { Dashboard }             from './components/Dashboard';
import { AgentChat }             from './components/AgentChat';
import { CryptoVerseLogo }       from './components/CryptoVerseLogo';
import { Academy }               from './components/Academy';
import { Leaderboard }           from './components/Leaderboard';
import { TwinLeague }            from './components/TwinLeague';
import { Portfolio }             from './components/Portfolio';
import { Profile }               from './components/Profile';
import { NotificationPanel }     from './components/NotificationPanel';
import { AuthPage }              from './components/AuthPage';
import { LanguageSelector }      from './components/LanguageSelector';
import { WelcomeGuide }          from './components/WelcomeGuide';
import { Nations }               from './components/Nations';
import { BacktestPage }          from './components/backtest/BacktestPage';
import { BacktestHistoryPage }  from './components/backtest/BacktestHistoryPage';
import { BacktestProgressSidebar, BacktestNavBadge } from './components/backtest/BacktestProgressSidebar';
import { BotsPage }              from './components/bots/BotsPage';
import { BotDetailsPage }        from './components/bots/BotDetailsPage';
import { MarketplacePage }       from './components/marketplace/MarketplacePage';
import { StrategyDetailPage }    from './components/marketplace/StrategyDetailPage';
import { MyStrategiesPage }      from './components/marketplace/MyStrategiesPage';
import { CreateStrategyPage }    from './components/marketplace/CreateStrategyPage';
import { StrategyAnalyticsPage } from './components/marketplace/StrategyAnalyticsPage';
import { Toaster } from 'sonner';
import { MarketplaceReportPage } from './components/marketplace/MarketplaceReportPage';
import { CopyTradingPage }       from './components/copyTrading/CopyTradingPage';
import { MyFollowingPage }       from './components/copyTrading/MyFollowingPage';
import { MyFollowersPage }       from './components/copyTrading/MyFollowersPage';
import { CopyHistoryPage }       from './components/copyTrading/CopyHistoryPage';
import { TraderDetailsPage }     from './components/copyTrading/TraderDetailsPage';
import { OnChainPage }           from './components/onChain/OnChainPage';
import { SmartMoneyPage }       from './components/onChain/SmartMoneyPage';
import { ExchangeFlowPage }     from './components/onChain/ExchangeFlowPage';
import { AlertsPage }           from './components/onChain/AlertsPage';
import { WalletTrackerPage }         from './components/onChain/WalletTrackerPage';
import { TransactionDetailsPage }    from './components/onChain/TransactionDetailsPage';
import { NFTPage }                   from './components/nft/NFTPage';
import { cn }                    from './lib/utils';
import { useAppStore }           from './lib/appStore';
import { useAuthStore }          from './lib/authStore';
import { useI18nStore }          from './lib/i18nStore';
import { useSubscriptionMonitor } from './lib/useSubscriptionMonitor';
import { useBotStore }           from './lib/botStore';
import { useBotMonitor }         from './lib/botMonitor';
import { BotBacktestProvider }   from './lib/botBacktestContext';

// ── Admin Portal ──────────────────────────────────────────────────────────────
import { AdminLogin }         from './components/admin/portal/AdminLogin';
import { AdminPortalLayout }  from './components/admin/portal/AdminPortalLayout';
import { AdminDashboard }     from './components/admin/portal/pages/AdminDashboard';
import { AdminUsers }         from './components/admin/portal/pages/AdminUsers';
import { AdminTransactions }  from './components/admin/portal/pages/AdminTransactions';
import { AdminContent }       from './components/admin/portal/pages/AdminContent';
import { AdminCompetitions }  from './components/admin/portal/pages/AdminCompetitions';
import { AdminEvents }        from './components/admin/portal/pages/AdminEvents';
import { AdminReports }       from './components/admin/portal/pages/AdminReports';
import { AdminTickets }       from './components/admin/portal/pages/AdminTickets';
import { AdminAdmins }        from './components/admin/portal/pages/AdminAdmins';
import { AdminRequests }      from './components/admin/portal/pages/AdminRequests';
import { AdminLogs }          from './components/admin/portal/pages/AdminLogs';
import { AdminCopyTrading }   from './components/admin/portal/pages/AdminCopyTrading';
import { AdminOnChain }       from './components/admin/portal/pages/AdminOnChain';
import { SentimentPage }      from './components/sentiment/SentimentPage';
import { AdminNFTManagement } from './components/admin/portal/pages/AdminNFTManagement';
import { AdminSentiment }            from './components/admin/portal/pages/AdminSentiment';
import { AdminExchangeManagement }  from './components/admin/portal/pages/AdminExchangeManagement';
import { SentimentWidget }   from './components/sentiment/SentimentWidget';
import { EventsPage }        from './components/events/EventsPage';
import { ExchangePage }     from './components/exchange/ExchangePage';
import {
  SentimentNotificationProvider,
  SentimentDigestBanner,
} from './components/sentiment/SentimentNotifications';
import { useAdminAuthStore }  from './lib/adminAuthStore';

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
const SidebarItem = ({
  icon: Icon, label, path, badge,
}: {
  icon:   React.ElementType;
  label:  string;
  path:   string;
  badge?: number;
}) => {
  const location = useLocation();
  // For the root "/" route, only match exactly (not every path)
  const isActive = path === '/'
    ? location.pathname === '/'
    : location.pathname === path || location.pathname.startsWith(path + '/');
  return (
    <Link
      to={path}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
        isActive
          ? 'bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: '#00C853', color: '#0A1929' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};

// ─── NFT nav group ────────────────────────────────────────────────────────────
const NFT_SUBNAV = [
  { path: '/nft',             label: 'Dashboard',     emoji: '📊' },
  { path: '/nft/live-sales',  label: 'Live Sales',    emoji: '⚡' },
  { path: '/nft/metaverse',   label: 'Metaverse',     emoji: '🌐' },
  { path: '/nft/watchlist',   label: 'Watchlist',     emoji: '👁️' },
  { path: '/nft/whales',      label: 'Whales',        emoji: '🐋' },
  { path: '/nft/simulate',    label: 'Trading Sim',   emoji: '🎮' },
  { path: '/nft/wallets',     label: 'Wallet Tracker',emoji: '👜' },
  { path: '/nft/alerts',      label: 'Alerts',        emoji: '🔔' },
  { path: '/nft/report',      label: 'Final Report',  emoji: '📋' },
];

const NFTNavGroup = () => {
  const location  = useLocation();
  const isSection = location.pathname.startsWith('/nft');
  const [open, setOpen] = React.useState(isSection);

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left',
          isSection
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
        )}>
        <span className="h-5 w-5 shrink-0 text-lg flex items-center justify-center">🖼️</span>
        <span className="flex-1">NFT & Metaverse</span>
        <svg className={cn('h-4 w-4 transition-transform shrink-0', open ? 'rotate-180' : '')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="ml-8 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
          {NFT_SUBNAV.map(item => {
            const active = item.path === '/nft' ? location.pathname === '/nft' : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  active
                    ? 'text-primary bg-primary/10 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/4',
                )}>
                <span className="text-xs">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── On-Chain expandable nav group ────────────────────────────────────────────
const ON_CHAIN_SUBNAV = [
  { path: '/on-chain',                label: 'Dashboard',     emoji: '📊' },
  { path: '/on-chain/smart-money',    label: 'Smart Money',   emoji: '🧠' },
  { path: '/on-chain/exchange-flow',  label: 'Exchange Flow', emoji: '🏦' },
  { path: '/on-chain/alerts',         label: 'Alerts',        emoji: '🔔' },
];

const OnChainNavGroup = () => {
  const location  = useLocation();
  const isSection = location.pathname.startsWith('/on-chain');
  const [open, setOpen] = React.useState(isSection);

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left',
          isSection
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
        )}>
        <Link2 className="h-5 w-5 shrink-0" />
        <span className="flex-1">⛓ On-Chain</span>
        <svg className={cn('h-4 w-4 transition-transform shrink-0', open ? 'rotate-180' : '')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="ml-8 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
          {ON_CHAIN_SUBNAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  active
                    ? 'text-primary bg-primary/10 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/4',
                )}>
                <span className="text-xs">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const location                            = useLocation();

  const { theme, toggleTheme, notifications } = useAppStore();
  const { user, logout }                      = useAuthStore();

  // 5.1: Bot monitor — drives WebSocket-style real-time updates + notifications
  useBotMonitor();

  // 5.1: Active bots count for sidebar badge
  const activeBotCount = useBotStore(s =>
    user ? Object.values(s.bots).filter(b => b.userId === user.id && b.status === 'active').length : 0
  );
  const { t, isTranslating, translationProgress } = useI18nStore();

  // Monitor subscription expiry and fire renewal warnings
  useSubscriptionMonitor();
  const unreadCount = notifications.filter(n => !n.read).length;

  // Apply dark class whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const avatarSrc = user?.avatarUrl
    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatarSeed ?? 'Felix'}`;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <CryptoVerseLogo size={40} />
          <span className="text-xl font-bold tracking-tight">
            CryptoVerse{' '}
            <span className="text-[#FFD700] text-xs ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/15">AI</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          <SidebarItem icon={Activity}      label={t('nav.trade')}       path="/" />
          <SidebarItem icon={BarChart2}    label={t('nav.portfolio')}   path="/portfolio" />
          <div className="flex items-center">
            <div className="flex-1">
              <SidebarItem icon={FlaskConical} label="🔬 Backtest" path="/backtest" />
            </div>
            <BacktestNavBadge />
          </div>
          <SidebarItem icon={Bot}          label="🤖 Bots"              path="/bots" badge={activeBotCount} />
          <SidebarItem icon={ShoppingBag} label="🏪 Marketplace"       path="/marketplace" />
          <SidebarItem icon={RefreshCw}   label="🔄 Copy Trading"      path="/copy-trading" />
          <OnChainNavGroup />
          <NFTNavGroup />
          <SidebarItem icon={BarChart3}     label="🧠 Sentiment"          path="/sentiment" />
          <SidebarItem icon={CalendarDays} label="🏆 Events"              path="/events" />
          <SidebarItem icon={Plug}        label="🔗 Real Exchange"       path="/exchange" />
          <SidebarItem icon={BookOpen}    label={t('nav.academy')}      path="/academy" />
          <SidebarItem icon={Trophy}       label={t('nav.leaderboard')} path="/leaderboard" />
          <SidebarItem icon={Globe}        label={t('nations.title')}   path="/nations" />
          <SidebarItem icon={Swords}       label={t('nav.twinLeague')}  path="/twin-league" />
        </nav>

        {/* Part 11.2 — Background job progress */}
        <BacktestProgressSidebar />

        {/* §6.3 Sentiment widget — compact sidebar summary */}
        <div className="px-3 pb-2 hidden lg:block">
          <SentimentWidget compact showTradeCTA showAICTA />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <Link
            to="/profile"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <UserCircle className="h-5 w-5" />
            <span>{t('nav.profile')}</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-background/50 backdrop-blur-md z-30">
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-lg"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 flex justify-end items-center gap-3">
            {/* Live market indicator */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Live Market Data</span>
            </div>

            {/* Language selector */}
            <LanguageSelector compact />

            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground border border-white/5 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="h-5 w-5" />
                : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="p-2.5 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground border border-white/5 relative transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

            {/* Avatar → Profile */}
            <Link to="/profile">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 border-2 border-card overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Translation progress bar */}
          {isTranslating && (
            <div className="h-0.5 bg-secondary/30 relative overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${translationProgress}%` }}
              />
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-white/5 backdrop-blur-md flex items-stretch h-16">
        {[
          { icon: Activity,     label: 'Trade',    path: '/' },
          { icon: Bot,          label: '🤖 Bots',  path: '/bots' },
          { icon: RefreshCw,    label: '🔄 Copy',  path: '/copy-trading' },
          { icon: Link2,        label: '⛓ Chain',  path: '/on-chain' },
          { icon: ShoppingBag,  label: '🖼️ NFT',   path: '/nft' },
          { icon: Trophy,       label: 'Ranks',    path: '/leaderboard' },
        ].map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      <AgentChat />

      {/* §6.4 Sentiment notification system */}
      <SentimentNotificationProvider />
      <SentimentDigestBanner />
    </div>
  );
};

// ─── Admin Portal (standalone, outside main Layout) ───────────────────────────
function AdminPortal() {
  const { isAdminAuth } = useAdminAuthStore();
  if (!isAdminAuth) return <AdminLogin />;
  return (
    <Routes>
      <Route element={<AdminPortalLayout />}>
        <Route path="dashboard"    element={<AdminDashboard />} />
        <Route path="users"        element={<AdminUsers />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="content"      element={<AdminContent />} />
        <Route path="competitions" element={<AdminCompetitions />} />
        <Route path="events"       element={<AdminEvents />} />
        <Route path="reports"      element={<AdminReports />} />
        <Route path="tickets"      element={<AdminTickets />} />
        <Route path="admins"       element={<AdminAdmins />} />
        <Route path="requests"     element={<AdminRequests />} />
        <Route path="logs"          element={<AdminLogs />} />
        <Route path="copy-trading" element={<AdminCopyTrading />} />
        <Route path="on-chain"    element={<AdminOnChain />} />
        <Route path="nft"         element={<AdminNFTManagement />} />
        <Route path="sentiment"   element={<AdminSentiment />} />
        <Route path="exchange"    element={<AdminExchangeManagement />} />
        <Route index               element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BotBacktestProvider>
    <Router>
      <Toaster position="bottom-right" richColors theme="dark" />
      {/* Admin portal lives at /admin/* — completely separate from main app */}
      <Routes>
        <Route path="/admin/*" element={<AdminPortal />} />
      </Routes>

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          >
            <AuthPage />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ height: '100%' }}
          >
            {/* First-login cinematic guide — renders over the full app */}
            <WelcomeGuide />
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/portfolio"   element={<div className="flex-1 p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"><div className="max-w-7xl mx-auto"><Portfolio /></div></div>} />
                <Route path="/bots"        element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><BotsPage /></div>} />
                <Route path="/bots/:id"    element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0 relative"><BotDetailsPage /></div>} />
                {/* ── Strategy Marketplace ── */}
                <Route path="/marketplace"                      element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><MarketplacePage /></div>} />
                <Route path="/marketplace/my-strategies"        element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><MyStrategiesPage /></div>} />
                <Route path="/marketplace/create"               element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><CreateStrategyPage /></div>} />
                <Route path="/marketplace/edit/:id"             element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><CreateStrategyPage /></div>} />
                <Route path="/marketplace/analytics/:id"        element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><StrategyAnalyticsPage /></div>} />
                <Route path="/marketplace/report"               element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><MarketplaceReportPage /></div>} />
                {/* ── Copy Trading ── */}
                <Route path="/copy-trading"             element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><CopyTradingPage /></div>} />
                <Route path="/copy-trading/following"   element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><MyFollowingPage /></div>} />
                <Route path="/copy-trading/followers"   element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><MyFollowersPage /></div>} />
                <Route path="/copy-trading/history"     element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><CopyHistoryPage /></div>} />
                <Route path="/copy-trading/trader/:id" element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><TraderDetailsPage /></div>} />
                {/* ── On-Chain Analysis ── */}
                <Route path="/on-chain"                    element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><OnChainPage /></div>} />
                <Route path="/on-chain/smart-money"        element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SmartMoneyPage /></div>} />
                <Route path="/on-chain/exchange-flow"      element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><ExchangeFlowPage /></div>} />
                <Route path="/on-chain/alerts"             element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><AlertsPage /></div>} />
                <Route path="/on-chain/wallet/:address"      element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><WalletTrackerPage /></div>} />
                <Route path="/on-chain/transaction/:hash"    element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><TransactionDetailsPage /></div>} />
                {/* ── NFT & Metaverse Analytics ── */}
                <Route path="/nft/*"                         element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><NFTPage /></div>} />
                {/* ── Sentiment Analysis ── */}
                <Route path="/sentiment"            element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/fear-greed" element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/social"     element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/news"       element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/alerts"     element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/signals"    element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/checklist" element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                <Route path="/sentiment/report"    element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><SentimentPage /></div>} />
                {/* ── Live Events & Group Challenges ── */}
                {/* ── Live Events & Group Challenges (nested router) ── */}
                <Route path="/events/*"           element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><EventsPage /></div>} />
                {/* ── Real Exchange Connection ── */}
                <Route path="/exchange"           element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><ExchangePage /></div>} />
                <Route path="/marketplace/:id"                  element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><StrategyDetailPage /></div>} />
                <Route path="/backtest"         element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><BacktestPage /></div>} />
                <Route path="/backtest/history" element={<div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0"><BacktestHistoryPage /></div>} />
                <Route path="/academy"     element={<div className="flex-1 p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"><div className="max-w-7xl mx-auto"><Academy /></div></div>} />
                <Route path="/leaderboard" element={<div className="flex-1 p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"><div className="max-w-7xl mx-auto"><Leaderboard /></div></div>} />
                <Route path="/nations"     element={<div className="flex-1 p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"><div className="max-w-7xl mx-auto"><Nations /></div></div>} />
                <Route path="/twin-league" element={<div className="flex-1 p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"><div className="max-w-7xl mx-auto"><TwinLeague /></div></div>} />
                <Route path="/profile"     element={<div className="flex-1 p-6 pb-24 lg:pb-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"><div className="max-w-7xl mx-auto"><Profile /></div></div>} />
              </Routes>
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
    </BotBacktestProvider>
  );
}
