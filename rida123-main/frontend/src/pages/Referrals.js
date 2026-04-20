import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Copy, Check, Users, Crown, ChartLineUp } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Referrals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchReferrals();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/referral/stats`, {
        withCredentials: true
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/referral/tree`, {
        withCredentials: true
      });
      setReferrals(data.referrals);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referral_code || '');
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const cycleProgress = (stats.completed_cycles / 10) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="referrals-title">My MLM Team</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card className="p-6 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl" data-testid="referral-code-card">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 mb-2">
              <Crown size={32} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium mb-2">Your Referral Code</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-4xl font-bold text-purple-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {user?.referral_code}
                </p>
                <Button
                  onClick={copyReferralCode}
                  size="sm"
                  variant="ghost"
                  className="text-purple-700 hover:bg-purple-200"
                  data-testid="copy-referral-btn"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-slate-200 rounded-2xl" data-testid="direct-referrals-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={24} weight="duotone" className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Direct Referrals</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stats.direct_referrals}
            </p>
          </Card>

          <Card className="p-6 border-slate-200 rounded-2xl" data-testid="auto-placements-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <ChartLineUp size={24} weight="duotone" className="text-orange-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Auto Placements</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stats.auto_placements}
            </p>
          </Card>

          <Card className="p-6 border-slate-200 rounded-2xl" data-testid="total-team-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users size={24} weight="duotone" className="text-emerald-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Team</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stats.total_referrals}
            </p>
          </Card>

          <Card className="p-6 border-slate-200 rounded-2xl" data-testid="cycles-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown size={24} weight="duotone" className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Completed Cycles</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stats.completed_cycles}/10
            </p>
          </Card>
        </div>

        <Card className="p-6 border-slate-200 rounded-2xl" data-testid="cycle-progress-card">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-slate-700">MLM Cycle Progress</p>
              <p className="text-sm font-bold text-purple-600">{stats.completed_cycles} of 10 Cycles</p>
            </div>
            <Progress value={cycleProgress} className="h-3" data-testid="cycle-progress-bar" />
            <p className="text-xs text-slate-500">
              Complete referrals to unlock more auto placements and earn higher commissions
            </p>
          </div>
        </Card>

        <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="referrals-list">
          <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Direct Referrals</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {referrals.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500" data-testid="no-referrals">
                No referrals yet. Start sharing your code!
              </div>
            ) : (
              referrals.map((ref, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-6 py-4 hover:bg-slate-50"
                  data-testid={`referral-item-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{ref.name}</p>
                      <p className="text-sm text-slate-500">{ref.mobile}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ref.direct_referrals} referrals
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Referrals;
