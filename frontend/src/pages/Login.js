import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, Eye, EyeSlash, Lightning, ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState(''); // ✅ mobile → email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return toast.error('Enter valid email');
    }

    if (!password) return toast.error('Password required');

    setIsLoading(true);
    const result = await login(email, password); // ✅ email pass karo
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

      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mb-3">
            <Lightning size={28} weight="fill" className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">
            SMART<span className="text-brand-gradient">PAY360</span>
          </h1>
        </div>

        <div className="surface-glass rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold">Welcome back</h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* ✅ EMAIL INPUT */}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-3 text-primary" size={18} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            <Link to="/register" className="text-primary font-bold">
              Create Account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs mt-5 flex justify-center gap-1">
          <ShieldCheck size={14} />
          Secure Login
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
