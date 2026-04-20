import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck } from '@phosphor-icons/react';

const PinDialog = ({ open, onClose, onConfirm, title, description, isLoading }) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (open) setPin('');
  }, [open]);

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-sm" data-testid="pin-dialog">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
            <ShieldCheck size={32} weight="duotone" className="text-white" />
          </div>
          <DialogTitle className="text-xl text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {title || 'Enter Security PIN'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || 'Apna 4-digit security PIN dalein'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={pin} onChange={setPin} data-testid="pin-input">
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-14 h-14 text-2xl font-bold border-2 border-purple-600 rounded-xl" />
                <InputOTPSlot index={1} className="w-14 h-14 text-2xl font-bold border-2 border-purple-600 rounded-xl" />
                <InputOTPSlot index={2} className="w-14 h-14 text-2xl font-bold border-2 border-purple-600 rounded-xl" />
                <InputOTPSlot index={3} className="w-14 h-14 text-2xl font-bold border-2 border-purple-600 rounded-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 rounded-xl h-12 font-bold text-base"
            disabled={isLoading || pin.length !== 4}
            data-testid="pin-confirm-btn"
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDialog;
