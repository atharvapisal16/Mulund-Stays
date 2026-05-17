// GuestBookingsPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin } from 'lucide-react';
import { bookingAPI } from '@/services/api';
import { EmptyState, PageHeader, PageLoader } from '@/components/common/UI';
import { formatCurrency, formatDate, bookingStatusColor } from '@/utils/helpers';

export function GuestBookingsPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['guest-bookings', status],
    queryFn: () => bookingAPI.getGuestBookings({ status }),
    select: (d) => d?.data?.docs || [],
  });

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  if (isLoading) return <PageLoader />;

  return (
    <div className="container-page py-8">
      <PageHeader title="My Bookings" subtitle="Track all your stays" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all capitalize ${status === s ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-dark-800 border-dark-600 text-dark-400 hover:border-dark-500'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {data?.length === 0 ? (
        <EmptyState icon="🧳" title="No bookings yet" description="Find a place to stay in Mulund."
          action={<Link to="/search" className="btn-primary">Explore Stays</Link>} />
      ) : (
        <div className="space-y-4">
          {data?.map((b) => (
            <Link key={b._id} to={`/bookings/${b._id}`} className="card-hover flex flex-col sm:flex-row gap-4 p-4">
              <img src={b.listing?.photos?.[0]?.url || ''} alt="" className="w-full sm:w-32 h-32 sm:h-auto object-cover rounded-xl" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-dark-50">{b.listing?.title}</h3>
                  <span className={`badge ${bookingStatusColor(b.status)} flex-shrink-0 capitalize`}>{b.status}</span>
                </div>
                <p className="text-sm text-dark-400 flex items-center gap-1 mb-2"><MapPin size={12} />{b.listing?.location?.area}</p>
                <p className="text-sm text-dark-300 flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                </p>
                <p className="text-sm font-semibold text-dark-50 mt-2">{formatCurrency(b.pricing?.totalAmount)}</p>
                <p className="text-xs text-dark-500 mt-1">Ref: {b.bookingRef}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
export default GuestBookingsPage;
