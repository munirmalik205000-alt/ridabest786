import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, Lock } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { mobile });
      toast.success('OTP sent to your mobile (check console)');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        mobile,
        otp,
        new_password: newPassword
      });
      toast.success('Password reset successful!');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-200 shadow-xl" data-testid="forgot-password-card">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-600">
              {step === 1 ? 'Enter your mobile number' : 'Enter OTP and new password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-slate-700 font-medium">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} weight="duotone" />
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter 10-digit mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="pl-11 border-slate-300 rounded-xl h-12 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                      data-testid="forgot-mobile-input"
                    />
                  </div>
                </div>
                <Button
                  onClick={sendOTP}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-semibold shadow-sm transition-all"
                  disabled={isLoading || mobile.length !== 10}
                  data-testid="send-otp-btn"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      data-testid="otp-input"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-12 text-xl border-slate-300" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-xl border-slate-300" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-xl border-slate-300" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-xl border-slate-300" />
                        <InputOTPSlot index={4} className="w-12 h-12 text-xl border-slate-300" />
                        <InputOTPSlot index={5} className="w-12 h-12 text-xl border-slate-300" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700 font-medium">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} weight="duotone" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-11 border-slate-300 rounded-xl h-12 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                      data-testid="new-password-input"
                    />
                  </div>
                </div>
                <Button
                  onClick={resetPassword}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-semibold shadow-sm transition-all"
                  disabled={isLoading || otp.length !== 6 || !newPassword}
                  data-testid="reset-password-btn"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
            <div className="text-center text-sm text-slate-600 mt-4">
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold" data-testid="back-to-login-link">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
