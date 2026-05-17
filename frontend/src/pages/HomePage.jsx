import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, ArrowRight, Star, Shield, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listingAPI, adminAPI } from '@/services/api';
import { ListingCard, ListingCardSkeleton, SectionHeader } from '@/components/common/UI';
import { MULUND_AREAS } from '@/utils/helpers';

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ area: '', checkIn: '', checkOut: '', guests: 2 });

  const { data: featured, isLoading } = useQuery({
    queryKey: ['listings-featured'],
    queryFn: () => listingAPI.search({ sort: 'relevance', limit: 6 }),
    select: (d) => d?.data?.listings || [],
  });

  // Fetch dashboard stats for real numbers
  const { data: stats } = useQuery({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      try {
        const result = await adminAPI.getDashboard();
        return result?.data || {};
      } catch {
        return {};
      }
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.area) params.set('area', search.area);
    if (search.checkIn) params.set('checkIn', search.checkIn);
    if (search.checkOut) params.set('checkOut', search.checkOut);
    if (search.guests) params.set('guests', search.guests);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center bg-hero-pattern overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1600"
            alt="Mulund Mumbai"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900" />
        </div>

        <div className="container-page relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/30 rounded-full text-sm text-brand-300 mb-6">
              <MapPin size={14} /> Mulund East & West, Mumbai
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-dark-50 mb-5 leading-tight">
              Find Your Perfect
              <br />
              <span className="text-gradient">Stay in Mulund</span>
            </h1>
            <p className="text-dark-300 text-lg md:text-xl max-w-xl mx-auto">
              Verified rooms, flats & homes — from Mulund Station to Nahur. Book directly with trusted hosts.
            </p>
          </motion.div>

          {/* Search card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <form onSubmit={handleSearch} className="glass rounded-2xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <select
                      value={search.area}
                      onChange={(e) => setSearch({ ...search, area: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="">Any area</option>
                      {MULUND_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Check-in</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="date"
                      value={search.checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Check-out</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="date"
                      value={search.checkOut}
                      min={search.checkIn || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Guests</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                      <input
                        type="number"
                        min={1} max={20}
                        value={search.guests}
                        onChange={(e) => setSearch({ ...search, guests: e.target.value })}
                        className="w-full pl-9 pr-3 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 text-sm focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <button type="submit" className="btn-primary px-5 py-3 rounded-xl">
                      <Search size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Quick area links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {['Mulund East', 'Mulund West', 'Near Station', 'Budget Stays', 'Family Rooms'].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/search?area=${encodeURIComponent(tag)}`)}
                className="px-4 py-1.5 bg-dark-800/60 backdrop-blur border border-dark-600 rounded-full text-sm text-dark-300 hover:border-brand-500/50 hover:text-brand-300 transition-all"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────── */}
      <section className="py-10 bg-dark-950 border-y border-dark-700/50">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Listings', value: stats?.activeListings || '0', icon: '🏠' },
              { label: 'Total Bookings', value: stats?.totalBookings || '0', icon: '📅' },
              { label: 'Verified Hosts', value: stats?.verifiedHosts || '0', icon: '🤝' },
              { label: 'Areas Covered', value: MULUND_AREAS.length, icon: '📍' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-display font-bold text-dark-50">{stat.value}</div>
                <div className="text-sm text-dark-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ────────────────────────── */}
      {featured && featured.length > 0 ? (
        <section className="py-16 container-page">
          <SectionHeader
            title="Featured Stays"
            subtitle="Handpicked properties in Mulund"
            action={
              <a href="/search" className="btn-ghost text-brand-400 flex items-center gap-1 text-sm">
                View all <ArrowRight size={14} />
              </a>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)
              : featured?.map((l, i) => <ListingCard key={l._id} listing={l} index={i} />)
            }
          </div>
        </section>
      ) : !isLoading ? (
        <section className="py-16 container-page">
          <div className="text-center py-12 bg-dark-800/30 rounded-2xl border border-dark-700">
            <p className="text-dark-400 text-lg mb-4">🏗️ Featured Stays coming soon!</p>
            <p className="text-dark-500 text-sm mb-6">Our hosts are preparing amazing properties. Check back soon!</p>
            <a href="/register" className="btn-primary inline-block">Become a Host</a>
          </div>
        </section>
      ) : null}

      {/* ── Why MulundStays ──────────────────────────── */}
      <section className="py-16 bg-dark-950">
        <div className="container-page">
          <SectionHeader title="Why MulundStays?" subtitle="Built for Mumbai's local community" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={24} />, title: 'Verified Hosts', desc: 'Every host completes Aadhaar & PAN KYC. You always know who you\'re staying with.', color: 'emerald' },
              { icon: <Zap size={24} />, title: 'Instant Book', desc: 'Many listings support instant booking — no need to wait for host approval.', color: 'amber' },
              { icon: <Star size={24} />, title: 'Genuine Reviews', desc: 'Reviews are only from guests who actually stayed — no fake ratings ever.', color: 'brand' },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className={`w-12 h-12 rounded-xl bg-${f.color}-500/10 border border-${f.color}-500/20 flex items-center justify-center text-${f.color}-400 mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-dark-50 mb-2">{f.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Host CTA ─────────────────────────────────── */}
      <section className="py-16 container-page">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900/40 to-dark-950 border border-brand-500/20 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
          <div className="relative max-w-xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-50 mb-4">
              Have a flat in Mulund?
              <br />
              <span className="text-brand-400">Earn from it.</span>
            </h2>
            <p className="text-dark-300 mb-6">
              List your property on MulundStays and reach hundreds of travelers every month. Setup takes less than 10 minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/register" className="btn-primary">Start Hosting</a>
              <a href="/search" className="btn-secondary">Explore First</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
