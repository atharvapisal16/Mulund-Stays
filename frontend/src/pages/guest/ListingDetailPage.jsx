import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bath, Bed, Calendar, Check, ChevronLeft, Heart, MapPin,
  Share2, Shield, Star, Users, Wifi, Zap,
} from 'lucide-react';
import { listingAPI, bookingAPI } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import {
  AmenityChip, PageLoader, StarRating, Spinner,
} from '@/components/common/UI';
import {
  formatCurrency, formatDate, AMENITIES_CONFIG, CANCELLATION_POLICIES,
  PROPERTY_TYPES, calculateClientPricing, nightsBetween,
} from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '', adults: 1, children: 0, message: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingAPI.getById(id),
    select: (d) => d?.data,
  });

  const pricing = data ? calculateClientPricing(data, booking.checkIn, booking.checkOut) : null;

  const { mutate: createBooking, isPending: booking_pending } = useMutation({
    mutationFn: () => bookingAPI.create({
      listingId: id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      numGuests: { adults: booking.adults, children: booking.children },
      guestMessage: booking.message,
    }),
    onSuccess: (res) => {
      toast.success(res.message || 'Booking request sent!');
      navigate(`/bookings/${res.data.booking._id}/checkout`);
    },
    onError: (err) => toast.error(err.message || 'Booking failed'),
  });

  const handleBook = () => {
    if (!isAuthenticated) { toast.error('Please log in to book.'); return navigate('/login'); }
    if (!booking.checkIn || !booking.checkOut) { toast.error('Please select check-in and check-out dates.'); return; }
    createBooking();
  };

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="container-page py-20 text-center text-dark-400">Listing not found.</div>;

  const l = data;
  const photos = l.photos || [];
  const policy = CANCELLATION_POLICIES[l.cancellationPolicy];

  return (
    <div className="container-page py-8 max-w-6xl">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 text-sm">
        <ChevronLeft size={16} /> Back to search
      </button>

      {/* Title */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-50 mb-2">{l.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-dark-400">
            {l.ratings?.totalReviews > 0 && (
              <span className="flex items-center gap-1 text-dark-200">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <strong>{l.ratings.average}</strong>
                <span>({l.ratings.totalReviews} reviews)</span>
              </span>
            )}
            <span className="flex items-center gap-1"><MapPin size={14} />{l.location?.area}, Mumbai</span>
            <span>{PROPERTY_TYPES[l.propertyType]}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Share2 size={16} /> Share</button>
          <button className="btn-ghost"><Heart size={16} /> Save</button>
        </div>
      </div>

      {/* Photos grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden mb-8">
        <div className="col-span-2 row-span-2 cursor-pointer overflow-hidden" onClick={() => setPhotoIdx(0)}>
          <img src={photos[0]?.url || ''} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
        {photos.slice(1, 5).map((p, i) => (
          <div key={i} className="overflow-hidden cursor-pointer relative" onClick={() => setPhotoIdx(i + 1)}>
            <img src={p.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            {i === 3 && photos.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                +{photos.length - 5} more
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Host */}
          <div className="flex items-center justify-between pb-6 border-b border-dark-700">
            <div>
              <h2 className="text-lg font-semibold text-dark-50">
                Hosted by {l.host?.fullName}
              </h2>
              <div className="flex gap-4 text-sm text-dark-400 mt-1">
                <span><Users size={13} className="inline mr-1" />{l.capacity?.maxGuests} guests</span>
                <span><Bed size={13} className="inline mr-1" />{l.capacity?.bedrooms} bedrooms</span>
                <span><Bath size={13} className="inline mr-1" />{l.capacity?.bathrooms} baths</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand-500/40 flex-shrink-0">
              {l.host?.profilePhoto?.url
                ? <img src={l.host.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-brand-500/20 flex items-center justify-center text-xl font-bold text-brand-400">
                    {l.host?.fullName?.[0]}
                  </div>
              }
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {l.availability?.instantBook && (
              <div className="flex gap-3">
                <Zap size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div><p className="font-medium text-dark-100 text-sm">Instant Book</p><p className="text-xs text-dark-400">No approval needed</p></div>
              </div>
            )}
            <div className="flex gap-3">
              <Shield size={22} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div><p className="font-medium text-dark-100 text-sm">Verified Host</p><p className="text-xs text-dark-400">KYC completed</p></div>
            </div>
            <div className="flex gap-3">
              <Calendar size={22} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-dark-100 text-sm">Flexible Check-in</p>
                <p className="text-xs text-dark-400">After {l.availability?.checkInTime}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-dark-50 mb-3">About this place</h3>
            <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">{l.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-dark-50 mb-4">What's included</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES_CONFIG.filter((a) => l.amenities?.[a.key]).map((a) => (
                <AmenityChip key={a.key} icon={a.icon} label={a.label} />
              ))}
            </div>
          </div>

          {/* House Rules */}
          {l.houseRules && (
            <div>
              <h3 className="text-lg font-semibold text-dark-50 mb-3">House rules</h3>
              <div className="space-y-2 text-sm text-dark-300">
                <div className="flex items-center gap-2"><Check size={14} className="text-dark-400" />Check-in: after {l.availability?.checkInTime}</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-dark-400" />Check-out: before {l.availability?.checkOutTime}</div>
                {l.houseRules.noSmoking && <div className="flex items-center gap-2"><Check size={14} className="text-dark-400" />No smoking</div>}
                {l.houseRules.noParties && <div className="flex items-center gap-2"><Check size={14} className="text-dark-400" />No parties or events</div>}
                {l.houseRules.noPets && <div className="flex items-center gap-2"><Check size={14} className="text-dark-400" />No pets</div>}
                {l.houseRules.quietHoursStart && <div className="flex items-center gap-2"><Check size={14} className="text-dark-400" />Quiet hours: {l.houseRules.quietHoursStart} – {l.houseRules.quietHoursEnd}</div>}
                {l.houseRules.customRules?.map((r, i) => (
                  <div key={i} className="flex items-center gap-2"><Check size={14} className="text-dark-400" />{r}</div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation */}
          <div className="card p-5">
            <h3 className="font-semibold text-dark-50 mb-2">Cancellation policy</h3>
            <p className={`font-medium text-sm ${policy?.color}`}>{policy?.label}</p>
            <p className="text-dark-400 text-sm mt-1">{policy?.desc}</p>
          </div>

          {/* Location hint */}
          <div>
            <h3 className="text-lg font-semibold text-dark-50 mb-3">Location</h3>
            <div className="bg-dark-800 rounded-xl p-4 text-sm text-dark-300 border border-dark-700">
              <p className="font-medium text-dark-100 mb-1">{l.location?.area}, {l.location?.city}</p>
              {l.location?.landmark && <p>Near: {l.location.landmark}</p>}
              <p className="text-dark-500 mt-2 text-xs">Exact address shared after booking confirmation.</p>
            </div>
          </div>
        </div>

        {/* Right: booking widget */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-2xl font-bold text-dark-50">{formatCurrency(l.pricing?.basePrice)}</span>
              <span className="text-dark-400 text-sm">/ night</span>
              {l.ratings?.totalReviews > 0 && (
                <span className="ml-auto text-sm text-dark-400 flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {l.ratings.average}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Check-in</label>
                <input type="date" value={booking.checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })}
                  className="w-full text-sm py-2.5" />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Check-out</label>
                <input type="date" value={booking.checkOut}
                  min={booking.checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })}
                  className="w-full text-sm py-2.5" />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs text-dark-400 mb-1 block">Guests</label>
              <input type="number" min={1} max={l.capacity?.maxGuests} value={booking.adults}
                onChange={(e) => setBooking({ ...booking, adults: parseInt(e.target.value) })}
                className="w-full text-sm py-2.5" />
              <p className="text-xs text-dark-500 mt-1">Max {l.capacity?.maxGuests} guests</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-dark-400 mb-1 block">Message to host <span className="text-dark-600">(optional)</span></label>
              <textarea rows={2} placeholder="Introduce yourself..." value={booking.message}
                onChange={(e) => setBooking({ ...booking, message: e.target.value })}
                className="w-full text-sm py-2.5 resize-none" />
            </div>

            {/* Pricing breakdown */}
            {pricing && (
              <div className="space-y-2 text-sm mb-4 pt-4 border-t border-dark-700">
                <div className="flex justify-between text-dark-300">
                  <span>{formatCurrency(l.pricing.basePrice)} × {pricing.nights} nights</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>−{formatCurrency(pricing.discount)}</span>
                  </div>
                )}
                {pricing.cleaningFee > 0 && (
                  <div className="flex justify-between text-dark-300">
                    <span>Cleaning fee</span>
                    <span>{formatCurrency(pricing.cleaningFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-dark-300">
                  <span>Service fee</span>
                  <span>{formatCurrency(pricing.serviceFee)}</span>
                </div>
                {pricing.securityDeposit > 0 && (
                  <div className="flex justify-between text-dark-300">
                    <span>Security deposit <span className="text-xs">(refundable)</span></span>
                    <span>{formatCurrency(pricing.securityDeposit)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-dark-50 pt-2 border-t border-dark-700">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.totalAmount)}</span>
                </div>
              </div>
            )}

            <button onClick={handleBook} disabled={booking_pending} className="btn-primary w-full">
              {booking_pending ? <Spinner size="sm" /> : null}
              {booking_pending ? 'Booking...' : l.availability?.instantBook ? '⚡ Book Now' : 'Request to Book'}
            </button>

            <p className="text-center text-xs text-dark-500 mt-3">
              {l.availability?.instantBook ? 'No approval needed — instant confirmation' : 'Host will confirm within 24 hours'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
