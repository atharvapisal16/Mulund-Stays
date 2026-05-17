# ⚡ QUICK CLOUDINARY SETUP (2-3 MINUTES)

## Step 1: Sign Up (1 minute)
1. Visit: https://cloudinary.com/users/register/free
2. Click "Sign up with Email"
3. Enter:
   - Email: your.email@gmail.com
   - Full Name: Your Name
   - Password: Any password
   - Click "Create account"
4. **Check your email** → Click verification link

## Step 2: Get Credentials (1 minute)
After login, you'll see Dashboard:

1. Look for **"Account Details"** section on the left
2. Or go to **Settings** (gear icon) → **API Keys**
3. You'll see:
   ```
   Cloud Name:     dkm7cxcaq (example)
   API Key:        847234897234 (example)
   API Secret:     k3k4k3k_k3k3k3k3_k3k3 (example)
   ```

4. **Copy these 3 values**

## Step 3: Update Your .env File

Open: `backend/.env`

Replace:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Example (with real values):
```env
CLOUDINARY_CLOUD_NAME=dkm7cxcaq
CLOUDINARY_API_KEY=847234897234
CLOUDINARY_API_SECRET=k3k4k3k_k3k3k3k3_k3k3
```

## Step 4: Restart Backend

In PowerShell (backend folder):
```bash
npm start
```

## Step 5: Test KYC Upload ✅

Now go to app and submit KYC files - should work!

---

## ❌ Why Mock Storage Isn't Working?

The mock storage approach has issues:
- Serving local files requires additional configuration
- File paths become inconsistent between dev/prod
- Better to use proper cloud storage

## ✅ Why Cloudinary is Best Choice?

✓ FREE tier available (forever)
✓ 25 API calls/day limit lifted for free account
✓ Easy to set up
✓ Works for all file types
✓ Industry standard

---

## IF YOU'RE STUCK:

Copy this template and fill in your actual values:

```env
# ─── Cloudinary (REQUIRED FOR KYC) ───────────────────────────────────────
CLOUDINARY_CLOUD_NAME=________________  (replace with your cloud name)
CLOUDINARY_API_KEY=________________     (replace with your api key)
CLOUDINARY_API_SECRET=________________  (replace with your api secret)
```

Then run: `npm start` in backend
