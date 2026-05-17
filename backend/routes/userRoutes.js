// ══════════════════════════════════════════════════════
// userRoutes.js
// ══════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');
const User = require('../models/User');
const { uploadProfilePhoto, uploadKYCDocs } = require('../config/cloudinary');

// GET /api/users/profile
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user.toSafeJSON() });
}));

// PUT /api/users/profile
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'bio', 'gender', 'dateOfBirth', 'notifications'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', data: user.toSafeJSON() });
}));

// POST /api/users/profile-photo
router.post('/profile-photo', protect, uploadProfilePhoto.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo uploaded.' });
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePhoto: { url: req.file.path, publicId: req.file.filename } },
    { new: true }
  );
  res.json({ success: true, message: 'Profile photo updated.', data: { url: user.profilePhoto.url } });
}));

// PUT /api/users/change-password
router.put('/change-password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
}));

// POST /api/users/become-host — register as host
router.post('/become-host', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.isHost) return res.status(400).json({ success: false, message: 'Already a host.' });

  user.isHost = true;
  user.role = 'host';
  user.hostStats.hostSince = new Date();
  await user.save();

  res.json({ success: true, message: 'You are now registered as a host! Please complete KYC to list properties.' });
}));

// POST /api/users/kyc — submit KYC documents
// In PRODUCTION: Files are required. In DEVELOPMENT: Can submit without files for testing
router.post('/kyc', protect, uploadKYCDocs.fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
]), asyncHandler(async (req, res) => {
  const { aadhaarNumber, panNumber } = req.body;
  const user = await User.findById(req.user.id);
  const isDev = process.env.NODE_ENV === 'development';

  // In development, files are optional
  const filesProvided = !!(req.files?.aadhaarFront && req.files?.aadhaarBack);
  
  if (!isDev && !filesProvided) {
    return res.status(400).json({ 
      success: false, 
      message: 'Aadhaar front and back photos are required.' 
    });
  }

  // Build KYC object
  const kyc = {
    aadhaarNumber,
    panNumber,
    kycStatus: 'pending',
  };

  // If files provided, attach them
  if (req.files?.aadhaarFront) {
    kyc.aadhaarFront = { 
      url: req.files.aadhaarFront[0].path, 
      publicId: req.files.aadhaarFront[0].filename 
    };
  }
  if (req.files?.aadhaarBack) {
    kyc.aadhaarBack = { 
      url: req.files.aadhaarBack[0].path, 
      publicId: req.files.aadhaarBack[0].filename 
    };
  }
  if (req.files?.panCard) {
    kyc.panCard = { 
      url: req.files.panCard[0].path, 
      publicId: req.files.panCard[0].filename 
    };
  }

  user.kyc = kyc;
  await user.save({ validateBeforeSave: false });
  
  const message = filesProvided 
    ? 'KYC documents submitted. We will review within 24-48 hours.'
    : '[DEV MODE] KYC data saved without files. Admin can approve for testing.';
  
  res.json({ success: true, message });
}));

// PUT /api/users/payout-details
router.put('/payout-details', protect, asyncHandler(async (req, res) => {
  const { accountHolderName, accountNumber, ifscCode, bankName, upiId, preferredMethod } = req.body;
  await User.findByIdAndUpdate(req.user.id, {
    payoutDetails: { accountHolderName, accountNumber, ifscCode, bankName, upiId, preferredMethod },
  });
  res.json({ success: true, message: 'Payout details saved.' });
}));

// GET /api/users/:id/public — public host profile
router.get('/:id/public', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('fullName profilePhoto bio hostStats createdAt isHost');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: user });
}));

// POST /api/users/wishlist/:listingId
router.post('/wishlist/:listingId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const idx = user.wishlist.indexOf(req.params.listingId);
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    await user.save();
    return res.json({ success: true, message: 'Removed from wishlist.', wishlisted: false });
  }
  user.wishlist.push(req.params.listingId);
  await user.save();
  res.json({ success: true, message: 'Added to wishlist.', wishlisted: true });
}));

// GET /api/users/wishlist
router.get('/wishlist', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'wishlist',
    select: 'title photos pricing location ratings status',
    match: { status: 'active' },
  });
  res.json({ success: true, data: user.wishlist });
}));

module.exports = router;
