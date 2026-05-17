const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendNotification } = require('../services/notificationService');

// ── Calculate pricing ──────────────────────────────────────────────────────────
const calculatePricing = (listing, checkIn, checkOut) => {
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  if (nights <= 0) throw new Error('Invalid date range.');

  const isWeekend = (date) => [5, 6].includes(new Date(date).getDay()); // Fri, Sat
  let subtotal = 0;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + i);
    const price = isWeekend(d) && listing.pricing.weekendPrice
      ? listing.pricing.weekendPrice
      : listing.pricing.basePrice;
    subtotal += price;
  }

  // Discounts
  let discount = 0;
  if (nights >= 28 && listing.pricing.monthlyDiscount) {
    discount = subtotal * (listing.pricing.monthlyDiscount / 100);
  } else if (nights >= 7 && listing.pricing.weeklyDiscount) {
    discount = subtotal * (listing.pricing.weeklyDiscount / 100);
  }

  const discountedSubtotal = subtotal - discount;
  const cleaningFee = listing.pricing.cleaningFee || 0;
  const serviceFee = Math.round(discountedSubtotal * 0.05); // 5% service fee to guest
  const securityDeposit = listing.pricing.securityDeposit || 0;
  const totalAmount = discountedSubtotal + cleaningFee + serviceFee + securityDeposit;
  const platformCommission = Math.round(discountedSubtotal * (parseInt(process.env.PLATFORM_COMMISSION_PERCENT || 10) / 100));
  const hostPayout = discountedSubtotal + cleaningFee - platformCommission;

  return {
    basePrice: listing.pricing.basePrice,
    numNights: nights,
    subtotal,
    cleaningFee,
    serviceFee,
    securityDeposit,
    discount,
    totalAmount,
    platformCommission,
    hostPayout,
    currency: 'INR',
  };
};

// ── Check date availability ────────────────────────────────────────────────────
const checkAvailability = async (listingId, checkIn, checkOut, excludeBookingId = null) => {
  const query = {
    listing: listingId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } },
    ],
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const conflict = await Booking.findOne(query);
  return !conflict;
};

// ── @POST /api/bookings ───────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const { listingId, checkIn, checkOut, numGuests, guestMessage, specialRequests } = req.body;

  const listing = await Listing.findById(listingId).populate('host', 'fullName phone email');

  if (!listing || listing.status !== 'active') {
    return res.status(404).json({ success: false, message: 'Listing not available.' });
  }

  // Can't book own listing
  if (listing.host._id.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot book your own listing.' });
  }

  // Guest capacity check
  const totalGuests = (numGuests.adults || 1) + (numGuests.children || 0);
  if (totalGuests > listing.capacity.maxGuests) {
    return res.status(400).json({
      success: false,
      message: `This listing accommodates maximum ${listing.capacity.maxGuests} guests.`,
    });
  }

  // Stay duration check
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  if (nights < listing.availability.minStay) {
    return res.status(400).json({ success: false, message: `Minimum stay is ${listing.availability.minStay} night(s).` });
  }
  if (nights > listing.availability.maxStay) {
    return res.status(400).json({ success: false, message: `Maximum stay is ${listing.availability.maxStay} nights.` });
  }

  // Availability check
  const available = await checkAvailability(listingId, checkIn, checkOut);
  if (!available) {
    return res.status(409).json({ success: false, message: 'Selected dates are not available.' });
  }

  // Check blocked dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const isBlocked = listing.availability.blockedDates?.some((d) => {
    const blocked = new Date(d);
    return blocked >= checkInDate && blocked < checkOutDate;
  });
  if (isBlocked) {
    return res.status(409).json({ success: false, message: 'Some dates in your selection are blocked by the host.' });
  }

  const pricing = calculatePricing(listing, checkIn, checkOut);

  // Set expiry for host to respond
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const bookingData = {
    guest: req.user.id,
    host: listing.host._id,
    listing: listingId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    numNights: nights,
    numGuests,
    pricing,
    guestMessage,
    specialRequests,
    isInstantBook: listing.availability.instantBook,
    expiresAt: listing.availability.instantBook ? undefined : expiresAt,
    status: listing.availability.instantBook ? 'confirmed' : 'pending',
  };

  const booking = await Booking.create(bookingData);

  // Notify host
  await sendNotification({
    userId: listing.host._id,
    type: 'booking_request',
    title: listing.availability.instantBook ? 'New Instant Booking!' : 'New Booking Request',
    message: `${req.user.fullName} wants to book "${listing.title}" from ${checkIn} to ${checkOut}.`,
    data: { bookingId: booking._id, bookingRef: booking.bookingRef },
    channels: { inApp: true, sms: true, email: true },
  });

  res.status(201).json({
    success: true,
    message: listing.availability.instantBook
      ? 'Booking confirmed! Proceed to payment.'
      : 'Booking request sent! Host will respond within 24 hours.',
    data: {
      booking,
      pricing,
      isInstantBook: listing.availability.instantBook,
    },
  });
});

// ── @GET /api/bookings/guest ──────────────────────────────────────────────────
const getGuestBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { guest: req.user.id };
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'listing', select: 'title photos location.area pricing' },
      { path: 'host', select: 'fullName profilePhoto phone' },
    ],
    lean: true,
  };

  const result = await Booking.paginate(filter, options);
  res.json({ success: true, data: result });
});

// ── @GET /api/bookings/host ───────────────────────────────────────────────────
const getHostBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { host: req.user.id };
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'listing', select: 'title photos location.area' },
      { path: 'guest', select: 'fullName profilePhoto phone email guestStats' },
    ],
    lean: true,
  };

  const result = await Booking.paginate(filter, options);
  res.json({ success: true, data: result });
});

// ── @GET /api/bookings/:id ────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('listing')
    .populate('guest', 'fullName profilePhoto phone email')
    .populate('host', 'fullName profilePhoto phone email')
    .populate('payment');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  // Only guest, host, or admin can view
  const isParty = [booking.guest._id.toString(), booking.host._id.toString()].includes(req.user.id);
  if (!isParty && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Only show full address after confirmation
  if (booking.status !== 'confirmed' && booking.status !== 'completed') {
    booking.listing.location.flatNo = undefined;
    booking.listing.location.buildingName = undefined;
    booking.listing.location.street = undefined;
  }

  res.json({ success: true, data: booking });
});

// ── @PUT /api/bookings/:id/respond ────────────────────────────────────────────
const respondToBooking = asyncHandler(async (req, res) => {
  const { action, declineReason } = req.body; // action: 'accept' | 'decline'

  const booking = await Booking.findById(req.params.id).populate('listing', 'title');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  if (booking.host.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (booking.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
  }

  if (action === 'accept') {
    booking.status = 'confirmed';
    booking.hostResponse.respondedAt = new Date();

    await sendNotification({
      userId: booking.guest,
      type: 'booking_confirmed',
      title: 'Booking Accepted! 🎉',
      message: `Your booking for "${booking.listing.title}" has been confirmed. Proceed to payment.`,
      data: { bookingId: booking._id },
      channels: { inApp: true, sms: true, email: true },
    });
  } else if (action === 'decline') {
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: 'host',
      cancelledAt: new Date(),
      reason: declineReason,
      refundAmount: 0,
    };
    booking.hostResponse = { respondedAt: new Date(), declineReason };

    await sendNotification({
      userId: booking.guest,
      type: 'booking_cancelled',
      title: 'Booking Declined',
      message: `Your booking request for "${booking.listing.title}" was declined.`,
      data: { bookingId: booking._id, reason: declineReason },
      channels: { inApp: true, sms: true, email: true },
    });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action. Use "accept" or "decline".' });
  }

  await booking.save();
  res.json({ success: true, message: `Booking ${action}ed.`, data: booking });
});

// ── @PUT /api/bookings/:id/cancel ────────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('listing', 'title cancellationPolicy');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  const isGuest = booking.guest.toString() === req.user.id;
  const isHost = booking.host.toString() === req.user.id;

  if (!isGuest && !isHost && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
  }

  // Calculate refund based on cancellation policy
  let refundAmount = 0;
  const daysUntilCheckIn = Math.ceil((booking.checkIn - Date.now()) / (1000 * 60 * 60 * 24));

  if (isGuest && booking.payment) {
    const policy = booking.listing.cancellationPolicy;
    if (policy === 'flexible' && daysUntilCheckIn >= 1) {
      refundAmount = booking.pricing.totalAmount;
    } else if (policy === 'moderate' && daysUntilCheckIn >= 5) {
      refundAmount = booking.pricing.totalAmount;
    } else if (policy === 'strict') {
      if (daysUntilCheckIn >= 7) refundAmount = booking.pricing.totalAmount * 0.5;
    }
  }

  booking.status = 'cancelled';
  booking.cancellation = {
    cancelledBy: isGuest ? 'guest' : isHost ? 'host' : 'admin',
    cancelledAt: new Date(),
    reason,
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : 'none',
  };

  await booking.save();

  res.json({
    success: true,
    message: 'Booking cancelled.',
    data: { refundAmount, refundStatus: booking.cancellation.refundStatus },
  });
});

// ── @GET /api/bookings/check-availability ────────────────────────────────────
const checkDateAvailability = asyncHandler(async (req, res) => {
  const { listingId, checkIn, checkOut } = req.query;

  if (!listingId || !checkIn || !checkOut) {
    return res.status(400).json({ success: false, message: 'listingId, checkIn, and checkOut are required.' });
  }

  const available = await checkAvailability(listingId, checkIn, checkOut);
  const listing = await Listing.findById(listingId).select('pricing availability capacity');
  const pricing = available && listing ? calculatePricing(listing, checkIn, checkOut) : null;

  res.json({ success: true, available, pricing });
});

module.exports = {
  createBooking, getGuestBookings, getHostBookings, getBookingById,
  respondToBooking, cancelBooking, checkDateAvailability,
};
