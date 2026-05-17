import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, parseISO } from 'date-fns';

// ── Tailwind class merger ──────────────────────────────
export const cn = (...inputs) => twMerge(clsx(inputs));

// ── Date helpers ──────────────────────────────────────
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
};

export const formatDateShort = (date) => formatDate(date, 'MMM d');

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn)));
};

// ── Currency formatter ────────────────────────────────
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ── Truncate text ─────────────────────────────────────
export const truncate = (str, maxLen = 100) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};

// ── Star rating display ───────────────────────────────
export const formatRating = (rating) => {
  if (!rating) return '—';
  return parseFloat(rating).toFixed(1);
};

// ── Booking status colors ─────────────────────────────
export const bookingStatusColor = (status) => ({
  pending:   'badge-warning',
  confirmed: 'badge-success',
  cancelled: 'badge-error',
  completed: 'badge-neutral',
  no_show:   'badge-error',
  refunded:  'badge-neutral',
}[status] || 'badge-neutral');

// ── KYC status ────────────────────────────────────────
export const kycStatusColor = (status) => ({
  not_submitted: 'badge-neutral',
  pending:       'badge-warning',
  approved:      'badge-success',
  rejected:      'badge-error',
}[status] || 'badge-neutral');

// ── Listing status ────────────────────────────────────
export const listingStatusColor = (status) => ({
  draft:            'badge-neutral',
  pending_approval: 'badge-warning',
  active:           'badge-success',
  paused:           'badge-warning',
  rejected:         'badge-error',
  archived:         'badge-neutral',
}[status] || 'badge-neutral');

// ── Property type labels ──────────────────────────────
export const PROPERTY_TYPES = {
  private_room: 'Private Room',
  entire_flat:  'Entire Flat',
  shared_room:  'Shared Room',
  pg:           'PG',
  bungalow:     'Bungalow',
  studio:       'Studio',
};

// ── Mulund areas ──────────────────────────────────────
export const MULUND_AREAS = [
  'Mulund East',
  'Mulund West',
  'Nahur',
  'Bhandup East',
  'Bhandup West',
  'Other',
];

// ── Amenities config ──────────────────────────────────
export const AMENITIES_CONFIG = [
  { key: 'wifi',               label: 'WiFi',             icon: '📶' },
  { key: 'ac',                 label: 'Air Conditioning',  icon: '❄️' },
  { key: 'geyser',             label: 'Hot Water',         icon: '🚿' },
  { key: 'kitchen',            label: 'Kitchen',           icon: '🍳' },
  { key: 'kitchenUtensils',    label: 'Kitchen Utensils',  icon: '🥄' },
  { key: 'refrigerator',       label: 'Refrigerator',      icon: '🧊' },
  { key: 'washingMachine',     label: 'Washing Machine',   icon: '👕' },
  { key: 'tv',                 label: 'TV',                icon: '📺' },
  { key: 'workDesk',           label: 'Work Desk',         icon: '💼' },
  { key: 'twoWheelerParking',  label: '2W Parking',        icon: '🛵' },
  { key: 'fourWheelerParking', label: '4W Parking',        icon: '🚗' },
  { key: 'powerBackup',        label: 'Power Backup',      icon: '⚡' },
  { key: 'securityGuard',      label: 'Security Guard',    icon: '💂' },
  { key: 'cctvCommonAreas',    label: 'CCTV',              icon: '📷' },
  { key: 'balcony',            label: 'Balcony',           icon: '🌿' },
  { key: 'petFriendly',        label: 'Pet Friendly',      icon: '🐾' },
  { key: 'hasLift',            label: 'Lift',              icon: '🛗' },
];

// ── Cancellation policy descriptions ─────────────────
export const CANCELLATION_POLICIES = {
  flexible: {
    label: 'Flexible',
    desc: 'Full refund if cancelled at least 24 hours before check-in.',
    color: 'text-emerald-400',
  },
  moderate: {
    label: 'Moderate',
    desc: 'Full refund if cancelled at least 5 days before check-in.',
    color: 'text-amber-400',
  },
  strict: {
    label: 'Strict',
    desc: '50% refund if cancelled at least 7 days before check-in. No refund after that.',
    color: 'text-red-400',
  },
};

// ── Calculate pricing (frontend preview) ─────────────
export const calculateClientPricing = (listing, checkIn, checkOut) => {
  if (!listing || !checkIn || !checkOut) return null;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) return null;

  const isWeekend = (date) => [5, 6].includes(new Date(date).getDay());
  let subtotal = 0;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + i);
    subtotal += isWeekend(d) && listing.pricing.weekendPrice
      ? listing.pricing.weekendPrice
      : listing.pricing.basePrice;
  }

  let discount = 0;
  if (nights >= 28 && listing.pricing.monthlyDiscount) discount = subtotal * (listing.pricing.monthlyDiscount / 100);
  else if (nights >= 7 && listing.pricing.weeklyDiscount) discount = subtotal * (listing.pricing.weeklyDiscount / 100);

  const discountedSubtotal = subtotal - discount;
  const cleaningFee = listing.pricing.cleaningFee || 0;
  const serviceFee = Math.round(discountedSubtotal * 0.05);
  const securityDeposit = listing.pricing.securityDeposit || 0;
  const totalAmount = discountedSubtotal + cleaningFee + serviceFee + securityDeposit;

  return { nights, subtotal, discount, discountedSubtotal, cleaningFee, serviceFee, securityDeposit, totalAmount };
};

// ── Razorpay loader ───────────────────────────────────
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpay = (options) => {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.on('payment.failed', (response) => reject(new Error(response.error.description)));
    rzp.open();
  });
};
