import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, User, Phone, EnvelopeSimple, MapPin, IdentificationCard, LockKey, Upload, UserCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    nominee_name: '',
    nominee_relation: '',
    nominee_mobile: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/profile`, {
        withCredentials: true
      });
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        address: data.address || '',
        nominee_name: data.nominee_name || '',
        nominee_relation: data.nominee_relation || '',
        nominee_mobile: data.nominee_mobile || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put(`${API_URL}/api/profile`, formData, {
        withCredentials: true
      });
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update failed');
    }
  };

  const handlePinSetup = async () => {
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      setConfirmPin('');
      setPinStep(2);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/auth/setup-pin`,
        { pin },
        { withCredentials: true }
      );
      toast.success('PIN created successfully!');
      setShowPinSetup(false);
      setPin('');
      setConfirmPin('');
      setPinStep(1);
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create PIN');
    }
  };

  const handleFileUpload = async (fileType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);

    try {
      await axios.post(`${API_URL}/api/profile/upload-kyc`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${fileType} uploaded successfully!`);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="profile-title">My Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Personal Information */}
        <Card className="border-slate-200 rounded-2xl" data-testid="personal-info-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User size={24} className="text-emerald-600" weight="duotone" />
                Personal Information
              </CardTitle>
              <Button
                onClick={() => setEditing(!editing)}
                variant="outline"
                className="rounded-xl"
                data-testid="edit-profile-btn"
              >
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl"
                  data-testid="name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={user?.mobile}
                  disabled
                  className="rounded-xl bg-slate-100"
                  data-testid="mobile-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl"
                  data-testid="email-input"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl"
                  rows={3}
                  data-testid="address-input"
                />
              </div>
            </div>
            {editing && (
              <Button
                onClick={handleUpdateProfile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                data-testid="save-profile-btn"
              >
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Transaction PIN */}
        <Card className="border-slate-200 rounded-2xl" data-testid="pin-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKey size={24} className="text-emerald-600" weight="duotone" />
              Transaction PIN
            </CardTitle>
            <CardDescription>
              4-digit PIN for secure transactions (Recharge, Transfer, Withdrawal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.has_pin ? (
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <p className="text-emerald-700 font-medium">✓ PIN is already set</p>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => navigate('/forgot-password')}
                  data-testid="change-pin-btn"
                >
                  Change PIN
                </Button>
              </div>
            ) : (
              <div>
                {!showPinSetup ? (
                  <Button
                    onClick={() => setShowPinSetup(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                    data-testid="create-pin-btn"
                  >
                    Create PIN
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-center block">
                        {pinStep === 1 ? 'Enter 4-digit PIN' : 'Confirm your PIN'}
                      </Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={4}
                          value={pinStep === 1 ? pin : confirmPin}
                          onChange={(value) => {
                            if (pinStep === 1) {
                              setPin(value);
                              if (value.length === 4) setPinStep(2);
                            } else {
                              setConfirmPin(value);
                            }
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
                    </div>
                    {pinStep === 2 && (
                      <Button
                        onClick={handlePinSetup}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                        disabled={confirmPin.length !== 4}
                        data-testid="confirm-pin-btn"
                      >
                        Confirm PIN
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Documents */}
        <Card className="border-slate-200 rounded-2xl" data-testid="kyc-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdentificationCard size={24} className="text-emerald-600" weight="duotone" />
              KYC Documents
            </CardTitle>
            <CardDescription>Upload Aadhaar Card & PAN Card for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar Card</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="aadhaar"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('aadhaar', e)}
                    className="rounded-xl"
                    data-testid="aadhaar-upload"
                  />
                  <Upload size={20} className="text-slate-400" />
                </div>
                {profile.kyc_aadhaar && (
                  <p className="text-xs text-emerald-600">✓ Uploaded</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN Card</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pan"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('pan', e)}
                    className="rounded-xl"
                    data-testid="pan-upload"
                  />
                  <Upload size={20} className="text-slate-400" />
                </div>
                {profile.kyc_pan && (
                  <p className="text-xs text-emerald-600">✓ Uploaded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nominee Details */}
        <Card className="border-slate-200 rounded-2xl" data-testid="nominee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle size={24} className="text-emerald-600" weight="duotone" />
              Nominee Details
            </CardTitle>
            <CardDescription>Add nominee for account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nominee_name">Nominee Name</Label>
                <Input
                  id="nominee_name"
                  value={formData.nominee_name}
                  onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl"
                  data-testid="nominee-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominee_relation">Relation</Label>
                <Input
                  id="nominee_relation"
                  value={formData.nominee_relation}
                  onChange={(e) => setFormData({ ...formData, nominee_relation: e.target.value })}
                  disabled={!editing}
                  placeholder="e.g., Father, Mother, Spouse"
                  className="rounded-xl"
                  data-testid="nominee-relation-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominee_mobile">Nominee Mobile</Label>
                <Input
                  id="nominee_mobile"
                  type="tel"
                  value={formData.nominee_mobile}
                  onChange={(e) => setFormData({ ...formData, nominee_mobile: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl"
                  maxLength={10}
                  data-testid="nominee-mobile-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
