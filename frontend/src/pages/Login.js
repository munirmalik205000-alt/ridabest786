import React, { useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
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
  const navigate = useNavigate();

  const handleMobileChange = (e) => {
    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
  };

  // ✅ FIXED LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mobile.length !== 10) {
      return toast.error('Mobile number must be exactly 10 digits');
    }

    if (!password) {
      return toast.error('Password required');
    }

    setIsLoading(true);

    try {
      const querySnapshot = await getDocs(collection(db, "users"));

      let foundUser = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.mobile === mobile && data.password === password) {
          foundUser = data;
        }
      });

      if (foundUser) {
        // 🔥 IMPORTANT: user save करना
        localStorage.setItem("user", JSON.stringify(foundUser));

        toast.success('Login successful ✅');
        navigate('/dashboard');
      } else {
        toast.error('Wrong mobile or password ❌');
      }

    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-gradient-soft flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg mb-3">
            <Lightning size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">SMARTPAY360</h1>
        </div>

        <div className="surface-glass rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold">Welcome back </h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">

            <div>
              <Label>Mobile Number</Label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3" />
                <Input
                  type="tel"
                  value={mobile}
                  onChange={handleMobileChange}
                  className="pl-10"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Logging in...' : (
                <span className="flex items-center justify-center gap-2">
                  Log in <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register">Create account</Link>
          </div>
        </div>

        <p className="text-center text-xs mt-4 flex items-center justify-center gap-1">
          <ShieldCheck size={14} />
          Secure login
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
