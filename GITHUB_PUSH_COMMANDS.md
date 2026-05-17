# 🚀 GitHub Push Commands - MulundStays

## Step-by-Step Commands to Push to GitHub

### **Step 1: Create Repository on GitHub**

Go to https://github.com/new and create a new repository:
- **Name**: `mulundstays`
- **Description**: Airbnb-style booking platform for Mulund, Mumbai
- **Public** or **Private** (your choice)
- **Do NOT initialize** with README, .gitignore, or license (we have them)

Copy your repository URL. You'll need it in next steps.

---

### **Step 2: Check Current Status**

```bash
cd c:\Users\ATHARVA PISAL\OneDrive\Documents\MulundStays

# Check if git is initialized
git status
```

If you see `fatal: not a git repository`:
```bash
# Initialize git
git init
```

---

### **Step 3: Configure Git (First Time Only)**

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify
git config --global user.name
git config --global user.email
```

---

### **Step 4: Verify .gitignore is Correct**

```bash
# Check files that will be ignored
git check-ignore -v node_modules/ backend/.env frontend/.env dist/

# You should see output like:
# .gitignore:11:	node_modules/
# .gitignore:2:	.env
# etc.
```

---

### **Step 5: Add All Files to Git**

```bash
# Add all files (except those in .gitignore)
git add .

# Check what will be committed
git status
```

**IMPORTANT: Verify these are NOT in the list:**
```
❌ node_modules/ 
❌ .env
❌ frontend/.env
❌ backend/.env
❌ dist/
❌ uploads/
```

---

### **Step 6: Create Initial Commit**

```bash
git commit -m "Initial commit: MulundStays - Full-stack booking platform

- React + Node.js + MongoDB
- Guest, Host, and Admin applications
- KYC verification system
- Razorpay payment integration
- Cloudinary image storage
- Ready for production"
```

---

### **Step 7: Connect to GitHub**

Replace `YOUR_USERNAME` and `your-email` with your actual GitHub username:

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/mulundstays.git

# Verify remote
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/mulundstays.git (fetch)
origin  https://github.com/YOUR_USERNAME/mulundstays.git (push)
```

---

### **Step 8: Rename Branch (if needed)**

```bash
# Rename master to main (modern standard)
git branch -M main
```

---

### **Step 9: Push to GitHub**

```bash
# Push for the first time
git push -u origin main
```

You'll be prompted for authentication:
- **Username**: Your GitHub username
- **Password**: Your GitHub personal access token (NOT password!)

---

### **Step 10: Verify on GitHub**

1. Go to https://github.com/YOUR_USERNAME/mulundstays
2. You should see all your files ✅
3. Verify `.env` files are NOT visible ❌

---

## 🔐 If Authentication Fails

### Option A: Use GitHub CLI (Recommended)

```bash
# Install GitHub CLI from https://cli.github.com

# Login
gh auth login

# Follow prompts and select HTTPS

# Then retry push
git push -u origin main
```

### Option B: Use Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (check `repo` permission)
3. Copy the token
4. When prompted for password, paste the token

### Option C: Use SSH (Advanced)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to GitHub (Settings → SSH and GPG keys)
cat ~/.ssh/id_ed25519.pub

# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/mulundstays.git

# Push
git push -u origin main
```

---

## 📝 Daily Workflow (After Initial Push)

### Make Changes
```bash
cd mulundstays
# Edit files...
```

### Commit Changes
```bash
git add .
git commit -m "Fixed bug in booking system"
```

### Push to GitHub
```bash
git push
```

---

## 🐛 Common Git Commands

### Check Status
```bash
git status
```

### View Commit History
```bash
git log
git log --oneline
```

### View Changes
```bash
# See unstaged changes
git diff

# See staged changes
git diff --cached
```

### Undo Changes
```bash
# Discard changes in working directory
git checkout -- filename.js

# Unstage file
git reset filename.js

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Create Branch (for features)
```bash
git branch feature/new-feature
git checkout feature/new-feature
# OR
git checkout -b feature/new-feature

# Push branch
git push -u origin feature/new-feature
```

### Merge Branch
```bash
git checkout main
git merge feature/new-feature
git push
```

---

## ✅ Complete Quick Start

```bash
# 1. Navigate to project
cd c:\Users\ATHARVA PISAL\OneDrive\Documents\MulundStays

# 2. Initialize (if needed)
git init

# 3. Configure
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 4. Check status
git status

# 5. Add files
git add .

# 6. Commit
git commit -m "Initial commit: MulundStays booking platform"

# 7. Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/mulundstays.git

# 8. Rename branch
git branch -M main

# 9. Push
git push -u origin main

# 10. Verify
git remote -v
git log --oneline
```

---

## 🔍 Verify Everything is Safe

Before pushing, run these commands to make sure no secrets are exposed:

```bash
# Check if .env files are tracked
git ls-files | grep ".env"

# Should show nothing (means they're not tracked) ✅

# Check what will be pushed
git diff --cached --name-only | head -20

# Should NOT show .env files ✅

# Final check before push
git status

# Should show:
# On branch main
# nothing to commit, working tree clean ✅
```

---

## 📚 Useful Resources

- **GitHub Docs**: https://docs.github.com/en/get-started
- **Git Cheat Sheet**: https://github.github.com/training-kit/downloads/github-git-cheat-sheet.pdf
- **Interactive Git Learning**: https://learngitbranching.js.org/

---

## ⚠️ Important Reminders

✅ **.env files are in .gitignore** - They won't be pushed
✅ **node_modules/ is in .gitignore** - Users run `npm install`
✅ **dist/ is in .gitignore** - Users run `npm run build`
✅ **README.md explains setup** - Users know what to do
✅ **.env.example exists** - Shows template for configuration

---

**Status**: Ready to Push! 🚀

Run the "Complete Quick Start" section above and you're done!
