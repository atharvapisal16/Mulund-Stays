// VerifyOTPPage.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import { Spinner } from '@/components/common/UI';
import toast from 'react-hot-toast';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = Array(6).fill(0).map(() => useRef(null));

  const { mutate: verify, isPending } = useMutation({
    mutationFn: () => authAPI.verifyOTP({ otp: otp.join('') }),
    onSuccess: () => {
      toast.success('Phone verified! ✅');
      navigate('/');
    },
    onError: (err) => toast.error(err.message || 'Invalid OTP'),
  });

  const { mutate: resend } = useMutation({
    mutationFn: authAPI.resendOTP,
    onSuccess: () => toast.success('OTP resent!'),
    onError: (err) => toast.error(err.message),
  });

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">📱</div>
        <h1 className="text-2xl font-display font-bold text-dark-50 mb-2">Verify your phone</h1>
        <p className="text-dark-400 text-sm">We sent a 6-digit OTP to <span className="text-dark-200">+91 {user?.phone}</span></p>
      </div>
      <div className="card p-6">
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-dark-600 focus:border-brand-500 rounded-xl"
            />
          ))}
        </div>
        <button onClick={() => verify()} disabled={otp.join('').length < 6 || isPending} className="btn-primary w-full mb-3">
          {isPending ? <Spinner size="sm" /> : null}
          {isPending ? 'Verifying...' : 'Verify OTP'}
        </button>
        <button onClick={() => resend()} className="btn-ghost w-full text-sm text-dark-400">
          Didn't receive? Resend OTP
        </button>
      </div>
    </motion.div>
  );
}
