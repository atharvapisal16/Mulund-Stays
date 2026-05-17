const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Check if Cloudinary credentials exist ─────────────────────────────────────
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_API_KEY && 
                            process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary if credentials exist
if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── MOCK STORAGE FOR DEVELOPMENT (when Cloudinary not configured) ──────────────
const devDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(devDir)) fs.mkdirSync(devDir, { recursive: true });

const mockStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(devDir, file.fieldname);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ── Storage for listing photos ─────────────────────────────────────────────────
const listingPhotoStorage = hasCloudinaryConfig ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mulundstays/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill', quality: 'auto:good' },
    ],
    public_id: (req, file) => `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },
}) : mockStorage;

// ── Storage for user profile photos ───────────────────────────────────────────
const profilePhotoStorage = hasCloudinaryConfig ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mulundstays/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
    public_id: (req, file) => `profile_${req.user?.id}_${Date.now()}`,
  },
}) : mockStorage;

// ── Storage for KYC documents ─────────────────────────────────────────────────
const kycDocStorage = hasCloudinaryConfig ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mulundstays/kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
    public_id: (req, file) => `kyc_${req.user?.id}_${file.fieldname}_${Date.now()}`,
  },
}) : mockStorage;

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

const uploadListingPhotos = multer({
  storage: listingPhotoStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 30 },
  fileFilter,
});

const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});

const uploadKYCDocs = multer({
  storage: kycDocStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter,
});

const deleteFromCloudinary = async (publicId) => {
  try {
    if (hasCloudinaryConfig) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      console.log('[DEV] Mock delete:', publicId);
    }
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = {
  cloudinary,
  uploadListingPhotos,
  uploadProfilePhoto,
  uploadKYCDocs,
  deleteFromCloudinary,
  hasCloudinaryConfig,
};
