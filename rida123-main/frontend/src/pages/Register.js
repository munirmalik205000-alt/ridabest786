import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Lock, Ticket, Eye, EyeSlash, CheckCircle, Lightning, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Register = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleMobileChange = (e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));

  const handleReferralCodeChange = async (e) => {
    const code = e.target.value.toUpperCase().slice(0, 12);
    setReferralCode(code);
    if (code.length >= 6) {
      try {
        const { data } = await axios.get(`${API_URL}/api/check-referral/${code}`);
        setReferrerName(data.exists ? data.name : '');
      } catch {
        setReferrerName('');
      }
    } else {
      setReferrerName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Full name required');
    if (mobile.length !== 10) return toast.error('Mobile number must be exactly 10 digits');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    setIsLoading(true);
    const result = await register(name, mobile, password, referralCode || null);
    setIsLoading(false);
    if (result.success) {
      toast.success('Account created! Welcome on board 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  const inputClass = 'pl-10 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 sm:p-6">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #047857 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2">
            <Lightning size={24} weight="fill" className="text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            SmartPay<span className="text-emerald-600">360</span>
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/60" data-testid="register-card">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Create your account</h2>
          <p className="text-slate-500 text-sm mt-1">Earn daily · Recharge smart · Grow together</p>

          <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
            <div>
              <Label className="text-slate-700 text-sm font-semibold">Referral Code <span className="text-slate-400 font-normal">(optional)</span></Label>
              <div className="relative mt-1.5">
                <Ticket size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  type="text"
                  placeholder="e.g. ADMIN001"
                  value={referralCode}
                  onChange={handleReferralCodeChange}
                  className={`${inputClass} pr-32 uppercase tracking-widest`}
                  data-testid="register-referral-input"
                />
                {referrerName && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 max-w-[120px] truncate">
                    <CheckCircle size={12} weight="fill" /> {referrerName}
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Full Name</Label>
              <div className="relative mt-1.5">
                <User size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Mobile Number</Label>
              <div className="relative mt-1.5">
                <Phone size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile"
                  value={mobile}
                  onChange={handleMobileChange}
                  className={`${inputClass} pr-14`}
                  required
                  maxLength={10}
                  data-testid="register-mobile-input"
                />
                {mobile.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">{mobile.length}/10</span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Password</Label>
              <div className="relative mt-1.5">
                <Lock size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  required
                  data-testid="register-password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" data-testid="toggle-password-btn">
                  {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-sm font-semibold">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  required
                  data-testid="register-confirm-password-input"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" data-testid="toggle-confirm-password-btn">
                  {showConfirmPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-[11px] font-medium mt-1 ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
              disabled={isLoading}
              data-testid="register-submit-btn"
            >
              {isLoading ? 'Creating...' : (<span className="flex items-center justify-center gap-2">Create Account <ArrowRight size={18} weight="bold" /></span>)}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold" data-testid="login-link">
              Log in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
