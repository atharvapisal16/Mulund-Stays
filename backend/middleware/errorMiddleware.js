// ── 404 Not Found ─────────────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// ── Global Error Handler ───────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    statusCode = 400;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large. Maximum size is 10MB.';
    statusCode = 400;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
      error: err,
    });
  }

  res.status(statusCode).json({ success: false, message });
};

// ── Async wrapper to avoid try-catch in every controller ─────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { notFound, errorHandler, asyncHandler };
