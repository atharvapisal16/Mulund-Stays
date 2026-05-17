// ResetPasswordPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authAPI } from '@/services/api';
import { FieldError, Spinner } from '@/components/common/UI';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (d) => authAPI.resetPassword(token, { password: d.password }),
    onSuccess: () => { toast.success('Password reset!'); navigate('/login'); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-50 mb-2">Set new password</h1>
      </div>
      <div className="card p-6">
        <form onSubmit={handleSubmit(mutate)} className="space-y-4">
          <div className="form-group">
            <label>New Password</label>
            <input type="password" placeholder="Min 8 chars..." {...register('password')} />
            <FieldError message={errors.password?.message} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" {...register('confirm')} />
            <FieldError message={errors.confirm?.message} />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? <Spinner size="sm" /> : null} Reset Password
          </button>
        </form>
      </div>
    </motion.div>
  );
}
