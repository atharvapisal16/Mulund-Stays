const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createOrder, verifyPayment, handleWebhook,
  getPaymentByBooking, initiateRefund, getHostEarnings,
} = require('../controllers/paymentController');

// Webhook must use raw body — set in server.js
router.post('/webhook', handleWebhook);

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/booking/:bookingId', protect, getPaymentByBooking);
router.post('/:paymentId/refund', protect, authorize('admin'), initiateRefund);
router.get('/host/earnings', protect, getHostEarnings);

module.exports = router;
