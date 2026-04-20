<Route path="/dashboard" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
<Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';

import Login from './pages/Login';
import Register from './pages/Register';
import SetupPIN from './pages/SetupPIN';
import ForgotPassword from './pages/ForgotPassword';
import DashboardV2 from './pages/DashboardV2';
import Profile from './pages/Profile';
import Shopping from './pages/Shopping';
import Recharge from './pages/Recharge';
import WalletPage from './pages/WalletPage';
import AddFund from './pages/AddFund';
import Transactions from './pages/Transactions';
import Referrals from './pages/Referrals';
import AdminPanel from './pages/AdminPanel';
import Packages from './pages/Packages';
import Withdrawals from './pages/Withdrawals';

import BottomNav from './components/BottomNav';

import './App.css';

const hideNavPaths = ['/login', '/register', '/forgot-password', '/setup-pin', '/admin'];

function AppLayout({ children }) {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const location = useLocation();

  const hide = hideNavPaths.some((p) => location.pathname.startsWith(p));
  const showNav = !!user && !hide;

  return (
    <>
      <div className={showNav ? 'pb-20 md:pb-0' : ''}>
        {children}
      </div>

      {showNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>

        <AppLayout>

          <Routes>

            {/* 🔥 Direct login show */}
            <Route path="/" element={<Login />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* 🔥 TEMP: Removed ProtectedRoute */}
            <Route path="/setup-pin" element={<SetupPIN />} />
            <Route path="/dashboard" element={<DashboardV2 />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/recharge" element={<Recharge />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/add-fund" element={<AddFund />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/withdrawals" element={<Withdrawals />} />

          </Routes>

        </AppLayout>

        <Toaster position="top-center" richColors />

      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
