const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const listingSchema = new mongoose.Schema(
  {
    // ── Host ───────────────────────────────────────────────────────────────────
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Basics ─────────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    propertyType: {
      type: String,
      required: true,
      enum: ['private_room', 'entire_flat', 'shared_room', 'pg', 'bungalow', 'studio'],
    },

    // ── Capacity ───────────────────────────────────────────────────────────────
    capacity: {
      maxGuests: { type: Number, required: true, min: 1, max: 20 },
      bedrooms: { type: Number, required: true, min: 0 },
      beds: { type: Number, required: true, min: 1 },
      bathrooms: { type: Number, required: true, min: 1 },
    },

    // ── Location ───────────────────────────────────────────────────────────────
    // Note: location.street and pincode are optional for draft listings
    // They become required when submitting for approval
    location: {
      flatNo: { type: String },
      buildingName: { type: String },
      street: { type: String }, // Optional during draft, required before publish
      area: {
        type: String,
        enum: ['Mulund East', 'Mulund West', 'Nahur', 'Bhandup East', 'Bhandup West', 'Other'],
      },
      landmark: { type: String },
      city: { type: String, default: 'Mumbai' },
      state: { type: String, default: 'Maharashtra' },
      pincode: {
        type: String,
        validate: {
          validator: function(v) {
            // If pincode has a value, it must be 6 digits
            if (!v) return true; // Empty is ok
            return /^[0-9]{6}$/.test(v);
          },
          message: 'PIN code must be 6 digits',
        },
      },
      // GeoJSON for MongoDB geospatial queries
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [72.9380, 19.1742] }, // [lng, lat] Mulund default
      },
    },

    // ── Building details ───────────────────────────────────────────────────────
    building: {
      floor: { type: Number },
      hasLift: { type: Boolean, default: false },
      societyName: { type: String },
      buildingType: {
        type: String,
        enum: ['apartment', 'independent_house', 'society_flat', 'chawl', 'villa'],
      },
    },

    // ── Photos ─────────────────────────────────────────────────────────────────
    photos: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        caption: { type: String },
        isCover: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],

    // ── Amenities ─────────────────────────────────────────────────────────────
    amenities: {
      // Essentials
      wifi: { type: Boolean, default: false },
      wifiSpeed: { type: String }, // e.g. "100 Mbps"
      ac: { type: Boolean, default: false },
      geyser: { type: Boolean, default: false },
      // Kitchen
      kitchen: { type: Boolean, default: false },
      kitchenUtensils: { type: Boolean, default: false },
      refrigerator: { type: Boolean, default: false },
      microwave: { type: Boolean, default: false },
      // Laundry
      washingMachine: { type: Boolean, default: false },
      // Entertainment
      tv: { type: Boolean, default: false },
      // Workspace
      workDesk: { type: Boolean, default: false },
      // Parking
      twoWheelerParking: { type: Boolean, default: false },
      fourWheelerParking: { type: Boolean, default: false },
      // Building
      powerBackup: { type: Boolean, default: false },
      cctvCommonAreas: { type: Boolean, default: false },
      securityGuard: { type: Boolean, default: false },
      // Extra
      balcony: { type: Boolean, default: false },
      petFriendly: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
      wheelchairAccessible: { type: Boolean, default: false },
    },

    // ── House Rules ────────────────────────────────────────────────────────────
    houseRules: {
      noSmoking: { type: Boolean, default: true },
      noParties: { type: Boolean, default: true },
      noPets: { type: Boolean, default: true },
      quietHoursStart: { type: String, default: '22:00' },
      quietHoursEnd: { type: String, default: '07:00' },
      customRules: [{ type: String }],
    },

    // ── Pricing ────────────────────────────────────────────────────────────────
    pricing: {
      basePrice: { type: Number, required: true, min: 100 }, // per night
      weekendPrice: { type: Number }, // Fri-Sat
      cleaningFee: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      // Discounts
      weeklyDiscount: { type: Number, default: 0, min: 0, max: 50 }, // percentage
      monthlyDiscount: { type: Number, default: 0, min: 0, max: 50 }, // percentage
    },

    // ── Availability ───────────────────────────────────────────────────────────
    availability: {
      minStay: { type: Number, default: 1 }, // nights
      maxStay: { type: Number, default: 365 }, // nights
      checkInTime: { type: String, default: '12:00' },
      checkOutTime: { type: String, default: '11:00' },
      instantBook: { type: Boolean, default: false },
      // Blocked dates by host
      blockedDates: [{ type: Date }],
      // Advance notice
      advanceNotice: {
        type: String,
        enum: ['same_day', '1_day', '2_days', '3_days', '7_days'],
        default: '1_day',
      },
    },

    // ── Cancellation Policy ────────────────────────────────────────────────────
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate',
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'active', 'paused', 'rejected', 'archived'],
      default: 'draft',
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },

    // ── Ratings & Reviews ──────────────────────────────────────────────────────
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      cleanliness: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      value: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },

    // ── Stats ─────────────────────────────────────────────────────────────────
    stats: {
      views: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
    },

    // ── Meta ───────────────────────────────────────────────────────────────────
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }], // e.g. ['near_station', 'family_friendly', 'budget']
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
listingSchema.index({ 'location.coordinates': '2dsphere' });
listingSchema.index({ status: 1, 'location.area': 1 });
listingSchema.index({ 'pricing.basePrice': 1 });
listingSchema.index({ 'ratings.average': -1 });
listingSchema.index({ host: 1 });
listingSchema.index({ propertyType: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ isFeatured: 1 });

// ── Virtual: cover photo ───────────────────────────────────────────────────────
listingSchema.virtual('coverPhoto').get(function () {
  const cover = this.photos.find((p) => p.isCover);
  return cover ? cover.url : this.photos[0]?.url || '';
});

// ── Method: update ratings from reviews ───────────────────────────────────────
listingSchema.methods.updateRatings = async function (newRatings) {
  const total = this.ratings.totalReviews + 1;
  const avg = (field) =>
    ((this.ratings[field] * this.ratings.totalReviews + newRatings[field]) / total).toFixed(2);

  this.ratings = {
    cleanliness: avg('cleanliness'),
    accuracy: avg('accuracy'),
    communication: avg('communication'),
    location: avg('location'),
    value: avg('value'),
    totalReviews: total,
    average: (
      (parseFloat(avg('cleanliness')) +
        parseFloat(avg('accuracy')) +
        parseFloat(avg('communication')) +
        parseFloat(avg('location')) +
        parseFloat(avg('value'))) /
      5
    ).toFixed(2),
  };

  await this.save();
};

listingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Listing', listingSchema);
