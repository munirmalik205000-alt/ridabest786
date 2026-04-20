import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ArrowLeft, CaretRight, MagnifyingGlass, Phone, Lightning, Coins,
  CurrencyCircleDollar, CheckCircle, Wallet, Sparkle, Gift, PencilSimple
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { key: 'unlimited', label: 'Truly Unlimited' },
  { key: 'data', label: 'Data' },
  { key: 'vouchers', label: 'Plan Vouchers' },
];

const Recharge = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Steps: 1=mobile+operator+circle, 2=plan listing, 3=payment sheet
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [operator, setOperator] = useState(null);
  const [circle, setCircle] = useState('');
  const [operators, setOperators] = useState([]);
  const [circles, setCircles] = useState([]);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('unlimited');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [preview, setPreview] = useState(null);
  const [paymentMode, setPaymentMode] = useState('e_wallet');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, c, w] = await Promise.all([
          axios.get(`${API_URL}/api/recharge/operators`),
          axios.get(`${API_URL}/api/recharge/circles`),
          axios.get(`${API_URL}/api/wallet/balance`),
        ]);
        setOperators(o.data.operators);
        setCircles(c.data.circles);
        setWalletData(w.data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const fetchPlans = useCallback(async () => {
    if (!operator) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/recharge/plans`, {
        params: { operator: operator.code, circle: circle || undefined },
      });
      setPlans(data.plans);
    } catch (e) { console.error(e); }
  }, [operator, circle]);

  useEffect(() => { if (step === 2) fetchPlans(); }, [step, fetchPlans]);

  const filteredPlans = useMemo(() => {
    const byCat = plans.filter((p) => p.category === category);
    if (!search) return byCat;
    const s = search.toLowerCase();
    return byCat.filter((p) =>
      String(p.price).includes(s) ||
      (p.validity || '').toLowerCase().includes(s) ||
      (p.data || '').toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s)
    );
  }, [plans, category, search]);

  const handleContinueFromStep1 = () => {
    if (mobile.length !== 10) return toast.error('Enter 10-digit mobile');
    if (!operator) return toast.error('Select operator');
    if (!circle) return toast.error('Select circle');
    setStep(2);
  };

  const openPaymentSheet = async (plan) => {
    setSelectedPlan(plan);
    setCoinsToUse(0);
    setPaymentMode('e_wallet');
    await fetchPreview(plan, 0);
    setConfirmOpen(true);
  };

  const fetchPreview = async (plan, coins) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/recharge/preview`, {
        operator: operator.code,
        amount: plan.price,
        coins_used: coins,
      });
      setPreview(data);
    } catch (e) { /* soft fail */ }
  };

  const handleCoinsChange = async (val) => {
    const v = Math.max(0, Math.min(val || 0, (preview?.max_coins || 50), walletData?.coins || 0));
    setCoinsToUse(v);
    if (selectedPlan) await fetchPreview(selectedPlan, v);
  };

  const payNow = async () => {
    if (!selectedPlan || !preview) return;
    setPaying(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/recharge`, {
        recharge_type: 'mobile',
        number: mobile,
        operator: operator.code,
        circle,
        plan_id: selectedPlan._id,
        amount: selectedPlan.price,
        coins_used: coinsToUse,
        payment_mode: paymentMode,
      });
      toast.success(`Recharge ${data.status}! Paid ₹${data.final_amount}${data.coins_earned ? ` · +${data.coins_earned} coins` : ''}`);
      setConfirmOpen(false);
      await refreshUser();
      // Refresh wallet
      const { data: w } = await axios.get(`${API_URL}/api/wallet/balance`);
      setWalletData(w);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Payment failed');
    } finally { setPaying(false); }
  };

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top gradient header */}
      <header className="bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 pt-4 pb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => (step > 1 ? setStep(step - 1) : navigate('/dashboard'))} className="w-10 h-10 rounded-full hover:bg-white/15 flex items-center justify-center" data-testid="rc-back-btn">
              <ArrowLeft size={22} weight="bold" />
            </button>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="rc-title">
              {step === 1 ? 'Mobile Recharge' : step === 2 ? 'Select a recharge plan' : 'Mobile Recharge'}
            </h1>
          </div>

          {/* Step 2 mini-summary of selected mobile/operator */}
          {step >= 2 && operator && (
            <div className="mt-4 bg-white rounded-2xl p-3 flex items-center gap-3 shadow-lg text-slate-900">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${operator.color} flex items-center justify-center text-white text-xl font-black`}>
                {operator.icon || operator.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-base" data-testid="rc-summary-number">{mobile}</div>
                <div className="text-xs text-slate-600 truncate">{operator.name} Prepaid · {circle}</div>
              </div>
              <Button onClick={() => setStep(1)} className="rounded-full bg-violet-600 text-white hover:bg-violet-700 h-9 px-4" data-testid="rc-edit-btn">
                <PencilSimple size={14} weight="bold" className="mr-1" /> Edit
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* STEP 1 */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto px-3 sm:px-5 -mt-3">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-4" data-testid="rc-step1">
            <div>
              <Label className="text-slate-700 text-sm font-semibold">Mobile Number</Label>
              <div className="mt-1.5 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition h-12">
                <span className="text-slate-700 font-semibold">+91</span>
                <span className="w-px h-6 bg-slate-300" />
                <Phone size={18} weight="duotone" className="text-violet-600" />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 bg-transparent border-0 outline-none text-slate-900 placeholder:text-slate-400 text-base"
                  data-testid="rc-mobile-input"
                />
                {mobile.length > 0 && <span className="text-xs font-mono text-slate-500">{mobile.length}/10</span>}
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Operator</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {operators.map((op) => (
                  <button
                    key={op.code}
                    onClick={() => setOperator(op)}
                    className={`h-16 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition ${operator?.code === op.code ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'}`}
                    data-testid={`rc-op-${op.code}`}
                  >
                    <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${op.color} flex items-center justify-center text-white text-lg`}>{op.icon || op.name.charAt(0)}</span>
                    <span>{op.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Circle</Label>
              <Select value={circle} onValueChange={setCircle}>
                <SelectTrigger className="mt-1.5 rounded-xl h-12 bg-slate-50 border-slate-200 focus:border-violet-500" data-testid="rc-circle-select">
                  <SelectValue placeholder="Select circle / state" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {circles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleContinueFromStep1}
              className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25"
              data-testid="rc-continue-btn"
            >
              View Plans <CaretRight size={18} weight="bold" className="ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 2 plan listing */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto px-3 sm:px-5 -mt-3" data-testid="rc-step2">
          {/* search */}
          <div className="relative bg-white border-2 border-violet-600 rounded-xl p-2 shadow-sm">
            <div className="relative">
              <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search like 199, 28 Days, 2GB"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 outline-none pl-10 pr-3 h-10 text-slate-900 placeholder:text-slate-400 text-sm"
                data-testid="rc-search-input"
              />
            </div>
          </div>

          {/* Categories tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 mt-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-3 sm:px-5 py-3 text-sm font-bold whitespace-nowrap transition ${category === c.key ? 'text-violet-700 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
                data-testid={`rc-cat-${c.key}`}
              >{c.label}</button>
            ))}
          </div>

          <div className="space-y-3 mt-4 pb-6">
            {filteredPlans.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">No plans available</div>
            )}
            {filteredPlans.map((p, i) => (
              <motion.button
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => openPaymentSheet(p)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-violet-300 hover:shadow-md transition flex items-center gap-4"
                data-testid={`rc-plan-${p.price}`}
              >
                <div className="flex items-baseline gap-1 min-w-[90px]">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">₹{p.price}</span>
                </div>
                <div className="w-px bg-slate-200 self-stretch" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Validity</div>
                  <div className="font-bold text-slate-900">{p.validity}</div>
                  <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {p.calls ? `Calls: ${p.calls} · ` : ''}{p.data ? `Data: ${p.data} · ` : ''}{p.sms ? `SMS: ${p.sms}` : ''}
                  </div>
                </div>
                <CaretRight size={18} weight="bold" className="text-slate-400 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Bottom Sheet */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[92vh] overflow-y-auto bg-white border-0 shadow-2xl" data-testid="rc-confirm-sheet">
          <div className="mx-auto max-w-lg">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <SheetHeader className="px-5 pb-3 border-b border-slate-100">
              <SheetTitle className="text-xl font-bold text-slate-900 text-left" style={{ fontFamily: 'Outfit, sans-serif' }}>Confirm Details</SheetTitle>
            </SheetHeader>

            {selectedPlan && preview && (
              <div className="p-5 space-y-4">
                {/* cashback chip */}
                {preview.cashback > 0 && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full px-4 py-2 shadow-md font-bold text-sm" data-testid="rc-cashback-chip">
                    <Gift size={16} weight="fill" /> Your Cashback — ₹{preview.cashback.toFixed(2)}
                  </div>
                )}

                {/* Details card */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <Row label="Mobile Number" value={`+91 ${mobile}`} />
                  <Row label="Operator" value={operator?.name} />
                  <Row label="Circle" value={circle} />
                  <Row label="Recharge Amount" value={`₹${selectedPlan.price}`} />
                  {preview.cashback > 0 && <Row label="Cashback Earned" value={`₹${preview.cashback.toFixed(2)}`} tone="emerald" />}
                  {coinsToUse > 0 && <Row label={`Coins Used (${coinsToUse})`} value={`− ₹${preview.coin_discount.toFixed(2)}`} tone="amber" />}
                  <div className="border-t border-slate-200 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-violet-700 text-base">Total Payable Amount</span>
                    <span className="font-extrabold text-violet-700 text-xl" data-testid="rc-final-amount">₹{preview.final_amount.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Includes all discounts &amp; cashback</p>
                </div>

                {/* Coins slider */}
                {preview.coins_enabled && (walletData?.coins || 0) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Coins size={20} weight="fill" className="text-amber-500" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Use Coins</div>
                          <div className="text-[11px] text-slate-500">{walletData?.coins || 0} available · Max {preview.max_coins} · 100 coins = ₹{(100 / preview.coin_rate).toFixed(2)}</div>
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.min(preview.max_coins, walletData?.coins || 0)}
                        value={coinsToUse}
                        onChange={(e) => handleCoinsChange(parseInt(e.target.value || '0', 10))}
                        className="w-20 bg-white border border-amber-300 rounded-lg h-9 px-2 text-sm font-bold text-slate-900 text-center"
                        data-testid="rc-coins-input"
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.min(preview.max_coins, walletData?.coins || 0)}
                      value={coinsToUse}
                      onChange={(e) => handleCoinsChange(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500"
                      data-testid="rc-coins-slider"
                    />
                  </div>
                )}

                {/* Payment Source */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">Pay using</div>
                  <div className="grid grid-cols-2 gap-2">
                    <PaymentChip
                      icon={Wallet}
                      label="E-Wallet"
                      value={walletData?.e_wallet}
                      active={paymentMode === 'e_wallet'}
                      onClick={() => setPaymentMode('e_wallet')}
                      testId="rc-pay-ewallet"
                    />
                    <PaymentChip
                      icon={CurrencyCircleDollar}
                      label="Main Wallet"
                      value={walletData?.main_wallet}
                      active={paymentMode === 'main_wallet'}
                      onClick={() => setPaymentMode('main_wallet')}
                      testId="rc-pay-main"
                    />
                  </div>
                </div>

                <Button
                  onClick={payNow}
                  disabled={paying}
                  className="w-full h-14 rounded-2xl font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl shadow-violet-500/30 text-lg active:scale-[0.98]"
                  data-testid="rc-pay-now-btn"
                >
                  {paying ? 'Processing…' : `Pay ₹${preview.final_amount.toFixed(2)} Now`}
                </Button>
                <p className="text-[11px] text-center text-slate-500">
                  By proceeding you agree to our Terms. Cashback of ₹{preview.cashback.toFixed(2)} will be credited as {Math.round(preview.cashback * preview.coin_rate)} coins.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Row = ({ label, value, tone }) => (
  <div className="flex justify-between items-center">
    <span className="text-slate-600 text-sm">{label}</span>
    <span className={`font-bold text-sm ${tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
  </div>
);

const PaymentChip = ({ icon: Icon, label, value, active, onClick, testId }) => (
  <button
    onClick={onClick}
    className={`h-16 rounded-2xl border-2 px-3 flex items-center justify-between transition ${active ? 'border-violet-600 bg-violet-50' : 'border-slate-200 bg-white'}`}
    data-testid={testId}
  >
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={22} weight="duotone" className={active ? 'text-violet-600' : 'text-slate-400'} />
      <div className="text-left min-w-0">
        <div className="font-bold text-slate-900 text-sm truncate">{label}</div>
        <div className="text-[10px] text-slate-500">₹{(value || 0).toFixed(2)}</div>
      </div>
    </div>
    {active && <CheckCircle size={18} weight="fill" className="text-violet-600 flex-shrink-0" />}
  </button>
);

export default Recharge;
