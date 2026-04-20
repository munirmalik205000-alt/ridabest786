import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import {
  ArrowLeft, CaretRight, MagnifyingGlass, Phone, Coins,
  CurrencyCircleDollar, CheckCircle, Wallet, Gift, PencilSimple, Receipt,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import PinDialog from '../components/PinDialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { key: 'unlimited', label: 'Truly Unlimited' },
  { key: 'data', label: 'Data' },
  { key: 'vouchers', label: 'Plan Vouchers' },
];

const Recharge = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // 'mobile' tab vs 'bills' tab
  const [tab, setTab] = useState('mobile');

  // MOBILE RECHARGE state
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

  // UTILITY BILLS state
  const [billCategories, setBillCategories] = useState([]);
  const [billCategory, setBillCategory] = useState(null);
  const [billers, setBillers] = useState([]);
  const [biller, setBiller] = useState(null);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [consumerName, setConsumerName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billSheetOpen, setBillSheetOpen] = useState(false);
  const [billPaymentMode, setBillPaymentMode] = useState('e_wallet');

  // PIN Dialog
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'recharge' | 'bill'

  useEffect(() => {
    (async () => {
      try {
        const [o, c, w, bc] = await Promise.all([
          axios.get(`${API_URL}/api/recharge/operators`),
          axios.get(`${API_URL}/api/recharge/circles`),
          axios.get(`${API_URL}/api/wallet/balance`),
          axios.get(`${API_URL}/api/bills/categories`),
        ]);
        setOperators(o.data.operators);
        setCircles(c.data.circles);
        setWalletData(w.data);
        setBillCategories(bc.data.categories);
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

  useEffect(() => { if (tab === 'mobile' && step === 2) fetchPlans(); }, [tab, step, fetchPlans]);

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

  const requireAndPay = (actionType) => {
    if (!user?.has_pin) {
      toast.error('Pehle Profile se PIN setup karein');
      navigate('/profile');
      return;
    }
    setPendingAction(actionType);
    setShowPinDialog(true);
  };

  const onPinConfirm = async (pin) => {
    try {
      setPaying(true);
      if (pendingAction === 'recharge') {
        const { data } = await axios.post(`${API_URL}/api/recharge`, {
          recharge_type: 'mobile',
          number: mobile,
          operator: operator.code,
          circle,
          plan_id: selectedPlan._id,
          amount: selectedPlan.price,
          coins_used: coinsToUse,
          payment_mode: paymentMode,
          pin,
        });
        toast.success(`Recharge ${data.status}! Paid ₹${data.final_amount}${data.coins_earned ? ` · +${data.coins_earned} coins` : ''}`);
        setConfirmOpen(false);
      } else if (pendingAction === 'bill') {
        const { data } = await axios.post(`${API_URL}/api/bills/pay`, {
          biller_category: billCategory.code,
          biller_code: biller.code,
          biller_name: biller.name,
          consumer_number: consumerNumber,
          consumer_name: consumerName || null,
          amount: parseFloat(billAmount),
          payment_mode: billPaymentMode,
          pin,
        });
        toast.success(`Bill ${data.status}! Paid ₹${data.final_amount}${data.coins_earned ? ` · +${data.coins_earned} coins` : ''}`);
        setBillSheetOpen(false);
        setConsumerNumber(''); setConsumerName(''); setBillAmount(''); setBiller(null); setBillCategory(null);
      }
      setShowPinDialog(false);
      setPendingAction(null);
      await refreshUser();
      const { data: w } = await axios.get(`${API_URL}/api/wallet/balance`);
      setWalletData(w);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const openBillerList = async (cat) => {
    setBillCategory(cat);
    try {
      const { data } = await axios.get(`${API_URL}/api/bills/billers/${cat.code}`);
      setBillers(data.billers);
    } catch (e) {
      toast.error('Could not load billers');
    }
  };

  const openBillSheet = (b) => {
    setBiller(b);
    setBillPaymentMode('e_wallet');
    setBillSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-brand-gradient text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 pt-4 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (tab === 'mobile' && step > 1 ? setStep(step - 1) : navigate('/dashboard'))}
              className="w-10 h-10 rounded-full hover:bg-white/15 flex items-center justify-center"
              data-testid="rc-back-btn"
            >
              <ArrowLeft size={22} weight="bold" />
            </button>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight" data-testid="rc-title">
              {tab === 'mobile'
                ? (step === 1 ? 'Mobile Recharge' : 'Select a Plan')
                : billCategory ? `${billCategory.name} Bills` : 'Pay Utility Bills'}
            </h1>
          </div>

          {/* Tabs */}
          <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-white/10 rounded-xl max-w-sm">
            <button
              onClick={() => { setTab('mobile'); setBillCategory(null); }}
              className={`h-10 rounded-lg font-semibold text-sm transition ${tab === 'mobile' ? 'bg-white text-indigo-700 shadow' : 'text-white/80'}`}
              data-testid="tab-mobile"
            >📱 Mobile</button>
            <button
              onClick={() => setTab('bills')}
              className={`h-10 rounded-lg font-semibold text-sm transition ${tab === 'bills' ? 'bg-white text-indigo-700 shadow' : 'text-white/80'}`}
              data-testid="tab-bills"
            >🧾 Bills</button>
          </div>

          {tab === 'mobile' && step >= 2 && operator && (
            <div className="mt-4 bg-white rounded-2xl p-3 flex items-center gap-3 shadow-lg text-foreground">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${operator.color} flex items-center justify-center text-white text-xl font-black`}>
                {operator.icon || operator.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base" data-testid="rc-summary-number">{mobile}</div>
                <div className="text-xs text-muted-foreground truncate">{operator.name} Prepaid · {circle}</div>
              </div>
              <Button onClick={() => setStep(1)} className="rounded-full btn-brand h-9 px-4" data-testid="rc-edit-btn">
                <PencilSimple size={14} weight="bold" className="mr-1" /> Edit
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* MOBILE STEP 1 */}
      {tab === 'mobile' && step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto px-3 sm:px-5 -mt-3">
          <div className="card-brand bg-card p-5 sm:p-6 space-y-4" data-testid="rc-step1">
            <div>
              <Label className="text-sm font-semibold">Mobile Number</Label>
              <div className="mt-1.5 flex items-center gap-2 bg-muted border border-border rounded-xl px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition h-12">
                <span className="font-semibold">+91</span>
                <span className="w-px h-6 bg-border" />
                <Phone size={18} weight="duotone" className="text-primary" />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-base"
                  data-testid="rc-mobile-input"
                />
                {mobile.length > 0 && <span className="text-xs font-mono text-muted-foreground">{mobile.length}/10</span>}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Operator</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {operators.map((op) => (
                  <button
                    key={op.code}
                    onClick={() => setOperator(op)}
                    className={`h-16 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition ${operator?.code === op.code ? 'border-primary bg-primary/10 text-primary shadow-md' : 'border-border bg-card hover:border-primary/40'}`}
                    data-testid={`rc-op-${op.code}`}
                  >
                    <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${op.color} flex items-center justify-center text-white text-lg`}>{op.icon || op.name.charAt(0)}</span>
                    <span>{op.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Circle</Label>
              <Select value={circle} onValueChange={setCircle}>
                <SelectTrigger className="mt-1.5 rounded-xl h-12" data-testid="rc-circle-select">
                  <SelectValue placeholder="Select circle / state" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {circles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleContinueFromStep1}
              className="btn-brand w-full h-12 rounded-xl font-bold text-white"
              data-testid="rc-continue-btn"
            >
              View Plans <CaretRight size={18} weight="bold" className="ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* MOBILE STEP 2 */}
      {tab === 'mobile' && step === 2 && (
        <div className="max-w-3xl mx-auto px-3 sm:px-5 -mt-3" data-testid="rc-step2">
          <div className="relative bg-card border-2 border-primary rounded-xl p-2 shadow-sm">
            <div className="relative">
              <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search like 199, 28 Days, 2GB"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 outline-none pl-10 pr-3 h-10 placeholder:text-muted-foreground text-sm"
                data-testid="rc-search-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border mt-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-3 sm:px-5 py-3 text-sm font-bold whitespace-nowrap transition ${category === c.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                data-testid={`rc-cat-${c.key}`}
              >{c.label}</button>
            ))}
          </div>

          <div className="space-y-3 mt-4 pb-24">
            {filteredPlans.length === 0 && (
              <div className="card-brand p-8 text-center text-muted-foreground">No plans available</div>
            )}
            {filteredPlans.map((p, i) => (
              <motion.button
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => openPaymentSheet(p)}
                className="w-full card-brand p-4 text-left hover:border-primary hover:shadow-md transition flex items-center gap-4"
                data-testid={`rc-plan-${p.price}`}
              >
                <div className="flex items-baseline gap-1 min-w-[90px]">
                  <span className="text-2xl sm:text-3xl font-black">₹{p.price}</span>
                </div>
                <div className="w-px bg-border self-stretch" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Validity</div>
                  <div className="font-bold">{p.validity}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {p.calls ? `Calls: ${p.calls} · ` : ''}{p.data ? `Data: ${p.data} · ` : ''}{p.sms ? `SMS: ${p.sms}` : ''}
                  </div>
                </div>
                <CaretRight size={18} weight="bold" className="text-muted-foreground flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* UTILITY BILLS */}
      {tab === 'bills' && !billCategory && (
        <div className="max-w-3xl mx-auto px-3 sm:px-5 -mt-3" data-testid="bills-categories">
          <div className="card-brand p-5">
            <h2 className="font-bold text-lg mb-3">Select Bill Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {billCategories.map((c) => (
                <button
                  key={c.code}
                  onClick={() => openBillerList(c)}
                  className="rounded-2xl p-3 bg-background border border-border hover:border-primary hover:shadow-md transition flex flex-col items-center gap-1"
                  data-testid={`bill-cat-${c.code}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xl shadow`}>
                    {c.icon}
                  </div>
                  <div className="text-[11px] font-bold text-center leading-tight mt-1">{c.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'bills' && billCategory && (
        <div className="max-w-3xl mx-auto px-3 sm:px-5 -mt-3" data-testid="bills-billers">
          <div className="card-brand p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Select {billCategory.name} Biller</h2>
              <Button variant="outline" className="rounded-xl h-9" onClick={() => { setBillCategory(null); setBillers([]); }} data-testid="bills-change-category">
                Change
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {billers.map((b) => (
                <button
                  key={b.code}
                  onClick={() => openBillSheet(b)}
                  className="rounded-xl p-3 bg-background border border-border hover:border-primary hover:shadow-md transition text-left flex items-center gap-3"
                  data-testid={`biller-${b.code}`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${billCategory.color} flex items-center justify-center text-white`}>
                    <Receipt size={18} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground">{billCategory.name}</div>
                  </div>
                  <CaretRight size={16} className="text-muted-foreground" />
                </button>
              ))}
              {billers.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-6">No billers available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE Payment Sheet */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[92vh] overflow-y-auto bg-card border-0 shadow-2xl" data-testid="rc-confirm-sheet">
          <div className="mx-auto max-w-lg">
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>
            <SheetHeader className="px-5 pb-3 border-b border-border">
              <SheetTitle className="text-xl font-bold text-left">Confirm Details</SheetTitle>
            </SheetHeader>

            {selectedPlan && preview && (
              <div className="p-5 space-y-4">
                {preview.cashback > 0 && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full px-4 py-2 shadow-md font-bold text-sm" data-testid="rc-cashback-chip">
                    <Gift size={16} weight="fill" /> Cashback — ₹{preview.cashback.toFixed(2)}
                  </div>
                )}

                <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                  <Row label="Mobile Number" value={`+91 ${mobile}`} />
                  <Row label="Operator" value={operator?.name} />
                  <Row label="Circle" value={circle} />
                  <Row label="Recharge Amount" value={`₹${selectedPlan.price}`} />
                  {preview.cashback > 0 && <Row label="Cashback Earned" value={`₹${preview.cashback.toFixed(2)}`} tone="emerald" />}
                  {coinsToUse > 0 && <Row label={`Coins Used (${coinsToUse})`} value={`− ₹${preview.coin_discount.toFixed(2)}`} tone="amber" />}
                  <div className="border-t border-border my-1" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary text-base">Total Payable</span>
                    <span className="font-extrabold text-primary text-xl" data-testid="rc-final-amount">₹{preview.final_amount.toFixed(2)}</span>
                  </div>
                </div>

                {preview.coins_enabled && (walletData?.coins || 0) > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Coins size={20} weight="fill" className="text-amber-500" />
                        <div>
                          <div className="font-bold text-sm">Use Coins</div>
                          <div className="text-[11px] text-muted-foreground">{walletData?.coins || 0} available · Max {preview.max_coins}</div>
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.min(preview.max_coins, walletData?.coins || 0)}
                        value={coinsToUse}
                        onChange={(e) => handleCoinsChange(parseInt(e.target.value || '0', 10))}
                        className="w-20 bg-card border border-amber-400/40 rounded-lg h-9 px-2 text-sm font-bold text-center"
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

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Pay using</div>
                  <div className="grid grid-cols-2 gap-2">
                    <PaymentChip icon={Wallet} label="E-Wallet" value={walletData?.e_wallet}
                      active={paymentMode === 'e_wallet'} onClick={() => setPaymentMode('e_wallet')} testId="rc-pay-ewallet" />
                    <PaymentChip icon={CurrencyCircleDollar} label="Main Wallet" value={walletData?.main_wallet}
                      active={paymentMode === 'main_wallet'} onClick={() => setPaymentMode('main_wallet')} testId="rc-pay-main" />
                  </div>
                </div>

                <Button
                  onClick={() => requireAndPay('recharge')}
                  disabled={paying}
                  className="btn-brand w-full h-14 rounded-2xl font-black text-lg"
                  data-testid="rc-pay-now-btn"
                >
                  {paying ? 'Processing…' : `Pay ₹${preview.final_amount.toFixed(2)} Now`}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">Secure PIN required to confirm payment.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* BILL Payment Sheet */}
      <Sheet open={billSheetOpen} onOpenChange={setBillSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[92vh] overflow-y-auto bg-card border-0 shadow-2xl" data-testid="bill-sheet">
          <div className="mx-auto max-w-lg">
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>
            <SheetHeader className="px-5 pb-3 border-b border-border">
              <SheetTitle className="text-xl font-bold text-left">
                Pay {biller?.name || 'Bill'}
              </SheetTitle>
            </SheetHeader>
            {biller && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">Consumer / Account Number</Label>
                    <Input
                      value={consumerNumber}
                      onChange={(e) => setConsumerNumber(e.target.value)}
                      placeholder="Enter consumer number"
                      className="mt-1 rounded-xl h-12"
                      data-testid="bill-consumer-number"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Consumer Name (optional)</Label>
                    <Input
                      value={consumerName}
                      onChange={(e) => setConsumerName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1 rounded-xl h-12"
                      data-testid="bill-consumer-name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Amount (₹)</Label>
                    <Input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="Enter bill amount"
                      className="mt-1 rounded-xl h-12"
                      data-testid="bill-amount"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Pay using</div>
                  <div className="grid grid-cols-2 gap-2">
                    <PaymentChip icon={Wallet} label="E-Wallet" value={walletData?.e_wallet}
                      active={billPaymentMode === 'e_wallet'} onClick={() => setBillPaymentMode('e_wallet')} testId="bill-pay-ewallet" />
                    <PaymentChip icon={CurrencyCircleDollar} label="Main Wallet" value={walletData?.main_wallet}
                      active={billPaymentMode === 'main_wallet'} onClick={() => setBillPaymentMode('main_wallet')} testId="bill-pay-main" />
                  </div>
                </div>

                {billAmount && parseFloat(billAmount) > 0 && (
                  <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
                    <Row label="Bill Amount" value={`₹${parseFloat(billAmount).toFixed(2)}`} />
                    <Row label="Cashback (1%)" value={`+ ${Math.round(parseFloat(billAmount) * 0.1)} coins`} tone="emerald" />
                    <div className="border-t border-border my-1" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">Total Payable</span>
                      <span className="font-extrabold text-primary text-lg">₹{parseFloat(billAmount).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (!consumerNumber) return toast.error('Enter consumer number');
                    if (!billAmount || parseFloat(billAmount) <= 0) return toast.error('Enter valid amount');
                    requireAndPay('bill');
                  }}
                  disabled={paying}
                  className="btn-brand w-full h-14 rounded-2xl font-black text-lg"
                  data-testid="bill-pay-btn"
                >
                  {paying ? 'Processing…' : `Pay ₹${billAmount ? parseFloat(billAmount).toFixed(2) : '0.00'}`}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">Secure PIN required to confirm payment.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* PIN dialog */}
      <PinDialog
        open={showPinDialog}
        onClose={() => { setShowPinDialog(false); setPendingAction(null); }}
        onConfirm={onPinConfirm}
        title={pendingAction === 'bill' ? 'Confirm Bill Payment' : 'Confirm Recharge'}
        description={
          pendingAction === 'bill'
            ? `₹${billAmount || 0} bill payment ke liye PIN dalein`
            : `₹${selectedPlan?.price || 0} recharge ke liye PIN dalein`
        }
        isLoading={paying}
      />
    </div>
  );
};

const Row = ({ label, value, tone }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className={`font-bold text-sm ${tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : ''}`}>{value}</span>
  </div>
);

const PaymentChip = ({ icon: Icon, label, value, active, onClick, testId }) => (
  <button
    onClick={onClick}
    className={`h-16 rounded-2xl border-2 px-3 flex items-center justify-between transition ${active ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
    data-testid={testId}
  >
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={22} weight="duotone" className={active ? 'text-primary' : 'text-muted-foreground'} />
      <div className="text-left min-w-0">
        <div className="font-bold text-sm truncate">{label}</div>
        <div className="text-[10px] text-muted-foreground">₹{(value || 0).toFixed(2)}</div>
      </div>
    </div>
    {active && <CheckCircle size={18} weight="fill" className="text-primary flex-shrink-0" />}
  </button>
);

export default Recharge;
