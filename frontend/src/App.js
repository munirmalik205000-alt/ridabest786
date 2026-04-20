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

import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';

import './App.css';

const hideNavPaths = ['/login', '/register', '/forgot-password', '/setup-pin', '/admin'];

function AppLayout({ children }) {

  // 🔥 SAFE USER (CRASH FIX)
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

            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/setup-pin" element={<ProtectedRoute><SetupPIN /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="/shopping" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />

            <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />

            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />

            <Route path="/add-fund" element={<ProtectedRoute><AddFund /></ProtectedRoute>} />

            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

            <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

            <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />

            <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />

          </Routes>

        </AppLayout>

        <Toaster position="top-center" richColors />

      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
