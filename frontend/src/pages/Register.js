import React, { useState } from 'react';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Phone, Lock, Ticket, Eye, EyeSlash, CheckCircle, Lightning, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

  const navigate = useNavigate();

  const handleMobileChange = (e) => {
    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
  };

  // ✅ Firebase referral check
  const handleReferralCodeChange = async (e) => {
    const code = e.target.value.toUpperCase().slice(0, 12);
    setReferralCode(code);

    if (code.length >= 6) {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        let found = null;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.referralCode === code) {
            found = data.name;
          }
        });

        setReferrerName(found || '');
      } catch {
        setReferrerName('');
      }
    } else {
      setReferrerName('');
    }
  };

  // ✅ FINAL REGISTER FIX
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Full name required');
    if (mobile.length !== 10) return toast.error('Mobile must be 10 digits');
    if (password.length < 6) return toast.error('Min 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setIsLoading(true);

    try {
      // check existing user
      const snapshot = await getDocs(collection(db, "users"));
      let exists = false;

      snapshot.forEach((doc) => {
        if (doc.data().mobile === mobile) {
          exists = true;
        }
      });

      if (exists) {
        toast.error("User already exists");
        setIsLoading(false);
        return;
      }

      const newUser = {
        name,
        mobile,
        password,
        referralCode: mobile.slice(0, 6),
        referredBy: referralCode || null,
        createdAt: new Date()
      };

      await addDoc(collection(db, "users"), newUser);

      // 🔥 Save user (IMPORTANT)
      localStorage.setItem("user", JSON.stringify(newUser));

      toast.success("Account created 🎉");
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      toast.error("Registration failed");
    }

    setIsLoading(false);
  };

  const inputClass = 'pl-10 h-12 rounded-xl bg-slate-50 border border-slate-200';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        <h2 className="text-xl font-bold mb-4 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label>Referral Code</Label>
            <Input value={referralCode} onChange={handleReferralCodeChange} className={inputClass} />
            {referrerName && <p className="text-green-600 text-xs">Ref: {referrerName}</p>}
          </div>

          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <Label>Mobile</Label>
            <Input value={mobile} onChange={handleMobileChange} maxLength={10} className={inputClass} />
          </div>

          <div>
            <Label>Password</Label>
            <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeSlash size={20}/> : <Eye size={20}/>}
            </button>
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeSlash size={20}/> : <Eye size={20}/>}
            </button>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Register"}
          </Button>

        </form>

        <p className="text-center mt-3">
          Already have account? <Link to="/login">Login</Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Register;
