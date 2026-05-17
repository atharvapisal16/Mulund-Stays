import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Check, X, Shield, ListChecks, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { adminAPI } from '@/services/api';
import { PageHeader, EmptyState, Spinner } from '@/components/common/UI';
import { kycStatusColor } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function AdminReviewQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'listings' ? 'listings' : 'kyc';
  const [tab, setTab] = useState(initialTab);
  const [expandedKycId, setExpandedKycId] = useState(null);
  const [expandedListingId, setExpandedListingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: pendingUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-review-kyc'],
    queryFn: () => adminAPI.getUsers({ kycStatus: 'pending', limit: 50 }),
    select: (d) => d?.data?.users || [],
    enabled: tab === 'kyc',
  });

  const { data: pendingListings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['admin-review-listings'],
    queryFn: adminAPI.getPendingListings,
    select: (d) => d?.data || [],
    enabled: tab === 'listings',
  });

  const { mutate: reviewKyc } = useMutation({
    mutationFn: ({ userId, action, reason }) => adminAPI.reviewKYC(userId, { action, reason }),
    onSuccess: (_, vars) => {
      toast.success(`KYC ${vars.action}d`);
      queryClient.invalidateQueries({ queryKey: ['admin-review-kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (e) => toast.error(e.message || 'KYC review failed'),
  });

  const { mutate: reviewListing } = useMutation({
    mutationFn: ({ id, action, reason }) => adminAPI.reviewListing(id, { action, reason }),
    onSuccess: (_, vars) => {
      toast.success(`Listing ${vars.action}d`);
      queryClient.invalidateQueries({ queryKey: ['admin-review-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (e) => toast.error(e.message || 'Listing review failed'),
  });

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  return (
    <div>
      <PageHeader
        title="Review Queue"
        subtitle="Step 1: Approve KYC, Step 2: Approve Listings"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => switchTab('kyc')}
          className={`card p-4 text-left border transition-all ${
            tab === 'kyc'
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-dark-700 hover:border-dark-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm text-dark-400">Step 1</p>
              <p className="font-semibold text-dark-100">KYC Reviews ({pendingUsers.length})</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => switchTab('listings')}
          className={`card p-4 text-left border transition-all ${
            tab === 'listings'
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-dark-700 hover:border-dark-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ListChecks size={18} />
            </div>
            <div>
              <p className="text-sm text-dark-400">Step 2</p>
              <p className="font-semibold text-dark-100">Listing Approvals ({pendingListings.length})</p>
            </div>
          </div>
        </button>
      </div>

      {tab === 'kyc' && (
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-dark-50 mb-4">Pending KYC Requests</h3>
          {loadingUsers ? (
            <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-14 rounded-lg skeleton" />)}</div>
          ) : pendingUsers.length === 0 ? (
            <EmptyState
              icon="✅"
              title="No pending KYC reviews"
              description="All KYC submissions are already reviewed."
            />
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u._id} className="border border-dark-700 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-4 bg-dark-850 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-dark-800 transition-colors"
                    onClick={() => setExpandedKycId(expandedKycId === u._id ? null : u._id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark-100 truncate">{u.fullName}</p>
                      <p className="text-xs text-dark-500 truncate">{u.email} · {u.phone || 'No phone'}</p>
                      <span className={`badge ${kycStatusColor(u.kyc?.kycStatus || 'not_submitted')} text-[10px] mt-2 capitalize`}>
                        {u.kyc?.kycStatus || 'not_submitted'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {expandedKycId === u._id ? (
                        <ChevronUp size={20} className="text-dark-400" />
                      ) : (
                        <ChevronDown size={20} className="text-dark-400" />
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  {expandedKycId === u._id && (
                    <div className="p-4 bg-dark-900 border-t border-dark-700 space-y-4">
                      {/* KYC Information */}
                      {u.kyc && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-dark-100">KYC Details</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-dark-500 text-xs mb-1">Full Name</p>
                              <p className="text-dark-200">{u.kyc.fullName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-dark-500 text-xs mb-1">Gender</p>
                              <p className="text-dark-200 capitalize">{u.kyc.gender || '-'}</p>
                            </div>
                            <div>
                              <p className="text-dark-500 text-xs mb-1">DOB</p>
                              <p className="text-dark-200">{u.kyc.dob ? new Date(u.kyc.dob).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                              <p className="text-dark-500 text-xs mb-1">Nationality</p>
                              <p className="text-dark-200">{u.kyc.nationality || '-'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-dark-500 text-xs mb-1">Address</p>
                              <p className="text-dark-200">{u.kyc.address || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-dark-100">Uploaded Documents</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Aadhaar Front */}
                          {u.kyc?.aadhaarFront ? (
                            <div>
                              <p className="text-xs text-dark-500 mb-2">Aadhaar Front</p>
                              <div className="relative group aspect-video rounded-lg overflow-hidden bg-dark-800">
                                <img src={u.kyc.aadhaarFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                                <a
                                  href={u.kyc.aadhaarFront}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-dark-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ExternalLink size={24} className="text-brand-400" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-dark-800 rounded-lg text-dark-500 text-xs">Aadhaar Front - Not uploaded</div>
                          )}

                          {/* Aadhaar Back */}
                          {u.kyc?.aadhaarBack ? (
                            <div>
                              <p className="text-xs text-dark-500 mb-2">Aadhaar Back</p>
                              <div className="relative group aspect-video rounded-lg overflow-hidden bg-dark-800">
                                <img src={u.kyc.aadhaarBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                                <a
                                  href={u.kyc.aadhaarBack}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-dark-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ExternalLink size={24} className="text-brand-400" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-dark-800 rounded-lg text-dark-500 text-xs">Aadhaar Back - Not uploaded</div>
                          )}

                          {/* PAN Card */}
                          {u.kyc?.panCard ? (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-dark-500 mb-2">PAN Card</p>
                              <div className="relative group aspect-video rounded-lg overflow-hidden bg-dark-800">
                                <img src={u.kyc.panCard} alt="PAN Card" className="w-full h-full object-cover" />
                                <a
                                  href={u.kyc.panCard}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-dark-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ExternalLink size={24} className="text-brand-400" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-dark-800 rounded-lg text-dark-500 text-xs sm:col-span-2">PAN Card - Not uploaded</div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-dark-700">
                        <button
                          type="button"
                          onClick={() => reviewKyc({ userId: u._id, action: 'approve' })}
                          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reason for rejecting KYC:');
                            if (reason !== null) reviewKyc({ userId: u._id, action: 'reject', reason });
                          }}
                          className="btn-secondary text-sm py-2 px-4 border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-dark-50 mb-4">Listings Awaiting Approval</h3>
          {loadingListings ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-24 rounded-lg skeleton" />)}</div>
          ) : pendingListings.length === 0 ? (
            <EmptyState
              icon="🏠"
              title="No pending listings"
              description="All submitted listings are already reviewed."
            />
          ) : (
            <div className="space-y-4">
              {pendingListings.map((l) => (
                <div key={l._id} className="border border-dark-700 rounded-xl overflow-hidden">
                  {/* Header with Cover Photo */}
                  <div
                    className="p-4 bg-dark-850 flex flex-col sm:flex-row gap-3 cursor-pointer hover:bg-dark-800 transition-colors"
                    onClick={() => setExpandedListingId(expandedListingId === l._id ? null : l._id)}
                  >
                    {l.photos?.[0]?.url ? (
                      <img src={l.photos[0].url} alt="" className="w-full sm:w-32 h-24 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-full sm:w-32 h-24 rounded-lg bg-dark-700 flex items-center justify-center text-dark-500 text-xs">No photo</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-100 text-lg truncate">{l.title}</p>
                      <p className="text-sm text-dark-400 mt-1">{l.location?.area} · ₹{l.pricing?.basePrice}/night</p>
                      <p className="text-xs text-dark-500 mt-1">Host: {l.host?.fullName} ({l.host?.email})</p>
                      <span className={`badge ${kycStatusColor(l.host?.kyc?.kycStatus || 'not_submitted')} text-[10px] mt-2`}>
                        KYC: {l.host?.kyc?.kycStatus || 'not_submitted'}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedListingId === l._id ? (
                        <ChevronUp size={24} className="text-dark-400" />
                      ) : (
                        <ChevronDown size={24} className="text-dark-400" />
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  {expandedListingId === l._id && (
                    <div className="p-6 bg-dark-900 border-t border-dark-700 space-y-6">
                      {/* Description */}
                      <div>
                        <h4 className="font-semibold text-dark-100 mb-2">Description</h4>
                        <p className="text-dark-300 text-sm leading-relaxed">{l.description}</p>
                      </div>

                      {/* Property Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-dark-850 p-3 rounded-lg">
                          <p className="text-dark-500 text-xs mb-1">Property Type</p>
                          <p className="text-dark-100 font-medium capitalize">{l.propertyType?.replace('_', ' ')}</p>
                        </div>
                        <div className="bg-dark-850 p-3 rounded-lg">
                          <p className="text-dark-500 text-xs mb-1">Max Guests</p>
                          <p className="text-dark-100 font-medium">{l.capacity?.maxGuests}</p>
                        </div>
                        <div className="bg-dark-850 p-3 rounded-lg">
                          <p className="text-dark-500 text-xs mb-1">Bedrooms</p>
                          <p className="text-dark-100 font-medium">{l.capacity?.bedrooms}</p>
                        </div>
                        <div className="bg-dark-850 p-3 rounded-lg">
                          <p className="text-dark-500 text-xs mb-1">Beds</p>
                          <p className="text-dark-100 font-medium">{l.capacity?.beds}</p>
                        </div>
                        <div className="bg-dark-850 p-3 rounded-lg">
                          <p className="text-dark-500 text-xs mb-1">Bathrooms</p>
                          <p className="text-dark-100 font-medium">{l.capacity?.bathrooms}</p>
                        </div>
                        <div className="bg-dark-850 p-3 rounded-lg">
                          <p className="text-dark-500 text-xs mb-1">Instant Book</p>
                          <p className="text-dark-100 font-medium">{l.availability?.instantBook ? '✅ Yes' : '❌ No'}</p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="bg-dark-850 p-4 rounded-lg space-y-2">
                        <h4 className="font-semibold text-dark-100">Location</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-dark-500 text-xs">Street</p>
                            <p className="text-dark-200">{l.location?.street}</p>
                          </div>
                          <div>
                            <p className="text-dark-500 text-xs">Area</p>
                            <p className="text-dark-200">{l.location?.area}</p>
                          </div>
                          <div>
                            <p className="text-dark-500 text-xs">PIN Code</p>
                            <p className="text-dark-200">{l.location?.pincode}</p>
                          </div>
                          <div>
                            <p className="text-dark-500 text-xs">Landmark</p>
                            <p className="text-dark-200">{l.location?.landmark || '-'}</p>
                          </div>
                          {l.location?.flatNo && (
                            <div>
                              <p className="text-dark-500 text-xs">Flat No.</p>
                              <p className="text-dark-200">{l.location.flatNo}</p>
                            </div>
                          )}
                          {l.location?.buildingName && (
                            <div>
                              <p className="text-dark-500 text-xs">Building</p>
                              <p className="text-dark-200">{l.location.buildingName}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-dark-850 p-4 rounded-lg">
                        <h4 className="font-semibold text-dark-100 mb-3">Pricing</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-dark-500 text-xs">Base Price</p>
                            <p className="text-dark-200 font-medium">₹{l.pricing?.basePrice}/night</p>
                          </div>
                          {l.pricing?.weekendPrice && (
                            <div>
                              <p className="text-dark-500 text-xs">Weekend Price</p>
                              <p className="text-dark-200 font-medium">₹{l.pricing.weekendPrice}/night</p>
                            </div>
                          )}
                          {l.pricing?.cleaningFee ? (
                            <div>
                              <p className="text-dark-500 text-xs">Cleaning Fee</p>
                              <p className="text-dark-200 font-medium">₹{l.pricing.cleaningFee}</p>
                            </div>
                          ) : null}
                          {l.pricing?.securityDeposit ? (
                            <div>
                              <p className="text-dark-500 text-xs">Security Deposit</p>
                              <p className="text-dark-200 font-medium">₹{l.pricing.securityDeposit}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Amenities */}
                      {l.amenities && Object.keys(l.amenities).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-dark-100 mb-3">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(l.amenities).map(([key, value]) => 
                              value && (
                                <span key={key} className="bg-brand-500/20 text-brand-300 px-3 py-1 rounded-full text-xs capitalize">
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* House Rules */}
                      {l.houseRules && (
                        <div className="bg-dark-850 p-4 rounded-lg">
                          <h4 className="font-semibold text-dark-100 mb-2">House Rules</h4>
                          <div className="space-y-1 text-sm">
                            <p>{l.houseRules?.noSmoking ? '🚭' : '✅'} Smoking: {l.houseRules?.noSmoking ? 'Not allowed' : 'Allowed'}</p>
                            <p>{l.houseRules?.noParties ? '🎉' : '✅'} Parties: {l.houseRules?.noParties ? 'Not allowed' : 'Allowed'}</p>
                            <p>{l.houseRules?.noPets ? '🐾' : '✅'} Pets: {l.houseRules?.noPets ? 'Not allowed' : 'Allowed'}</p>
                          </div>
                        </div>
                      )}

                      {/* Availability */}
                      <div className="bg-dark-850 p-4 rounded-lg">
                        <h4 className="font-semibold text-dark-100 mb-2">Availability</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-dark-500 text-xs">Check-in</p>
                            <p className="text-dark-200">{l.availability?.checkInTime}</p>
                          </div>
                          <div>
                            <p className="text-dark-500 text-xs">Check-out</p>
                            <p className="text-dark-200">{l.availability?.checkOutTime}</p>
                          </div>
                          <div>
                            <p className="text-dark-500 text-xs">Min Stay</p>
                            <p className="text-dark-200">{l.availability?.minStay} night(s)</p>
                          </div>
                          <div>
                            <p className="text-dark-500 text-xs">Max Stay</p>
                            <p className="text-dark-200">{l.availability?.maxStay} night(s)</p>
                          </div>
                        </div>
                      </div>

                      {/* All Photos */}
                      {l.photos && l.photos.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-dark-100 mb-3">All Photos ({l.photos.length})</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {l.photos.map((p, i) => (
                              <a
                                key={p._id || i}
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                className="relative group aspect-square rounded-lg overflow-hidden bg-dark-800 block hover:shadow-lg transition-shadow"
                              >
                                <img src={p.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink size={20} className="text-brand-400" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-dark-700">
                        <button
                          type="button"
                          onClick={() => reviewListing({ id: l._id, action: 'approve' })}
                          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          <Check size={16} /> Approve Listing
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reason for rejecting listing:');
                            if (reason) reviewListing({ id: l._id, action: 'reject', reason });
                          }}
                          className="btn-secondary text-sm py-2 px-4 border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
