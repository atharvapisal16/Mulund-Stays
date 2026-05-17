const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { Payment } = require('../models/index');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendNotification } = require('../services/notificationService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── @POST /api/payments/create-order ─────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate('listing', 'title host')
    .populate('guest', 'email phone fullName');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  if (booking.guest._id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ success: false, message: 'Booking must be confirmed before payment.' });
  }

  if (booking.payment) {
    const existingPayment = await Payment.findById(booking.payment);
    if (existingPayment?.status === 'captured') {
      return res.status(400).json({ success: false, message: 'Payment already completed.' });
    }
  }

  // Razorpay amount in paise (₹1 = 100 paise)
  const amountInPaise = booking.pricing.totalAmount * 100;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: booking.bookingRef,
    notes: {
      bookingId: booking._id.toString(),
      bookingRef: booking.bookingRef,
      guestName: booking.guest.fullName,
      listingTitle: booking.listing.title,
    },
  });

  // Save payment record
  const payment = await Payment.create({
    booking: booking._id,
    guest: booking.guest._id,
    host: booking.host,
    razorpayOrderId: razorpayOrder.id,
    amount: booking.pricing.totalAmount,
    payout: {
      amount: booking.pricing.hostPayout,
      platformCommission: booking.pricing.platformCommission,
    },
  });

  booking.payment = payment._id;
  await booking.save();

  res.json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingRef: booking.bookingRef,
      prefill: {
        name: booking.guest.fullName,
        email: booking.guest.email,
        contact: `+91${booking.guest.phone}`,
      },
    },
  });
});

// ── @POST /api/payments/verify ────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
  }

  // Fetch payment details from Razorpay
  const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'captured',
      method: rzpPayment.method,
      capturedAt: new Date(),
    },
    { new: true }
  );

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment record not found.' });
  }

  // Update booking payment status
  const booking = await Booking.findById(bookingId)
    .populate('listing', 'title location.area')
    .populate('host', 'fullName email phone');

  if (booking) {
    booking.status = 'confirmed';
    await booking.save();

    // Notify guest
    await sendNotification({
      userId: booking.guest,
      type: 'payment_success',
      title: 'Payment Successful! ✅',
      message: `Payment of ₹${payment.amount.toLocaleString('en-IN')} confirmed for booking ${booking.bookingRef}.`,
      data: { bookingId: booking._id, paymentId: payment._id },
      channels: { inApp: true, sms: true, email: true },
    });

    // Notify host
    await sendNotification({
      userId: booking.host._id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed & Paid! 🏠',
      message: `Booking ${booking.bookingRef} has been paid. Guest arrives on ${booking.checkIn.toDateString()}.`,
      data: { bookingId: booking._id },
      channels: { inApp: true, sms: true, email: true },
    });
  }

  res.json({
    success: true,
    message: 'Payment verified successfully!',
    data: {
      paymentId: payment._id,
      razorpayPaymentId,
      amount: payment.amount,
      bookingRef: booking?.bookingRef,
    },
  });
});

// ── @POST /api/payments/webhook ───────────────────────────────────────────────
// Razorpay sends webhook events here
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (expectedSig !== webhookSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const event = JSON.parse(req.body.toString());
  const { event: eventType, payload } = event;

  console.log(`Razorpay webhook: ${eventType}`);

  switch (eventType) {
    case 'payment.captured': {
      const { payment: { entity } } = payload;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id },
        {
          $push: { webhookEvents: { event: eventType, payload: entity } },
          status: 'captured',
          razorpayPaymentId: entity.id,
          capturedAt: new Date(),
        }
      );
      break;
    }

    case 'payment.failed': {
      const { payment: { entity } } = payload;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id },
        {
          $push: { webhookEvents: { event: eventType, payload: entity } },
          status: 'failed',
        }
      );

      // Find booking and notify guest
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
      if (payment) {
        await sendNotification({
          userId: payment.guest,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          data: { paymentId: payment._id },
          channels: { inApp: true, sms: true },
        });
      }
      break;
    }

    case 'refund.processed': {
      const { refund: { entity: refundEntity } } = payload;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: refundEntity.payment_id },
        {
          $push: {
            webhookEvents: { event: eventType, payload: refundEntity },
            refunds: {
              amount: refundEntity.amount / 100,
              razorpayRefundId: refundEntity.id,
              status: 'processed',
              processedAt: new Date(),
            },
          },
          status: 'refunded',
        }
      );
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  res.json({ success: true });
});

// ── @GET /api/payments/booking/:bookingId ─────────────────────────────────────
const getPaymentByBooking = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ booking: req.params.bookingId });

  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

  const isAuthorized = [payment.guest.toString(), payment.host.toString()].includes(req.user.id);
  if (!isAuthorized && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  res.json({ success: true, data: payment });
});

// ── @POST /api/payments/:paymentId/refund ─────────────────────────────────────
const initiateRefund = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can initiate refunds.' });
  }

  const { amount, reason } = req.body;
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

  const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: amount * 100, // convert to paise
    notes: { reason },
  });

  payment.refunds.push({
    amount,
    razorpayRefundId: refund.id,
    status: 'pending',
    reason,
  });
  await payment.save();

  res.json({ success: true, message: 'Refund initiated.', data: { refundId: refund.id, amount } });
});

// ── @GET /api/payments/host/earnings ─────────────────────────────────────────
const getHostEarnings = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  const now = new Date();
  let startDate;
  if (period === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
  else if (period === 'month') startDate = new Date(now.setMonth(now.getMonth() - 1));
  else if (period === 'year') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
  else startDate = new Date(0); // all time

  const earnings = await Payment.aggregate([
    {
      $match: {
        host: req.user._id,
        status: 'captured',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$payout.amount' },
        totalBookings: { $count: {} },
        totalRevenue: { $sum: '$amount' },
        totalCommission: { $sum: '$payout.platformCommission' },
      },
    },
  ]);

  // Monthly breakdown for chart
  const monthly = await Payment.aggregate([
    { $match: { host: req.user._id, status: 'captured' } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        earnings: { $sum: '$payout.amount' },
        bookings: { $count: {} },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  res.json({
    success: true,
    data: {
      summary: earnings[0] || { totalEarnings: 0, totalBookings: 0, totalRevenue: 0 },
      monthly,
    },
  });
});

module.exports = {
  createOrder, verifyPayment, handleWebhook,
  getPaymentByBooking, initiateRefund, getHostEarnings,
};
