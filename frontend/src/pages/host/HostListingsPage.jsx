import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit, Eye, Plus, Trash2, Upload,
  Shield, CheckCircle, Clock, XCircle, Check,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useForm } from 'react-hook-form';
import { listingAPI, bookingAPI, paymentAPI, userAPI } from '@/services/api';
import { EmptyState, PageHeader, Spinner, FieldError } from '@/components/common/UI';
import {
  formatCurrency, formatDate, listingStatusColor,
  bookingStatusColor, PROPERTY_TYPES, AMENITIES_CONFIG,
} from '@/utils/helpers';
import { useAuthStore } from '@/context/authStore';
import toast from 'react-hot-toast';

// ── HostListingsPage ──────────────────────────────────
export function HostListingsPage() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['host-listings', status],
    queryFn:  () => listingAPI.getMyListings({ status, limit: 20 }),
    select: (d) => d?.data?.docs || [],
  });

  const { mutate: submit } = useMutation({
    mutationFn: (id) => listingAPI.submitForApproval(id),
    onSuccess:  () => { toast.success('Submitted for approval!'); queryClient.invalidateQueries(['host-listings']); },
    onError: (e) => toast.error(e.message),
  });

  const { mutate: deleteListing } = useMutation({
    mutationFn: (id) => listingAPI.delete(id),
    onSuccess:  () => { toast.success('Listing archived.'); queryClient.invalidateQueries(['host-listings']); },
    onError: (e) => toast.error(e.message),
  });

  const statuses = ['', 'draft', 'pending_approval', 'active', 'paused', 'rejected'];

  return (
    <div>
      <PageHeader
        title="My Listings"
        subtitle="Manage your properties"
        action={<Link to="/host/listings/new" className="btn-primary"><Plus size={16} /> New Listing</Link>}
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all capitalize ${
              status === s
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-dark-800 border-dark-600 text-dark-400'
            }`}>
            {s.replace(/_/g, ' ') || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="card h-24 skeleton" />)}</div>
      ) : data?.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No listings yet"
          description="Create your first listing and start earning from your property."
          action={<Link to="/host/listings/new" className="btn-primary">Create Your First Listing</Link>}
        />
      ) : (
        <div className="space-y-3">
          {data.map((l) => (
            <div key={l._id} className="card p-4 flex flex-col sm:flex-row gap-4">
              {l.photos?.[0]?.url ? (
                <img src={l.photos[0].url} alt="" className="w-full sm:w-28 h-24 sm:h-20 object-cover rounded-xl flex-shrink-0" />
              ) : (
                <div className="w-full sm:w-28 h-24 sm:h-20 bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl flex items-center justify-center text-dark-500 flex-shrink-0">
                  <span className="text-sm">No photo</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-dark-100 text-sm truncate">{l.title}</h3>
                  <span className={`badge ${listingStatusColor(l.status)} text-[11px] capitalize flex-shrink-0`}>
                    {l.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-dark-500 mb-2">
                  {l.location?.area} · {PROPERTY_TYPES[l.propertyType]} · {formatCurrency(l.pricing?.basePrice)}/night
                </p>
                {l.status === 'rejected' && l.rejectionReason && (
                  <p className="text-xs text-red-400 mb-2">Reason: {l.rejectionReason}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/host/listings/${l._id}/edit`} className="btn-secondary text-xs py-1.5 px-3">
                    <Edit size={12} /> Edit
                  </Link>
                  <Link to={`/listings/${l._id}`} className="btn-ghost text-xs py-1.5 px-3">
                    <Eye size={12} /> Preview
                  </Link>
                  {['draft', 'rejected'].includes(l.status) && (
                    <button onClick={() => submit(l._id)} className="btn-primary text-xs py-1.5 px-3">
                      <Upload size={12} /> Submit for Review
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Archive this listing?')) deleteListing(l._id); }}
                    className="btn-ghost text-xs py-1.5 px-3 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} /> Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HostBookingsPage ──────────────────────────────────
export function HostBookingsPage() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['host-bookings', status],
    queryFn:  () => bookingAPI.getHostBookings({ status, limit: 20 }),
    select: (d) => d?.data?.docs || [],
  });

  const { mutate: respond } = useMutation({
    mutationFn: ({ id, action, declineReason }) =>
      bookingAPI.respond(id, { action, declineReason }),
    onSuccess: (_, vars) => {
      toast.success(`Booking ${vars.action}ed!`);
      queryClient.invalidateQueries(['host-bookings']);
    },
    onError: (e) => toast.error(e.message),
  });

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Manage all incoming reservations" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs border capitalize transition-all ${
              status === s
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-dark-800 border-dark-600 text-dark-400'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="card h-28 skeleton" />)}</div>
      ) : data?.length === 0 ? (
        <EmptyState icon="📅" title="No bookings yet" description="Booking requests from guests will appear here." />
      ) : (
        <div className="space-y-4">
          {data.map((b) => (
            <div key={b._id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold flex-shrink-0">
                    {b.guest?.fullName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-100">{b.guest?.fullName}</p>
                    <p className="text-xs text-dark-500">{b.listing?.title}</p>
                  </div>
                </div>
                <span className={`badge ${bookingStatusColor(b.status)} capitalize text-xs flex-shrink-0`}>
                  {b.status}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs text-dark-400 mb-4">
                <div><p className="text-dark-600 mb-0.5">Check-in</p><p className="text-dark-200">{formatDate(b.checkIn)}</p></div>
                <div><p className="text-dark-600 mb-0.5">Check-out</p><p className="text-dark-200">{formatDate(b.checkOut)}</p></div>
                <div><p className="text-dark-600 mb-0.5">Guests</p><p className="text-dark-200">{b.numGuests?.adults || 1}</p></div>
                <div><p className="text-dark-600 mb-0.5">Nights</p><p className="text-dark-200">{b.numNights}</p></div>
                <div><p className="text-dark-600 mb-0.5">Your Payout</p><p className="text-dark-200 font-semibold">{formatCurrency(b.pricing?.hostPayout)}</p></div>
              </div>

              {b.guestMessage && (
                <div className="bg-dark-800 rounded-lg p-3 mb-3 text-sm text-dark-300 italic border-l-2 border-brand-500/40">
                  "{b.guestMessage}"
                </div>
              )}

              {b.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond({ id: b._id, action: 'accept' })}
                    className="btn-primary text-sm py-2"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for declining (optional):');
                      respond({ id: b._id, action: 'decline', declineReason: reason || '' });
                    }}
                    className="btn-secondary text-sm py-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    ✗ Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HostEarningsPage ──────────────────────────────────
export function HostEarningsPage() {
  const [period, setPeriod] = useState('month');

  const { data } = useQuery({
    queryKey: ['host-earnings', period],
    queryFn:  () => paymentAPI.getEarnings(period),
    select: (d) => d?.data,
  });

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = (data?.monthly || []).map((m) => ({
    month:    MONTHS[m._id.month - 1],
    earnings: m.earnings,
    bookings: m.bookings,
  }));

  const periods = [
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year',  label: 'This Year' },
    { key: 'all',   label: 'All Time' },
  ];

  return (
    <div>
      <PageHeader title="Earnings" subtitle="Track your hosting income" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              period === p.key
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-dark-800 border-dark-600 text-dark-400'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-dark-500 text-sm mb-1">Total Earned</p>
          <p className="text-3xl font-bold font-display text-dark-50">
            {formatCurrency(data?.summary?.totalEarnings || 0)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-dark-500 text-sm mb-1">Total Bookings</p>
          <p className="text-3xl font-bold font-display text-dark-50">{data?.summary?.totalBookings || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-dark-500 text-sm mb-1">Avg per Booking</p>
          <p className="text-3xl font-bold font-display text-dark-50">
            {data?.summary?.totalBookings > 0
              ? formatCurrency(Math.round(data.summary.totalEarnings / data.summary.totalBookings))
              : '₹0'}
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-dark-50 mb-4">Monthly Earnings</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a50" />
              <XAxis dataKey="month" stroke="#8585af" fontSize={12} />
              <YAxis stroke="#8585af" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#16213e', border: '1px solid #2a2a50', borderRadius: 8 }}
                labelStyle={{ color: '#e8e8f0' }}
                formatter={(v) => [formatCurrency(v), 'Earnings']}
              />
              <Bar dataKey="earnings" fill="#e94560" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── KYCPage ───────────────────────────────────────────
export function KYCPage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (formData) => userAPI.submitKYC(formData),
    onSuccess: () => {
      toast.success('KYC submitted! We will review within 24-48 hours.');
      updateUser({ kyc: { ...user?.kyc, kycStatus: 'pending' } });
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('aadhaarNumber', data.aadhaarNumber);
    if (data.panNumber) formData.append('panNumber', data.panNumber);
    formData.append('aadhaarFront', data.aadhaarFront[0]);
    formData.append('aadhaarBack',  data.aadhaarBack[0]);
    if (data.panCard?.[0]) formData.append('panCard', data.panCard[0]);
    mutate(formData);
  };

  const kycStatus = user?.kyc?.kycStatus || 'not_submitted';

  if (kycStatus === 'approved') {
    return (
      <div>
        <PageHeader title="KYC Verification" subtitle="Identity & document verification" />
        <div className="card p-10 text-center max-w-md mx-auto">
          <CheckCircle className="text-emerald-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-dark-50 mb-2">KYC Approved ✅</h2>
          <p className="text-dark-400 text-sm">
            Your identity has been verified. You can now publish listings and receive payouts.
          </p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <div>
        <PageHeader title="KYC Verification" subtitle="Identity & document verification" />
        <div className="card p-10 text-center max-w-md mx-auto">
          <Clock className="text-amber-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-dark-50 mb-2">KYC Under Review ⏳</h2>
          <p className="text-dark-400 text-sm">
            We received your documents and are reviewing them. This typically takes 24-48 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="KYC Verification" subtitle="Upload documents to start hosting" />

      {kycStatus === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-300 font-semibold text-sm">⚠ KYC Rejected</p>
          <p className="text-red-400/70 text-xs mt-1">{user?.kyc?.kycRejectionReason}</p>
        </div>
      )}

      <div className="card p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6 p-4 bg-brand-500/10 rounded-xl border border-brand-500/20">
          <Shield className="text-brand-400 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium text-brand-300">Why is KYC required?</p>
            <p className="text-xs text-dark-400 mt-0.5">
              Indian law requires rental platforms to verify host identity. Your documents are stored securely and never shared publicly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="form-group">
            <label>Aadhaar Number *</label>
            <input
              placeholder="1234 5678 9012"
              maxLength={14}
              {...register('aadhaarNumber', {
                required: 'Aadhaar number is required',
                pattern: { value: /^\d{4}\s?\d{4}\s?\d{4}$/, message: 'Enter valid 12-digit Aadhaar' },
              })}
            />
            <FieldError message={errors.aadhaarNumber?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Aadhaar Front *</label>
              <input type="file" accept="image/*,application/pdf" className="py-2 text-sm"
                {...register('aadhaarFront', { required: 'Front photo required' })} />
              <FieldError message={errors.aadhaarFront?.message} />
            </div>
            <div className="form-group">
              <label>Aadhaar Back *</label>
              <input type="file" accept="image/*,application/pdf" className="py-2 text-sm"
                {...register('aadhaarBack', { required: 'Back photo required' })} />
              <FieldError message={errors.aadhaarBack?.message} />
            </div>
          </div>

          <div className="form-group">
            <label>PAN Number <span className="text-dark-500">(recommended)</span></label>
            <input
              placeholder="ABCDE1234F"
              maxLength={10}
              {...register('panNumber', {
                pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Enter valid PAN (e.g. ABCDE1234F)' },
              })}
            />
            <FieldError message={errors.panNumber?.message} />
          </div>

          <div className="form-group">
            <label>PAN Card Photo <span className="text-dark-500">(recommended)</span></label>
            <input type="file" accept="image/*,application/pdf" className="py-2 text-sm" {...register('panCard')} />
          </div>

          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? <Spinner size="sm" /> : <Shield size={16} />}
            {isPending ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default HostListingsPage;
