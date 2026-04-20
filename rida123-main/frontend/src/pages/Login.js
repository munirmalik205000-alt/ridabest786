import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Lock, Eye, EyeSlash, Lightning, ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleMobileChange = (e) => {
    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) return toast.error('Mobile number must be exactly 10 digits');
    if (!password) return toast.error('Password required');
    setIsLoading(true);
    const result = await login(mobile, password);
    setIsLoading(false);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 sm:p-6">
      {/* Subtle pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #047857 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
            <Lightning size={28} weight="fill" className="text-white sm:size-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            SmartPay<span className="text-emerald-600">360</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">India's trusted recharge & invest app</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/60" data-testid="login-card">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Welcome back 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Log in to manage your money</p>

          <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
            <div>
              <Label htmlFor="mobile" className="text-slate-700 text-sm font-semibold">Mobile Number</Label>
              <div className="relative mt-1.5">
                <Phone size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile"
                  value={mobile}
                  onChange={handleMobileChange}
                  className="pl-10 pr-14 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  required
                  maxLength={10}
                  data-testid="login-mobile-input"
                />
                {mobile.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">{mobile.length}/10</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Password</Label>
                <Link to="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold" data-testid="forgot-password-link">
                  Forgot?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-11 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
              disabled={isLoading}
              data-testid="login-submit-btn"
            >
              {isLoading ? 'Logging in...' : (<span className="flex items-center justify-center gap-2">Log in <ArrowRight size={18} weight="bold" /></span>)}
            </Button>
          </form>

          <div className="mt-5 sm:mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold" data-testid="register-link">
              Sign Up Free
            </Link>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] sm:text-xs text-slate-500 mt-5 sm:mt-6">
          <ShieldCheck size={14} weight="duotone" className="text-emerald-600" />
          Bank-grade encryption · RBI-compliant withdrawals
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
