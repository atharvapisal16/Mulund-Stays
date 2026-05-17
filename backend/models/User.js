const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Core Identity ──────────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // ── Profile ────────────────────────────────────────────────────────────────
    profilePhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    bio: { type: String, maxlength: 500 },

    // ── Role & Status ──────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['guest', 'host', 'admin'],
      default: 'guest',
    },
    isHost: { type: Boolean, default: false }, // can be both guest and host

    // ── Verification ───────────────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },

    // ── OTP ───────────────────────────────────────────────────────────────────
    otp: { type: String, select: false },
    otpExpire: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0 },

    // ── Password Reset ─────────────────────────────────────────────────────────
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    // ── KYC (mandatory for hosts) ─────────────────────────────────────────────
    kyc: {
      aadhaarNumber: { type: String, select: false }, // encrypted
      aadhaarFront: { url: String, publicId: String },
      aadhaarBack: { url: String, publicId: String },
      panNumber: { type: String, select: false },
      panCard: { url: String, publicId: String },
      kycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected'],
        default: 'not_submitted',
      },
      kycRejectionReason: { type: String },
      kycVerifiedAt: { type: Date },
      kycVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    // ── Bank / Payout Details (for hosts) ─────────────────────────────────────
    payoutDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String, select: false },
      ifscCode: { type: String },
      bankName: { type: String },
      upiId: { type: String },
      preferredMethod: { type: String, enum: ['bank', 'upi'], default: 'bank' },
    },

    // ── Host Stats ─────────────────────────────────────────────────────────────
    hostStats: {
      totalListings: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      responseRate: { type: Number, default: 0 }, // percentage
      responseTime: { type: String, default: 'within a day' },
      isSuperhost: { type: Boolean, default: false },
      hostSince: { type: Date },
    },

    // ── Guest Stats ────────────────────────────────────────────────────────────
    guestStats: {
      totalBookings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },

    // ── Wishlist ───────────────────────────────────────────────────────────────
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],

    // ── Notifications Preferences ──────────────────────────────────────────────
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },

    // ── Account Status ─────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Note: email and phone already have indexes from "unique: true" property
userSchema.index({ role: 1 });
userSchema.index({ 'kyc.kycStatus': 1 });
userSchema.index({ createdAt: -1 });

// ── Virtual: isLocked ─────────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: hash password ────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Method: compare password ───────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Method: increment login attempts ──────────────────────────────────────────
userSchema.methods.incrementLoginAttempts = async function () {
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
  const MAX_ATTEMPTS = 5;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.updateOne(updates);
};

// ── Method: generate OTP ───────────────────────────────────────────────────────
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  return otp;
};

// ── Remove sensitive fields from JSON output ───────────────────────────────────
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpire;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  if (obj.kyc) {
    delete obj.kyc.aadhaarNumber;
    delete obj.kyc.panNumber;
  }
  if (obj.payoutDetails) {
    delete obj.payoutDetails.accountNumber;
  }
  return obj;
};

module.exports = mongoose.model('User', userSchema);
