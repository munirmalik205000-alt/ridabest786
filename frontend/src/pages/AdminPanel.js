import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Users, CurrencyCircleDollar, Lightning, Gear, Plus, Check, X, UploadSimple, Image, Bank, Package, IdentificationCard, Trash, Receipt, Tag, Coin, DeviceMobileCamera, Prohibit } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [coinPackages, setCoinPackages] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createPackageDialog, setCreatePackageDialog] = useState(false);
  const [bannerDialog, setBannerDialog] = useState(false);
  const [packageAmount, setPackageAmount] = useState('');
  const [packageCoins, setPackageCoins] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [bannerColor, setBannerColor] = useState('from-purple-600 via-pink-600 to-rose-600');
  const [bannerImages, setBannerImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bannerSubTab, setBannerSubTab] = useState('text');
  const [uploading, setUploading] = useState(false);
  // New tabs state
  const [withdrawals, setWithdrawals] = useState([]);
  const [investPackages, setInvestPackages] = useState([]);
  const [kycUsers, setKycUsers] = useState([]);
  const [newPkg, setNewPkg] = useState({ name: '', price: '', daily_income: '', duration_days: '', total_return: '', badge: '', color: 'from-emerald-500 to-teal-500' });
  const [createInvestDialog, setCreateInvestDialog] = useState(false);
  // Recharge / cashback / coin states
  const [rechargePlans, setRechargePlans] = useState([]);
  const [cashbackRules, setCashbackRules] = useState([]);
  const [coinSettings, setCoinSettings] = useState({ coins_per_rupee: 10, max_coins_per_recharge: 50, enabled: true });
  const [rechargeStats, setRechargeStats] = useState(null);
  const [adminRecharges, setAdminRecharges] = useState([]);
  const [createRechargePlanDialog, setCreateRechargePlanDialog] = useState(false);
  const [createCashbackDialog, setCreateCashbackDialog] = useState(false);
  const [newRechargePlan, setNewRechargePlan] = useState({ operator: 'AIRTEL', category: 'unlimited', price: '', validity: '', data: '', calls: '', sms: '', description: '' });
  const [newCashback, setNewCashback] = useState({ operator: '', type: 'fixed', value: '', min_amount: '', max_amount: '', priority: 10 });

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchFundRequests();
    fetchCoinPackages();
    fetchBannerSettings();
    fetchWithdrawals();
    fetchInvestPackages();
    fetchKycUsers();
    fetchRechargePlans();
    fetchCashbackRules();
    fetchCoinSettings();
    fetchRechargeStats();
    fetchAdminRecharges();
  }, []);

  const fetchRechargePlans = async () => {
    try { const { data } = await axios.get(`${API_URL}/api/admin/recharge-plans`); setRechargePlans(data.plans); } catch (e) { console.error(e); }
  };
  const fetchCashbackRules = async () => {
    try { const { data } = await axios.get(`${API_URL}/api/admin/cashback-rules`); setCashbackRules(data.rules); } catch (e) { console.error(e); }
  };
  const fetchCoinSettings = async () => {
    try { const { data } = await axios.get(`${API_URL}/api/admin/coin-settings`); setCoinSettings(data); } catch (e) { console.error(e); }
  };
  const fetchRechargeStats = async () => {
    try { const { data } = await axios.get(`${API_URL}/api/admin/recharge-stats`); setRechargeStats(data); } catch (e) { console.error(e); }
  };
  const fetchAdminRecharges = async () => {
    try { const { data } = await axios.get(`${API_URL}/api/admin/recharges`); setAdminRecharges(data.recharges); } catch (e) { console.error(e); }
  };

  const handleCreateRechargePlan = async () => {
    const p = newRechargePlan;
    if (!p.price || !p.validity) return toast.error('Price & validity required');
    try {
      await axios.post(`${API_URL}/api/admin/recharge-plans`, { ...p, price: parseFloat(p.price) });
      toast.success('Plan created');
      setCreateRechargePlanDialog(false);
      setNewRechargePlan({ operator: 'AIRTEL', category: 'unlimited', price: '', validity: '', data: '', calls: '', sms: '', description: '' });
      fetchRechargePlans();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDeleteRechargePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try { await axios.delete(`${API_URL}/api/admin/recharge-plans/${id}`); toast.success('Deleted'); fetchRechargePlans(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleCreateCashback = async () => {
    const c = newCashback;
    if (!c.value) return toast.error('Value required');
    try {
      await axios.post(`${API_URL}/api/admin/cashback-rules`, {
        operator: c.operator || null,
        type: c.type,
        value: parseFloat(c.value),
        min_amount: parseFloat(c.min_amount || 0),
        max_amount: c.max_amount ? parseFloat(c.max_amount) : null,
        enabled: true,
        priority: parseInt(c.priority || 0, 10),
      });
      toast.success('Rule added');
      setCreateCashbackDialog(false);
      setNewCashback({ operator: '', type: 'fixed', value: '', min_amount: '', max_amount: '', priority: 10 });
      fetchCashbackRules();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDeleteCashback = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try { await axios.delete(`${API_URL}/api/admin/cashback-rules/${id}`); toast.success('Deleted'); fetchCashbackRules(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleSaveCoinSettings = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/coin-settings`, {
        coins_per_rupee: parseFloat(coinSettings.coins_per_rupee),
        max_coins_per_recharge: parseInt(coinSettings.max_coins_per_recharge, 10),
        enabled: !!coinSettings.enabled,
      });
      toast.success('Coin settings saved');
    } catch (e) { toast.error('Failed'); }
  };

  const handleAdjustCoins = async (userId, delta) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/adjust-coins`, { user_id: userId, delta, reason: 'Admin adjustment' });
      toast.success(`Adjusted ${delta > 0 ? '+' : ''}${delta} coins`);
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleBlockUser = async (userId, blocked) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/block`, { user_id: userId, blocked });
      toast.success(blocked ? 'User blocked' : 'User unblocked');
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/withdrawals`, { withCredentials: true });
      setWithdrawals(data.withdrawals);
    } catch (e) { console.error(e); }
  };

  const fetchInvestPackages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/packages`, { withCredentials: true });
      setInvestPackages(data.packages);
    } catch (e) { console.error(e); }
  };

  const fetchKycUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/kyc`, { withCredentials: true });
      setKycUsers(data.users);
    } catch (e) { console.error(e); }
  };

  const handleApproveWithdrawal = async (id, status) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/approve-withdrawal`, { request_id: id, status }, { withCredentials: true });
      toast.success(`Withdrawal ${status}`);
      fetchWithdrawals();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed');
    } finally { setIsLoading(false); }
  };

  const handleCreateInvestPackage = async () => {
    const p = newPkg;
    if (!p.name || !p.price || !p.daily_income || !p.duration_days || !p.total_return) return toast.error('All fields required');
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/packages`, {
        name: p.name,
        price: parseFloat(p.price),
        daily_income: parseFloat(p.daily_income),
        duration_days: parseInt(p.duration_days),
        total_return: parseFloat(p.total_return),
        badge: p.badge || null,
        color: p.color
      }, { withCredentials: true });
      toast.success('Package created');
      setCreateInvestDialog(false);
      setNewPkg({ name: '', price: '', daily_income: '', duration_days: '', total_return: '', badge: '', color: 'from-emerald-500 to-teal-500' });
      fetchInvestPackages();
    } catch (e) { toast.error(e.response?.data?.detail || 'Create failed'); }
    finally { setIsLoading(false); }
  };

  const handleTogglePackage = async (id, active) => {
    try {
      await axios.post(`${API_URL}/api/admin/packages/toggle`, { package_id: id, active }, { withCredentials: true });
      toast.success(active ? 'Activated' : 'Deactivated');
      fetchInvestPackages();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/packages/${id}`, { withCredentials: true });
      toast.success('Deleted');
      fetchInvestPackages();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleKycDecision = async (user_id, decision) => {
    try {
      await axios.post(`${API_URL}/api/admin/kyc/decision`, { user_id, decision }, { withCredentials: true });
      toast.success(`KYC ${decision}`);
      fetchKycUsers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/dashboard`, {
        withCredentials: true
      });
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true
      });
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchFundRequests = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/fund-requests`, {
        withCredentials: true
      });
      setFundRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch fund requests:', error);
    }
  };

  const fetchCoinPackages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/coin-packages`, {
        withCredentials: true
      });
      setCoinPackages(data.packages);
    } catch (error) {
      console.error('Failed to fetch coin packages:', error);
    }
  };

  const fetchBannerSettings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/banner`, {
        withCredentials: true
      });
      setBannerText(data.text || '');
      setBannerColor(data.color || 'from-purple-600 via-pink-600 to-rose-600');
      setBannerImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch banner settings:', error);
    }
  };

  const handleApproveFund = async (requestId, status) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/approve-fund`,
        { request_id: requestId, status },
        { withCredentials: true }
      );
      toast.success(`Request ${status}!`);
      fetchFundRequests();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/coin-packages`,
        {
          amount: parseFloat(packageAmount),
          coins: parseInt(packageCoins)
        },
        { withCredentials: true }
      );
      toast.success('Package created!');
      setCreatePackageDialog(false);
      setPackageAmount('');
      setPackageCoins('');
      fetchCoinPackages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBanner = async (type) => {
    setIsLoading(true);
    try {
      if (type === 'text') {
        await axios.post(
          `${API_URL}/api/admin/banner/text`,
          { text: bannerText, color: bannerColor },
          { withCredentials: true }
        );
        toast.success('Text banner updated!');
      } else {
        await axios.post(
          `${API_URL}/api/admin/banner/image`,
          { images: bannerImages },
          { withCredentials: true }
        );
        toast.success('Image banner updated!');
      }
      setBannerDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setBannerImages([...bannerImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Sirf image files allowed hain');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File 5MB se chhoti honi chahiye');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post(`${API_URL}/api/admin/banner/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fullUrl = `${API_URL}${data.url}`;
      setBannerImages([...bannerImages, fullUrl]);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setBannerImages(bannerImages.filter((_, i) => i !== index));
  };

  if (!dashboardData) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-panel-title">Admin Panel</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 md:mx-0 px-4 md:px-0 no-scrollbar" data-testid="admin-tabs">
          {[
            { k: 'dashboard', label: 'Dashboard', icon: Lightning },
            { k: 'users', label: 'Users', icon: Users },
            { k: 'funds', label: 'Fund Requests', icon: CurrencyCircleDollar },
            { k: 'withdrawals', label: 'Withdrawals', icon: Bank },
            { k: 'recharge_plans', label: 'Recharge Plans', icon: DeviceMobileCamera },
            { k: 'cashback', label: 'Cashback', icon: Tag },
            { k: 'coin_sys', label: 'Coin System', icon: Coin },
            { k: 'transactions', label: 'Transactions', icon: Receipt },
            { k: 'invest', label: 'Packages', icon: Package },
            { k: 'kyc', label: 'KYC', icon: IdentificationCard },
            { k: 'packages', label: 'Coin Packages', icon: CurrencyCircleDollar },
            { k: 'banner', label: 'Banner', icon: Image },
          ].map((t) => (
            <Button
              key={t.k}
              onClick={() => setActiveTab(t.k)}
              variant={activeTab === t.k ? 'default' : 'outline'}
              className={`rounded-xl whitespace-nowrap flex items-center gap-2 ${activeTab === t.k ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              data-testid={`tab-${t.k}`}
            >
              <t.icon size={16} weight="duotone" /> {t.label}
            </Button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="total-users-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users size={24} weight="duotone" className="text-blue-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Users</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dashboardData.total_users}
                </p>
              </Card>

              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="pending-funds-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <CurrencyCircleDollar size={24} weight="duotone" className="text-amber-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Pending Funds</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dashboardData.pending_funds}
                </p>
              </Card>

              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="total-recharges-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Lightning size={24} weight="duotone" className="text-emerald-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Recharges</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dashboardData.total_recharges}
                </p>
              </Card>

              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="recharge-amount-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <CurrencyCircleDollar size={24} weight="duotone" className="text-purple-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Recharge Amount</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  ₹{dashboardData.total_recharge_amount.toFixed(2)}
                </p>
              </Card>
            </div>

            {rechargeStats && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Recharge Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="recharge-metrics-row">
                  <Card className="p-5 border-slate-200 rounded-2xl bg-violet-50">
                    <DeviceMobileCamera size={22} weight="duotone" className="text-violet-600 mb-2" />
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">Total Recharges</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{rechargeStats.total_recharges}</p>
                  </Card>
                  <Card className="p-5 border-slate-200 rounded-2xl bg-emerald-50">
                    <CurrencyCircleDollar size={22} weight="duotone" className="text-emerald-600 mb-2" />
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">Recharge Amount</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{rechargeStats.total_recharge_amount.toFixed(2)}</p>
                  </Card>
                  <Card className="p-5 border-slate-200 rounded-2xl bg-pink-50">
                    <Tag size={22} weight="duotone" className="text-pink-600 mb-2" />
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">Cashback Given</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{rechargeStats.total_cashback_given.toFixed(2)}</p>
                  </Card>
                  <Card className="p-5 border-slate-200 rounded-2xl bg-amber-50">
                    <Coin size={22} weight="duotone" className="text-amber-600 mb-2" />
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">Coins Used</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{rechargeStats.total_coins_used}</p>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="users-list">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">Mobile</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">Main</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">E-Wallet</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">Coins</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">Refs</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`user-row-${idx}`}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.mobile}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">₹{u.main_wallet.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-600 font-semibold">₹{u.e_wallet.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-amber-600 font-semibold">{u.coins || 0}</td>
                      <td className="px-4 py-3 text-sm text-center">{u.direct_referrals}</td>
                      <td className="px-4 py-3 text-center">
                        {u.blocked ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Blocked</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" onClick={() => handleAdjustCoins(u._id, 50)} className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2" title="Add 50 coins" data-testid={`add-coins-${idx}`}>
                            <Coin size={14} /> +50
                          </Button>
                          <Button size="sm" onClick={() => handleAdjustCoins(u._id, -50)} className="h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 px-2" title="Remove 50 coins" data-testid={`rm-coins-${idx}`}>
                            -50
                          </Button>
                          <Button size="sm" onClick={() => handleBlockUser(u._id, !u.blocked)} className={`h-8 rounded-lg px-2 ${u.blocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white`} data-testid={`block-${idx}`}>
                            <Prohibit size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'funds' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="funds-list">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mobile</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundRequests.filter(req => req.status === 'pending').map((req, idx) => (
                    <tr key={req._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`fund-request-${idx}`}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{req.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{req.mobile}</td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-600 font-bold">
                        ₹{req.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveFund(req._id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg h-8"
                            disabled={isLoading}
                            data-testid={`approve-btn-${idx}`}
                          >
                            <Check size={16} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproveFund(req._id, 'rejected')}
                            className="rounded-lg h-8"
                            disabled={isLoading}
                            data-testid={`reject-btn-${idx}`}
                          >
                            <X size={16} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fundRequests.filter(req => req.status === 'pending').length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500" data-testid="no-pending-funds">
                        No pending fund requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={createPackageDialog} onOpenChange={setCreatePackageDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" data-testid="create-package-btn">
                    <Plus size={20} className="mr-2" />
                    Create Package
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="create-package-dialog">
                  <DialogHeader>
                    <DialogTitle>Create Coin Package</DialogTitle>
                    <DialogDescription>Define amount and coins for the package</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="packageAmount">Amount (₹)</Label>
                      <Input
                        id="packageAmount"
                        type="number"
                        placeholder="e.g., 100"
                        value={packageAmount}
                        onChange={(e) => setPackageAmount(e.target.value)}
                        className="rounded-xl"
                        data-testid="package-amount-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="packageCoins">Coins</Label>
                      <Input
                        id="packageCoins"
                        type="number"
                        placeholder="e.g., 50"
                        value={packageCoins}
                        onChange={(e) => setPackageCoins(e.target.value)}
                        className="rounded-xl"
                        data-testid="package-coins-input"
                      />
                    </div>
                    <Button
                      onClick={handleCreatePackage}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                      disabled={isLoading || !packageAmount || !packageCoins}
                      data-testid="submit-package-btn"
                    >
                      {isLoading ? 'Creating...' : 'Create Package'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coinPackages.map((pkg, idx) => (
                <Card key={idx} className="p-6 border-slate-200 rounded-2xl" data-testid={`package-card-${idx}`}>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                      <CurrencyCircleDollar size={32} weight="duotone" className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        ₹{pkg.amount}
                      </p>
                      <p className="text-slate-600 mt-2">
                        Get <span className="font-bold text-amber-600">{pkg.coins} Coins</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recharge_plans' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Recharge Plans</h3>
              <Dialog open={createRechargePlanDialog} onOpenChange={setCreateRechargePlanDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl" data-testid="create-rc-plan-btn">
                    <Plus size={18} className="mr-1" /> New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="create-rc-plan-dialog">
                  <DialogHeader>
                    <DialogTitle>Create Recharge Plan</DialogTitle>
                    <DialogDescription>This plan will appear in user recharge screen</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="space-y-1.5">
                      <Label>Operator</Label>
                      <Select value={newRechargePlan.operator} onValueChange={(v) => setNewRechargePlan({ ...newRechargePlan, operator: v })}>
                        <SelectTrigger className="rounded-xl" data-testid="rc-plan-op"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AIRTEL">Airtel</SelectItem>
                          <SelectItem value="JIO">Jio</SelectItem>
                          <SelectItem value="VI">Vi</SelectItem>
                          <SelectItem value="BSNL">BSNL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select value={newRechargePlan.category} onValueChange={(v) => setNewRechargePlan({ ...newRechargePlan, category: v })}>
                        <SelectTrigger className="rounded-xl" data-testid="rc-plan-cat"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unlimited">Truly Unlimited</SelectItem>
                          <SelectItem value="data">Data</SelectItem>
                          <SelectItem value="vouchers">Vouchers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price (₹)</Label>
                      <Input type="number" value={newRechargePlan.price} onChange={(e) => setNewRechargePlan({ ...newRechargePlan, price: e.target.value })} placeholder="299" className="rounded-xl" data-testid="rc-plan-price" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Validity</Label>
                      <Input value={newRechargePlan.validity} onChange={(e) => setNewRechargePlan({ ...newRechargePlan, validity: e.target.value })} placeholder="28 Days" className="rounded-xl" data-testid="rc-plan-validity" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Data</Label>
                      <Input value={newRechargePlan.data} onChange={(e) => setNewRechargePlan({ ...newRechargePlan, data: e.target.value })} placeholder="1.5GB/day" className="rounded-xl" data-testid="rc-plan-data" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Calls</Label>
                      <Input value={newRechargePlan.calls} onChange={(e) => setNewRechargePlan({ ...newRechargePlan, calls: e.target.value })} placeholder="Unlimited local & STD" className="rounded-xl" data-testid="rc-plan-calls" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>SMS</Label>
                      <Input value={newRechargePlan.sms} onChange={(e) => setNewRechargePlan({ ...newRechargePlan, sms: e.target.value })} placeholder="100 SMS/day" className="rounded-xl" data-testid="rc-plan-sms" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Description</Label>
                      <Input value={newRechargePlan.description} onChange={(e) => setNewRechargePlan({ ...newRechargePlan, description: e.target.value })} placeholder="Popular pack" className="rounded-xl" data-testid="rc-plan-desc" />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleCreateRechargePlan} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11" data-testid="rc-plan-submit">Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Operator</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Category</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-700">Price</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Validity</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Data</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Calls</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechargePlans.map((p, idx) => (
                      <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`rc-plan-row-${idx}`}>
                        <td className="px-4 py-3 font-semibold">{p.operator}</td>
                        <td className="px-4 py-3 capitalize">{p.category}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">₹{p.price}</td>
                        <td className="px-4 py-3">{p.validity}</td>
                        <td className="px-4 py-3 text-slate-600">{p.data || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{p.calls || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRechargePlan(p._id)} className="h-8 rounded-lg" data-testid={`rc-plan-del-${idx}`}>
                            <Trash size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {rechargePlans.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No plans yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'cashback' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Cashback Rules</h3>
              <Dialog open={createCashbackDialog} onOpenChange={setCreateCashbackDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl" data-testid="create-cb-btn">
                    <Plus size={18} className="mr-1" /> New Rule
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="create-cb-dialog">
                  <DialogHeader>
                    <DialogTitle>Cashback Rule</DialogTitle>
                    <DialogDescription>Rules are applied by priority (highest first)</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Operator (blank = all)</Label>
                      <Select value={newCashback.operator || 'ALL'} onValueChange={(v) => setNewCashback({ ...newCashback, operator: v === 'ALL' ? '' : v })}>
                        <SelectTrigger className="rounded-xl" data-testid="cb-op"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Operators</SelectItem>
                          <SelectItem value="AIRTEL">Airtel</SelectItem>
                          <SelectItem value="JIO">Jio</SelectItem>
                          <SelectItem value="VI">Vi</SelectItem>
                          <SelectItem value="BSNL">BSNL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={newCashback.type} onValueChange={(v) => setNewCashback({ ...newCashback, type: v })}>
                        <SelectTrigger className="rounded-xl" data-testid="cb-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed (₹)</SelectItem>
                          <SelectItem value="percent">Percent (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Value</Label>
                      <Input type="number" value={newCashback.value} onChange={(e) => setNewCashback({ ...newCashback, value: e.target.value })} placeholder={newCashback.type === 'fixed' ? '5' : '2'} className="rounded-xl" data-testid="cb-value" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Min Amount</Label>
                      <Input type="number" value={newCashback.min_amount} onChange={(e) => setNewCashback({ ...newCashback, min_amount: e.target.value })} placeholder="100" className="rounded-xl" data-testid="cb-min" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max Amount (blank = none)</Label>
                      <Input type="number" value={newCashback.max_amount} onChange={(e) => setNewCashback({ ...newCashback, max_amount: e.target.value })} placeholder="500" className="rounded-xl" data-testid="cb-max" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Priority</Label>
                      <Input type="number" value={newCashback.priority} onChange={(e) => setNewCashback({ ...newCashback, priority: e.target.value })} className="rounded-xl" data-testid="cb-priority" />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleCreateCashback} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11" data-testid="cb-submit">Create Rule</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Operator</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-700">Type</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-700">Value</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-700">Min</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-700">Max</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-700">Priority</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashbackRules.map((r, idx) => (
                      <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`cb-row-${idx}`}>
                        <td className="px-4 py-3">{r.operator || <span className="text-slate-400">All</span>}</td>
                        <td className="px-4 py-3 capitalize">{r.type}</td>
                        <td className="px-4 py-3 text-right font-bold">{r.type === 'percent' ? `${r.value}%` : `₹${r.value}`}</td>
                        <td className="px-4 py-3 text-right">₹{r.min_amount || 0}</td>
                        <td className="px-4 py-3 text-right">{r.max_amount ? `₹${r.max_amount}` : '—'}</td>
                        <td className="px-4 py-3 text-center">{r.priority || 0}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCashback(r._id)} className="h-8 rounded-lg" data-testid={`cb-del-${idx}`}><Trash size={14} /></Button>
                        </td>
                      </tr>
                    ))}
                    {cashbackRules.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No rules yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'coin_sys' && (
          <Card className="p-5 sm:p-6 border-slate-200 rounded-2xl max-w-2xl" data-testid="coin-settings-card">
            <div className="flex items-center gap-2 mb-4">
              <Coin size={24} weight="fill" className="text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Coin System Control</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div>
                  <div className="font-semibold text-slate-900">Enable Coin Discount</div>
                  <div className="text-xs text-slate-600">Allow users to spend coins on recharges</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!coinSettings.enabled}
                  onChange={(e) => setCoinSettings({ ...coinSettings, enabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500"
                  data-testid="coin-enabled-toggle"
                />
              </div>
              <div>
                <Label>Coins per Rupee (e.g. 10 means 100 coins = ₹10)</Label>
                <Input type="number" step="0.1" value={coinSettings.coins_per_rupee} onChange={(e) => setCoinSettings({ ...coinSettings, coins_per_rupee: e.target.value })} className="rounded-xl h-12 mt-1.5" data-testid="coins-per-rupee-input" />
              </div>
              <div>
                <Label>Max Coins per Recharge</Label>
                <Input type="number" value={coinSettings.max_coins_per_recharge} onChange={(e) => setCoinSettings({ ...coinSettings, max_coins_per_recharge: e.target.value })} className="rounded-xl h-12 mt-1.5" data-testid="max-coins-input" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700">
                Preview: <strong>{coinSettings.max_coins_per_recharge}</strong> coins = ₹{(coinSettings.max_coins_per_recharge / (coinSettings.coins_per_rupee || 1)).toFixed(2)} max discount per recharge.
              </div>
              <Button onClick={handleSaveCoinSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11" data-testid="save-coin-settings-btn">Save Settings</Button>
            </div>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="admin-recharges-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-700">User</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700">Number</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700">Operator</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700">Cashback</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700">Coins Used</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700">Final</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {adminRecharges.map((r, idx) => (
                    <tr key={r._id} className="border-b border-slate-100" data-testid={`tx-row-${idx}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.user_name || '-'}</div>
                        <div className="text-xs text-slate-500">{r.user_mobile}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">{r.number}</td>
                      <td className="px-4 py-3">{r.operator}</td>
                      <td className="px-4 py-3 text-right font-bold">₹{r.amount}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">₹{(r.cashback || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{r.coins_used || 0}</td>
                      <td className="px-4 py-3 text-right font-bold text-violet-700">₹{(r.final_amount || r.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'success' ? 'bg-emerald-100 text-emerald-800' : r.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {adminRecharges.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-slate-500">No transactions yet</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'withdrawals' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="admin-withdrawals-list">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Net</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Details</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, idx) => {
                    const isUpi = (w.method || 'bank') === 'upi';
                    return (
                      <tr key={w._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`wd-row-${idx}`}>
                        <td className="px-4 py-3 text-sm font-semibold">{isUpi ? '📱 UPI' : '🏦 Bank'}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-900">₹{w.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-emerald-700 font-semibold">₹{(w.net_amount ?? w.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {isUpi ? w.upi_id : (<>
                            <div className="font-semibold">{w.bank_name}</div>
                            <div className="text-slate-500">A/C {w.account_number} · {w.ifsc_code}</div>
                          </>)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${w.status === 'pending' ? 'bg-amber-100 text-amber-800' : w.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{w.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {w.status === 'pending' && (
                            <div className="flex items-center justify-center gap-2">
                              <Button size="sm" onClick={() => handleApproveWithdrawal(w._id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 h-8 rounded-lg" disabled={isLoading} data-testid={`wd-approve-${idx}`}>
                                <Check size={14} className="mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleApproveWithdrawal(w._id, 'rejected')} className="h-8 rounded-lg" disabled={isLoading} data-testid={`wd-reject-${idx}`}>
                                <X size={14} className="mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {withdrawals.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500" data-testid="no-withdrawals">No withdrawals yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'invest' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={createInvestDialog} onOpenChange={setCreateInvestDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" data-testid="create-invest-pkg-btn">
                    <Plus size={18} className="mr-2" /> New Investment Package
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="create-invest-pkg-dialog" className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Investment Package</DialogTitle>
                    <DialogDescription>Users activate & earn daily income</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Name</Label>
                      <Input placeholder="e.g. Gold" value={newPkg.name} onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })} className="rounded-xl" data-testid="inv-pkg-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price (₹)</Label>
                      <Input type="number" placeholder="3000" value={newPkg.price} onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })} className="rounded-xl" data-testid="inv-pkg-price" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Daily Income (₹)</Label>
                      <Input type="number" placeholder="150" value={newPkg.daily_income} onChange={(e) => setNewPkg({ ...newPkg, daily_income: e.target.value })} className="rounded-xl" data-testid="inv-pkg-daily" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duration (days)</Label>
                      <Input type="number" placeholder="28" value={newPkg.duration_days} onChange={(e) => setNewPkg({ ...newPkg, duration_days: e.target.value })} className="rounded-xl" data-testid="inv-pkg-duration" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Total Return (₹)</Label>
                      <Input type="number" placeholder="4200" value={newPkg.total_return} onChange={(e) => setNewPkg({ ...newPkg, total_return: e.target.value })} className="rounded-xl" data-testid="inv-pkg-total" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Badge (optional)</Label>
                      <Input placeholder="Popular / Best Value" value={newPkg.badge} onChange={(e) => setNewPkg({ ...newPkg, badge: e.target.value })} className="rounded-xl" data-testid="inv-pkg-badge" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Color Gradient</Label>
                      <Select value={newPkg.color} onValueChange={(v) => setNewPkg({ ...newPkg, color: v })}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="from-emerald-500 to-teal-500">Emerald</SelectItem>
                          <SelectItem value="from-slate-500 to-slate-700">Silver</SelectItem>
                          <SelectItem value="from-amber-500 to-orange-500">Gold</SelectItem>
                          <SelectItem value="from-indigo-500 to-purple-600">Platinum</SelectItem>
                          <SelectItem value="from-cyan-500 to-blue-600">Diamond</SelectItem>
                          <SelectItem value="from-rose-500 to-pink-600">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className={`h-8 rounded-xl bg-gradient-to-r ${newPkg.color}`}></div>
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleCreateInvestPackage} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 mt-2" disabled={isLoading} data-testid="inv-pkg-submit">
                        {isLoading ? 'Creating...' : 'Create Package'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {investPackages.map((p) => (
                <Card key={p._id} className={`relative overflow-hidden border-0 rounded-2xl shadow-lg text-white ${p.active ? '' : 'opacity-60 grayscale'}`} data-testid={`inv-pkg-card-${p._id}`}>
                  <div className={`bg-gradient-to-br ${p.color || 'from-emerald-500 to-teal-500'} p-5`}>
                    {p.badge && <span className="absolute top-3 right-3 bg-white/20 backdrop-blur text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full border border-white/30">{p.badge}</span>}
                    <div className="text-xs uppercase tracking-widest opacity-80">{p.code || p.name}</div>
                    <div className="text-2xl font-extrabold mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{p.name}</div>
                    <div className="mt-2 text-3xl font-black">₹{p.price.toFixed(0)}</div>
                    <div className="text-sm opacity-90 mt-1">₹{p.daily_income.toFixed(0)}/day · {p.duration_days}d · Total ₹{p.total_return.toFixed(0)}</div>
                  </div>
                  <div className="p-3 bg-white flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleTogglePackage(p._id, !p.active)} className={`rounded-lg h-8 text-xs font-semibold ${p.active ? 'bg-slate-200 hover:bg-slate-300 text-slate-900' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`} data-testid={`inv-pkg-toggle-${p._id}`}>
                        {p.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeletePackage(p._id)} className="rounded-lg h-8 px-2" data-testid={`inv-pkg-delete-${p._id}`}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {investPackages.length === 0 && (
                <div className="col-span-full text-center text-slate-500 py-10 bg-white rounded-2xl border border-slate-200">No packages yet. Click "New Investment Package".</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="admin-kyc-list">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">User</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Aadhaar</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">PAN</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycUsers.filter((u) => u.kyc_aadhaar || u.kyc_pan).map((u, idx) => (
                    <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`kyc-row-${idx}`}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.mobile}</td>
                      <td className="px-4 py-3 text-xs">{u.kyc_aadhaar ? <span className="text-emerald-600 font-semibold">✓ Uploaded</span> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-xs">{u.kyc_pan ? <span className="text-emerald-600 font-semibold">✓ Uploaded</span> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.kyc_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : u.kyc_status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                          {u.kyc_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(u.kyc_status || 'pending') === 'pending' && (
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" onClick={() => handleKycDecision(u._id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 h-8 rounded-lg" data-testid={`kyc-approve-${idx}`}>
                              <Check size={14} className="mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleKycDecision(u._id, 'rejected')} className="h-8 rounded-lg" data-testid={`kyc-reject-${idx}`}>
                              <X size={14} className="mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {kycUsers.filter((u) => u.kyc_aadhaar || u.kyc_pan).length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500" data-testid="no-kyc">No KYC submissions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'banner' && (
          <div className="space-y-6">
            {/* Sub-tabs: Text Banner / Image Banner */}
            <div className="flex gap-3 mb-4">
              <Button
                onClick={() => setBannerSubTab('text')}
                variant={bannerSubTab === 'text' ? 'default' : 'outline'}
                className={`rounded-xl ${bannerSubTab === 'text' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                data-testid="banner-sub-tab-text"
              >
                Text Banner
              </Button>
              <Button
                onClick={() => setBannerSubTab('image')}
                variant={bannerSubTab === 'image' ? 'default' : 'outline'}
                className={`rounded-xl ${bannerSubTab === 'image' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                data-testid="banner-sub-tab-image"
              >
                Image Banner
              </Button>
            </div>

            {/* Text Banner Section */}
            {bannerSubTab === 'text' && (
              <Card className="border-slate-200 rounded-2xl p-6" data-testid="text-banner-card">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Text Banner Settings</h3>
                <p className="text-sm text-slate-600 mb-6">Dashboard pe ek motivational text banner dikhega</p>

                {/* Preview */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold mb-2 block">Preview:</Label>
                  <div className={`bg-gradient-to-r ${bannerColor} text-white p-6 rounded-2xl`}>
                    <p className="text-lg font-bold text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {bannerText || 'Earn Smart - Grow Fast - Achieve More'}
                    </p>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bannerText">Banner Text</Label>
                    <Input
                      id="bannerText"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Earn Smart - Grow Fast - Achieve More"
                      className="border-2 border-purple-600 rounded-xl h-12"
                      data-testid="banner-text-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Banner Color</Label>
                    <Select value={bannerColor} onValueChange={setBannerColor}>
                      <SelectTrigger className="border-2 border-purple-600 rounded-xl h-12" data-testid="banner-color-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="from-purple-600 via-pink-600 to-rose-600">Purple - Pink - Rose</SelectItem>
                        <SelectItem value="from-blue-600 via-indigo-600 to-purple-600">Blue - Indigo - Purple</SelectItem>
                        <SelectItem value="from-emerald-600 via-teal-600 to-cyan-600">Emerald - Teal - Cyan</SelectItem>
                        <SelectItem value="from-orange-600 via-red-600 to-pink-600">Orange - Red - Pink</SelectItem>
                        <SelectItem value="from-yellow-500 via-amber-500 to-orange-600">Yellow - Amber - Orange</SelectItem>
                        <SelectItem value="from-slate-900 via-slate-800 to-slate-900">Dark Slate</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className={`h-8 rounded-xl bg-gradient-to-r ${bannerColor}`}></div>
                  </div>
                  <Button
                    onClick={() => handleUpdateBanner('text')}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 rounded-xl h-12"
                    disabled={isLoading}
                    data-testid="save-text-banner-btn"
                  >
                    {isLoading ? 'Saving...' : 'Save Text Banner'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Image Banner Section */}
            {bannerSubTab === 'image' && (
              <Card className="border-slate-200 rounded-2xl p-6" data-testid="image-banner-card">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Image Banner / Slider</h3>
                <p className="text-sm text-slate-600 mb-6">Dashboard pe image slider banner dikhega. Direct image file upload karein.</p>

                {/* Image Preview */}
                {bannerImages.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-sm font-semibold mb-2 block">Preview ({bannerImages.length} images):</Label>
                    <div className="relative overflow-hidden rounded-2xl h-40 bg-slate-100">
                      <img 
                        src={bannerImages[0]} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/800x200?text=Image+Banner'; }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* File Upload - Primary */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Upload Image File</Label>
                    <div className="flex gap-2 items-center">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-3 border-2 border-dashed border-purple-400 rounded-xl h-14 bg-purple-50 hover:bg-purple-100 transition-colors">
                          <UploadSimple size={22} className="text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">
                            {uploading ? 'Uploading...' : 'Click to Upload Image (JPG, PNG, WebP)'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          data-testid="file-upload-input"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">Max 5MB. Supported: JPG, PNG, GIF, WebP</p>
                  </div>

                  {/* OR URL Input - Secondary */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">OR paste direct image URL</span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="border-2 border-slate-300 rounded-xl h-11 text-sm"
                        data-testid="image-url-input"
                      />
                      <Button
                        onClick={handleAddImage}
                        type="button"
                        className="bg-slate-600 hover:bg-slate-700 rounded-xl px-5"
                        data-testid="add-image-btn"
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                    <p className="text-xs text-red-500">Note: Sirf direct image URLs kaam karenge (Google Photos sharing links nahi chalenge)</p>
                  </div>

                  {/* Image List */}
                  {bannerImages.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Added Images ({bannerImages.length}):</Label>
                      {bannerImages.map((img, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border">
                          <img src={img} alt={`Img ${idx + 1}`} className="w-16 h-10 object-cover rounded-lg border" onError={(e) => { e.target.src = 'https://via.placeholder.com/64x40?text=Error'; }} />
                          <span className="text-xs flex-1 truncate text-slate-600">{img.length > 50 ? '...' + img.slice(-45) : img}</span>
                          <Button
                            onClick={() => handleRemoveImage(idx)}
                            size="sm"
                            variant="destructive"
                            className="h-8 rounded-lg"
                            data-testid={`remove-image-${idx}`}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => handleUpdateBanner('image')}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 rounded-xl h-12"
                    disabled={isLoading || bannerImages.length === 0}
                    data-testid="save-image-banner-btn"
                  >
                    {isLoading ? 'Saving...' : 'Save Image Banner'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
