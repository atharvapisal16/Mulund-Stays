const express   = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { asyncHandler }       = require('../middleware/errorMiddleware');
const Booking   = require('../models/Booking');
const Listing   = require('../models/Listing');
const User      = require('../models/User');
const { Review, Payment, Notification } = require('../models/index');

// ═══════════════════════════════════════════════
// REVIEW ROUTER
// ═══════════════════════════════════════════════
const reviewRouter = express.Router();

// POST /api/reviews
reviewRouter.post('/', protect, asyncHandler(async (req, res) => {
  const { bookingId, ratings, publicReview, privateReview } = req.body;

  const booking = await Booking.findById(bookingId).populate('listing');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  const isGuest = booking.guest.toString() === req.user.id;
  const isHost  = booking.host.toString()  === req.user.id;
  if (!isGuest && !isHost) {
    return res.status(403).json({ success: false, message: 'Not a party to this booking.' });
  }

  if (!['completed', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: 'Can only review completed bookings.' });
  }

  const reviewType = isGuest ? 'guest_to_host' : 'host_to_guest';

  const existing = await Review.findOne({ booking: bookingId, reviewType });
  if (existing) return res.status(400).json({ success: false, message: 'Review already submitted.' });

  const review = await Review.create({
    booking:     bookingId,
    listing:     booking.listing._id,
    reviewer:    req.user.id,
    reviewee:    isGuest ? booking.host : booking.guest,
    reviewType,
    ratings,
    publicReview,
    privateReview,
  });

  if (isGuest) booking.guestReviewed = true;
  else         booking.hostReviewed  = true;
  await booking.save();

  const bothReviewed = booking.guestReviewed && booking.hostReviewed;
  if (bothReviewed) {
    await Review.updateMany({ booking: bookingId }, { isVisible: true });
    if (isGuest && booking.listing?.updateRatings) {
      await booking.listing.updateRatings(ratings);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Review submitted! It will be visible once both parties have reviewed.',
    data: review,
  });
}));

// GET /api/reviews/listing/:listingId
reviewRouter.get('/listing/:listingId', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const reviews = await Review.find({
    listing:    req.params.listingId,
    reviewType: 'guest_to_host',
    isVisible:  true,
  })
    .populate('reviewer', 'fullName profilePhoto createdAt')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  const total = await Review.countDocuments({
    listing:    req.params.listingId,
    reviewType: 'guest_to_host',
    isVisible:  true,
  });

  res.json({ success: true, data: { reviews, total, page: parseInt(page) } });
}));

// PUT /api/reviews/:id/host-response
reviewRouter.put('/:id/host-response', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  if (review.reviewee.toString() !== req.user.id)
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  if (review.hostResponse?.text)
    return res.status(400).json({ success: false, message: 'Already responded.' });

  review.hostResponse = { text: req.body.text, respondedAt: new Date() };
  await review.save();
  res.json({ success: true, message: 'Response added.', data: review });
}));

// ═══════════════════════════════════════════════
// ADMIN ROUTER
// ═══════════════════════════════════════════════
const adminRouter = express.Router();
adminRouter.use(protect, authorize('admin'));

// GET /api/admin/dashboard
adminRouter.get('/dashboard', asyncHandler(async (req, res) => {
  const [userCount, listingCount, bookingCount, payments] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Booking.countDocuments(),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  const pendingKyc      = await User.countDocuments({ 'kyc.kycStatus': 'pending' });
  const pendingListings = await Listing.countDocuments({ status: 'pending_approval' });
  const activeBookings  = await Booking.countDocuments({ status: 'confirmed' });

  res.json({
    success: true,
    data: {
      users:    userCount,
      listings: listingCount,
      bookings: bookingCount,
      revenue:  payments[0]?.total || 0,
      pendingKyc,
      pendingListings,
      activeBookings,
    },
  });
}));

// GET /api/admin/users
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const { role, kycStatus, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (role)      filter.role = role;
  if (kycStatus) filter['kyc.kycStatus'] = kycStatus;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { phone:    { $regex: search, $options: 'i' } },
    ];
  }
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  const total = await User.countDocuments(filter);
  res.json({ success: true, data: { users, total } });
}));

// PUT /api/admin/users/:id/kyc
adminRouter.put('/users/:id/kyc', asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.kyc.kycStatus = action === 'approve' ? 'approved' : 'rejected';
  if (action === 'reject') user.kyc.kycRejectionReason = reason;
  if (action === 'approve') {
    user.kyc.kycVerifiedAt  = new Date();
    user.kyc.kycVerifiedBy  = req.user.id;
  }
  await user.save({ validateBeforeSave: false });

  const { sendNotification } = require('../services/notificationService');
  await sendNotification({
    userId:  user._id,
    type:    action === 'approve' ? 'kyc_approved' : 'kyc_rejected',
    title:   action === 'approve' ? 'KYC Approved! ✅' : 'KYC Rejected',
    message: action === 'approve'
      ? 'Your KYC has been verified. You can now list properties on MulundStays!'
      : `Your KYC was rejected. Reason: ${reason}. Please resubmit with correct documents.`,
    data:     {},
    channels: { inApp: true, email: true, sms: true },
  });

  res.json({ success: true, message: `KYC ${action}d.` });
}));

// PUT /api/admin/users/:id/ban
adminRouter.put('/users/:id/ban', asyncHandler(async (req, res) => {
  const { ban, reason } = req.body;
  await User.findByIdAndUpdate(req.params.id, { isBanned: ban, banReason: reason || '' });
  res.json({ success: true, message: `User ${ban ? 'banned' : 'unbanned'}.` });
}));

// GET /api/admin/listings/pending
adminRouter.get('/listings/pending', asyncHandler(async (req, res) => {
  const listings = await Listing.find({ status: 'pending_approval' })
    .populate('host', 'fullName email phone kyc.kycStatus')
    .sort({ createdAt: 1 })
    .lean();
  res.json({ success: true, data: listings });
}));

// PUT /api/admin/listings/:id/review
adminRouter.put('/listings/:id/review', asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  const listing = await Listing.findById(req.params.id).populate('host', 'email fullName');
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

  listing.status = action === 'approve' ? 'active' : 'rejected';
  if (action === 'approve') { listing.approvedBy = req.user.id; listing.approvedAt = new Date(); }
  if (action === 'reject')    listing.rejectionReason = reason;
  await listing.save();

  const { sendNotification } = require('../services/notificationService');
  await sendNotification({
    userId:  listing.host._id,
    type:    action === 'approve' ? 'listing_approved' : 'listing_rejected',
    title:   action === 'approve' ? 'Listing Approved! 🏠' : 'Listing Rejected',
    message: action === 'approve'
      ? `Your listing "${listing.title}" is now live on MulundStays!`
      : `Your listing "${listing.title}" was rejected. Reason: ${reason}`,
    data:     { listingId: listing._id },
    channels: { inApp: true, email: true, sms: true },
  });

  res.json({ success: true, message: `Listing ${action}d.` });
}));

// GET /api/admin/bookings
adminRouter.get('/bookings', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};
  const bookings = await Booking.find(filter)
    .populate('guest',   'fullName email')
    .populate('host',    'fullName email')
    .populate('listing', 'title location.area')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  const total = await Booking.countDocuments(filter);
  res.json({ success: true, data: { bookings, total } });
}));

// GET /api/admin/revenue
adminRouter.get('/revenue', asyncHandler(async (req, res) => {
  const monthly = await Payment.aggregate([
    { $match: { status: 'captured' } },
    {
      $group: {
        _id:        { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue:    { $sum: '$amount' },
        commission: { $sum: '$payout.platformCommission' },
        bookings:   { $count: {} },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);
  res.json({ success: true, data: monthly });
}));

// ═══════════════════════════════════════════════
// NOTIFICATION ROUTER
// ═══════════════════════════════════════════════
const notifRouter = express.Router();

notifRouter.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
  res.json({ success: true, data: { notifications, unreadCount } });
}));

notifRouter.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All marked as read.' });
}));

notifRouter.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { isRead: true });
  res.json({ success: true });
}));

// ═══════════════════════════════════════════════
// UPLOAD ROUTER
// ═══════════════════════════════════════════════
const uploadRouter = express.Router();

uploadRouter.get('/sign', protect, asyncHandler(async (req, res) => {
  const { cloudinary } = require('../config/cloudinary');
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: 'mulundstays/listings' },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    success: true,
    data: {
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY,
    },
  });
}));

module.exports = { reviewRouter, adminRouter, notifRouter, uploadRouter };
