import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const DashboardV2 = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    main_wallet: 0,
    e_wallet: 0,
    today_income: 0,
    total_income: 0,
    coins: 0
  });

  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/dashboard/stats`);
      setData(res?.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const total =
    (data?.main_wallet || 0) +
    (data?.e_wallet || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <button
          onClick={() => setShow(!show)}
          className="bg-gray-700 px-3 py-1 rounded"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {/* BALANCE CARD */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl mb-6 shadow-lg">
        <h3 className="text-sm opacity-80">Total Balance</h3>
        <h1 className="text-4xl font-bold mt-1">
          {show ? `₹${total.toFixed(2)}` : "₹••••"}
        </h1>

        <div className="flex gap-4 mt-4 text-sm">
          <div>Main: ₹{data?.main_wallet || 0}</div>
          <div>E: ₹{data?.e_wallet || 0}</div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Btn label="Recharge" onClick={() => navigate("/recharge")} />
        <Btn label="Wallet" onClick={() => navigate("/wallet")} />
        <Btn label="Add" onClick={() => navigate("/add-fund")} />
        <Btn label="Invest" onClick={() => navigate("/packages")} />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">
        <Card title="Today Income" value={data?.today_income} />
        <Card title="Total Income" value={data?.total_income} />
        <Card title="Coins" value={data?.coins} />
        <Card title="Balance" value={total} />
      </div>

    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="bg-gray-900 p-4 rounded-xl">
    <p className="text-xs opacity-70">{title}</p>
    <h2 className="text-xl font-bold mt-1">₹{value || 0}</h2>
  </div>
);

const Btn = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-800 p-3 rounded-xl text-sm hover:bg-gray-700"
  >
    {label}
  </button>
);

export default DashboardV2;
