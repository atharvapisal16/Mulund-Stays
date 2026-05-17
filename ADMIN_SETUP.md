# 🔐 Admin Portal - Separate Local Host Setup

## Overview

The admin portal is now configured as a **completely separate application** accessible only on:
- **URL:** http://localhost:5175
- **Default Backend:** http://localhost:5000

This ensures:
✅ Admin portal is isolated from main app  
✅ No accidental access by regular users  
✅ Company team members have dedicated interface  
✅ Easy deployment separation in production  

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MulundStays Platform                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────┐      ┌──────────────────────┐
│  Main App                │      │  Admin Portal        │
│ http://localhost:5173    │      │ http://localhost:5175│
│  (Guests & Hosts)        │      │  (Company Team)      │
│                          │      │                      │
│  - Browse listings       │      │  - KYC Review        │
│  - Book stays            │      │  - Listing Approval  │
│  - Create listings       │      │  - User Management   │
│  - Manage bookings       │      │  - Revenue Dashboard │
│  - View profile          │      │  - Disputes          │
└─────────────────────────┘      └──────────────────────┘
          │                               │
          │         Connected to          │
          └───────────┬────────────────────┘
                      │
            ┌─────────▼─────────┐
            │  Backend API      │
            │ :5000             │
            │  (Protected)      │
            └───────────────────┘
```

---

## Running the Admin Portal

### Option 1: Simple Batch File (Windows)

**Double-click:** `start-admin.bat`

This will:
- ✅ Start backend on :5000
- ✅ Start admin portal on :5175
- ✅ Show all logs in one terminal

---

### Option 2: PowerShell Script (Windows)

```powershell
# Run this in PowerShell
.\start-admin.ps1
```

---

### Option 3: Manual Command

**In project root:**
```bash
npm run dev:admin
```

This runs:
```
Backend: npm run dev:backend         # :5000
Admin:   npm run dev:admin:frontend  # :5175
```

---

### Option 4: Run Everything (Main + Admin)

**To run main app AND admin simultaneously:**
```bash
npm run dev:all
```

This starts:
- Main app on :5173 (Guests & Hosts)
- Admin portal on :5175 (Company team)
- Backend on :5000

---

## Environment Setup

### Production Build (Admin Only)

```bash
# Build admin portal for production
npm run build:admin

# Output: frontend/dist-admin/
```

### Build Main App

```bash
# Build main app for production  
npm run build

# Output: frontend/dist/
```

---

## Project Structure

```
MulundStays/
├── frontend/
│   ├── index.html                 ← Main app entry
│   ├── admin.html                 ← Admin portal entry (NEW)
│   ├── vite.config.js             ← Updated for dual builds
│   ├── package.json               ← Updated with admin scripts
│   ├── src/
│   │   ├── main.jsx               ← Main app bootstrap
│   │   ├── main-admin.jsx         ← Admin app bootstrap (NEW)
│   │   ├── App.jsx                ← Shared routes
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboardPage.jsx
│   │   │   │   ├── AdminUsersPage.jsx
│   │   │   │   ├── AdminListingsPage.jsx
│   │   │   │   └── AdminBookingsPage.jsx
│   │   │   └── ... (other pages)
│   │   └── ... (other files)
│   ├── dist/                      ← Main app build
│   └── dist-admin/                ← Admin app build
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   └── ...
├── start-admin.bat                ← Quick start (NEW)
├── start-admin.ps1                ← Quick start PowerShell (NEW)
├── package.json                   ← Updated with admin scripts
└── ...
```

---

## Development Workflow

### For Regular Users (Main App)

```bash
# Start main app only
npm run dev

# Access:
# - Main app: http://localhost:5173
# - Backend: http://localhost:5000
```

**Users can:**
- Browse listings
- Book stays
- Create/manage listings (if host)
- View profile

---

### For Admin Team

```bash
# Start admin portal
npm run dev:admin

# Access:
# - Admin portal: http://localhost:5175
# - Backend: http://localhost:5000
```

**Admins can:**
- Review KYC submissions
- Approve/reject listings
- Manage users
- View revenue
- Resolve disputes

---

### For Full Testing (Both)

```bash
# Start everything
npm run dev:all

# Access:
# - Main app: http://localhost:5173 (for testing guests/hosts)
# - Admin portal: http://localhost:5175 (for testing admin)
# - Backend: http://localhost:5000
```

---

## Access Control

### Main App (:5173)
```
Public Users: ✅ Full access
Guests: ✅ Browse, book, manage bookings
Hosts: ✅ Create listings, manage properties
Admins: ⚠️ Can access but shouldn't use this

Admin routes (/admin) are BLOCKED for non-admin users
```

### Admin Portal (:5175)
```
Public Users: ❌ Redirected to home if not admin
Guests: ❌ Access denied
Hosts: ❌ Access denied
Admins: ✅ Full access

Only role='admin' accounts can access
```

---

## Admin Portal Login

**Email:** `admin@mulundstays.com`  
**Password:** `Admin@123`

**Or seed test data:**
```bash
cd backend
npm run seed
```

---

## How It Works (Technical)

### Entry Points

**Main App (`main.jsx`):**
```javascript
// Regular app with all routes
import App from './App'
ReactDOM.render(<App />, root)
```

**Admin Portal (`main-admin.jsx`):**
```javascript
// Admin-only app with role verification
import App from './App'
ReactDOM.render(<App adminOnly={true} />, root)
```

### Vite Configuration

The `vite.config.js` detects the environment variable `VITE_APP`:

```javascript
const isAdmin = process.env.VITE_APP === 'admin';

export default defineConfig({
  server: {
    port: isAdmin ? 5175 : 5173,  // Different ports
  },
  build: {
    outDir: isAdmin ? 'dist-admin' : 'dist',  // Different output
  },
  // ...
})
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "vite",                              // Main on :5173
    "dev:admin": "VITE_APP=admin vite",        // Admin on :5175
    "dev:all": "concurrently dev dev:admin",   // Both
    "build": "vite build",                      // Main app
    "build:admin": "VITE_APP=admin vite build" // Admin app
  }
}
```

---

## Security Features

✅ **Backend Authorization**
- All admin routes protected with `authorize('admin')` middleware
- Non-admin tokens rejected at API level

✅ **Frontend Protection**
- ProtectedRoute component checks admin role
- DashboardLayout has role verification
- Non-admins see "Access Denied" page
- Console warnings logged for attempts

✅ **Isolation**
- Admin portal on separate port
- Different app bundle
- No cross-contamination with main app
- Easy to deploy to separate server/domain in production

---

## Production Deployment

### Separate Deployments (Recommended)

**Main App:**
```bash
npm run build
# Deploy dist/ to Vercel (or any host)
```

**Admin Portal:**
```bash
npm run build:admin
# Deploy dist-admin/ to separate domain or server
# Example: admin.mulundstays.com
```

**Backend:**
```bash
# Deploy to Railway (or any host)
```

### Single Domain with Different Paths (Alternative)

If deploying to same domain:
```
mulundstays.com/          → Main app (dist/)
mulundstays.com/admin/    → Admin portal (dist-admin/)
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill existing processes
taskkill /F /IM node.exe

# Or specify different port
# Edit vite.config.js and change port values
```

### Admin Portal Redirect Loop

- ✅ Check if JWT token has `role: 'admin'`
- ✅ Verify backend is running on :5000
- ✅ Clear browser cache/localStorage
- ✅ Re-login with admin credentials

### Vite Proxy Not Working

- ✅ Ensure backend running on :5000
- ✅ Check `vite.config.js` proxy target
- ✅ Look for CORS errors in console

---

## CLI Commands Reference

| Command | Purpose | Access |
|---------|---------|--------|
| `npm run dev` | Start main app | :5173 |
| `npm run dev:admin` | Start admin portal | :5175 |
| `npm run dev:all` | Start everything | Both |
| `npm run build` | Build main app | - |
| `npm run build:admin` | Build admin portal | - |
| `npm run start` | Start backend only | :5000 |

---

## Next Steps for Team

1. **Team Lead:** Run `npm run dev:admin` to test admin portal
2. **QA:** Test both main app (`dev`) and admin (`dev:admin`)
3. **DevOps:** Deploy admin portal to separate domain
4. **Security:** Audit admin access logs

---

**Admin Portal Ready! 🎉**

Questions? Check the logs or review the security audit in [ADMIN_PORTAL_STATUS.md](ADMIN_PORTAL_STATUS.md)
