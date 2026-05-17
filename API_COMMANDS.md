# 📡 API Commands - Create Listings

Quick commands to test creating listings via API.

---

## 🔑 Get Host Token First

**Login as Host:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "host@mulundstays.com",
    "password": "Host@123456"
  }'
```

**Response:** You'll get a `token`. Copy it and use in next commands.

---

## 📝 Create Listing 1: Mulund East 2BHK

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "title": "Spacious 2BHK Family Apartment - Mulund East",
    "description": "A bright and airy 2BHK flat in a well-established society with 24/7 security. Perfect for families and small groups. Located near D-Mart Mulund, just 2 minutes walk from bus stops.",
    "propertyType": "entire_flat",
    "capacity": {
      "maxGuests": 4,
      "bedrooms": 2,
      "beds": 2,
      "bathrooms": 2
    },
    "location": {
      "flatNo": "12A",
      "buildingName": "Green Valley CHS",
      "street": "Nahur Road",
      "area": "Mulund East",
      "landmark": "Near D-Mart Mulund",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400081",
      "coordinates": {
        "type": "Point",
        "coordinates": [72.9320, 19.1680]
      }
    },
    "building": {
      "floor": 4,
      "hasLift": true,
      "societyName": "Green Valley CHS",
      "buildingType": "apartment"
    },
    "amenities": {
      "wifi": true,
      "wifiSpeed": "100 Mbps",
      "ac": true,
      "geyser": true,
      "kitchen": true,
      "kitchenUtensils": true,
      "refrigerator": true,
      "microwave": true,
      "washingMachine": true,
      "tv": true,
      "workDesk": true,
      "balcony": true,
      "twoWheelerParking": true,
      "fourWheelerParking": true,
      "powerBackup": true,
      "cctvCommonAreas": true,
      "securityGuard": true
    },
    "houseRules": {
      "noSmoking": true,
      "noParties": true,
      "noPets": true,
      "quietHoursStart": "22:00",
      "quietHoursEnd": "07:00",
      "customRules": ["Guests must register at society gate", "No outside food delivery allowed"]
    },
    "pricing": {
      "basePrice": 1800,
      "weekendPrice": 2200,
      "cleaningFee": 300,
      "securityDeposit": 5000,
      "currency": "INR",
      "weeklyDiscount": 15,
      "monthlyDiscount": 25
    },
    "availability": {
      "minStay": 1,
      "maxStay": 365,
      "checkInTime": "14:00",
      "checkOutTime": "11:00",
      "instantBook": true,
      "advanceNotice": "1_day"
    },
    "cancellationPolicy": "moderate",
    "status": "pending_approval"
  }'
```

---

## 🏠 Create Listing 2: Mulund West Studio

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "title": "Cozy Studio near Mulund Railway Station",
    "description": "A compact and well-designed studio apartment just 3 minutes walk from Mulund Railway Station.",
    "propertyType": "studio",
    "capacity": {"maxGuests": 1, "bedrooms": 0, "beds": 1, "bathrooms": 1},
    "location": {
      "flatNo": "501",
      "buildingName": "Station View Plaza",
      "street": "LBS Marg",
      "area": "Mulund West",
      "landmark": "Opposite Mulund Railway Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400080",
      "coordinates": {"type": "Point", "coordinates": [72.9600, 19.1720]}
    },
    "building": {"floor": 5, "hasLift": true, "societyName": "Station View Plaza", "buildingType": "apartment"},
    "amenities": {
      "wifi": true,
      "wifiSpeed": "200 Mbps",
      "ac": true,
      "geyser": true,
      "refrigerator": true,
      "tv": true,
      "workDesk": true,
      "twoWheelerParking": true,
      "powerBackup": true,
      "cctvCommonAreas": true,
      "securityGuard": true
    },
    "pricing": {"basePrice": 999, "weekendPrice": 1200, "cleaningFee": 0, "securityDeposit": 2000, "currency": "INR", "weeklyDiscount": 10, "monthlyDiscount": 20},
    "availability": {"minStay": 1, "maxStay": 180, "checkInTime": "15:00", "checkOutTime": "11:00", "instantBook": false, "advanceNotice": "1_day"},
    "cancellationPolicy": "flexible",
    "status": "pending_approval"
  }'
```

---

## 🎯 Create Listing 3: Nahur Private Room

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "title": "Private Room in Shared Flat - Nahur Area",
    "description": "A comfortable private room in a shared apartment with friendly roommates.",
    "propertyType": "private_room",
    "capacity": {"maxGuests": 1, "bedrooms": 1, "beds": 1, "bathrooms": 1},
    "location": {
      "flatNo": "201",
      "buildingName": "Shree Residency",
      "street": "Nahur Road",
      "area": "Nahur",
      "landmark": "Near Nahur Fire Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400608",
      "coordinates": {"type": "Point", "coordinates": [72.9180, 19.1650]}
    },
    "building": {"floor": 2, "hasLift": false, "societyName": "Shree Residency", "buildingType": "apartment"},
    "amenities": {
      "wifi": true,
      "wifiSpeed": "50 Mbps",
      "ac": true,
      "geyser": true,
      "kitchen": true,
      "kitchenUtensils": true,
      "refrigerator": true,
      "microwave": true,
      "washingMachine": true,
      "twoWheelerParking": true
    },
    "pricing": {"basePrice": 799, "weekendPrice": 899, "cleaningFee": 0, "securityDeposit": 1500, "currency": "INR", "weeklyDiscount": 5, "monthlyDiscount": 15},
    "availability": {"minStay": 7, "maxStay": 365, "checkInTime": "14:00", "checkOutTime": "12:00", "instantBook": false, "advanceNotice": "2_days"},
    "cancellationPolicy": "strict",
    "status": "pending_approval"
  }'
```

---

## 🏡 Create Listing 4: Bhandup East House

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "title": "Independent 3BHK House - Bhandup East",
    "description": "A beautiful independent 3-story house with terrace garden and ample parking.",
    "propertyType": "bungalow",
    "capacity": {"maxGuests": 8, "bedrooms": 3, "beds": 4, "bathrooms": 2},
    "location": {
      "flatNo": "Plot 15",
      "buildingName": "Bhandup Park Society",
      "street": "Bhandup West Road",
      "area": "Bhandup East",
      "landmark": "Near Godrej Society",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400042",
      "coordinates": {"type": "Point", "coordinates": [72.9050, 19.1450]}
    },
    "building": {"floor": 3, "hasLift": false, "societyName": "Bhandup Park Society", "buildingType": "independent_house"},
    "amenities": {
      "wifi": true,
      "wifiSpeed": "150 Mbps",
      "ac": true,
      "geyser": true,
      "kitchen": true,
      "kitchenUtensils": true,
      "refrigerator": true,
      "microwave": true,
      "washingMachine": true,
      "tv": true,
      "workDesk": true,
      "balcony": true,
      "petFriendly": true,
      "twoWheelerParking": true,
      "fourWheelerParking": true,
      "powerBackup": true
    },
    "pricing": {"basePrice": 3500, "weekendPrice": 4200, "cleaningFee": 500, "securityDeposit": 10000, "currency": "INR", "weeklyDiscount": 20, "monthlyDiscount": 30},
    "availability": {"minStay": 1, "maxStay": 365, "checkInTime": "14:00", "checkOutTime": "11:00", "instantBook": false, "advanceNotice": "3_days"},
    "cancellationPolicy": "moderate",
    "status": "pending_approval"
  }'
```

---

## 💰 Create Listing 5: Bhandup West PG

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "title": "Affordable PG Room - Bhandup West",
    "description": "A clean and basic PG room perfect for students and professionals.",
    "propertyType": "pg",
    "capacity": {"maxGuests": 1, "bedrooms": 0, "beds": 1, "bathrooms": 1},
    "location": {
      "flatNo": "Room 5",
      "buildingName": "Horizon PG Facility",
      "street": "Bhandup West Road",
      "area": "Bhandup West",
      "landmark": "Near ICICI Bank",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400104",
      "coordinates": {"type": "Point", "coordinates": [72.8950, 19.1380]}
    },
    "building": {"floor": 1, "hasLift": false, "societyName": "Horizon PG Facility", "buildingType": "chawl"},
    "amenities": {
      "wifi": true,
      "wifiSpeed": "30 Mbps",
      "geyser": true,
      "kitchen": true,
      "kitchenUtensils": true,
      "refrigerator": true,
      "microwave": true,
      "washingMachine": true,
      "workDesk": true,
      "twoWheelerParking": true,
      "powerBackup": true,
      "cctvCommonAreas": true,
      "securityGuard": true
    },
    "pricing": {"basePrice": 599, "weekendPrice": 599, "cleaningFee": 0, "securityDeposit": 1000, "currency": "INR", "weeklyDiscount": 0, "monthlyDiscount": 10},
    "availability": {"minStay": 30, "maxStay": 365, "checkInTime": "14:00", "checkOutTime": "12:00", "instantBook": false, "advanceNotice": "7_days"},
    "cancellationPolicy": "strict",
    "status": "pending_approval"
  }'
```

---

## ✅ Testing Steps

### Step 1: Login and Get Token
```bash
# Login as host
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "host@mulundstays.com", "password": "Host@123456"}'

# Response will include: "token": "eyJhbGci..."
```

### Step 2: Save Token
```bash
# Replace YOUR_HOST_TOKEN in all curl commands above with the token from Step 1
# Example: Authorization: Bearer eyJhbGc...
```

### Step 3: Create Listings
- Run each curl command above (one at a time)
- Each should return 201 status with listing ID

### Step 4: View Created Listings
```bash
# Check in Admin Portal
# http://localhost:5175/admin/listings

# Or via API:
curl http://localhost:5000/api/admin/listings/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Step 5: Approve Listings
```bash
# Via Admin Portal
# http://localhost:5175/admin/listings
# Click Approve button

# Or via API:
curl -X PUT http://localhost:5000/api/admin/listings/{LISTING_ID}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"action": "approve"}'
```

---

## 📊 Expected Response (201 Created)

```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "_id": "6707a1b2c3d4e5f6g7h8i9j0",
    "title": "Spacious 2BHK Family Apartment - Mulund East",
    "status": "pending_approval",
    "host": "667a1b2c3d4e5f6g7h8i9j0",
    "createdAt": "2026-04-20T08:30:00.000Z"
  }
}
```

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| Admin Portal | http://localhost:5175 |
| Main App | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| API Health | http://localhost:5000/api/health |

---

## 🎯 Quick Checklist

- [ ] Backend running on :5000
- [ ] Host logged in and token copied
- [ ] All 5 listings created
- [ ] Listings visible in `/api/admin/listings/pending`
- [ ] Approved all listings via admin portal
- [ ] Listings now show as "active" status
- [ ] Can search listings on main app

**Ready to go!** 🚀
