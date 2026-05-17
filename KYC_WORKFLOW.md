/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KYC VERIFICATION WORKFLOW
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This document explains the complete KYC (Know Your Customer) verification flow
 * in the MulundStays application.
 */

// ───────────────────────────────────────────────────────────────────────────────
// STEP 1: HOST SUBMITS KYC
// ───────────────────────────────────────────────────────────────────────────────

KYC Status After Submission:
  ├─ Status: "pending"
  ├─ Documents: Aadhaar + PAN uploaded & stored in Cloudinary
  ├─ User receives: Email + SMS notification
  └─ Can do: View dashboard (read-only)

Cannot do yet:
  ❌ Create listings
  ❌ Edit/publish properties
  ❌ Access pricing/earnings
  ❌ List properties publicly


// ───────────────────────────────────────────────────────────────────────────────
// STEP 2: ADMIN REVIEWS & APPROVES
// ───────────────────────────────────────────────────────────────────────────────

Admin Task:
  - Go to Admin Panel → Users
  - Filter by KYC Status: "pending"
  - Review Aadhaar & PAN documents
  - Either: APPROVE or REJECT with reason

Endpoint: PUT /api/admin/users/:id/kyc
Payload:
  {
    "action": "approve" | "reject",
    "reason": "Optional rejection reason"
  }


// ───────────────────────────────────────────────────────────────────────────────
// STEP 3: KYC APPROVED ✅
// ───────────────────────────────────────────────────────────────────────────────

Update in Database:
  kyc: {
    kycStatus: "approved",           ← Changed from "pending"
    kycVerifiedAt: Date.now(),       ← Timestamp
    kycVerifiedBy: admin_user_id,    ← Admin who approved
  }

Notifications Sent:
  ✅ Email: "Your KYC has been verified!"
  ✅ SMS: Approval notification
  ✅ In-App: Success notification

User receives message:
  "Your KYC has been verified. You can now list properties on MulundStays!"


// ───────────────────────────────────────────────────────────────────────────────
// STEP 4: WHAT UNLOCKS AFTER APPROVAL
// ───────────────────────────────────────────────────────────────────────────────

NOW CAN UNLOCK:

// 1️⃣ CREATE LISTINGS
   - Go to Host Dashboard → Create Listing
   - Fill property details (address, photos, pricing, amenities)
   - List property can now be ACTIVE

// 2️⃣ SET PRICING & AVAILABILITY
   - Set base price per night
   - Add cleaning fees, security deposit
   - Block unavailable dates
   - Create pricing rules

// 3️⃣ RECEIVE BOOKINGS
   - Guests can now book your property
   - Get booking requests
   - Accept / Reject bookings

// 4️⃣ MANAGE BOOKINGS
   - View upcoming checkings
   - Chat with guests
   - Process check-ins & check-outs

// 5️⃣ EARN MONEY
   - Track earnings per booking
   - View payout history
   - Submit bank/UPI details for payments

// 6️⃣ BECOME SUPERHOST (Optional)
   - Get "Superhost" badge if:
      • Response rate > 90%
      • Minimum 4.8 rating
      • No cancellations
   - Earn more bookings with badge


// ───────────────────────────────────────────────────────────────────────────────
// STEP 5: KYC REJECTED ❌
// ───────────────────────────────────────────────────────────────────────────────

If documents are invalid:

KYC Status:
  kycStatus: "rejected"
  kycRejectionReason: "Aadhaar document is blurry"

User receives:
  ✅ Email: "Your KYC was rejected"
  ✅ SMS: Rejection notification
  ✅ Reason: Why it was rejected

User can:
  - Resubmit KYC with correct documents
  - Return to "pending" status for review


// ───────────────────────────────────────────────────────────────────────────────
// COMPLETE STATUS FLOW DIAGRAM
// ───────────────────────────────────────────────────────────────────────────────

┌─────────────┐
│   GUEST     │  (Anyone) Can book & message
│ (Host: No)  │
└──────┬──────┘
       │ Click "Become Host"
       ▼
┌──────────────────┐
│  BECOME A HOST   │  HostConverter Account to Host
│  (isHost: true)  │  (Still no KYC)
└──────┬───────────┘
       │ Click "Submit KYC"
       ▼
┌────────────────────────────────────────┐
│  KYC PENDING - STATUS: "pending"       │ ⏳ Waiting for admin review
│  • Can't list properties               │ (1-2 days)
│  • Can't set pricing                   │
│  • Can't receive bookings              │
└──────┬─────────────────────────────────┘
       │
       ├─────────────────────────────✓─────────────────────────┐
       │                                                        │
       ▼                                                        ▼
┌────────────────────────────────┐           ┌─────────────────────────┐
│ KYC APPROVED! ✅              │           │ KYC REJECTED ❌         │
│ Status: "approved"            │           │ Status: "rejected"      │
├────────────────────────────────┤           ├─────────────────────────┤
│ ✅ Create listings            │           │ ❌ Can't list yet      │
│ ✅ Set pricing & dates        │           │ 🔄 Resubmit KYC        │
│ ✅ Receive bookings           │           │ 📧 See rejection reason │
│ ✅ Manage guests              │           └─────────────────────────┘
│ ✅ Earn money                 │
│ ✅ Superhost eligibility      │
└────────────────────────────────┘


// ───────────────────────────────────────────────────────────────────────────────
// API ENDPOINTS & CHECKS
// ───────────────────────────────────────────────────────────────────────────────

Backend Middleware Check:
  requireApprovedHost() {
    if (!user.isHost || user.kyc.kycStatus !== "approved") {
      return 403 error "You must complete KYC verification"
    }
  }

This middleware is applied to:
  ✓ POST /api/listings (create listing)
  ✓ PUT /api/listings/:id (edit listing)
  ✓ DELETE /api/listings/:id (delete listing)
  ✓ POST /api/listings/:id/photos (upload photos)
  ✓ PUT /api/listings/:id/block-dates (block dates)


// ───────────────────────────────────────────────────────────────────────────────
// FRONTEND FLOWS
// ───────────────────────────────────────────────────────────────────────────────

// HOST DASHBOARD - Shows KYC Status:

if (kyc.kycStatus === "not_submitted") {
  ➜ Show: "Submit KYC" button
  ➜ Disable: All listing features

} else if (kyc.kycStatus === "pending") {
  ➜ Show: "KYC Under Review" badge
  ➜ Message: "We're verifying your documents..."
  ➜ Disable: All listing features
  ➜ Show: Admin contact for questions

} else if (kyc.kycStatus === "rejected") {
  ➜ Show: "KYC Rejected" badge
  ➜ Message: Reason why rejected
  ➜ Show: "Resubmit KYC" button
  ➜ Disable: All listing features

} else if (kyc.kycStatus === "approved") {
  ➜ Show: "Verified ✅" badge
  ➜ Enable: All features
  ➜ Show: Create Listing button
  ➜ Show: Earnings dashboard
}


// ───────────────────────────────────────────────────────────────────────────────
// TYPICAL TIMELINE
// ───────────────────────────────────────────────────────────────────────────────

Day 1:
  09:00 AM - User signs up as Guest
  10:00 AM - User clicks "Become a Host"
  10:05 AM - User submits KYC documents

Day 2:
  03:00 PM - Admin reviews & approves KYC

Day 2-3:
  04:00 PM - User creates first listing
  04:30 PM - Photos uploaded & listing ACTIVE
  05:00 PM - First booking request arrives

Day 4+:
  Earning money from bookings! 💰


// ───────────────────────────────────────────────────────────────────────────────
// DATABASE UPDATES ON APPROVAL
// ───────────────────────────────────────────────────────────────────────────────

Before Approval:
  {
    _id: "user123",
    isHost: true,
    kyc: {
      aadhaarNumber: "123456789012",
      aadhaarFront: { url: "...", publicId: "..." },
      aadhaarBack: { url: "...", publicId: "..." },
      panNumber: "ABCDE1234F",
      panCard: { url: "...", publicId: "..." },
      kycStatus: "pending",
      kycRejectionReason: null,
      kycVerifiedAt: null,
      kycVerifiedBy: null
    }
  }

After Approval:
  {
    _id: "user123",
    isHost: true,
    kyc: {
      aadhaarNumber: "123456789012",
      aadhaarFront: { url: "...", publicId: "..." },
      aadhaarBack: { url: "...", publicId: "..." },
      panNumber: "ABCDE1234F",
      panCard: { url: "...", publicId: "..." },
      kycStatus: "approved",              ← ✅ CHANGED
      kycRejectionReason: null,
      kycVerifiedAt: "2026-04-20T...",    ← ✅ SET
      kycVerifiedBy: "admin456"           ← ✅ SET
    }
  }


// ───────────────────────────────────────────────────────────────────────────────
// TESTING THE FLOW
// ───────────────────────────────────────────────────────────────────────────────

FOR DEVELOPMENT (Bypass KYC):
  In .env add:
    SKIP_KYC_VERIFICATION=true  // ⚠️ DEVELOPMENT ONLY

  Then in middleware:
    requireApprovedHost() {
      if (process.env.SKIP_KYC_VERIFICATION === "true") {
        return next();  // Skip check
      }
    }

FOR TESTING FULL FLOW:
  1. Create test host account
  2. Submit KYC with dummy data
  3. Go to Admin Panel
  4. Approve KYC
  5. Back to host, should see "Verified ✅"
  6. Create listing
  7. Verify guest can book


═══════════════════════════════════════════════════════════════════════════════
END OF KYC WORKFLOW DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════
 */
