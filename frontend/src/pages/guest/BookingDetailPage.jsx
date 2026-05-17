// BookingDetailPage.jsx
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Phone } from 'lucide-react';
import { bookingAPI, paymentAPI, userAPI } from '@/services/api';
import { PageHeader, PageLoader, Spinner, EmptyState, ListingCard } from '@/components/common/UI';
import { formatCurrency, formatDate, bookingStatusColor, loadRazorpay, openRazorpay } from '@/utils/helpers';
import { useAuthStore } from '@/context/authStore';
import toast from 'react-hot-toast';

export function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingAPI.getById(id),
    select: (d) => d?.data,
  });

  const { mutate: cancel, isPending } = useMutation({
    mutationFn: (reason) => bookingAPI.cancel(id, { reason }),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries(['booking', id]);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader />;
  if (!booking) return <div className="container-page py-20 text-center text-dark-400">Booking not found.</div>;

  const isGuest = booking.guest?._id === user?._id || booking.guest === user?._id;
  const other = isGuest ? booking.host : booking.guest;

  return (
    <div className="container-page py-8 max-w-3xl">
      <PageHeader
        title={`Booking ${booking.bookingRef}`}
        subtitle={booking.listing?.title}
        back={<Link to="/bookings" className="text-sm text-brand-400">← My Bookings</Link>}
      />

      <div className="grid gap-6">
        {/* Status */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={`badge ${bookingStatusColor(booking.status)} capitalize text-sm`}>{booking.status}</span>
            <span className="text-dark-400 text-sm">Ref: {booking.bookingRef}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-dark-500 text-xs mb-0.5">Check-in</p><p className="text-dark-100 font-medium">{formatDate(booking.checkIn)}</p></div>
            <div><p className="text-dark-500 text-xs mb-0.5">Check-out</p><p className="text-dark-100 font-medium">{formatDate(booking.checkOut)}</p></div>
            <div><p className="text-dark-500 text-xs mb-0.5">Guests</p><p className="text-dark-100 font-medium">{(booking.numGuests?.adults || 1) + (booking.numGuests?.children || 0)}</p></div>
            <div><p className="text-dark-500 text-xs mb-0.5">Nights</p><p className="text-dark-100 font-medium">{booking.numNights}</p></div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-5">
          <h3 className="font-semibold text-dark-50 mb-4">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-dark-300"><span>Subtotal ({booking.numNights} nights)</span><span>{formatCurrency(booking.pricing?.subtotal)}</span></div>
            {booking.pricing?.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatCurrency(booking.pricing.discount)}</span></div>}
            {booking.pricing?.cleaningFee > 0 && <div className="flex justify-between text-dark-300"><span>Cleaning fee</span><span>{formatCurrency(booking.pricing.cleaningFee)}</span></div>}
            <div className="flex justify-between text-dark-300"><span>Service fee</span><span>{formatCurrency(booking.pricing?.serviceFee)}</span></div>
            {booking.pricing?.securityDeposit > 0 && <div className="flex justify-between text-dark-300"><span>Security deposit</span><span>{formatCurrency(booking.pricing.securityDeposit)}</span></div>}
            <div className="flex justify-between font-bold text-dark-50 pt-2 border-t border-dark-700"><span>Total</span><span>{formatCurrency(booking.pricing?.totalAmount)}</span></div>
          </div>
        </div>

        {/* Contact - only after confirmation */}
        {['confirmed', 'completed'].includes(booking.status) && other && (
          <div className="card p-5">
            <h3 className="font-semibold text-dark-50 mb-3">{isGuest ? 'Your Host' : 'Your Guest'}</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xl">
                {other.fullName?.[0]}
              </div>
              <div>
                <p className="font-medium text-dark-100">{other.fullName}</p>
                <p className="text-sm text-dark-400 flex items-center gap-1"><Phone size={12} /> +91 {other.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {['pending', 'confirmed'].includes(booking.status) && isGuest && (
          <button
            onClick={() => { if (confirm('Cancel this booking?')) cancel('Guest cancelled'); }}
            disabled={isPending}
            className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {isPending ? <Spinner size="sm" /> : null} Cancel Booking
          </button>
        )}

        {booking.status === 'confirmed' && !booking.payment && (
          <Link to={`/bookings/${id}/checkout`} className="btn-primary w-full text-center">
            Proceed to Payment →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── BookingCheckoutPage ────────────────────────────────
export function BookingCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paying, setPaying] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingAPI.getById(id),
    select: (d) => d?.data,
  });

  const handlePay = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway failed to load. Please try again.'); return; }

      const orderData = await paymentAPI.createOrder(id);
      const { orderId, amount, keyId, prefill } = orderData.data;

      const response = await openRazorpay({
        key: keyId,
        amount,
        currency: 'INR',
        name: 'MulundStays',
        description: `Booking ${booking?.bookingRef}`,
        order_id: orderId,
        prefill,
        theme: { color: '#e94560' },
      });

      await paymentAPI.verify({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        bookingId: id,
      });

      toast.success('Payment successful! 🎉');
      navigate(`/bookings/${id}`);
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="container-page py-8 max-w-lg">
      <PageHeader
        title="Complete Payment"
        back={<Link to={`/bookings/${id}`} className="text-sm text-brand-400">← Back to Booking</Link>}
      />
      <div className="card p-6 space-y-4">
        <div>
          <p className="text-dark-400 text-sm">Booking for</p>
          <p className="font-semibold text-dark-50">{booking?.listing?.title}</p>
          <p className="text-xs text-dark-500 mt-0.5">Ref: {booking?.bookingRef}</p>
        </div>
        <div className="divider" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-dark-300"><span>Subtotal</span><span>{formatCurrency(booking?.pricing?.subtotal)}</span></div>
          {booking?.pricing?.cleaningFee > 0 && <div className="flex justify-between text-dark-300"><span>Cleaning fee</span><span>{formatCurrency(booking.pricing.cleaningFee)}</span></div>}
          <div className="flex justify-between text-dark-300"><span>Service fee</span><span>{formatCurrency(booking?.pricing?.serviceFee)}</span></div>
          {booking?.pricing?.securityDeposit > 0 && <div className="flex justify-between text-dark-300"><span>Security deposit</span><span>{formatCurrency(booking.pricing.securityDeposit)}</span></div>}
        </div>
        <div className="flex justify-between font-bold text-dark-50 text-lg pt-2 border-t border-dark-700">
          <span>Total Amount</span>
          <span>{formatCurrency(booking?.pricing?.totalAmount)}</span>
        </div>
        <div className="bg-dark-800 rounded-xl p-3 text-xs text-dark-400 space-y-1">
          <p>✓ UPI (GPay, PhonePe, Paytm)</p>
          <p>✓ Credit / Debit Card</p>
          <p>✓ Net Banking</p>
          <p>✓ EMI Options</p>
        </div>
        <button onClick={handlePay} disabled={paying} className="btn-primary w-full text-base py-4">
          {paying ? <Spinner /> : '🔒'}
          {paying ? 'Processing...' : `Pay ${formatCurrency(booking?.pricing?.totalAmount)}`}
        </button>
        <p className="text-xs text-dark-500 text-center">
          Secured by Razorpay. Your payment is encrypted and safe.
        </p>
      </div>
    </div>
  );
}

// ── WishlistPage ──────────────────────────────────────
export function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: userAPI.getWishlist,
    select: (d) => d?.data || [],
  });

  return (
    <div className="container-page py-8">
      <PageHeader title="My Wishlist" subtitle="Properties you've saved" />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => <div key={i} className="card h-64 skeleton" />)}
        </div>
      ) : data?.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="Your wishlist is empty"
          description="Save listings you love by clicking the heart icon on any listing."
          action={<Link to="/search" className="btn-primary">Explore Stays</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((l, i) => <ListingCard key={l._id} listing={l} index={i} />)}
        </div>
      )}
    </div>
  );
}

export default BookingDetailPage;
