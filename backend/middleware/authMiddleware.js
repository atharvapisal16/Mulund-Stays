const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect routes (requires valid JWT) ───────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been suspended. Reason: ${user.banReason || 'Policy violation'}`,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

// ── Role-based authorization ───────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

// ── Check host KYC approved ───────────────────────────────────────────────────
const requireApprovedHost = (req, res, next) => {
  if (!req.user.isHost || req.user.kyc?.kycStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'You must complete KYC verification to perform this action.',
      kycStatus: req.user.kyc?.kycStatus || 'not_submitted',
    });
  }
  next();
};

// ── Optional auth (attach user if token exists) ───────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
    next();
  } catch {
    next(); // silently fail — route works without auth
  }
};

module.exports = { protect, authorize, requireApprovedHost, optionalAuth };
