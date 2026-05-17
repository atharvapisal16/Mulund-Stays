const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const bookingSchema = new mongoose.Schema(
  {
    // ── Parties ────────────────────────────────────────────────────────────────
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },

    // ── Dates ──────────────────────────────────────────────────────────────────
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numNights: { type: Number, required: true },

    // ── Guests ─────────────────────────────────────────────────────────────────
    numGuests: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
    },

    // ── Pricing Breakdown ──────────────────────────────────────────────────────
    pricing: {
      basePrice: { type: Number, required: true }, // per night
      numNights: { type: Number, required: true },
      subtotal: { type: Number, required: true }, // basePrice × numNights
      cleaningFee: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 }, // platform fee to guest
      securityDeposit: { type: Number, default: 0 },
      discount: { type: Number, default: 0 }, // weekly/monthly discount
      totalAmount: { type: Number, required: true }, // what guest pays
      platformCommission: { type: Number, default: 0 }, // what platform takes
      hostPayout: { type: Number, required: true }, // what host receives
      currency: { type: String, default: 'INR' },
    },

    // ── Guest Message ──────────────────────────────────────────────────────────
    guestMessage: { type: String, maxlength: 1000 },
    specialRequests: { type: String, maxlength: 500 },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        'pending',       // waiting for host approval
        'confirmed',     // host accepted + payment done
        'cancelled',     // cancelled by guest or host
        'completed',     // check-out done
        'no_show',       // guest didn't show up
        'refunded',      // refund issued
      ],
      default: 'pending',
    },

    // ── Cancellation ───────────────────────────────────────────────────────────
    cancellation: {
      cancelledBy: { type: String, enum: ['guest', 'host', 'admin'] },
      cancelledAt: { type: Date },
      reason: { type: String },
      refundAmount: { type: Number, default: 0 },
      refundStatus: { type: String, enum: ['none', 'pending', 'processed'] },
    },

    // ── Host Response ──────────────────────────────────────────────────────────
    hostResponse: {
      respondedAt: { type: Date },
      declineReason: { type: String },
    },
    // Auto-expire if host doesn't respond within 24h
    expiresAt: { type: Date },

    // ── Payment ────────────────────────────────────────────────────────────────
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // ── Review Flags ───────────────────────────────────────────────────────────
    guestReviewed: { type: Boolean, default: false },
    hostReviewed: { type: Boolean, default: false },
    reviewWindowOpen: { type: Boolean, default: false },

    // ── Check-in/out Actual Times ──────────────────────────────────────────────
    actualCheckIn: { type: Date },
    actualCheckOut: { type: Date },

    // ── Communication ──────────────────────────────────────────────────────────
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        sentAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
      },
    ],

    // ── Source ─────────────────────────────────────────────────────────────────
    isInstantBook: { type: Boolean, default: false },
    bookingRef: { type: String, unique: true }, // human-readable like MS2024001234
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
bookingSchema.index({ guest: 1, status: 1 });
bookingSchema.index({ host: 1, status: 1 });
bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });
// Note: bookingRef has unique: true, so index already exists

// ── Pre-save: generate booking reference ───────────────────────────────────────
bookingSchema.pre('save', async function (next) {
  if (!this.bookingRef) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.bookingRef = `MS${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// ── Virtual: duration ─────────────────────────────────────────────────────────
bookingSchema.virtual('duration').get(function () {
  if (!this.checkIn || !this.checkOut) return 0;
  const diff = this.checkOut - this.checkIn;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

bookingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Booking', bookingSchema);
