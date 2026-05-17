// ══════════════════════════════════════════════════════
// authRoutes.js
// ══════════════════════════════════════════════════════
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  register, login, verifyOTP, resendOTP,
  forgotPassword, resetPassword, refreshToken, getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const validateRegister = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail({
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
  }),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and a number'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail({
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
  }),
  body('password').notEmpty(),
];

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-otp', protect, verifyOTP);
router.post('/resend-otp', protect, resendOTP);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
