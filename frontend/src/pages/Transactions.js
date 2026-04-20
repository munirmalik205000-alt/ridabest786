import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Transactions = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ FIX: Auto fetch on filter change
  useEffect(() => {
    fetchTransactions();
  }, [filterType, fromDate, toDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let params = new URLSearchParams();

      if (filterType !== 'all') params.append('type', filterType);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const url = `${API_URL}/api/transactions?${params.toString()}`;

      const { data } = await axios.get(url, { withCredentials: true });
      setTransactions(data?.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Safe CSV export
  const exportTransactions = () => {
    const csvRows = [
      ['Date', 'Type', 'Amount', 'Status', 'Description'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.amount,
        t.status,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ])
    ];

    const csv = csvRows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
      success: 'bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs',
      pending: 'bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs',
      failed: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs'
    };
    return colors[status] || 'bg-gray-100 px-2 py-1 rounded-full text-xs';
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
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

        {/* Filters */}
        <Card className="p-6 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
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

            <Button onClick={exportTransactions} disabled={!transactions.length}>
              <DownloadSimple size={20} className="mr-2" />
              Export CSV
            </Button>

          </div>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">Loading...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">No transactions found</td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="border-t">
                    <td className="p-3">{new Date(txn.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{txn.type}</td>
                    <td className={`p-3 font-semibold ${getAmountColor(txn.amount)}`}>
                      ₹{txn.amount}
                    </td>
                    <td className="p-3">
                      <span className={getStatusBadge(txn.status)}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-3">{txn.description || '-'}</td>
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
