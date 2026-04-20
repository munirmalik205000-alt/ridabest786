import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Upload, CheckCircle, Bank, Image as ImageIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AddFund = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // For demo, we'll just use a placeholder URL
      setScreenshot(`uploaded_${file.name}`);
      toast.success('Screenshot selected');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !utrNumber || !screenshot) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/add-fund-request`,
        {
          amount: parseFloat(amount),
          utr_number: utrNumber,
          screenshot_url: screenshot,
          payment_method: paymentMethod,
          remarks: remarks
        },
        { withCredentials: true }
      );
      
      toast.success('Fund request submitted successfully! Waiting for admin approval.');
      
      // Reset form
      setAmount('');
      setUtrNumber('');
      setScreenshot('');
      setPaymentMethod('');
      setRemarks('');
      setSelectedFile(null);
      
      // Navigate to transactions after 2 seconds
      setTimeout(() => {
        navigate('/transactions');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="add-fund-title">
              Add Fund to E-Wallet
            </h1>
            <p className="text-emerald-100 text-sm">Submit payment proof for admin approval</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-emerald-200 shadow-2xl rounded-2xl" data-testid="add-fund-card">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                  <Plus size={24} weight="duotone" className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Fund Request Form</CardTitle>
                  <CardDescription>Fill details to add money to your E-Wallet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Bank size={20} weight="duotone" />
                  Payment Instructions
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Make payment to admin bank account</li>
                  <li>✓ Note down UTR/Transaction Reference Number</li>
                  <li>✓ Take screenshot of payment confirmation</li>
                  <li>✓ Submit this form for approval</li>
                  <li>✓ Funds will be credited after admin verification</li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-slate-700 font-semibold text-base">
                    Amount (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to add"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl h-12 text-lg"
                    required
                    min="1"
                    data-testid="fund-amount-input"
                  />
                  <p className="text-xs text-slate-500">Minimum: ₹100</p>
                </div>

                {/* UTR Number */}
                <div className="space-y-2">
                  <Label htmlFor="utr" className="text-slate-700 font-semibold text-base">
                    UTR / Transaction Reference Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="utr"
                    type="text"
                    placeholder="Enter 12-digit UTR number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                    className="border-2 border-purple-600 rounded-xl h-12 text-lg font-mono"
                    required
                    data-testid="utr-number-input"
                  />
                  <p className="text-xs text-slate-500">Example: HDFC12345678, IMPS123456789012</p>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="method" className="text-slate-700 font-semibold text-base">
                    Payment Method
                  </Label>
                  <Input
                    id="method"
                    type="text"
                    placeholder="e.g., UPI, NEFT, IMPS, Bank Transfer"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    data-testid="payment-method-input"
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label htmlFor="screenshot" className="text-slate-700 font-semibold text-base">
                    Payment Screenshot <span className="text-red-500">*</span>
                  </Label>
                  <div className="border-2 border-dashed border-purple-600 rounded-xl p-6 bg-purple-50/30 hover:bg-purple-50 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-3">
                      {selectedFile ? (
                        <div className="text-center">
                          <CheckCircle size={48} weight="duotone" className="text-emerald-600 mx-auto mb-2" />
                          <p className="font-semibold text-emerald-700">{selectedFile.name}</p>
                          <p className="text-xs text-slate-500 mt-1">File selected successfully</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={48} weight="duotone" className="text-purple-400" />
                          <div className="text-center">
                            <p className="font-semibold text-slate-700">Upload Payment Screenshot</p>
                            <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        </>
                      )}
                      <label htmlFor="fileInput" className="cursor-pointer">
                        <div className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2">
                          <Upload size={20} />
                          {selectedFile ? 'Change File' : 'Choose File'}
                        </div>
                        <input
                          id="fileInput"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          data-testid="screenshot-upload"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks" className="text-slate-700 font-semibold text-base">
                    Remarks (Optional)
                  </Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any additional information..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl"
                    rows={3}
                    data-testid="remarks-input"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-14 font-bold text-lg shadow-lg transition-all hover:scale-[1.02]"
                  disabled={isLoading || !amount || !utrNumber || !screenshot}
                  data-testid="submit-fund-request-btn"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle size={24} weight="duotone" />
                      Submit Fund Request
                    </span>
                  )}
                </Button>
              </form>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
                <p className="text-sm text-amber-900">
                  <strong>⏱ Processing Time:</strong> Fund requests are typically approved within 1-2 hours during business hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AddFund;
