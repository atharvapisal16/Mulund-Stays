const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { deleteFromCloudinary } = require('../config/cloudinary');

// ── @GET /api/listings/search ─────────────────────────────────────────────────
// Query params: area, checkIn, checkOut, guests, type, minPrice, maxPrice,
//               amenities, instantBook, petFriendly, minRating, sort, page, limit
const searchListings = asyncHandler(async (req, res) => {
  const {
    area, checkIn, checkOut, guests,
    type, minPrice, maxPrice,
    amenities, instantBook, petFriendly, minRating,
    sort = 'relevance', page = 1, limit = 12,
    lat, lng, radius = 5000, // metres
  } = req.query;

  const filter = { status: 'active' };

  // Area / geo filter
  if (lat && lng) {
    filter['location.coordinates'] = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius),
      },
    };
  } else if (area) {
    filter['location.area'] = area;
  }

  // Property type
  if (type) filter.propertyType = type;

  // Price range
  if (minPrice || maxPrice) {
    filter['pricing.basePrice'] = {};
    if (minPrice) filter['pricing.basePrice'].$gte = parseInt(minPrice);
    if (maxPrice) filter['pricing.basePrice'].$lte = parseInt(maxPrice);
  }

  // Guest capacity
  if (guests) filter['capacity.maxGuests'] = { $gte: parseInt(guests) };

  // Amenities
  if (amenities) {
    const amenityList = amenities.split(',').map((a) => a.trim());
    amenityList.forEach((a) => {
      filter[`amenities.${a}`] = true;
    });
  }

  // Instant book
  if (instantBook === 'true') filter['availability.instantBook'] = true;

  // Pet friendly
  if (petFriendly === 'true') filter['amenities.petFriendly'] = true;

  // Minimum rating
  if (minRating) filter['ratings.average'] = { $gte: parseFloat(minRating) };

  // Date availability check — exclude listings with conflicting bookings
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictingBookings = await Booking.distinct('listing', {
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    filter._id = { $nin: conflictingBookings };
  }

  // Sort options
  const sortOptions = {
    relevance: { isFeatured: -1, 'ratings.average': -1, 'stats.totalBookings': -1 },
    price_asc: { 'pricing.basePrice': 1 },
    price_desc: { 'pricing.basePrice': -1 },
    rating: { 'ratings.average': -1 },
    newest: { createdAt: -1 },
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortOptions[sort] || sortOptions.relevance,
    populate: [
      { path: 'host', select: 'fullName profilePhoto hostStats.isSuperhost hostStats.averageRating' },
    ],
    select: '-__v -stats.totalRevenue',
    lean: true,
  };

  const result = await Listing.paginate(filter, options);

  // Add computed fields
  const listings = result.docs.map((l) => ({
    ...l,
    coverPhoto: l.photos.find((p) => p.isCover)?.url || l.photos[0]?.url || '',
    checkInDate: checkIn,
    checkOutDate: checkOut,
  }));

  res.json({
    success: true,
    data: {
      listings,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      },
      filters: { area, checkIn, checkOut, guests, type },
    },
  });
});

// ── @GET /api/listings/:id ────────────────────────────────────────────────────
const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate('host', 'fullName profilePhoto hostStats bio createdAt')
    .lean();

  if (!listing || listing.status === 'archived') {
    return res.status(404).json({ success: false, message: 'Listing not found.' });
  }

  // Increment view count (fire-and-forget)
  Listing.findByIdAndUpdate(req.params.id, { $inc: { 'stats.views': 1 } }).exec();

  // Get unavailable dates (next 12 months)
  const today = new Date();
  const twelveMonthsLater = new Date(today);
  twelveMonthsLater.setMonth(twelveMonthsLater.getMonth() + 12);

  const confirmedBookings = await Booking.find({
    listing: req.params.id,
    status: { $in: ['pending', 'confirmed'] },
    checkOut: { $gte: today },
    checkIn: { $lte: twelveMonthsLater },
  }).select('checkIn checkOut -_id');

  // Build array of unavailable date ranges
  const unavailableDates = [
    ...confirmedBookings.map((b) => ({ start: b.checkIn, end: b.checkOut })),
    ...(listing.availability.blockedDates || []).map((d) => ({ start: d, end: d })),
  ];

  // Privacy: hide exact address until booking
  if (listing.status !== 'active') {
    return res.status(403).json({ success: false, message: 'This listing is not available.' });
  }

  const safeAddress = {
    area: listing.location.area,
    landmark: listing.location.landmark,
    city: listing.location.city,
    pincode: listing.location.pincode,
    // Approximate coordinates (offset by ~200m for privacy)
    approximateCoords: {
      lat: listing.location.coordinates.coordinates[1] + (Math.random() - 0.5) * 0.003,
      lng: listing.location.coordinates.coordinates[0] + (Math.random() - 0.5) * 0.003,
    },
  };

  res.json({
    success: true,
    data: {
      ...listing,
      location: safeAddress,
      unavailableDates,
    },
  });
});

// ── @POST /api/listings ───────────────────────────────────────────────────────
const createListing = asyncHandler(async (req, res) => {
  req.body.host = req.user.id;
  req.body.status = 'draft';

  const listing = await Listing.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Listing created as draft.',
    data: listing,
  });
});

// ── @PUT /api/listings/:id ────────────────────────────────────────────────────
const updateListing = asyncHandler(async (req, res) => {
  let listing = await Listing.findById(req.params.id);

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

  if (listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this listing.' });
  }

  // If listing was active and key fields changed, re-submit for approval
  const sensitiveFields = ['title', 'description', 'pricing', 'location'];
  const needsReapproval = listing.status === 'active' &&
    sensitiveFields.some((f) => req.body[f]);

  if (needsReapproval) req.body.status = 'pending_approval';

  listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });

  res.json({ success: true, message: 'Listing updated.', data: listing });
});

// ── @DELETE /api/listings/:id ─────────────────────────────────────────────────
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

  if (listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Check for active bookings
  const activeBookings = await Booking.countDocuments({
    listing: req.params.id,
    status: { $in: ['pending', 'confirmed'] },
    checkOut: { $gte: new Date() },
  });

  if (activeBookings > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete listing with ${activeBookings} active booking(s). Please cancel them first.`,
    });
  }

  // Soft delete: archive instead of actual delete
  await Listing.findByIdAndUpdate(req.params.id, { status: 'archived' });

  res.json({ success: true, message: 'Listing archived successfully.' });
});

// ── @POST /api/listings/:id/photos ────────────────────────────────────────────
const uploadPhotos = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

  if (listing.host.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No photos uploaded.' });
  }

  if (listing.photos.length + req.files.length > 30) {
    return res.status(400).json({ success: false, message: 'Maximum 30 photos allowed.' });
  }

  const newPhotos = req.files.map((file, i) => ({
    url: file.path,
    publicId: file.filename,
    isCover: listing.photos.length === 0 && i === 0,
    order: listing.photos.length + i,
  }));

  listing.photos.push(...newPhotos);
  await listing.save();

  res.json({ success: true, message: `${req.files.length} photo(s) uploaded.`, photos: listing.photos });
});

// ── @DELETE /api/listings/:id/photos/:photoId ─────────────────────────────────
const deletePhoto = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

  if (listing.host.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const photo = listing.photos.id(req.params.photoId);
  if (!photo) return res.status(404).json({ success: false, message: 'Photo not found.' });

  await deleteFromCloudinary(photo.publicId);
  photo.remove();

  // If deleted photo was cover, make first photo the new cover
  if (listing.photos.length > 0 && !listing.photos.some((p) => p.isCover)) {
    listing.photos[0].isCover = true;
  }

  await listing.save();
  res.json({ success: true, message: 'Photo deleted.' });
});

// ── @PUT /api/listings/:id/submit ─────────────────────────────────────────────
const submitForApproval = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

  if (listing.host.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (listing.photos.length < 3) {
    return res.status(400).json({ success: false, message: 'Minimum 3 photos required before submitting.' });
  }

  if (!['draft', 'rejected'].includes(listing.status)) {
    return res.status(400).json({ success: false, message: `Listing is already ${listing.status}.` });
  }

  listing.status = 'pending_approval';
  await listing.save();

  res.json({ success: true, message: 'Listing submitted for approval. We will review within 24 hours.' });
});

// ── @GET /api/listings/host/my-listings ───────────────────────────────────────
const getMyListings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { host: req.user.id };
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    lean: true,
    select: 'title description propertyType location pricing photos status rejectionReason capacity createdAt',
  };

  const result = await Listing.paginate(filter, options);
  res.json({ success: true, data: result });
});

// ── @PUT /api/listings/:id/block-dates ───────────────────────────────────────
const blockDates = asyncHandler(async (req, res) => {
  const { dates } = req.body; // array of date strings
  const listing = await Listing.findById(req.params.id);

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
  if (listing.host.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });

  const newDates = dates.map((d) => new Date(d));
  listing.availability.blockedDates = [...new Set([...listing.availability.blockedDates, ...newDates])];
  await listing.save();

  res.json({ success: true, message: 'Dates blocked.', blockedDates: listing.availability.blockedDates });
});

module.exports = {
  searchListings, getListingById, createListing, updateListing,
  deleteListing, uploadPhotos, deletePhoto, submitForApproval,
  getMyListings, blockDates,
};
