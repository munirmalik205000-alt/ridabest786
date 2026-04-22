import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Phone, Lock, Eye, EyeSlash, Lightning, ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="min-h-screen bg-brand-gradient-soft flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated blobs for depth */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, hsl(243 85% 65%), transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, hsl(158 70% 55%), transparent 70%)' }} />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, hsl(270 85% 65%), transparent 70%)' }} />

      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/30 mb-3">
            <Lightning size={28} weight="fill" className="text-white sm:size-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            SMART<span className="text-brand-gradient">PAY360</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Recharge · Bills · Cashback · Earing </p>
        </div>

        <div className="surface-glass rounded-3xl p-5 sm:p-8 shadow-xl" data-testid="login-card">
          <h2 className="text-xl sm:text-2xl font-bold">Welcome back</h2>
          <p className="text-muted-foreground text-sm mt-1">Log in to manage your money</p>

          <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
            <div>
              <Label htmlFor="mobile" className="text-sm font-semibold">Mobile Number</Label>
              <div className="relative mt-1.5">
                <Phone size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                import React, { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Email validation (letters + numbers allowed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert("Invalid email format");
      return;
    }

    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
                {mobile.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground">{mobile.length}/10</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold" data-testid="forgot-password-link">
                  Forgot?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock size={18} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-11 h-12 rounded-xl bg-muted/60"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="btn-brand w-full h-12 rounded-xl font-bold text-white"
              disabled={isLoading}
              data-testid="login-submit-btn"
            >
              {isLoading ? 'Logging in...' : (<span className="flex items-center justify-center gap-2">Log in <ArrowRight size={18} weight="bold" /></span>)}
            </Button>
          </form>

          <div className="mt-5 sm:mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-bold" data-testid="register-link">
              Sign Up Free
            </Link>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] sm:text-xs text-muted-foreground mt-5 sm:mt-6">
          <ShieldCheck size={14} weight="duotone" className="text-primary" />
          Bank-grade encryption · RBI-compliant withdrawals
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
