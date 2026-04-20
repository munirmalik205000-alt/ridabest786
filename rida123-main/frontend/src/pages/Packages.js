import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Rocket, CheckCircle, Clock, CurrencyCircleDollar, Sparkle, TrendUp } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import PinDialog from '../components/PinDialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Packages = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [p, mp, w] = await Promise.all([
        axios.get(`${API_URL}/api/packages`, { withCredentials: true }),
        axios.get(`${API_URL}/api/packages/my`, { withCredentials: true }),
        axios.get(`${API_URL}/api/wallet/balance`, { withCredentials: true }),
      ]);
      setPackages(p.data.packages);
      setMyPackages(mp.data.packages);
      setWallet(w.data);
    } catch (e) {
      console.error(e);
    }
  };

  const openBuy = (pkg) => {
    if (!user?.has_pin) {
      toast.error('Pehle Profile se PIN setup karein');
      navigate('/profile');
      return;
    }
    setSelected(pkg);
    setConfirmOpen(true);
  };

  const proceedPin = () => {
    setConfirmOpen(false);
    setShowPin(true);
  };

  const handlePinConfirm = async (pin) => {
    if (!selected) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/packages/buy`,
        { package_id: selected._id, pin },
        { withCredentials: true }
      );
      toast.success(`${selected.name} package activated!`);
      setShowPin(false);
      setSelected(null);
      await loadAll();
      await refreshUser();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* subtle pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, #047857 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border-b border-emerald-700/20 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5 flex items-center gap-3">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0" data-testid="pkg-back-btn">
            <ArrowLeft size={22} />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="pkg-title">
              Investment Packages
            </h1>
            <p className="text-emerald-50 text-xs sm:text-sm">Activate a plan, earn daily, grow your wealth.</p>
          </div>
          {wallet && (
            <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2 border border-white/20 flex-shrink-0" data-testid="pkg-wallet-chip">
              <CurrencyCircleDollar size={18} weight="duotone" className="text-white" />
              <span className="text-xs sm:text-sm text-white/90">E-Wallet</span>
              <span className="font-bold text-white text-sm">₹{wallet.e_wallet.toFixed(2)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 sm:mb-6">
          <button
            onClick={() => setTab('all')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${tab === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
            data-testid="tab-all-packages"
          >All Plans</button>
          <button
            onClick={() => setTab('my')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${tab === 'my' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
            data-testid="tab-my-packages"
          >My Packages ({myPackages.length})</button>
        </div>

        {tab === 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" data-testid="packages-grid">
            {packages.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className={`relative overflow-hidden bg-gradient-to-br ${p.color || 'from-emerald-500 to-teal-500'} text-white border-0 rounded-3xl shadow-xl`} data-testid={`pkg-card-${p.code || p.name}`}>
                  {p.badge && (
                    <span className="absolute top-4 right-4 bg-white/25 backdrop-blur text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-white/30">
                      {p.badge}
                    </span>
                  )}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest opacity-80">
                      <Sparkle size={14} weight="fill" /> {p.code || p.name}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold mt-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {p.name}
                    </h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black">₹{p.price.toFixed(0)}</span>
                      <span className="text-xs sm:text-sm opacity-80">one-time</span>
                    </div>

                    <div className="mt-5 space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center gap-2"><CheckCircle size={16} weight="fill" /> ₹{p.daily_income.toFixed(0)} daily income</div>
                      <div className="flex items-center gap-2"><CheckCircle size={16} weight="fill" /> {p.duration_days} days duration</div>
                      <div className="flex items-center gap-2"><CheckCircle size={16} weight="fill" /> Total return ₹{p.total_return.toFixed(0)}</div>
                      <div className="flex items-center gap-2"><CheckCircle size={16} weight="fill" /> MLM commission eligible</div>
                    </div>

                    <Button
                      onClick={() => openBuy(p)}
                      className="mt-5 w-full bg-white text-slate-900 hover:bg-slate-100 h-12 rounded-2xl font-bold shadow-md"
                      data-testid={`pkg-buy-btn-${p.code || p.name}`}
                    >
                      <Rocket size={18} weight="fill" className="mr-2" /> Activate Now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'my' && (
          <div className="space-y-3 sm:space-y-4" data-testid="my-packages-list">
            {myPackages.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center text-slate-500">
                No active package yet. Activate one to start earning daily!
              </div>
            )}
            {myPackages.map((mp) => {
              const progress = Math.min(100, (mp.days_credited / mp.duration_days) * 100);
              return (
                <Card key={mp._id} className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm" data-testid={`my-pkg-${mp._id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">{mp.status}</div>
                      <h4 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{mp.package_name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Earned</div>
                      <div className="text-xl sm:text-2xl font-bold text-emerald-600">₹{mp.earned.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm mb-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2"><div className="text-slate-500 text-[10px] uppercase tracking-wider">Price</div><div className="font-bold">₹{mp.price.toFixed(0)}</div></div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2"><div className="text-slate-500 text-[10px] uppercase tracking-wider">Daily</div><div className="font-bold">₹{mp.daily_income.toFixed(0)}</div></div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2"><div className="text-slate-500 text-[10px] uppercase tracking-wider">Days</div><div className="font-bold">{mp.days_credited}/{mp.duration_days}</div></div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${progress}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white border-slate-200 max-h-[90vh] overflow-y-auto" data-testid="pkg-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Activate {selected?.name}</DialogTitle>
            <DialogDescription>Review plan details before purchase.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-3">
              <Row label="Price" value={`₹${selected.price.toFixed(0)}`} />
              <Row label="Daily Income" value={`₹${selected.daily_income.toFixed(0)}`} />
              <Row label="Duration" value={`${selected.duration_days} days`} />
              <Row label="Total Return" value={`₹${selected.total_return.toFixed(0)}`} highlight />
              {wallet && <Row label="E-Wallet Balance" value={`₹${wallet.e_wallet.toFixed(2)}`} />}
              <Button onClick={proceedPin} className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 rounded-2xl font-bold text-white" data-testid="pkg-confirm-proceed">
                Proceed with PIN
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PinDialog
        open={showPin}
        onClose={() => setShowPin(false)}
        onConfirm={handlePinConfirm}
        title={`Activate ${selected?.name}`}
        description={`Enter PIN to debit ₹${selected?.price.toFixed(0)} from E-Wallet`}
        isLoading={loading}
      />
    </div>
  );
};

const Row = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
    <span className="text-slate-600 text-sm">{label}</span>
    <span className={`font-bold text-sm sm:text-base ${highlight ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</span>
  </div>
);

export default Packages;
