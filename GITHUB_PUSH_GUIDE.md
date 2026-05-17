# GitHub Push Guide - What to Include/Exclude

## ✅ PUSH TO GITHUB (Include These)

### Source Code
```
✅ backend/
   ├── controllers/          (ALL - business logic)
   ├── models/              (ALL - database schemas)
   ├── routes/              (ALL - API endpoints)
   ├── middleware/          (ALL - auth, validation)
   ├── services/            (ALL - business services)
   ├── config/              (ALL - configuration)
   ├── utils/               (ALL - utilities)
   ├── server.js            (YES)
   └── package.json         (YES)

✅ frontend/
   ├── src/
   │   ├── components/      (ALL - React components)
   │   ├── pages/          (ALL - page components)
   │   ├── context/        (ALL - state management)
   │   ├── services/       (ALL - API client)
   │   ├── utils/          (ALL - utilities)
   │   ├── App.jsx         (YES)
   │   └── main.jsx        (YES)
   ├── public/             (YES - static assets)
   ├── index.html          (YES)
   ├── vite.config.js      (YES)
   ├── tailwind.config.js  (YES)
   └── package.json        (YES)
```

### Configuration Files
```
✅ Dockerfile              (YES - for deployment)
✅ docker-compose.yml      (YES - for local docker setup)
✅ railway.toml            (YES - Railway deployment config)
✅ vercel.json             (YES - Vercel deployment config)
✅ .gitignore              (YES - files to exclude)
✅ package.json (root)     (YES - root scripts)
✅ README.md               (YES - project documentation)
```

### Example/Template Files
```
✅ backend/.env.example    (YES - template, no real values)
✅ frontend/.env.example   (YES - template, no real values)
✅ ADMIN_SETUP.md          (YES - documentation)
✅ KYC_WORKFLOW.md         (YES - documentation)
✅ API_COMMANDS.md         (YES - documentation)
```

---

## ❌ DO NOT PUSH TO GITHUB (Exclude These)

### 🔐 SECRET FILES (Most Important!)
```
❌ backend/.env            (NEVER - has API keys!)
❌ frontend/.env           (NEVER - has secrets!)
❌ *.pem                   (NEVER - private keys)
❌ *.key                   (NEVER - keys)
```

### 📦 Dependencies (Downloaded, Not Source)
```
❌ node_modules/           (will be reinstalled via npm install)
❌ package-lock.json       (optional, but can be skipped)
❌ yarn.lock               (if using yarn)
❌ pnpm-lock.yaml         (if using pnpm)
```

### 🏗️ Build Outputs (Generated)
```
❌ dist/                   (frontend build output)
❌ dist-admin/             (admin build output)
❌ build/                  (optional build directory)
❌ .next/                  (if using Next.js)
```

### 📁 Local Files (Development Only)
```
❌ uploads/                (local file uploads)
❌ backend/uploads/        (temporary uploads)
❌ .vscode/                (IDE settings - personal)
❌ .idea/                  (IDE settings - personal)
```

### 📊 Logs & Caches (Auto-Generated)
```
❌ logs/                   (application logs)
❌ *.log                   (log files)
❌ npm-debug.log
❌ .cache/                 (cache directories)
❌ .eslintcache
❌ coverage/               (test coverage)
```

### 🖥️ OS Files (System)
```
❌ .DS_Store               (macOS)
❌ Thumbs.db               (Windows)
❌ desktop.ini             (Windows)
```

---

## 📋 Before Pushing to GitHub

### Checklist

- [ ] **Remove .env files**
  ```bash
  git rm --cached backend/.env
  git rm --cached frontend/.env
  echo ".env" >> .gitignore
  git add .gitignore
  git commit -m "Remove .env files"
  ```

- [ ] **Create .env.example files** (templates only, no real values)
  ```bash
  # Copy and edit to remove sensitive data
  cp backend/.env backend/.env.example
  # Edit backend/.env.example to have placeholder values
  ```

- [ ] **Verify .gitignore is correct**
  ```bash
  git status
  # Should show .env and node_modules as untracked (not staged)
  ```

- [ ] **Check what will be pushed**
  ```bash
  git diff --cached
  # Make sure no .env files or API keys are visible
  ```

- [ ] **Create .gitignore files if missing**
  - ✅ Root: `/

.gitignore` (already exists)
  - ✅ Backend: `backend/.gitignore` (already exists)
  - ✅ Frontend: `frontend/.gitignore` (created)

---

## 🚀 First Time GitHub Setup

### Step 1: Initialize Git (if not already done)
```bash
cd mulundstays
git init
git add .
```

### Step 2: Verify .gitignore
```bash
# Should have these files
ls -la .gitignore
ls -la backend/.gitignore
ls -la frontend/.gitignore
```

### Step 3: Check What's Being Tracked
```bash
git status
```

**You should see:**
- ✅ Source code files
- ✅ Configuration files
- ✅ Documentation files
- ❌ node_modules/ (untracked)
- ❌ .env files (untracked)
- ❌ dist/ (untracked)

### Step 4: Create Initial Commit
```bash
git add .
git commit -m "Initial commit - MulundStays booking platform"
```

### Step 5: Push to GitHub
```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/yourname/mulundstays.git
git branch -M main
git push -u origin main
```

---

## 🔐 If You Accidentally Pushed .env

```bash
# Step 1: Remove from git history
git rm --cached backend/.env frontend/.env

# Step 2: Add to .gitignore
echo ".env" >> .gitignore
echo "!.env.example" >> .gitignore

# Step 3: Commit
git add .gitignore
git commit -m "Remove .env files from git tracking"

# Step 4: Push
git push origin main

# Step 5: Change all API keys immediately!
# - Rotate Razorpay keys
# - Regenerate JWT secrets
# - Change database passwords
# - Revoke Cloudinary tokens
# - Update all credentials
```

---

## 📝 File Summary

| File/Folder | Push? | Reason |
|-------------|-------|--------|
| `src/` files | ✅ | Source code |
| `package.json` | ✅ | Dependencies list |
| `.gitignore` | ✅ | Ignore rules |
| `README.md` | ✅ | Documentation |
| `.env` | ❌ | **API Keys!** |
| `node_modules/` | ❌ | **npm install rebuilds it** |
| `dist/` | ❌ | **build rebuilds it** |
| `.vscode/` | ❌ | Personal IDE settings |
| `uploads/` | ❌ | Local development files |

---

## ✨ Best Practices

1. **Never commit secrets** - Use .env.example as template
2. **Use environment variables** - All sensitive data in .env
3. **Keep .gitignore updated** - Add new types of files to ignore
4. **Review before push** - `git diff --cached` before commit
5. **Use .env.example** - Help others setup quickly
6. **Document setup** - README should explain .env setup

---

**Created:** May 17, 2026  
**Purpose:** Safe GitHub deployment without exposing API keys
