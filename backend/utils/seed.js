require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Listing = require('../models/Listing');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  await User.deleteMany({});
  await Listing.deleteMany({});

  // Admin
  const admin = await User.create({
    fullName: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@mulundstays.com',
    phone: '9000000001',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    isEmailVerified: true,
    isPhoneVerified: true,
  });
  console.log('✅ Admin created:', admin.email);

  // Host
  const host = await User.create({
    fullName: 'Ramesh Patil',
    email: 'host@mulundstays.com',
    phone: '9000000002',
    password: 'Host@123456',
    role: 'host',
    isHost: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    bio: 'Property owner in Mulund East with 5 years of hosting experience.',
    kyc: { kycStatus: 'approved' },
    hostStats: { hostSince: new Date(), averageRating: 4.8, isSuperhost: true },
  });

  // Guest
  const guest = await User.create({
    fullName: 'Priya Shah',
    email: 'guest@mulundstays.com',
    phone: '9000000003',
    password: 'Guest@123456',
    role: 'guest',
    isEmailVerified: true,
    isPhoneVerified: true,
  });

  console.log('✅ Host & Guest created');

  // Sample listings
  const listings = [
    {
      host: host._id,
      title: 'Cozy 1BHK near Mulund Station',
      description: 'A clean and comfortable 1BHK apartment just 5 minutes walk from Mulund station. Perfect for business travelers and couples. The apartment has all amenities including high-speed WiFi, AC, and a fully equipped kitchen.',
      propertyType: 'entire_flat',
      capacity: { maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1 },
      location: {
        flatNo: '304',
        buildingName: 'Sai Krupa Heights',
        street: 'LBS Marg',
        area: 'Mulund West',
        landmark: 'Near Mulund Railway Station',
        pincode: '400080',
        coordinates: { type: 'Point', coordinates: [72.9600, 19.1720] },
      },
      building: { floor: 3, hasLift: true, buildingType: 'apartment' },
      photos: [
        { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', publicId: 'seed_1', isCover: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: 'seed_2', isCover: false, order: 1 },
        { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', publicId: 'seed_3', isCover: false, order: 2 },
      ],
      amenities: { wifi: true, wifiSpeed: '100 Mbps', ac: true, geyser: true, kitchen: true, kitchenUtensils: true, refrigerator: true, tv: true, workDesk: true, twoWheelerParking: true },
      pricing: { basePrice: 1500, weekendPrice: 1800, cleaningFee: 200, securityDeposit: 3000, weeklyDiscount: 10, monthlyDiscount: 20 },
      availability: { minStay: 1, maxStay: 30, checkInTime: '12:00', checkOutTime: '11:00', instantBook: true },
      cancellationPolicy: 'moderate',
      status: 'active',
      ratings: { average: 4.8, cleanliness: 4.9, accuracy: 4.8, communication: 5.0, location: 4.7, value: 4.6, totalReviews: 23 },
      isFeatured: true,
      tags: ['near_station', 'wifi', 'ac', 'couple_friendly'],
    },
    {
      host: host._id,
      title: 'Spacious 2BHK with Balcony — Mulund East',
      description: 'A bright and airy 2BHK flat with a beautiful balcony overlooking the Yeoor Hills. Ideal for families and small groups. Society has 24/7 security and generator backup. Walking distance from D-Mart Mulund.',
      propertyType: 'entire_flat',
      capacity: { maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2 },
      location: {
        flatNo: '12A',
        buildingName: 'Green Valley CHS',
        street: 'Nahur Road',
        area: 'Mulund East',
        landmark: 'Near D-Mart Mulund',
        pincode: '400081',
        coordinates: { type: 'Point', coordinates: [72.9700, 19.1750] },
      },
      building: { floor: 1, hasLift: false, buildingType: 'society_flat' },
      photos: [
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', publicId: 'seed_4', isCover: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', publicId: 'seed_5', isCover: false, order: 1 },
        { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', publicId: 'seed_6', isCover: false, order: 2 },
      ],
      amenities: { wifi: true, wifiSpeed: '50 Mbps', ac: true, geyser: true, kitchen: true, kitchenUtensils: true, refrigerator: true, washingMachine: true, tv: true, balcony: true, fourWheelerParking: true, powerBackup: true, securityGuard: true, cctvCommonAreas: true },
      pricing: { basePrice: 2500, weekendPrice: 3000, cleaningFee: 300, securityDeposit: 5000, weeklyDiscount: 15, monthlyDiscount: 25 },
      availability: { minStay: 2, maxStay: 60, checkInTime: '13:00', checkOutTime: '11:00', instantBook: false },
      cancellationPolicy: 'strict',
      status: 'active',
      ratings: { average: 4.6, cleanliness: 4.7, accuracy: 4.5, communication: 4.8, location: 4.9, value: 4.3, totalReviews: 15 },
      isFeatured: false,
      tags: ['family_friendly', 'balcony', 'parking', 'hills_view'],
    },
    {
      host: host._id,
      title: 'Budget Private Room — Mulund West PG Style',
      description: 'An affordable private room in a shared flat. Ideal for solo travelers, students, and working professionals. Common kitchen and bathroom are well-maintained. Close to Mulund check naka and bus stops.',
      propertyType: 'private_room',
      capacity: { maxGuests: 1, bedrooms: 1, beds: 1, bathrooms: 1 },
      location: {
        street: 'M.G. Road',
        area: 'Mulund West',
        landmark: 'Near Mulund Check Naka',
        pincode: '400080',
        coordinates: { type: 'Point', coordinates: [72.9550, 19.1690] },
      },
      building: { floor: 2, hasLift: false, buildingType: 'apartment' },
      photos: [
        { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', publicId: 'seed_7', isCover: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', publicId: 'seed_8', isCover: false, order: 1 },
      ],
      amenities: { wifi: true, wifiSpeed: '30 Mbps', geyser: true, kitchen: true, workDesk: true, twoWheelerParking: true },
      pricing: { basePrice: 600, cleaningFee: 100, securityDeposit: 1000 },
      availability: { minStay: 3, maxStay: 90, checkInTime: '11:00', checkOutTime: '10:00', instantBook: true },
      cancellationPolicy: 'flexible',
      status: 'active',
      ratings: { average: 4.3, cleanliness: 4.2, accuracy: 4.4, communication: 4.5, location: 4.3, value: 4.7, totalReviews: 8 },
      tags: ['budget', 'solo', 'near_station', 'working_professionals'],
    },
  ];

  await Listing.insertMany(listings);
  console.log('✅ 3 Sample listings created');

  console.log('\n🎉 Seed complete!\n');
  console.log('─────────────────────────────────────');
  console.log('Admin    → admin@mulundstays.com  / Admin@123');
  console.log('Host     → host@mulundstays.com   / Host@123456');
  console.log('Guest    → guest@mulundstays.com  / Guest@123456');
  console.log('─────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
