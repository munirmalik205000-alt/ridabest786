import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { LockKey } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SetupPIN = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePinComplete = (value) => {
    if (step === 1) {
      setPin(value);
      setStep(2);
    } else {
      setConfirmPin(value);
    }
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      setConfirmPin('');
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/setup-pin`,
        { pin },
        { withCredentials: true }
      );
      toast.success('PIN setup successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to setup PIN');
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
        <Card className="border-slate-200 shadow-xl" data-testid="setup-pin-card">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <LockKey size={32} weight="duotone" className="text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Setup Transaction PIN
            </CardTitle>
            <CardDescription className="text-slate-600">
              {step === 1 ? 'Enter a 4-digit PIN' : 'Confirm your PIN'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={step === 1 ? pin : confirmPin}
                onChange={(value) => {
                  if (step === 1) setPin(value);
                  else setConfirmPin(value);
                  if (value.length === 4) handlePinComplete(value);
                }}
                data-testid="pin-input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-2xl border-slate-300" />
                  <InputOTPSlot index={1} className="w-14 h-14 text-2xl border-slate-300" />
                  <InputOTPSlot index={2} className="w-14 h-14 text-2xl border-slate-300" />
                  <InputOTPSlot index={3} className="w-14 h-14 text-2xl border-slate-300" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {step === 2 && (
              <Button
                onClick={handleSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-semibold shadow-sm transition-all"
                disabled={confirmPin.length !== 4 || isLoading}
                data-testid="setup-pin-submit-btn"
              >
                {isLoading ? 'Setting up...' : 'Confirm PIN'}
              </Button>
            )}
            {step === 2 && (
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setPin('');
                  setConfirmPin('');
                }}
                className="w-full rounded-xl h-10"
                data-testid="reset-pin-btn"
              >
                Reset
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupPIN;
