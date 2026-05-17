import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { adminAPI } from '@/services/api';
import { StatCard, PageHeader, EmptyState } from '@/components/common/UI';
import { formatCurrency, bookingStatusColor, kycStatusColor } from '@/utils/helpers';
import toast from 'react-hot-toast';

// ── AdminDashboardPage ────────────────────────────────
export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminAPI.getDashboard,
    select: (d) => d?.data,
  });

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users"    value={data?.users    || 0} icon="👤" color="blue"   />
        <StatCard label="Total Listings" value={data?.listings || 0} icon="🏠" color="brand"  />
        <StatCard label="Total Bookings" value={data?.bookings || 0} icon="📅" color="emerald"/>
        <StatCard label="Revenue" value={formatCurrency(data?.revenue || 0)} icon="💰" color="amber" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-amber-500">
          <p className="text-dark-400 text-sm">Pending KYC Reviews</p>
          <p className="text-3xl font-bold text-dark-50 mt-1">{data?.pendingKyc || 0}</p>
          <Link to="/admin/reviews?tab=kyc" className="text-xs text-brand-400 mt-2 block">Review now →</Link>
        </div>
        <div className="card p-5 border-l-4 border-brand-500">
          <p className="text-dark-400 text-sm">Listings Awaiting Approval</p>
          <p className="text-3xl font-bold text-dark-50 mt-1">{data?.pendingListings || 0}</p>
          <Link to="/admin/reviews?tab=listings" className="text-xs text-brand-400 mt-2 block">Review now →</Link>
        </div>
        <div className="card p-5 border-l-4 border-emerald-500">
          <p className="text-dark-400 text-sm">Active Bookings</p>
          <p className="text-3xl font-bold text-dark-50 mt-1">{data?.activeBookings || 0}</p>
          <Link to="/admin/bookings?status=confirmed" className="text-xs text-brand-400 mt-2 block">View all →</Link>
        </div>
      </div>
    </div>
  );
}

// ── AdminUsersPage ────────────────────────────────────
export function AdminUsersPage() {
  const [kycStatus, setKycStatus] = useState('');
  const [search, setSearch]       = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', kycStatus, search],
    queryFn:  () => adminAPI.getUsers({ kycStatus, search, limit: 30 }),
    select: (d) => d?.data?.users || [],
  });

  const { mutate: reviewKyc } = useMutation({
    mutationFn: ({ userId, action, reason }) => adminAPI.reviewKYC(userId, { action, reason }),
    onSuccess:  (_, vars) => {
      toast.success(`KYC ${vars.action}d!`);
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (e) => toast.error(e.message),
  });

  const { mutate: ban } = useMutation({
    mutationFn: ({ userId, ban, reason }) => adminAPI.banUser(userId, { ban, reason }),
    onSuccess: () => { toast.success('User status updated'); queryClient.invalidateQueries(['admin-users']); },
    onError: (e) => toast.error(e.message),
  });

  const statuses = ['', 'pending', 'approved', 'rejected'];

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage all platform users" />
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 py-2.5 text-sm"
        />
        <select value={kycStatus} onChange={(e) => setKycStatus(e.target.value)} className="py-2.5 text-sm">
          <option value="">All KYC Status</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="card h-16 skeleton" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-700 bg-dark-900">
                <tr>
                  {['User', 'Role', 'KYC Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-dark-400 text-xs font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {data?.map((u) => (
                  <tr key={u._id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-100">{u.fullName}</p>
                      <p className="text-xs text-dark-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-neutral capitalize text-xs">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${kycStatusColor(u.kyc?.kycStatus || 'not_submitted')} text-xs capitalize`}>
                        {(u.kyc?.kycStatus || 'not_submitted').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {u.kyc?.kycStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => reviewKyc({ userId: u._id, action: 'approve' })}
                              title="Approve KYC"
                              className="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => {
                                const r = prompt('Reason for rejecting:');
                                if (r !== null) reviewKyc({ userId: u._id, action: 'reject', reason: r });
                              }}
                              title="Reject KYC"
                              className="w-7 h-7 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            const r = u.isBanned ? '' : prompt('Ban reason:');
                            if (!u.isBanned || r !== null) ban({ userId: u._id, ban: !u.isBanned, reason: r });
                          }}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            u.isBanned
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-dark-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AdminListingsPage ─────────────────────────────────
export function AdminListingsPage() {
  const [tab, setTab] = useState('pending');
  const queryClient  = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings-pending'],
    queryFn:  adminAPI.getPendingListings,
    select: (d) => d?.data || [],
    enabled: tab === 'pending',
  });

  const { mutate: review } = useMutation({
    mutationFn: ({ id, action, reason }) => adminAPI.reviewListing(id, { action, reason }),
    onSuccess:  (_, vars) => {
      toast.success(`Listing ${vars.action}d!`);
      queryClient.invalidateQueries(['admin-listings-pending']);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Listings" subtitle="Review and manage all listings" />
      <div className="flex gap-2 mb-6">
        {['pending', 'all'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              tab === t
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-dark-800 border-dark-600 text-dark-400'
            }`}
          >
            {t === 'pending' ? `⏳ Pending (${data?.length || 0})` : 'All Listings'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="card h-40 skeleton" />)}</div>
      ) : data?.length === 0 ? (
        <div className="text-center py-16 text-dark-400">✅ No pending listings!</div>
      ) : (
        <div className="space-y-4">
          {data.map((l) => (
            <div key={l._id} className="card p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                {l.photos?.[0]?.url && (
                  <img
                    src={l.photos[0].url}
                    alt=""
                    className="w-full sm:w-36 h-28 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-50 mb-1">{l.title}</h3>
                  <p className="text-xs text-dark-400 mb-1">
                    {l.location?.area} · ₹{l.pricing?.basePrice}/night · {l.photos?.length || 0} photos
                  </p>
                  <p className="text-xs text-dark-300 mb-1">
                    Host: <span className="text-dark-100">{l.host?.fullName}</span>
                    <span className={`badge ${kycStatusColor(l.host?.kyc?.kycStatus || 'not_submitted')} ml-2 text-[10px]`}>
                      KYC: {l.host?.kyc?.kycStatus || 'not submitted'}
                    </span>
                  </p>
                  <p className="text-xs text-dark-500 mb-3 line-clamp-2">{l.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={`/listings/${l._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => review({ id: l._id, action: 'approve' })}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        const r = prompt('Reason for rejection:');
                        if (r) review({ id: l._id, action: 'reject', reason: r });
                      }}
                      className="btn-secondary text-xs py-1.5 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AdminBookingsPage ─────────────────────────────────
export function AdminBookingsPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', status],
    queryFn:  () => adminAPI.getBookings({ status, limit: 30 }),
    select: (d) => d?.data?.bookings || [],
  });

  const statuses = ['', 'pending', 'confirmed', 'cancelled', 'completed'];

  return (
    <div>
      <PageHeader title="All Bookings" subtitle="Platform-wide booking management" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs border capitalize transition-all ${
              status === s
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-dark-800 border-dark-600 text-dark-400'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="card h-14 skeleton" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-700 bg-dark-900">
                <tr>
                  {['Ref', 'Guest', 'Host', 'Listing', 'Dates', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-dark-400 text-xs font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {data?.map((b) => (
                  <tr key={b._id} className="hover:bg-dark-800/50 text-xs">
                    <td className="px-4 py-3 text-dark-400 font-mono">{b.bookingRef}</td>
                    <td className="px-4 py-3 text-dark-200">{b.guest?.fullName}</td>
                    <td className="px-4 py-3 text-dark-200">{b.host?.fullName}</td>
                    <td className="px-4 py-3 text-dark-400 max-w-[120px] truncate">{b.listing?.title}</td>
                    <td className="px-4 py-3 text-dark-400 whitespace-nowrap">
                      {new Date(b.checkIn).toLocaleDateString('en-IN')} → {new Date(b.checkOut).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-dark-200 font-medium">
                      ₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${bookingStatusColor(b.status)} text-[10px] capitalize`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-dark-500">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
