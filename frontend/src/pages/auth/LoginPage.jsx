// LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import { FieldError, Spinner } from '@/components/common/UI';
import toast from 'react-hot-toast';

const ADMIN_PORTAL_EMAIL =
  (import.meta.env.VITE_ADMIN_PORTAL_EMAIL || 'mulundstays.companylead.20260421@gmail.com').toLowerCase();

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export default function LoginPage({ adminOnly = false }) {
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const handleLogin = (values) => {
    const normalizedEmail = values.email?.trim().toLowerCase();

    if (adminOnly && normalizedEmail !== ADMIN_PORTAL_EMAIL) {
      toast.error('Only company lead admin email can access this portal.');
      return;
    }

    mutate(values);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      if (adminOnly) {
        const loggedInEmail = data?.user?.email?.toLowerCase();
        const isAuthorizedAdmin = data?.user?.role === 'admin' && loggedInEmail === ADMIN_PORTAL_EMAIL;

        if (!isAuthorizedAdmin) {
          logout();
          toast.error('Access denied. This admin portal is restricted to company lead only.');
          navigate('/login', { replace: true });
          return;
        }
      }

      setAuth(data);
      toast.success(`Welcome back, ${data.user.fullName.split(' ')[0]}! 👋`);
      navigate(data.user.role === 'admin' ? '/admin' : data.user.isHost ? '/host' : '/');
    },
    onError: (err) => toast.error(err.message || 'Login failed'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-dark-50 mb-2">
          {adminOnly ? 'Admin Control Access' : 'Welcome back'}
        </h1>
        <p className="text-dark-400">
          {adminOnly ? 'Authorized company lead login only' : 'Sign in to your MulundStays account'}
        </p>
      </div>

      <div className="card p-6">
        {adminOnly && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-300">
              Allowed admin email: <span className="font-semibold">{ADMIN_PORTAL_EMAIL}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">Forgot password?</Link>
            </div>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" {...register('password')} className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <button type="submit" disabled={isPending} className="btn-primary w-full mt-2">
            {isPending ? <Spinner size="sm" /> : <LogIn size={18} />}
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {!adminOnly && (
          <>
            <div className="divider" />
            <div className="space-y-2">
              <p className="text-xs text-center text-dark-500 mb-2">Quick demo access</p>
              {[
                { label: '👤 Guest Demo', email: 'guest@mulundstays.com', password: 'Guest@123456' },
                { label: '🏠 Host Demo', email: 'host@mulundstays.com', password: 'Host@123456' },
                { label: '⚡ Admin Demo', email: 'admin@mulundstays.com', password: 'Admin@123' },
              ].map((demo) => (
                <button
                  key={demo.label}
                  onClick={() => mutate({ email: demo.email, password: demo.password })}
                  className="w-full py-2 px-3 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg text-xs text-dark-300 transition-all text-left"
                >
                  {demo.label} <span className="text-dark-500">— {demo.email}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {!adminOnly && (
        <p className="text-center text-sm text-dark-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one free</Link>
        </p>
      )}
    </motion.div>
  );
}
