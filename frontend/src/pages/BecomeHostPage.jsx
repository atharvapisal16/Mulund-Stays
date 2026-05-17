import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CheckCircle, TrendingUp, Shield, Zap } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { userAPI } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/common/UI';

export default function BecomeHostPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  const { mutate: becomeHost, isPending } = useMutation({
    mutationFn: () => userAPI.becomeHost(),
    onSuccess: (data) => {
      updateUser({ isHost: true, role: 'host' });
      toast.success('Welcome to hosting! 🏠');
      navigate('/host');
    },
    onError: (err) => toast.error(err.message || 'Failed to become a host'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-brand-500/10 to-transparent">
        <div className="container-page text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/40 mb-6">
            <Home size={32} className="text-brand-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-50 mb-4">
            Share Your Space, Earn Money
          </h1>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto mb-8">
            Become a host on MulundStays and start earning from your spare room or entire flat. Join hundreds of hosts in Mulund.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-dark-800/50">
        <div className="container-page">
          <h2 className="text-3xl font-display font-bold text-center text-dark-50 mb-12">Why Host with Us?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Earn More', desc: 'Set your own prices and earn up to ₹5,000+ per night' },
              { icon: Shield, title: 'Protected', desc: 'Our verification system keeps you and guests safe' },
              { icon: Zap, title: 'Easy Setup', desc: 'List your space in minutes with our simple process' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/40 mb-4">
                  <item.icon size={24} className="text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-dark-50 mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="container-page max-w-2xl">
          <h2 className="text-2xl font-display font-bold text-dark-50 mb-8">Host Requirements</h2>
          <div className="space-y-4">
            {[
              '18+ years old with valid photo ID',
              'Phone number verified',
              'Valid address in Mulund or nearby areas',
              'Complete your hosting profile (optional but recommended)',
              'Submit KYC documents for higher trust rating',
            ].map((req, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-1" />
                <span className="text-dark-200">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 flex-grow flex items-end">
        <div className="container-page w-full text-center">
          <button
            onClick={() => becomeHost()}
            disabled={isPending}
            className="btn-primary px-8 py-4 text-lg inline-flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Spinner size={20} />
                Converting...
              </>
            ) : (
              <>
                <Home size={20} />
                Yes, I Want to Become a Host
              </>
            )}
          </button>
          <p className="text-dark-400 text-sm mt-4">
            You can list your first property immediately after signing up
          </p>
        </div>
      </section>
    </motion.div>
  );
}
