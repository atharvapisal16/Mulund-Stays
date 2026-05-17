# 🏠 MulundStays

> **Airbnb-style short-stay booking platform for Mulund, Mumbai**

![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![Version](https://img.shields.io/badge/v-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 What's Inside

This is a **full-stack booking platform** with three separate applications:

1. **Guest App** - Browse & book properties
2. **Host App** - List properties & manage bookings  
3. **Admin Portal** - Approve KYC & manage platform

---

## ✨ Features

### 🔐 Authentication & Security
- User registration & login (JWT + OTP email verification)
- Password reset workflow
- Role-based access control (Guest, Host, Admin)
- Secure password hashing

### 🏠 Listings Management
- Create, edit, delete property listings
- Multi-photo upload (up to 20 images per listing)
- Property details (bedrooms, bathrooms, capacity)
- Amenities selection (50+ amenities available)
- Location tagging & Google Maps integration
- Pricing tiers (base price, weekend price, weekly/monthly discounts)
- Availability calendar
- House rules customization
- Admin approval workflow (pending → approved/rejected → active)

### 📅 Booking System
- Browse & search listings with advanced filters
  - Filter by location (Mulund East/West)
  - Filter by price range, capacity, amenities
  - Sort by price, rating, newest
- Date selection with availability checking
- Booking request system (guests can send requests)
- Host accept/reject booking requests
- Auto-expiry of pending bookings after 24 hours
- Booking cancellation with refund processing
- Check-in/check-out management
- Booking status tracking (pending → confirmed → completed/cancelled)

### 💳 Payments
- Razorpay integration with multiple payment methods:
  - UPI payments
  - Credit/Debit cards
  - Net Banking
  - Digital wallets (Apple Pay, Google Pay)
  - EMI (installment options)
- Automatic webhook handling for payment updates
- Payment status tracking
- Automatic commission calculation (configurable percentage)
- Refund processing system
- Transaction history

### 💰 Host Earnings
- Earnings dashboard showing:
  - Total earnings from completed bookings
  - Breakdown by individual bookings
  - Platform commission deduction
  - Host payout amount calculation
- Payout status tracking
- Commission transparency

### 👤 Host KYC Verification
- Host document submission (Aadhaar + PAN card)
- Document upload to Cloudinary cloud storage
- Admin approval workflow for KYC review
- Email & SMS notifications for approval/rejection
- KYC status tracking (pending → approved/rejected/resubmit)
- Cannot list properties until KYC is approved

### ⭐ Reviews & Ratings
- 5-star rating system
- Multi-category ratings:
  - Cleanliness
  - Accuracy of listing
  - Communication with host
  - Location quality
  - Value for money
- Public & private review comments
- Mutual review system (guest reviews host, host reviews guest)
- Reviews only visible after booking completion
- Average rating calculation per listing

### 📬 Notifications
- Email notifications (Gmail SMTP)
- SMS notifications (MSG91 or Twilio)
- Notification types:
  - KYC approval/rejection
  - Booking confirmation/cancellation
  - Payment receipts
  - New booking requests (for hosts)
  - Host messages to guests

### 👨‍💼 User Management (Admin)
- View all users (guests & hosts)
- Search users by name, email, phone
- Ban/unban user accounts
- View user KYC status
- View user booking history

### 📊 Admin Dashboard
- Platform statistics:
  - Total number of users
  - Total listings on platform
  - Total bookings completed
  - Total revenue earned
- Quick access counters:
  - Pending KYC submissions
  - Pending listing approvals
  - Active bookings

### 🔍 KYC Approval Queue (Admin)
- View all pending KYC submissions
- See Aadhaar & PAN documents
- Approve or reject KYC applications
- Add rejection reasons
- Auto-send approval/rejection via email & SMS
- Filter by KYC status

### ✅ Listing Approval Queue (Admin)
- View all pending listing submissions
- See listing photos & details
- Check if host has approved KYC
- Approve or reject listings
- Add rejection reasons
- Auto-notify hosts of approval/rejection

### 🔖 Wishlist
- Add/remove listings from wishlist
- View saved wishlists
- Quick access to favorite properties

### 🔍 Search & Filters
- Full-text search on listing titles & descriptions
- Location-based search (Mulund East, Mulund West)
- Price range filtering
- Guest capacity filtering
- Property type filtering (apartment, villa, shared room)
- Amenities multi-select filtering
- Availability date filtering
- Sort options (price low-to-high, rating, newest)

### 🗺️ Maps Integration
- Google Maps display of property location
- Nearby amenities on map
- Distance calculation from landmarks
- Location-based search

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, React Query, Zustand |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + bcryptjs |
| **Payments** | Razorpay |
| **Cloud Storage** | Cloudinary |
| **Notifications** | Nodemailer (Email), MSG91/Twilio (SMS) |
| **Maps** | Google Maps API |

---

## 📁 Project Structure

```
backend/                    # Express.js API server
├── controllers/            # Business logic
├── models/                 # Mongoose schemas
├── routes/                 # API routes
├── middleware/             # Authentication & error handling
├── services/               # Email, SMS, notifications
└── server.js               # Entry point

frontend/                   # React web app
├── pages/                  # Page components
│   ├── auth/              # Login, Register, OTP
│   ├── guest/             # Browse, Book, Bookings
│   ├── host/              # Dashboard, Listings, KYC
│   └── admin/             # Dashboard, Approvals, Users
├── components/            # Reusable components
└── services/              # API client
```



## Features

### Guest
- Search by area, dates, guests, price range, amenities
- View listing photos, amenities, reviews, map location
- Book with real-time pricing calculation
- Pay via Razorpay (UPI / Card / Net Banking)
- Wishlist, booking history, host contact post-confirmation
- Leave reviews (mutual — both sides review)

### Host
- Multi-step listing creation wizard
- Photo upload (up to 30 photos, auto-optimized via Cloudinary)
- Availability calendar & date blocking
- Instant Book toggle
- Accept/decline booking requests
- Earnings dashboard with charts
- KYC verification (Aadhaar + PAN)
- Payout tracking

### Admin
- Dashboard with platform stats
- KYC document review (approve/reject)
- Listing approval workflow
- User management (ban/unban)
- All bookings overview
- Revenue analytics

---

## Security
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry + refresh tokens
- Rate limiting on auth endpoints (20 req/15min)
- Razorpay signature verification on payments
- Webhook secret validation
- Helmet.js security headers
- Account lockout after 5 failed logins
- KYC verification before listing publication

---

Built for Mulund. Powered by the MERN stack. 🏠
