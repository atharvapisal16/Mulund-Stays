const mongoose = require('mongoose');

// ══════════════════════════════════════════════════════
//  PAYMENT MODEL
// ══════════════════════════════════════════════════════
const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Razorpay ─────────────────────────────────────────────────────────────
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // ── Amount ────────────────────────────────────────────────────────────────
    amount: { type: Number, required: true }, // total paid by guest (paise)
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'emi', 'unknown'],
      default: 'unknown',
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
      default: 'created',
    },

    // ── Payout to host ────────────────────────────────────────────────────────
    payout: {
      amount: { type: Number }, // net amount after commission
      platformCommission: { type: Number },
      tds: { type: Number, default: 0 },
      status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
      processedAt: { type: Date },
      razorpayPayoutId: { type: String },
    },

    // ── Refund ────────────────────────────────────────────────────────────────
    refunds: [
      {
        amount: { type: Number },
        razorpayRefundId: { type: String },
        status: { type: String, enum: ['pending', 'processed', 'failed'] },
        reason: { type: String },
        processedAt: { type: Date },
      },
    ],

    // ── Webhook log ───────────────────────────────────────────────────────────
    webhookEvents: [
      {
        event: { type: String },
        payload: { type: mongoose.Schema.Types.Mixed },
        receivedAt: { type: Date, default: Date.now },
      },
    ],

    capturedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });
// Note: razorpayOrderId has unique: true, so index already exists
paymentSchema.index({ 'payout.status': 1 });

const Payment = mongoose.model('Payment', paymentSchema);

// ══════════════════════════════════════════════════════
//  REVIEW MODEL
// ══════════════════════════════════════════════════════
const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewType: { type: String, enum: ['guest_to_host', 'host_to_guest'], required: true },

    // ── Ratings (guest reviews listing/host) ─────────────────────────────────
    ratings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5, required: true },
    },

    // ── Text ─────────────────────────────────────────────────────────────────
    publicReview: { type: String, maxlength: 1000 },
    privateReview: { type: String, maxlength: 500, select: false }, // only shown to host

    // ── Visibility ────────────────────────────────────────────────────────────
    // Reviews are hidden until both sides submit, or 14 days pass
    isVisible: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String },

    // ── Host response to guest review ─────────────────────────────────────────
    hostResponse: {
      text: { type: String, maxlength: 500 },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true }
);

reviewSchema.index({ listing: 1, reviewType: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
// Note: booking has unique: true, so index already exists

const Review = mongoose.model('Review', reviewSchema);

// ══════════════════════════════════════════════════════
//  NOTIFICATION MODEL
// ══════════════════════════════════════════════════════
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'booking_request', 'booking_confirmed', 'booking_cancelled', 'booking_completed',
        'payment_success', 'payment_failed', 'payout_processed',
        'new_review', 'review_reminder',
        'kyc_approved', 'kyc_rejected',
        'listing_approved', 'listing_rejected',
        'checkin_reminder', 'checkout_reminder',
        'message_received', 'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed }, // extra context (booking ID, etc.)
    isRead: { type: Boolean, default: false },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Payment, Review, Notification };
