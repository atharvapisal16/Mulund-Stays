import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import { FieldError, Spinner } from '@/components/common/UI';
import toast from 'react-hot-toast';

const schema = z.object({
  fullName: z.string().min(2, 'Min 2 characters').max(60),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile required'),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase & number'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => authAPI.register(data),
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Account created! Please verify your phone number.');
      navigate('/verify-otp');
    },
    onError: (err) => toast.error(err.message || 'Registration failed'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-dark-50 mb-2">Create account</h1>
        <p className="text-dark-400">Join MulundStays — it's free</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(mutate)} className="space-y-4">
          <div className="form-group">
            <label>Full Name</label>
            <input placeholder="Rahul Sharma" {...register('fullName')} />
            <FieldError message={errors.fullName?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" {...register('email')} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" placeholder="9876543210" maxLength={10} {...register('phone')} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, upper + lower + number" {...register('password')} className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="••••••••" {...register('confirmPassword')} />
            <FieldError message={errors.confirmPassword?.message} />
          </div>

          <div className="form-group">
            <label>Date of Birth <span className="text-dark-500">(must be 18+)</span></label>
            <input type="date" {...register('dateOfBirth')} />
          </div>

          <p className="text-xs text-dark-500 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-brand-400">Terms of Service</a> and{' '}
            <a href="#" className="text-brand-400">Privacy Policy</a>.
          </p>

          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? <Spinner size="sm" /> : <UserPlus size={18} />}
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-dark-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
      </p>
    </motion.div>
  );
}
