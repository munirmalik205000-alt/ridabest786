import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Wallet, CurrencyCircleDollar, Coins, TrendUp, DeviceMobileCamera, Lightning, Fire, Drop, SignOut, CreditCard, ArrowsLeftRight, ClockCounterClockwise, UsersThree, Plus, User } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [rechargeDialog, setRechargeDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [selfTransferDialog, setSelfTransferDialog] = useState(false);
  const [addFundDialog, setAddFundDialog] = useState(false);
  
  const [rechargeType, setRechargeType] = useState('mobile');
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [rechargeOperator, setRechargeOperator] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('e_wallet');
  const [rechargePin, setRechargePin] = useState('');
  
  const [transferMobile, setTransferMobile] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPin, setTransferPin] = useState('');
  
  const [selfAmount, setSelfAmount] = useState('');
  const [selfPin, setSelfPin] = useState('');
  
  const [fundAmount, setFundAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/wallet/balance`, {
        withCredentials: true
      });
      setWalletData(data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const handleRecharge = async () => {
    if (!user?.has_pin) {
      toast.error('Please setup PIN first');
      navigate('/setup-pin');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/recharge`,
        {
          recharge_type: rechargeType,
          number: rechargeNumber,
          operator: rechargeOperator,
          amount: parseFloat(rechargeAmount),
          payment_mode: paymentMode
        },
        { withCredentials: true }
      );
      toast.success(`Recharge ${data.status}!`);
      setRechargeDialog(false);
      resetRechargeForm();
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Recharge failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTransfer = async () => {
    if (!user?.has_pin) {
      toast.error('Please setup PIN first');
      navigate('/setup-pin');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/user-transfer`,
        {
          receiver_mobile: transferMobile,
          amount: parseFloat(transferAmount),
          pin: transferPin
        },
        { withCredentials: true }
      );
      toast.success('Transfer successful!');
      setTransferDialog(false);
      resetTransferForm();
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfTransfer = async () => {
    if (!user?.has_pin) {
      toast.error('Please setup PIN first');
      navigate('/setup-pin');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/self-transfer`,
        {
          amount: parseFloat(selfAmount),
          pin: selfPin
        },
        { withCredentials: true }
      );
      toast.success('Self transfer successful!');
      setSelfTransferDialog(false);
      resetSelfTransferForm();
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFundRequest = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/add-fund-request`,
        { amount: parseFloat(fundAmount) },
        { withCredentials: true }
      );
      toast.success('Fund request submitted for admin approval');
      setAddFundDialog(false);
      setFundAmount('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetRechargeForm = () => {
    setRechargeNumber('');
    setRechargeOperator('');
    setRechargeAmount('');
    setRechargePin('');
  };

  const resetTransferForm = () => {
    setTransferMobile('');
    setTransferAmount('');
    setTransferPin('');
  };

  const resetSelfTransferForm = () => {
    setSelfAmount('');
    setSelfPin('');
  };

  const rechargeServices = [
    { id: 'mobile', name: 'Mobile', icon: DeviceMobileCamera, color: 'bg-blue-500' },
    { id: 'dth', name: 'DTH', icon: Lightning, color: 'bg-purple-500' },
    { id: 'electricity', name: 'Electricity', icon: Lightning, color: 'bg-yellow-500' },
    { id: 'gas', name: 'Gas', icon: Fire, color: 'bg-orange-500' },
    { id: 'water', name: 'Water', icon: Drop, color: 'bg-cyan-500' },
  ];

  if (!walletData) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="dashboard-title">Welcome, {user?.name}</h1>
            <p className="text-emerald-100 text-sm mt-1">Mobile: {user?.mobile}</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                data-testid="admin-panel-btn"
              >
                <User size={20} className="mr-2" />
                Admin Panel
              </Button>
            )}
            <Button
              onClick={logout}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              data-testid="logout-btn"
            >
              <SignOut size={20} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900 text-white border-0 p-6 rounded-2xl shadow-lg" data-testid="main-wallet-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Wallet size={24} weight="duotone" />
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Main Wallet</p>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{walletData.main_wallet.toFixed(2)}</p>
            <p className="text-sm text-slate-400">For commissions only</p>
          </Card>

          <Card className="bg-emerald-600 text-white border-0 p-6 rounded-2xl shadow-lg" data-testid="e-wallet-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <CurrencyCircleDollar size={24} weight="duotone" />
              </div>
              <p className="text-xs uppercase tracking-wider text-emerald-200">E-Wallet</p>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{walletData.e_wallet.toFixed(2)}</p>
            <p className="text-sm text-emerald-200">For recharge & bills</p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300 p-6 rounded-2xl shadow-lg" data-testid="coins-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Coins size={24} weight="duotone" className="text-amber-700" />
              </div>
              <p className="text-xs uppercase tracking-wider text-amber-700">Coins</p>
            </div>
            <p className="text-3xl font-bold mb-2 text-amber-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{walletData.coins}</p>
            <p className="text-sm text-amber-700">Available coins</p>
          </Card>

          <Card className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg" data-testid="income-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendUp size={24} weight="duotone" className="text-emerald-600" />
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Income</p>
            </div>
            <p className="text-3xl font-bold mb-2 text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{walletData.total_income.toFixed(2)}</p>
            <p className="text-sm text-slate-600">Today: ₹{walletData.today_income.toFixed(2)}</p>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Dialog open={addFundDialog} onOpenChange={setAddFundDialog}>
              <DialogTrigger asChild>
                <Button className="h-24 bg-white border-2 border-emerald-200 hover:border-emerald-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1" data-testid="add-fund-btn">
                  <Plus size={28} weight="duotone" className="text-emerald-600" />
                  <span className="font-semibold">Add Fund</span>
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="add-fund-dialog">
                <DialogHeader>
                  <DialogTitle>Request Add Fund</DialogTitle>
                  <DialogDescription>Submit a fund request for admin approval</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundAmount">Amount (₹)</Label>
                    <Input
                      id="fundAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="rounded-xl"
                      data-testid="fund-amount-input"
                    />
                  </div>
                  <Button
                    onClick={handleAddFundRequest}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                    disabled={isLoading || !fundAmount}
                    data-testid="submit-fund-request-btn"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={selfTransferDialog} onOpenChange={setSelfTransferDialog}>
              <DialogTrigger asChild>
                <Button className="h-24 bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1" data-testid="self-transfer-btn">
                  <ArrowsLeftRight size={28} weight="duotone" className="text-slate-600" />
                  <span className="font-semibold">Self Transfer</span>
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="self-transfer-dialog">
                <DialogHeader>
                  <DialogTitle>Main Wallet → E-Wallet</DialogTitle>
                  <DialogDescription>Transfer from main wallet to e-wallet</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="selfAmount">Amount (₹)</Label>
                    <Input
                      id="selfAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={selfAmount}
                      onChange={(e) => setSelfAmount(e.target.value)}
                      className="rounded-xl"
                      data-testid="self-transfer-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Enter PIN</Label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={4} value={selfPin} onChange={setSelfPin} data-testid="self-transfer-pin-input">
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                          <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                          <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                          <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button
                    onClick={handleSelfTransfer}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                    disabled={isLoading || !selfAmount || selfPin.length !== 4}
                    data-testid="submit-self-transfer-btn"
                  >
                    {isLoading ? 'Transferring...' : 'Transfer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
              <DialogTrigger asChild>
                <Button className="h-24 bg-white border-2 border-blue-200 hover:border-blue-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1" data-testid="user-transfer-btn">
                  <CreditCard size={28} weight="duotone" className="text-blue-600" />
                  <span className="font-semibold">Transfer Money</span>
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="user-transfer-dialog">
                <DialogHeader>
                  <DialogTitle>User to User Transfer</DialogTitle>
                  <DialogDescription>Transfer from your E-Wallet to another user</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="transferMobile">Receiver Mobile</Label>
                    <Input
                      id="transferMobile"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={transferMobile}
                      onChange={(e) => setTransferMobile(e.target.value)}
                      className="rounded-xl"
                      data-testid="transfer-mobile-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Amount (₹)</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="rounded-xl"
                      data-testid="transfer-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Enter PIN</Label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={4} value={transferPin} onChange={setTransferPin} data-testid="transfer-pin-input">
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                          <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                          <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                          <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button
                    onClick={handleUserTransfer}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                    disabled={isLoading || !transferMobile || !transferAmount || transferPin.length !== 4}
                    data-testid="submit-user-transfer-btn"
                  >
                    {isLoading ? 'Transferring...' : 'Transfer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => navigate('/transactions')}
              className="h-24 bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1"
              data-testid="transactions-btn"
            >
              <ClockCounterClockwise size={28} weight="duotone" className="text-slate-600" />
              <span className="font-semibold">Transactions</span>
            </Button>

            <Button
              onClick={() => navigate('/referrals')}
              className="h-24 bg-white border-2 border-purple-200 hover:border-purple-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1"
              data-testid="referrals-btn"
            >
              <UsersThree size={28} weight="duotone" className="text-purple-600" />
              <span className="font-semibold">My Team</span>
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Recharge & Bills</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {rechargeServices.map((service) => (
              <Dialog key={service.id} open={rechargeDialog && rechargeType === service.id} onOpenChange={(open) => {
                setRechargeDialog(open);
                if (open) setRechargeType(service.id);
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="h-28 bg-white border-2 border-slate-200 hover:border-slate-400 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1"
                    data-testid={`recharge-${service.id}-btn`}
                  >
                    <div className={`w-14 h-14 ${service.color} rounded-full flex items-center justify-center`}>
                      <service.icon size={28} weight="duotone" className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-900">{service.name}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="recharge-dialog">
                  <DialogHeader>
                    <DialogTitle>{service.name} Recharge</DialogTitle>
                    <DialogDescription>Complete the recharge details below</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="rechargeNumber">Number</Label>
                      <Input
                        id="rechargeNumber"
                        type="text"
                        placeholder="Enter number"
                        value={rechargeNumber}
                        onChange={(e) => setRechargeNumber(e.target.value)}
                        className="rounded-xl"
                        data-testid="recharge-number-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rechargeOperator">Operator</Label>
                      <Input
                        id="rechargeOperator"
                        type="text"
                        placeholder="e.g., Airtel, Jio"
                        value={rechargeOperator}
                        onChange={(e) => setRechargeOperator(e.target.value)}
                        className="rounded-xl"
                        data-testid="recharge-operator-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rechargeAmount">Amount (₹)</Label>
                      <Input
                        id="rechargeAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="rounded-xl"
                        data-testid="recharge-amount-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMode">Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger className="rounded-xl" data-testid="payment-mode-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="e_wallet">E-Wallet</SelectItem>
                          <SelectItem value="coins">Coins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleRecharge}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                      disabled={isLoading || !rechargeNumber || !rechargeOperator || !rechargeAmount}
                      data-testid="submit-recharge-btn"
                    >
                      {isLoading ? 'Processing...' : 'Recharge Now'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
