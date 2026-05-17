// HostDashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Home, Plus, TrendingUp } from 'lucide-react';
import { listingAPI, bookingAPI, paymentAPI } from '@/services/api';
import { StatCard, PageHeader, EmptyState } from '@/components/common/UI';
import { formatCurrency, formatDate, bookingStatusColor } from '@/utils/helpers';
import { useAuthStore } from '@/context/authStore';

export default function HostDashboardPage() {
  const { user } = useAuthStore();

  const { data: listings } = useQuery({
    queryKey: ['host-listings'],
    queryFn: () => listingAPI.getMyListings({ limit: 3 }),
    select: (d) => d?.data?.docs || [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['host-bookings-recent'],
    queryFn: () => bookingAPI.getHostBookings({ limit: 5 }),
    select: (d) => d?.data?.docs || [],
  });

  const { data: earnings } = useQuery({
    queryKey: ['host-earnings'],
    queryFn: () => paymentAPI.getEarnings('month'),
    select: (d) => d?.data?.summary,
  });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0]}! 🏠`}
        subtitle="Here's your hosting overview"
        action={<Link to="/host/listings/new" className="btn-primary"><Plus size={16} /> New Listing</Link>}
      />

      {/* KYC banner */}
      {user?.kyc?.kycStatus !== 'approved' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-300 text-sm">⚠ KYC Verification Required</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Complete KYC to publish listings and receive payouts.</p>
          </div>
          <Link to="/host/kyc" className="btn-primary text-sm py-2 px-4">Complete KYC</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Listings" value={listings?.filter(l => l.status === 'active').length || 0} icon="🏠" color="brand" />
        <StatCard label="Total Bookings" value={user?.hostStats?.totalBookings || 0} icon="📅" color="blue" />
        <StatCard label="This Month" value={formatCurrency(earnings?.totalEarnings || 0)} icon="💰" color="emerald" />
        <StatCard label="Avg Rating" value={user?.hostStats?.averageRating ? `${user.hostStats.averageRating} ⭐` : '—'} icon="⭐" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-50">Recent Bookings</h3>
            <Link to="/host/bookings" className="text-sm text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {bookings?.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-6">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {bookings?.slice(0, 4).map((b) => (
                <Link key={b._id} to={`/bookings/${b._id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
                    {b.guest?.fullName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-100 truncate">{b.guest?.fullName}</p>
                    <p className="text-xs text-dark-500">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                  </div>
                  <span className={`badge ${bookingStatusColor(b.status)} text-[11px] capitalize flex-shrink-0`}>{b.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-50">My Listings</h3>
            <Link to="/host/listings" className="text-sm text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {listings?.length === 0 ? (
            <EmptyState icon="🏠" title="No listings yet" description="Create your first listing to start earning."
              action={<Link to="/host/listings/new" className="btn-primary text-sm py-2">Create Listing</Link>} />
          ) : (
            <div className="space-y-3">
              {listings?.map((l) => (
                <Link key={l._id} to={`/host/listings/${l._id}/edit`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors">
                  <img src={l.photos?.[0]?.url} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-100 truncate">{l.title}</p>
                    <p className="text-xs text-dark-500">{formatCurrency(l.pricing?.basePrice)}/night · {l.location?.area}</p>
                  </div>
                  <span className={`badge text-[11px] capitalize flex-shrink-0 ${
                    l.status === 'active' ? 'badge-success' : l.status === 'pending_approval' ? 'badge-warning' : 'badge-neutral'
                  }`}>{l.status?.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
