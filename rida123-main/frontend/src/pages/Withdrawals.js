import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Bank, DeviceMobileCamera, Clock, CheckCircle, XCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusMeta = {
  pending: { color: 'text-amber-500', bg: 'bg-amber-100', Icon: Clock, label: 'Pending' },
  approved: { color: 'text-emerald-600', bg: 'bg-emerald-100', Icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'text-rose-600', bg: 'bg-rose-100', Icon: XCircle, label: 'Rejected' },
};

const Withdrawals = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/wallet/withdrawals`, { withCredentials: true });
        setItems(data.withdrawals);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-orange-600 to-rose-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button onClick={() => navigate('/wallet')} variant="ghost" className="text-white hover:bg-white/10" data-testid="wd-back-btn">
            <ArrowLeft size={22} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="wd-title">Withdrawal History</h1>
            <p className="text-orange-100 text-sm">Track all your bank & UPI withdrawals</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-5 space-y-3">
        {loading && <div className="text-center p-10 text-slate-500">Loading...</div>}
        {!loading && items.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-500 border border-slate-200" data-testid="wd-empty">
            No withdrawals yet. Go to Wallet to make one.
          </div>
        )}
        {items.map((w, i) => {
          const meta = statusMeta[w.status] || statusMeta.pending;
          const M = meta.Icon;
          const isUpi = (w.method || 'bank') === 'upi';
          return (
            <motion.div key={w._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition" data-testid={`wd-row-${w._id}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isUpi ? 'bg-violet-100 text-violet-600' : 'bg-orange-100 text-orange-600'}`}>
                    {isUpi ? <DeviceMobileCamera size={22} weight="duotone" /> : <Bank size={22} weight="duotone" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">
                        {isUpi ? (w.upi_id || 'UPI') : (w.bank_name || 'Bank')}
                      </p>
                      <p className="text-lg font-extrabold text-slate-900">₹{w.amount.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {isUpi ? `UPI` : `A/C ****${(w.account_number || '').slice(-4)} · ${w.ifsc_code || ''}`}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                        <M size={14} weight="fill" /> {meta.label}
                      </span>
                      <p className="text-xs text-slate-500">
                        Net ₹{(w.net_amount ?? w.amount).toFixed(2)} · {new Date(w.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Withdrawals;
