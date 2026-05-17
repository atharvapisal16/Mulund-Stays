// ══════════════════════════════════════════════════════
// listingRoutes.js
// ══════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { protect, authorize, requireApprovedHost, optionalAuth } = require('../middleware/authMiddleware');
const { uploadListingPhotos } = require('../config/cloudinary');
const {
  searchListings, getListingById, createListing, updateListing,
  deleteListing, uploadPhotos, deletePhoto, submitForApproval,
  getMyListings, blockDates,
} = require('../controllers/listingController');

router.get('/search', optionalAuth, searchListings);
router.get('/host/my-listings', protect, getMyListings);
router.get('/:id', optionalAuth, getListingById);
router.post('/', protect, authorize('host', 'admin'), createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);
router.post('/:id/photos', protect, uploadListingPhotos.array('photos', 30), uploadPhotos);
router.delete('/:id/photos/:photoId', protect, deletePhoto);
router.put('/:id/submit', protect, submitForApproval);
router.put('/:id/block-dates', protect, blockDates);

module.exports = router;
