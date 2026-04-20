import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, fromDate, toDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/transactions?`;
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (fromDate) url += `from_date=${fromDate}&`;
      if (toDate) url += `to_date=${toDate}&`;
      
      const { data } = await axios.get(url, { withCredentials: true });
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Status', 'Description'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.amount,
        t.status,
        t.description || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  const getAmountColor = (amount) => {
    return amount >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getStatusBadge = (status) => {
    const colors = {
      success: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-amber-100 text-amber-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="transactions-title">Transaction History</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card className="p-6 border-slate-200 rounded-2xl" data-testid="filters-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="rounded-xl" data-testid="filter-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="recharge">Recharge</SelectItem>
                  <SelectItem value="self_transfer">Self Transfer</SelectItem>
                  <SelectItem value="user_transfer">User Transfer</SelectItem>
                  <SelectItem value="fund_added">Fund Added</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl"
                data-testid="from-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl"
                data-testid="to-date-input"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={exportTransactions}
                className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl"
                disabled={transactions.length === 0}
                data-testid="export-btn"
              >
                <DownloadSimple size={20} className="mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="transactions-list">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Description</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500" data-testid="no-transactions">No transactions found</td>
                  </tr>
                ) : (
                  transactions.map((txn, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                      data-testid={`transaction-row-${idx}`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium capitalize">
                        {txn.type.replace('_', ' ')}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold text-right ${getAmountColor(txn.amount)}`}>
                        {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {txn.description || '-'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
