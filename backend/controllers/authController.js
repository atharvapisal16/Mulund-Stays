const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendOTP, sendEmail } = require('../services/notificationService');

// ── Generate JWT ───────────────────────────────────────────────────────────────
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

// ── @POST /api/auth/register ───────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, dateOfBirth, gender } = req.body;

  // Check existing
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Phone number';
    return res.status(400).json({ success: false, message: `${field} is already registered.` });
  }

  // Age verification (18+)
  if (dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(400).json({ success: false, message: 'You must be at least 18 years old to register.' });
    }
  }

  const user = await User.create({ fullName, email, phone, password, dateOfBirth, gender });

  // Send OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });
  await sendOTP(phone, otp, fullName);

  // Send welcome email
  await sendEmail({
    to: email,
    subject: '🏠 Welcome to MulundStays!',
    template: 'welcome',
    data: { name: fullName },
  });

  const token = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created! Please verify your phone number.',
    token,
    refreshToken,
    user: user.toSafeJSON(),
    requiresPhoneVerification: true,
  });
});

// ── @POST /api/auth/login ──────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockExpiry = new Date(user.lockUntil).toLocaleTimeString('en-IN');
    return res.status(423).json({
      success: false,
      message: `Account temporarily locked due to too many failed attempts. Try again after ${lockExpiry}.`,
    });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    await user.incrementLoginAttempts();
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  // Reset login attempts on success
  await User.findByIdAndUpdate(user._id, {
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });

  const token = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    refreshToken,
    user: user.toSafeJSON(),
  });
});

// ── @POST /api/auth/verify-otp ─────────────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user.id).select('+otp +otpExpire +otpAttempts');

  if (!user.otp) {
    return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
  }

  if (user.otpAttempts >= 5) {
    return res.status(429).json({ success: false, message: 'Too many OTP attempts. Please request a new OTP.' });
  }

  if (Date.now() > user.otpExpire) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  if (user.otp !== otp.toString()) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    return res.status(400).json({ success: false, message: 'Invalid OTP.', attemptsLeft: 5 - user.otpAttempts });
  }

  user.isPhoneVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Phone number verified successfully!' });
});

// ── @POST /api/auth/resend-otp ─────────────────────────────────────────────────
const resendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+otp +otpExpire');

  if (user.otpExpire && Date.now() < user.otpExpire - 9 * 60 * 1000) {
    return res.status(429).json({ success: false, message: 'Please wait before requesting another OTP.' });
  }

  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });
  await sendOTP(user.phone, otp, user.fullName);

  res.json({ success: true, message: 'OTP sent successfully.' });
});

// ── @POST /api/auth/forgot-password ───────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal whether email exists
    return res.json({ success: true, message: 'If that email is registered, you will receive a reset link.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: email,
    subject: 'MulundStays - Password Reset Request',
    template: 'resetPassword',
    data: { name: user.fullName, resetUrl },
  });

  res.json({ success: true, message: 'Password reset link sent to your email.' });
});

// ── @PUT /api/auth/reset-password/:token ──────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. Please log in.' });
});

// ── @POST /api/auth/refresh-token ─────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token required.' });

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

  const newToken = generateToken(user._id, user.role);
  res.json({ success: true, token: newToken });
});

// ── @GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user: user.toSafeJSON() });
});

module.exports = { register, login, verifyOTP, resendOTP, forgotPassword, resetPassword, refreshToken, getMe };
