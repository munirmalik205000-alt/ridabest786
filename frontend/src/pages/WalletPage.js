import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Wallet, ArrowsLeftRight, PaperPlaneTilt, CurrencyCircleDollar, Bank } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import PinDialog from '../components/PinDialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);

  // Dialog states
  const [selfTransferDialog, setSelfTransferDialog] = useState(false);
  const [userTransferDialog, setUserTransferDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);

  // Self Transfer
  const [selfAmount, setSelfAmount] = useState('');

  // User Transfer
  const [transferMobile, setTransferMobile] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Withdrawal
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank'); // 'bank' | 'upi'
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [upiId, setUpiId] = useState('');

  // PIN Dialog
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'self_transfer' | 'user_transfer' | 'withdraw'
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

  // Step 1: User clicks Process -> open PIN dialog
  const handleSelfTransferProcess = () => {
    if (!user?.has_pin) {
      toast.error('Pehle Profile se PIN setup karein');
      navigate('/profile');
      return;
    }
    if (!selfAmount || parseFloat(selfAmount) <= 0) {
      toast.error('Amount dalein');
      return;
    }
    setSelfTransferDialog(false);
    setPendingAction('self_transfer');
    setShowPinDialog(true);
  };

  const handleUserTransferProcess = () => {
    if (!user?.has_pin) {
      toast.error('Pehle Profile se PIN setup karein');
      navigate('/profile');
      return;
    }
    if (!transferMobile || transferMobile.length !== 10 || !transferAmount) {
      toast.error('Sab details bharein');
      return;
    }
    setUserTransferDialog(false);
    setPendingAction('user_transfer');
    setShowPinDialog(true);
  };

  const handleWithdrawProcess = () => {
    if (!user?.has_pin) {
      toast.error('Pehle Profile se PIN setup karein');
      navigate('/profile');
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) < 100) {
      toast.error('Minimum withdrawal Rs.100 hai');
      return;
    }
    if (!bankName || !accountNumber || !ifscCode) {
      toast.error('Bank details bharein');
      return;
    }
    setWithdrawDialog(false);
    setPendingAction('withdraw');
    setShowPinDialog(true);
  };

  // Step 2: PIN confirmed -> execute action
  const handlePinConfirm = async (pin) => {
    setIsLoading(true);
    try {
      if (pendingAction === 'self_transfer') {
        await axios.post(
          `${API_URL}/api/wallet/self-transfer`,
          { amount: parseFloat(selfAmount), pin },
          { withCredentials: true }
        );
        toast.success(`Rs.${selfAmount} Main Wallet se E-Wallet mein transfer ho gaya!`);
        setSelfAmount('');
      } else if (pendingAction === 'user_transfer') {
        await axios.post(
          `${API_URL}/api/wallet/user-transfer`,
          { receiver_mobile: transferMobile, amount: parseFloat(transferAmount), pin },
          { withCredentials: true }
        );
        toast.success(`Rs.${transferAmount} ${transferMobile} ko bhej diya!`);
        setTransferMobile('');
        setTransferAmount('');
      } else if (pendingAction === 'withdraw') {
        await axios.post(
          `${API_URL}/api/wallet/withdraw`,
          {
            amount: parseFloat(withdrawAmount),
            pin,
            method: withdrawMethod,
            bank_name: withdrawMethod === 'bank' ? bankName : null,
            account_number: withdrawMethod === 'bank' ? accountNumber : null,
            ifsc_code: withdrawMethod === 'bank' ? ifscCode : null,
            account_holder: withdrawMethod === 'bank' ? accountHolder : null,
            upi_id: withdrawMethod === 'upi' ? upiId : null,
          },
          { withCredentials: true }
        );
        toast.success(`Rs.${withdrawAmount} withdrawal submitted! 2% platform fee applied.`);
        setWithdrawAmount('');
        setBankName('');
        setAccountNumber('');
        setIfscCode('');
        setAccountHolder('');
        setUpiId('');
      }
      setShowPinDialog(false);
      setPendingAction(null);
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!walletData) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="wallet-title">
              My Wallet
            </h1>
            <p className="text-emerald-100 text-sm">Manage your funds & transfers</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Wallet Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 p-6 rounded-2xl shadow-xl" data-testid="main-wallet-balance">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet size={24} weight="duotone" />
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Main Wallet</p>
              </div>
              <p className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Rs.{walletData.main_wallet.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400">Commission income</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-0 p-6 rounded-2xl shadow-xl" data-testid="e-wallet-balance">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <CurrencyCircleDollar size={24} weight="duotone" />
                </div>
                <p className="text-xs uppercase tracking-wider text-emerald-100">E-Wallet</p>
              </div>
              <p className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Rs.{walletData.e_wallet.toFixed(2)}
              </p>
              <p className="text-sm text-emerald-100">Recharge & shopping</p>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Self Transfer */}
          <Dialog open={selfTransferDialog} onOpenChange={setSelfTransferDialog}>
            <DialogTrigger asChild>
              <Button className="h-24 bg-white border-2 border-emerald-200 hover:border-emerald-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:shadow-xl" data-testid="self-transfer-btn">
                <ArrowsLeftRight size={32} weight="duotone" className="text-emerald-600" />
                <span className="font-bold">Self Transfer</span>
                <span className="text-xs text-slate-500">Main to E-Wallet</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="self-transfer-dialog">
              <DialogHeader>
                <DialogTitle className="text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Self Transfer</DialogTitle>
                <DialogDescription>Main Wallet se E-Wallet mein transfer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (Rs.)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={selfAmount}
                    onChange={(e) => setSelfAmount(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    data-testid="self-amount-input"
                  />
                  <p className="text-xs text-slate-500">Available: Rs.{walletData.main_wallet.toFixed(2)}</p>
                </div>
                {selfAmount && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Transfer Amount</span>
                      <span className="font-bold text-emerald-700">Rs.{selfAmount}</span>
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleSelfTransferProcess}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl h-12 font-semibold"
                  disabled={!selfAmount}
                  data-testid="process-self-transfer-btn"
                >
                  Process Transfer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Send Money */}
          <Dialog open={userTransferDialog} onOpenChange={setUserTransferDialog}>
            <DialogTrigger asChild>
              <Button className="h-24 bg-white border-2 border-blue-200 hover:border-blue-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:shadow-xl" data-testid="user-transfer-btn">
                <PaperPlaneTilt size={32} weight="duotone" className="text-blue-600" />
                <span className="font-bold">Send Money</span>
                <span className="text-xs text-slate-500">To other user</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="user-transfer-dialog">
              <DialogHeader>
                <DialogTitle className="text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Send Money</DialogTitle>
                <DialogDescription>Dusre user ke E-Wallet mein transfer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Receiver Mobile</Label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={transferMobile}
                    onChange={(e) => setTransferMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    maxLength={10}
                    data-testid="transfer-mobile-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (Rs.)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    data-testid="transfer-amount-input"
                  />
                  <p className="text-xs text-slate-500">Available: Rs.{walletData.e_wallet.toFixed(2)}</p>
                </div>
                {transferAmount && transferMobile.length === 10 && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Send to {transferMobile}</span>
                      <span className="font-bold text-blue-700">Rs.{transferAmount}</span>
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleUserTransferProcess}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-12 font-semibold"
                  disabled={!transferMobile || transferMobile.length !== 10 || !transferAmount}
                  data-testid="process-user-transfer-btn"
                >
                  Process Transfer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bank Withdrawal */}
          <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
            <DialogTrigger asChild>
              <Button className="h-24 bg-white border-2 border-orange-200 hover:border-orange-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:shadow-xl" data-testid="withdraw-btn">
                <Bank size={32} weight="duotone" className="text-orange-600" />
                <span className="font-bold">Withdraw Money</span>
                <span className="text-xs text-slate-500">Bank / UPI</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="withdraw-dialog" className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>Withdraw Money</DialogTitle>
                <DialogDescription>Main Wallet se Bank ya UPI par paisa nikalein</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setWithdrawMethod('bank')}
                    className={`h-10 rounded-lg font-semibold text-sm transition ${withdrawMethod === 'bank' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    data-testid="wd-method-bank"
                  >🏦 Bank Transfer</button>
                  <button
                    onClick={() => setWithdrawMethod('upi')}
                    className={`h-10 rounded-lg font-semibold text-sm transition ${withdrawMethod === 'upi' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    data-testid="wd-method-upi"
                  >📱 UPI</button>
                </div>

                <div className="space-y-2">
                  <Label>Amount (Rs.)</Label>
                  <Input
                    type="number"
                    placeholder="Min Rs.100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="border-2 border-slate-200 focus:border-orange-500 rounded-xl h-12"
                    data-testid="withdraw-amount-input"
                  />
                  <p className="text-xs text-slate-500">Available: Rs.{walletData.main_wallet.toFixed(2)} | Min: Rs.100 | 2% platform fee</p>
                </div>

                {withdrawMethod === 'bank' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input
                        type="text"
                        placeholder="As per bank records"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="border-2 border-slate-200 focus:border-orange-500 rounded-xl h-12"
                        data-testid="account-holder-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        type="text"
                        placeholder="e.g., State Bank of India"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="border-2 border-slate-200 focus:border-orange-500 rounded-xl h-12"
                        data-testid="bank-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        type="text"
                        placeholder="Enter account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        className="border-2 border-slate-200 focus:border-orange-500 rounded-xl h-12"
                        data-testid="account-number-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code</Label>
                      <Input
                        type="text"
                        placeholder="e.g., SBIN0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="border-2 border-slate-200 focus:border-orange-500 rounded-xl h-12"
                        data-testid="ifsc-code-input"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      type="text"
                      placeholder="e.g., name@okicici"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                      className="border-2 border-slate-200 focus:border-orange-500 rounded-xl h-12"
                      data-testid="upi-id-input"
                    />
                    <p className="text-xs text-slate-500">Google Pay / PhonePe / Paytm / BHIM UPI supported</p>
                  </div>
                )}

                {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-rose-50 p-4 rounded-xl border border-orange-200 space-y-1.5">
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Amount</span><span className="font-semibold">Rs.{parseFloat(withdrawAmount).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Platform Fee (2%)</span><span className="font-semibold text-rose-600">- Rs.{(parseFloat(withdrawAmount) * 0.02).toFixed(2)}</span></div>
                    <div className="border-t border-orange-200 pt-1.5 flex justify-between"><span className="font-bold text-slate-900">You Receive</span><span className="font-extrabold text-emerald-700">Rs.{(parseFloat(withdrawAmount) * 0.98).toFixed(2)}</span></div>
                  </div>
                )}
                <Button
                  onClick={handleWithdrawProcess}
                  className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 rounded-xl h-12 font-semibold"
                  disabled={
                    !withdrawAmount || parseFloat(withdrawAmount) < 100 ||
                    (withdrawMethod === 'bank' ? (!bankName || !accountNumber || !ifscCode) : !upiId.includes('@'))
                  }
                  data-testid="process-withdraw-btn"
                >
                  Process Withdrawal
                </Button>
                <Button onClick={() => { setWithdrawDialog(false); navigate('/withdrawals'); }} variant="ghost" className="w-full text-orange-600 hover:text-orange-700" data-testid="view-withdrawal-history">
                  View Withdrawal History →
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* PIN Dialog - shows after any Process click */}
      <PinDialog
        open={showPinDialog}
        onClose={() => { setShowPinDialog(false); setPendingAction(null); }}
        onConfirm={handlePinConfirm}
        title={
          pendingAction === 'self_transfer' ? 'Confirm Self Transfer' :
          pendingAction === 'user_transfer' ? 'Confirm Send Money' :
          pendingAction === 'withdraw' ? 'Confirm Withdrawal' : 'Enter PIN'
        }
        description={
          pendingAction === 'self_transfer' ? `Rs.${selfAmount} transfer ke liye PIN dalein` :
          pendingAction === 'user_transfer' ? `Rs.${transferAmount} ${transferMobile} ko bhejne ke liye PIN dalein` :
          pendingAction === 'withdraw' ? `Rs.${withdrawAmount} bank withdrawal ke liye PIN dalein` : 'Security PIN dalein'
        }
        isLoading={isLoading}
      />
    </div>
  );
};

export default WalletPage;
