import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import {
  List, Wallet, CurrencyCircleDollar, TrendUp, DeviceMobileCamera,
  ClockCounterClockwise, UsersThree, Plus, SignOut, User, UserPlus, UserCheck,
  UserCircle, ShoppingBag, Coins, Package, ArrowSquareOut, Bank, PaperPlaneTilt,
  Lightning, Copy, ShieldCheck, Eye, EyeSlash, ArrowUpRight, Sparkle
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardV2 = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [bannerData, setBannerData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState({});
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchBannerData();
    fetchPackages();
  }, []);

  useEffect(() => {
    if (bannerData?.images && bannerData.images.length > 1) {
      const t = setInterval(() => setCurrentSlide((p) => (p + 1) % bannerData.images.length), 4000);
      return () => clearInterval(t);
    }
  }, [bannerData]);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/dashboard/stats`);
      setDashboardData(data);
    } catch (e) { console.error(e); }
  };

  const fetchBannerData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/banner`);
      setBannerData(data);
    } catch (e) {
      setBannerData({ text: "Earn Smart · Grow Fast · Achieve More", color: "from-violet-500 via-fuchsia-500 to-rose-500", images: [] });
    }
  };

  const fetchPackages = async () => {
    try {
      const [p, mp] = await Promise.all([
        axios.get(`${API_URL}/api/packages`),
        axios.get(`${API_URL}/api/packages/my`),
      ]);
      setPackages(p.data.packages.slice(0, 4));
      setMyPackages(mp.data.packages);
    } catch (e) { /* soft fail */ }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referral_code || '');
    toast.success('Referral code copied!');
  };

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile', testId: 'menu-profile' },
    { icon: Package, label: 'Investment Packages', path: '/packages', testId: 'menu-packages' },
    { icon: DeviceMobileCamera, label: 'Recharge', path: '/recharge', testId: 'menu-recharge' },
    { icon: ShoppingBag, label: 'Shopping', path: '/shopping', testId: 'menu-shopping' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', testId: 'menu-wallet' },
    { icon: Bank, label: 'Withdrawals', path: '/withdrawals', testId: 'menu-withdrawals' },
    { icon: ClockCounterClockwise, label: 'Transaction History', path: '/transactions', testId: 'menu-transactions' },
    { icon: UsersThree, label: 'Referral / Network', path: '/referrals', testId: 'menu-referrals' },
    { icon: Plus, label: 'Add Fund', path: '/add-fund', testId: 'menu-add-fund' },
  ];

  const quickActions = [
    { icon: DeviceMobileCamera, label: 'Recharge', color: 'from-emerald-500 to-teal-500', path: '/recharge', testId: 'qa-recharge' },
    { icon: PaperPlaneTilt, label: 'Send Money', color: 'from-blue-500 to-indigo-500', path: '/wallet', testId: 'qa-send' },
    { icon: Bank, label: 'Withdraw', color: 'from-orange-500 to-rose-500', path: '/wallet', testId: 'qa-withdraw' },
    { icon: Plus, label: 'Add Fund', color: 'from-violet-500 to-fuchsia-500', path: '/add-fund', testId: 'qa-addfund' },
    { icon: Package, label: 'Packages', color: 'from-cyan-500 to-sky-500', path: '/packages', testId: 'qa-packages' },
    { icon: UsersThree, label: 'Refer', color: 'from-amber-500 to-orange-500', path: '/referrals', testId: 'qa-refer' },
    { icon: ShoppingBag, label: 'Shop', color: 'from-pink-500 to-rose-500', path: '/shopping', testId: 'qa-shop' },
    { icon: ClockCounterClockwise, label: 'History', color: 'from-slate-500 to-slate-700', path: '/transactions', testId: 'qa-history' },
  ];

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-600 border-r-2"></div>
      </div>
    );
  }

  const totalBalance = dashboardData.main_wallet + dashboardData.e_wallet;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="text-slate-700 hover:bg-slate-100 rounded-full w-10 h-10 p-0" data-testid="hamburger-menu-btn">
                  <List size={22} weight="bold" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm bg-white text-slate-900" data-testid="sidebar-menu">
                <SheetHeader className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                      {user?.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-lg font-bold text-left text-slate-900 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {user?.name}
                      </SheetTitle>
                      <p className="text-xs text-slate-500">{user?.mobile}</p>
                    </div>
                  </div>
                </SheetHeader>
                <div className="mt-4 space-y-0.5">
                  {menuItems.map((item, idx) => (
                    <motion.div key={item.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                      <Button
                        onClick={() => { navigate(item.path); setMenuOpen(false); }}
                        variant="ghost"
                        className="w-full justify-start text-base hover:bg-emerald-50 rounded-xl h-12 text-slate-800"
                        data-testid={item.testId}
                      >
                        <item.icon size={22} className="mr-3 text-emerald-600" weight="duotone" />
                        <span className="font-medium">{item.label}</span>
                      </Button>
                    </motion.div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <Button onClick={logout} variant="ghost" className="w-full justify-start text-base text-rose-600 hover:bg-rose-50 rounded-xl h-12" data-testid="menu-logout">
                      <SignOut size={22} className="mr-3" weight="duotone" />
                      <span className="font-medium">Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Lightning size={18} weight="fill" className="text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                SmartPay<span className="text-emerald-600">360</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user?.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                className="bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 text-xs h-9 rounded-full px-3"
                data-testid="admin-panel-btn"
              >
                <ShieldCheck size={16} weight="fill" className="mr-1 text-emerald-600" /> <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <div className="text-slate-700">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-5 pb-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <p className="text-slate-500 text-xs sm:text-sm">Welcome back,</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="welcome-text">
            {user?.name} 👋
          </h1>
        </motion.div>

        {/* Hero Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 sm:p-7 shadow-2xl shadow-emerald-500/20" data-testid="hero-balance-card">
            {/* decorative */}
            <div className="absolute -top-16 -right-16 w-48 h-48 sm:w-60 sm:h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 sm:w-60 sm:h-60 bg-cyan-400/20 rounded-full blur-3xl" />

            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white bg-white/15 backdrop-blur border border-white/20 px-2.5 sm:px-3 py-1 rounded-full">
                <Sparkle size={12} weight="fill" /> Total Balance
              </span>
              <button onClick={() => setShowBalance(!showBalance)} className="text-white/90 hover:text-white" data-testid="toggle-balance-vis">
                {showBalance ? <Eye size={20} weight="duotone" /> : <EyeSlash size={20} weight="duotone" />}
              </button>
            </div>

            <div className="relative mt-2">
              <span className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight block" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="hero-total-balance">
                {showBalance ? `₹${totalBalance.toFixed(2)}` : '₹ • • • • •'}
              </span>
            </div>

            <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-5">
              <BalanceChip label="Main" value={dashboardData.main_wallet} show={showBalance} testId="chip-main" />
              <BalanceChip label="E-Wallet" value={dashboardData.e_wallet} show={showBalance} testId="chip-ewallet" />
              <BalanceChip label="Coins" value={dashboardData.coins} prefix="" show={showBalance} testId="chip-coins" raw />
            </div>

            <div className="relative flex flex-wrap items-center gap-2 mt-5">
              <Button onClick={() => navigate('/add-fund')} className="rounded-full bg-white text-emerald-700 hover:bg-slate-50 font-bold h-10 px-4 sm:px-5 text-sm shadow-md" data-testid="hero-add-fund">
                <Plus size={16} weight="bold" className="mr-1" /> Add Money
              </Button>
              <Button onClick={() => navigate('/wallet')} className="rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold h-10 px-4 sm:px-5 text-sm" data-testid="hero-withdraw">
                <Bank size={16} weight="bold" className="mr-1" /> Withdraw
              </Button>
              <Button onClick={() => navigate('/packages')} className="rounded-full bg-amber-400 text-emerald-900 hover:bg-amber-300 font-bold h-10 px-4 sm:px-5 text-sm shadow-md" data-testid="hero-packages">
                <Package size={16} weight="fill" className="mr-1" /> Invest
              </Button>
            </div>

            <div className="relative mt-5 flex items-center justify-between gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                  <UsersThree size={18} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-white/80">Your Referral Code</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-white truncate" data-testid="referral-code-display">{user?.referral_code}</div>
                </div>
              </div>
              <Button onClick={copyReferral} variant="ghost" className="text-white hover:bg-white/20 rounded-xl flex-shrink-0" data-testid="copy-referral-btn">
                <Copy size={16} weight="bold" className="mr-1" /> <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <section className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Actions</h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {quickActions.map((qa, i) => (
              <motion.button
                key={qa.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.02 * i }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(qa.path)}
                className="group flex flex-col items-center gap-1.5 sm:gap-2 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition"
                data-testid={qa.testId}
              >
                <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${qa.color} flex items-center justify-center shadow-md`}>
                  <qa.icon size={20} weight="fill" className="text-white" />
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 text-center leading-tight">{qa.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Banner */}
        {bannerData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl overflow-hidden shadow-md">
            <div className={`bg-gradient-to-r ${bannerData?.color || 'from-violet-500 via-fuchsia-500 to-rose-500'} text-white px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3`}>
              <Sparkle size={20} weight="fill" className="animate-pulse flex-shrink-0" />
              <p className="text-sm sm:text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="text-banner">
                {bannerData?.text || "Earn Smart · Grow Fast · Achieve More"}
              </p>
            </div>
            {bannerData?.images && bannerData.images.length > 0 && (() => {
              const valid = bannerData.images.filter((_, i) => !imageLoadFailed[i]);
              if (valid.length === 0) return null;
              return (
                <div className="relative h-32 sm:h-40 md:h-48 bg-slate-100" data-testid="image-banner">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentSlide}
                      src={bannerData.images[currentSlide]}
                      alt="banner"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full object-cover"
                      onError={() => setImageLoadFailed((p) => ({ ...p, [currentSlide]: true }))}
                    />
                  </AnimatePresence>
                  {bannerData.images.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {bannerData.images.map((_, i) => !imageLoadFailed[i] && (
                        <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/60 w-1.5'}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Investment Packages Teaser */}
        <section className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Investment Packages</h3>
              <p className="text-xs text-slate-500">Activate once. Earn daily. Withdraw anytime.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/packages')} className="text-emerald-600 hover:bg-emerald-50 rounded-full text-xs sm:text-sm flex-shrink-0" data-testid="see-all-packages">
              See all <ArrowSquareOut size={14} weight="bold" className="ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {packages.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} whileHover={{ y: -4 }}>
                <Card className={`relative overflow-hidden bg-gradient-to-br ${p.color || 'from-emerald-500 to-teal-500'} border-0 text-white rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer h-full`} onClick={() => navigate('/packages')} data-testid={`home-pkg-${p.code || p.name}`}>
                  {p.badge && <span className="absolute top-2.5 right-2.5 bg-white/25 backdrop-blur text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border border-white/30">{p.badge}</span>}
                  <div className="text-[10px] uppercase tracking-widest opacity-80">{p.code || p.name}</div>
                  <div className="text-lg sm:text-2xl font-extrabold mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{p.name}</div>
                  <div className="mt-2 text-2xl sm:text-3xl font-black">₹{p.price.toFixed(0)}</div>
                  <div className="mt-1 text-xs sm:text-sm opacity-90">₹{p.daily_income.toFixed(0)}/day · {p.duration_days}d</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs sm:text-sm font-bold">
                    Activate <ArrowUpRight size={14} weight="bold" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Stats</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <StatCard delay={0.00} title="Today Income" value={`₹${dashboardData.today_income.toFixed(2)}`} icon={TrendUp} tone="emerald" testId="today-income-card" />
            <StatCard delay={0.05} title="Total Income" value={`₹${dashboardData.total_income.toFixed(2)}`} icon={TrendUp} tone="violet" testId="total-income-card" />
            <StatCard delay={0.10} title="Active Packages" value={myPackages.filter((m) => m.status === 'active').length} icon={Package} tone="cyan" testId="active-packages-card" />
            <StatCard delay={0.15} title="Today Repurchase" value={`₹${dashboardData.today_repurchase_income.toFixed(2)}`} icon={DeviceMobileCamera} tone="orange" testId="today-repurchase-card" />
            <StatCard delay={0.20} title="Total Repurchase" value={`₹${dashboardData.total_repurchase_income.toFixed(2)}`} icon={TrendUp} tone="rose" testId="total-repurchase-card" />
            <StatCard delay={0.25} title="Today Joining" value={dashboardData.today_joining} icon={UserPlus} tone="sky" testId="today-joining-card" />
            <StatCard delay={0.30} title="Active Users" value={dashboardData.total_active_users} icon={UserCheck} tone="emerald" testId="active-users-card" />
            <StatCard delay={0.35} title="Free Users" value={dashboardData.total_free_users} icon={UserCircle} tone="amber" testId="free-users-card" />
          </div>
        </section>
      </main>
    </div>
  );
};

const toneMap = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
  sky: { bg: 'bg-sky-50', icon: 'text-sky-600', border: 'border-sky-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
};

const StatCard = ({ title, value, icon: Icon, tone = 'emerald', delay = 0, testId }) => {
  const c = toneMap[tone] || toneMap.emerald;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 hover:border-slate-300 hover:shadow-md transition" data-testid={testId}>
        <div className="flex items-center justify-between mb-2">
          <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon size={18} weight="duotone" className={c.icon} />
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{title}</div>
        <div className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      </div>
    </motion.div>
  );
};

const BalanceChip = ({ label, value, show, prefix = '₹', raw = false, testId }) => (
  <div className="bg-white/15 backdrop-blur border border-white/20 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5" data-testid={testId}>
    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/80 truncate">{label}</div>
    <div className="text-sm sm:text-base lg:text-lg font-bold text-white mt-0.5 truncate">
      {show ? (raw ? value : `${prefix}${value.toFixed(2)}`) : '• • •'}
    </div>
  </div>
);

export default DashboardV2;
