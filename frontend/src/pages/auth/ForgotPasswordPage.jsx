// ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/services/api';
import { FieldError, Spinner } from '@/components/common/UI';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [sent, setSent] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.forgotPassword,
    onSuccess: () => { setSent(true); toast.success('Reset link sent!'); },
    onError: (err) => toast.error(err.message),
  });

  if (sent) return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">📧</div>
      <h2 className="text-xl font-display font-bold text-dark-50 mb-2">Check your email</h2>
      <p className="text-dark-400 text-sm mb-6">We've sent a password reset link. It expires in 30 minutes.</p>
      <Link to="/login" className="btn-primary">Back to Login</Link>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-50 mb-2">Forgot password?</h1>
        <p className="text-dark-400 text-sm">Enter your email and we'll send you a reset link.</p>
      </div>
      <div className="card p-6">
        <form onSubmit={handleSubmit(mutate)} className="space-y-4">
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" {...register('email', { required: 'Email required' })} />
            <FieldError message={errors.email?.message} />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? <Spinner size="sm" /> : null}
            Send Reset Link
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-dark-400 mt-4">
        <Link to="/login" className="text-brand-400">← Back to login</Link>
      </p>
    </motion.div>
  );
}


