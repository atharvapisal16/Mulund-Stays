const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createBooking, getGuestBookings, getHostBookings, getBookingById,
  respondToBooking, cancelBooking, checkDateAvailability,
} = require('../controllers/bookingController');

router.get('/check-availability', checkDateAvailability);
router.post('/', protect, createBooking);
router.get('/guest', protect, getGuestBookings);
router.get('/host', protect, getHostBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/respond', protect, respondToBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
