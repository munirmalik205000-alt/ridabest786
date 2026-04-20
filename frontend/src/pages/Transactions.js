import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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

  // ✅ FIXED useEffect (no error now)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTransactions();
  }, []);

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
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">Transaction History</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card className="p-6 border-slate-200 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="recharge">Recharge</SelectItem>
                <SelectItem value="self_transfer">Self Transfer</SelectItem>
                <SelectItem value="user_transfer">User Transfer</SelectItem>
                <SelectItem value="fund_added">Fund Added</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

            <Button onClick={exportTransactions} disabled={transactions.length === 0}>
              <DownloadSimple size={20} className="mr-2" />
              Export CSV
            </Button>

          </div>
        </Card>

        <Card className="border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5}>No transactions found</td></tr>
              ) : (
                transactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                    <td>{txn.type}</td>
                    <td className={getAmountColor(txn.amount)}>
                      ₹{txn.amount}
                    </td>
                    <td>{txn.status}</td>
                    <td>{txn.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
