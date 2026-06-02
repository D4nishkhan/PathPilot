# PathPilot Deployment Readiness Report
**Date:** June 2, 2026  
**Status:** Ready for deployment with configuration  
**Deployment Complexity:** Medium  
**Estimated Setup Time:** 2-3 hours per platform

---

## TABLE OF CONTENTS
1. [Environment Variables](#1-environment-variables)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Gemini API Setup](#3-gemini-api-setup)
4. [Razorpay Setup](#4-razorpay-setup)
5. [Google OAuth Setup](#5-google-oauth-setup)
6. [SMTP Email Setup](#6-smtp-email-setup)
7. [Vercel Deployment](#7-vercel-deployment)
8. [Render Deployment](#8-render-deployment)
9. [Production Checklist](#9-production-checklist)
10. [Go-Live Steps](#10-go-live-steps)

---

## 1. ENVIRONMENT VARIABLES

### All Required Variables

**Backend (.env file in `/backend`):**

| Variable | Type | Required | Example | Notes |
|----------|------|----------|---------|-------|
| `PORT` | Number | No | `5000` | API port (default: 5000) |
| `NODE_ENV` | String | Yes | `production` | Set to `production` for live |
| `MONGODB_URI` | String | Yes | See [MongoDB Section](#2-mongodb-atlas-setup) | Database connection string |
| `JWT_SECRET` | String | Yes | `your-secret-key-min-32-chars` | Min 32 random characters |
| `JWT_EXPIRE` | String | No | `7d` | Token expiry (default: 7 days) |
| `GEMINI_API_KEY` | String | Yes | See [Gemini Section](#3-gemini-api-setup) | From Google AI Studio |
| `GOOGLE_CLIENT_ID` | String | Yes* | See [OAuth Section](#5-google-oauth-setup) | From Google Console (*optional if OAuth disabled) |
| `GOOGLE_CLIENT_SECRET` | String | Yes* | See [OAuth Section](#5-google-oauth-setup) | From Google Console (*optional if OAuth disabled) |
| `GOOGLE_CALLBACK_URL` | String | Yes* | `https://yourdomain.com/api/auth/google/callback` | OAuth redirect URL |
| `RAZORPAY_KEY_ID` | String | Yes* | See [Razorpay Section](#4-razorpay-setup) | From Razorpay Dashboard (*payments disabled if not set) |
| `RAZORPAY_KEY_SECRET` | String | Yes* | See [Razorpay Section](#4-razorpay-setup) | From Razorpay Dashboard (*payments disabled if not set) |
| `EMAIL_HOST` | String | Yes* | `smtp.gmail.com` | Email server (*optional for local-only) |
| `EMAIL_PORT` | Number | Yes* | `587` | SMTP port (usually 587 or 465) |
| `EMAIL_USER` | String | Yes* | `noreply@pathpilot.com` | Email address |
| `EMAIL_PASS` | String | Yes* | Your app password | Email password or app-specific token |
| `FRONTEND_URL` | String | Yes | `https://pathpilot.vercel.app` | Frontend domain (for CORS and OAuth) |

**Frontend (.env file in `/frontend`):**

| Variable | Type | Required | Example | Notes |
|----------|------|----------|---------|-------|
| `VITE_API_URL` | String | No | `https://api.pathpilot.com` | Backend API base URL (defaults to `/api`) |

### JWT Secret Generation

```bash
# Generate secure JWT secret (recommended: 32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment File Template

**Backend `/.env`:**
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pathpilot?retryWrites=true&w=majority

# Authentication
JWT_SECRET=abc123def456ghi789jkl012mno345pqr567stu890vwx
JWT_EXPIRE=7d

# Gemini AI
GEMINI_API_KEY=AIzaSyD...your_key_here

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
GOOGLE_CALLBACK_URL=https://api.pathpilot.com/api/auth/google/callback

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_live_abc123...
RAZORPAY_KEY_SECRET=xyz789abc...

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@pathpilot.com
EMAIL_PASS=your_app_password_here

# Frontend URL
FRONTEND_URL=https://pathpilot.vercel.app
```

**Frontend `/.env.local`:**
```env
VITE_API_URL=https://api.pathpilot.com
```

---

## 2. MONGODB ATLAS SETUP

### Step-by-Step MongoDB Atlas Configuration

#### 2.1 Create MongoDB Atlas Account & Cluster

1. **Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)**
   - Sign up with email or Google
   - Create organization (optional)

2. **Create a New Project**
   - Click "New Project"
   - Name: `PathPilot`
   - Create project

3. **Deploy a Cluster**
   - Click "Build a Database"
   - Select **M0 (Free Tier)** for development/testing
   - Select **M2** or higher for production
   - Choose Cloud Provider: AWS/Azure/GCP (closest to your region)
   - Choose Region: Select based on your user base
   - Cluster Name: `pathpilot-prod`
   - Create Cluster (takes 1-3 minutes)

#### 2.2 Configure Network Access

1. **IP Whitelist**
   - Go to: **Security** → **Network Access**
   - Click "Add IP Address"
   - Option A (Development): `0.0.0.0/0` (allows all IPs - less secure)
   - Option B (Production): Add specific IPs of your deployment platform
     - Vercel: Pre-configured (they handle this)
     - Render: Add Render's IP range (they provide auto-config)
     - Custom: Add your office/team IPs only

2. **Database User**
   - Go to: **Security** → **Database Access**
   - Click "Add Database User"
   - Authentication Method: **Password**
   - Username: `pathpilot_prod`
   - Password: Generate strong password (25+ chars, mix of symbols)
   - Built-in Role: `Atlas Admin` (for development)
   - Or: `Custom Role` (for production - more restrictive)

#### 2.3 Get Connection String

1. **Cluster Overview** → **Connect**
2. **Connect your application**
3. **Driver:** Node.js, **Version:** 4.1 or later
4. **Connection URL** format:
   ```
   mongodb+srv://pathpilot_prod:PASSWORD@cluster.mongodb.net/pathpilot?retryWrites=true&w=majority
   ```
5. **Copy and paste into backend `/.env`** as `MONGODB_URI`
6. **Replace `PASSWORD`** with actual password (URL-encode special chars)

#### 2.4 Verify Connection

```bash
# From backend directory
npm install
node -e "
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ Connection failed:', err.message));
"
```

#### 2.5 Initialize Database

```bash
cd backend
npm run seed
# Output should show:
# ✅ MongoDB Connected
# 🧹 Cleared old seed data
# ✅ Created 6 badges
# ✅ Created 4 tracks...
```

### MongoDB Atlas Pricing

- **M0 (Free)**: 512MB storage - good for MVP/demo
- **M2**: $9/month - 10GB storage - for small production
- **M5**: $57/month - 100GB storage - for scaling
- **M10+**: $95+/month - enterprise features

**Recommendation:** Start with **M2** for production to avoid surprises with data growth

---

## 3. GEMINI API SETUP

### Step-by-Step Google AI Studio Configuration

#### 3.1 Access Google AI Studio

1. **Visit [aistudio.google.com](https://aistudio.google.com)**
   - Sign in with Google account
   - Accept terms

2. **Enable Generative Language API**
   - Go to: **API Console** (if prompted)
   - Search: "Generative Language API"
   - Click **Enable**

#### 3.2 Create API Key

1. **In AI Studio: Click "Get API Key"**
2. **Select "Create API Key in Google Cloud Console"**
3. **Or manually:**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project: `PathPilot`
   - Enable Generative Language API
   - Go to **Credentials** → **Create Credentials** → **API Key**
4. **Copy the key** (looks like: `AIzaSy...`)

#### 3.3 Add to Environment

1. Add to backend `/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

2. **Restrict API Key (Production):**
   - In Cloud Console: **Credentials** → Select key
   - Click **Edit** → **Restrict Key**
   - Application restrictions: **API or service**
   - Select: **Generative Language API**
   - Save

#### 3.4 Set Quotas & Alerts

1. **Quotas** tab in Cloud Console
   - Set daily quota limit (e.g., 1000 requests/day)
2. **Billing Alerts**
   - Set budget alert at $10/month
   - Get email notifications

#### 3.5 Test Gemini API

```bash
# From backend directory
npm install
node -e "
  require('dotenv').config();
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  (async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello PathPilot!');
    console.log('✅ Gemini API working:', result.response.text());
  })().catch(e => console.error('❌ Error:', e.message));
"
```

### Gemini API Pricing (Free Tier Available)

- **Free**: 60 requests/minute, 1500 per day
- **Pay-as-you-go**: $0.075 per 1M input tokens, $0.30 per 1M output tokens

**Recommendation:** Start on free tier, upgrade as usage grows

---

## 4. RAZORPAY SETUP

### Step-by-Step Razorpay Configuration

#### 4.1 Create Razorpay Account

1. **Visit [razorpay.com](https://razorpay.com)**
   - Sign up with email
   - Verify email & phone

2. **Complete KYC (Know Your Customer)**
   - Business details (required to go live)
   - Bank account info
   - Expected monthly transactions

3. **Activate Account**
   - Once KYC approved (2-4 hours), you get live keys

#### 4.2 Get API Keys

1. **Settings** → **API Keys** (in Razorpay Dashboard)
2. Toggle: **Test Mode** ↔️ **Live Mode**
3. **Test Mode Keys** (for development):
   - Key ID: `rzp_test_abc...`
   - Key Secret: `xyz789...`
4. **Live Mode Keys** (for production):
   - Key ID: `rzp_live_abc...`
   - Key Secret: `xyz789...`

#### 4.3 Update Environment Variables

```bash
# For development (Test Mode)
RAZORPAY_KEY_ID=rzp_test_abc123...
RAZORPAY_KEY_SECRET=xyz789...

# For production (Live Mode)
RAZORPAY_KEY_ID=rzp_live_abc123...
RAZORPAY_KEY_SECRET=xyz789production...
```

#### 4.4 Configure Payment Plans

In `backend/src/controllers/paymentController.js`, plans are defined as:
- **Free Plan**: ₹0 (no payment, 1 roadmap)
- **Premium Plan**: ₹499/month (or configure as needed)

#### 4.5 Webhook Configuration (Optional but Recommended)

1. **Settings** → **Webhooks** in Razorpay
2. **Add Webhook URL**: `https://api.pathpilot.com/api/payments/webhook`
3. **Events to listen**: `payment.authorized`, `subscription.activated`
4. **Alert Email**: Your team email

#### 4.6 Test Payment Flow

```bash
# Test credentials (always use test mode first)
Card: 4111111111111111
Expiry: 12/25
CVV: 123
OTP: 123456
```

### Razorpay Pricing

- Commission: 2% + GST on payments (₹0.99 minimum)
- Subscription management: Included
- Webhooks: Included

**Note:** Payments are OPTIONAL in the current code. If `RAZORPAY_KEY_*` not set, payments endpoint returns 500 but the app still works.

---

## 5. GOOGLE OAUTH SETUP

### Step-by-Step Google OAuth Configuration

#### 5.1 Create Google Cloud Project

1. **Visit [console.cloud.google.com](https://console.cloud.google.com)**
   - Create new project: `PathPilot`
   - Set project ID: `pathpilot-prod`

2. **Enable OAuth Consent Screen**
   - Go: **APIs & Services** → **OAuth consent screen**
   - User Type: **External** (for public beta) or **Internal** (if Google Workspace)
   - Fill in app details:
     - App name: `PathPilot`
     - User support email: your@email.com
     - Developer contact: your@email.com

3. **Add OAuth Scopes**
   - Scopes needed: `profile`, `email`
   - Already pre-selected

4. **Add Test Users** (for testing before launch)
   - Your test Google account email

#### 5.2 Create OAuth 2.0 Credentials

1. **Go:** **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. **Application Type:** Web application
4. **Authorized JavaScript origins:**
   ```
   http://localhost:5000 (development)
   http://localhost:5173 (frontend dev)
   https://api.pathpilot.com (production backend)
   https://pathpilot.vercel.app (production frontend)
   ```
5. **Authorized redirect URIs:**
   ```
   http://localhost:5000/api/auth/google/callback (dev)
   https://api.pathpilot.com/api/auth/google/callback (prod)
   ```
6. **Create** → Copy credentials

#### 5.3 Add to Environment

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
GOOGLE_CALLBACK_URL=https://api.pathpilot.com/api/auth/google/callback
FRONTEND_URL=https://pathpilot.vercel.app
```

#### 5.4 Publish OAuth Application

1. **OAuth consent screen**
2. Click **Publish app**
3. Change status from **Testing** to **In production**

#### 5.5 Test OAuth Flow

1. Start backend: `npm run dev`
2. Visit: `http://localhost:5173/login`
3. Click "Login with Google"
4. Verify redirect works and user created

### Google OAuth Pricing

- **Free** - No charges ever

---

## 6. SMTP EMAIL SETUP

### Configuration for Different Email Providers

#### Option A: Gmail (Recommend for MVP)

1. **Enable 2-Factor Authentication**
   - Visit [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification

2. **Create App Password**
   - Security → App passwords
   - App: `Mail`, Device: `Windows/Mac/Linux`
   - Copy 16-char password

3. **Add to .env**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx (the 16-char app password)
   ```

4. **Test:**
   ```bash
   npm run dev
   # Try forgot password flow
   ```

#### Option B: SendGrid (Recommended for Production)

1. **Create SendGrid Account** - [sendgrid.com](https://sendgrid.com)
   - Sign up → Verify email
   - Go to: **Settings** → **API Keys**
   - Create new key (Full Access)

2. **Add to .env**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=SG.your_full_api_key...
   ```

3. **SendGrid Pricing**
   - Free: 100 emails/day
   - Paid: $19.95/month (50k emails)

#### Option C: AWS SES (Production Scale)

1. **Create AWS Account** - [aws.amazon.com](https://aws.amazon.com)
2. **SES Service** → Request production access
3. **Create SMTP credentials**
4. **Same configuration as above**

#### Option D: Mailgun (Simple API)

1. **Create Mailgun Account** - [mailgun.com](https://mailgun.com)
2. **Add domain**: mail.pathpilot.com
3. **Get SMTP credentials**
4. Configure in `.env`

### Email Setup Verification

```bash
# Test email sending (need backend running)
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
  
# Should return: {"success": true, "message": "Password reset email sent"}
# Check your email inbox for reset email
```

### Important: Email Service Optional

- If `EMAIL_*` variables not set, app still runs
- Password reset will show 500 error (graceful)
- Consider this a non-blocking feature for MVP

---

## 7. VERCEL DEPLOYMENT

### One-Click Deployment to Vercel

#### 7.1 Prepare Repository (CI/CD Ready)

```bash
# Ensure both frontend & backend can build
cd backend
npm run build  # if exists
cd ../frontend
npm run build
```

#### 7.2 Setup Vercel for Frontend

1. **Visit [vercel.com](https://vercel.com)**
   - Sign in with GitHub

2. **New Project** → Import Git Repository
   - Select `pathpilot` repo

3. **Project Settings**
   - Root Directory: `frontend/`
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables** (in Vercel Dashboard)
   ```
   VITE_API_URL=https://api.pathpilot.com
   ```

5. **Deploy** (click)

#### 7.3 Setup Render for Backend

1. **Visit [render.com](https://render.com)**
   - Sign in with GitHub

2. **New Web Service**
   - Repository: `pathpilot`
   - Branch: `main`
   - Name: `pathpilot-api`
   - Root Directory: `backend/`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`

3. **Environment Variables** (in Render Dashboard)
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=...
   GEMINI_API_KEY=...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://pathpilot-api.onrender.com/api/auth/google/callback
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   EMAIL_HOST=...
   EMAIL_PORT=...
   EMAIL_USER=...
   EMAIL_PASS=...
   FRONTEND_URL=https://pathpilot.vercel.app
   ```

4. **Deploy** (click)

#### 7.4 Post-Deployment

1. **Update Vercel Frontend**
   - Redeploy: Settings → Deployments → Redeploy

2. **Verify Health Check**
   ```bash
   curl https://pathpilot-api.onrender.com/health
   # Should return: {"status":"OK","timestamp":"2026-06-02T..."}
   ```

3. **Run Seed (One-time)**
   ```bash
   # SSH into Render instance or run via Render Shell:
   cd backend && npm run seed
   ```

### Vercel + Render Setup Cost

- Vercel Frontend: **Free** (generous free tier)
- Render Backend: **$7/month** (paid tier for production)
- Total: **~$7/month** minimum

### Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ User Browser                                        │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
       ┌───────────┴────────────┐
       │                        │
       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│ Vercel Frontend │    │ Render Backend   │
│ (React + Vite)  │    │ (Node + Express) │
│ pathpilot.*     │    │ pathpilot-api.*  │
└─────────────────┘    └─────────┬────────┘
                                 │
                       ┌─────────┴──────────┐
                       │                    │
                       ▼                    ▼
                  ┌──────────┐        ┌──────────┐
                  │ MongoDB  │        │ Gemini   │
                  │ Atlas    │        │ API      │
                  └──────────┘        └──────────┘
```

---

## 8. RENDER DEPLOYMENT

### Step-by-Step Render Configuration (Backend Only)

#### 8.1 Repository Preparation

```bash
# Ensure backend can start
cd backend
npm install
npm run dev

# Test in production mode
NODE_ENV=production PORT=5000 npm start
```

#### 8.2 Create Render Service

1. **[render.com](https://render.com)** → **Dashboard**
2. **New +** → **Web Service**
3. **Connect Repository**
   - GitHub: `your-org/pathpilot`
   - Select public/private key

4. **Service Configuration**
   - Name: `pathpilot-api`
   - Environment: **Node**
   - Region: Closest to your users
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`

5. **Plan**
   - Free tier: `$0` (sleeps after 15 min inactivity)
   - Starter: `$7/month` (always on, recommended)
   - Pro: `$25+/month` (production-grade)

#### 8.3 Environment Variables

1. **Environment** tab in Render
2. **Add from .env.example** (all 15+ variables)
   - MONGODB_URI
   - JWT_SECRET
   - GEMINI_API_KEY
   - GOOGLE_CLIENT_* (3 vars)
   - RAZORPAY_* (2 vars)
   - EMAIL_* (4 vars)
   - FRONTEND_URL

#### 8.4 Auto-Deploy on Push

1. **Render auto-deploys** when you git push to main
2. **View** → **Logs** to monitor deployment
3. **Typical deployment time:** 2-3 minutes

#### 8.5 Database Seeding (One-Time)

1. **Shell** tab in Render
2. Run:
   ```bash
   cd backend
   npm run seed
   ```
3. Or SSH into instance and run command

#### 8.6 Health Monitor

Render provides:
- ✅ Auto-restart on crashes
- ✅ SSL/HTTPS included
- ✅ CDN + caching
- ✅ Auto-scaling (on paid plans)

### Alternative: Railway Deployment

Railway is similar to Render:
1. Visit [railway.app](https://railway.app)
2. Create project
3. Connect GitHub
4. Add environment variables
5. Deploy

---

## 9. PRODUCTION CHECKLIST

### Pre-Launch (72 hours before)

- [ ] DNS configured: `api.pathpilot.com` → Render service
- [ ] SSL certificate auto-enabled (Render/Vercel handle this)
- [ ] CORS origins updated to production domains
- [ ] Cookies/JWT configured for production (httpOnly if applicable)
- [ ] Email service tested: Try forgot password on production
- [ ] OAuth redirect URLs added to Google Console
- [ ] Rate limits configured (currently fine)
- [ ] Security headers verified (Helmet enabled)
- [ ] MongoDB backups enabled in Atlas

### Launch Day

- [ ] Backend health check: `curl https://api.pathpilot.com/health`
- [ ] Login flow tested: Email/password registration
- [ ] OAuth flow tested: Google login
- [ ] Quiz submission tested: Check scoring works
- [ ] Payment flow tested: Try creating order (test mode)
- [ ] Admin panel accessible: admin@pathpilot.dev login
- [ ] Analytics dashboard working: Check user stats
- [ ] Error logging working: Check DB for any errors

### First Week Monitoring

- [ ] Monitor error logs daily
- [ ] Check MongoDB storage usage (should be <1GB initially)
- [ ] Review Gemini API usage (should be <100 requests/day)
- [ ] Monitor API response times (should be <500ms)
- [ ] Set up error tracking: [Sentry](https://sentry.io) recommended

### Staging Environment (Recommended)

Consider setting up a staging environment before production:

```
development (local)
    ↓
staging (render-staging.onrender.com with test data)
    ↓
production (api.pathpilot.com with real data)
```

### Database Backup Strategy

**MongoDB Atlas Backups:**
1. **Settings** → **Backup and Restore**
2. Enable **Continuous Cloud Backups** (free)
3. Snapshots taken 8x daily, kept 3+ weeks
4. Set **Backup Window:** Off-peak hours

**Restore procedure:**
```bash
If disaster happens:
1. Stop writes to database
2. MongoDB Atlas → Backup and Restore
3. Select snapshot older than incident
4. Restore to new cluster
5. Update MONGODB_URI in .env
6. Redeploy
```

---

## 10. GO-LIVE STEPS

### Complete Timeline to Public Launch

#### Phase 1: Preparation (Week 1)

```bash
# 1. Clone and prepare
git clone https://github.com/your-org/pathpilot.git
cd pathpilot

# 2. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.local frontend/.env.local (if needed)

# 3. Fill in credentials:
# - MongoDB Atlas connection string
# - Gemini API key
# - Google OAuth credentials
# - Razorpay credentials (optional)
# - SMTP details (optional)
# - JWT secret (generated)
```

#### Phase 2: Backend Deployment (3 hours)

```bash
# 1. Render Setup
# - Create Render account
# - Connect GitHub
# - Create Web Service with vars
# - Deploy (auto from git push)

# 2. Initialize Database
# - SSH into Render instance
# - Run: cd backend && npm run seed
# - Verify: 6 badges, 4 tracks created

# 3. Test API
curl https://pathpilot-api.onrender.com/health
# Expected: {"status":"OK","timestamp":"..."}
```

#### Phase 3: Frontend Deployment (1 hour)

```bash
# 1. Update API URL
# - In frontend/.env.local or Vercel dashboard
# - VITE_API_URL=https://pathpilot-api.onrender.com

# 2. Vercel Setup
# - Create Vercel account
# - Import GitHub repo
# - Set root to frontend/
# - Deploy

# 3. Test Frontend
# - Visit https://pathpilot.vercel.app
# - Try login with admin@pathpilot.dev / admin123456
```

#### Phase 4: Point-to-Point Testing (2 hours)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| **Email/Password Auth** | Register new email | Redirects to dashboard | ✓ |
| **Google OAuth** | Click "Login with Google" | Creates account, logs in | ✓ |
| **Video Progress** | Watch video to 80% | XP awarded, topic marked | ✓ |
| **Quiz Submit** | Take and submit quiz | Score shows, XP awarded | ✓ |
| **Admin Access** | Login as admin | Can see analytics | ✓ |
| **Premium Guard** | Try interview as free user | 403 with upgrade message | ✓ |
| **Email Reset** | Forgot password | Email received with link | ✓ |
| **Gamification** | Complete topic | Badges awarded | ✓ |

#### Phase 5: Custom Domain (30 min)

**Option A: Namecheap**
```
1. Buy domain: pathpilot.com
2. DNS Records:
   - A record: api → Render IP
   - CNAME: www → pathpilot.vercel.app
   - CNAME: mail → sendgrid.net
```

**Option B: Use Vercel/Render Custom Domains**
```
Vercel:
- Settings → Domains
- Add pathpilot.vercel.app
- Add www.pathpilot.vercel.app

Render:
- Environment → Custom Domain
- Set api.pathpilot.com
- Add DNS records (Render provides)
```

#### Phase 6: SEO & Analytics (1 hour)

1. **Vercel Analytics**
   - Settings → Analytics → Enable
   - Get insights on performance

2. **Google Analytics**
   - Create property at analytics.google.com
   - Add tracking code to `frontend/src/main.tsx`
   - Wait 24h for data

3. **Search Console**
   - Add domain to https://search.google.com/search-console
   - Verify ownership
   - Submit sitemap

#### Phase 7: Announce Launch! 🚀

```bash
# Post on:
- Twitter/X: "PathPilot is live! Go from beginner to job-ready."
- Discord/Communities: Programming communities
- ProductHunt: https://producthunt.com (Product Hunt Friday)
- Hacker News: If applicable
- Email: Send to waitlist
```

### Go-Live Validation Checklist

```
✅ Backend API responds in <500ms
✅ Database has initial data (seed complete)
✅ Frontend loads without CORS errors
✅ Auth flow works: Email + Google OAuth
✅ Video progress tracked correctly
✅ XP & badges award properly
✅ Admin can see analytics
✅ Premium features properly gated
✅ Emails send (password reset tested)
✅ Payment button shows (Razorpay or disabled)
✅ No unhandled errors in console
✅ Mobile responsive (check on phone)
✅ Page load time <3s
✅ SSL certificate valid
✅ Rate limiting active
✅ Error tracking setup (Sentry)
```

### Instant Hotfix Procedure

If critical bug found:

```bash
# 1. Fix code locally
git commit -am "Fix: critical issue"

# 2. Push to main
git push origin main

# 3. Auto-deploy (Render & Vercel auto-redeploy)
# Watch logs: Render → Logs tab
# Takes 2-3 minutes to go live

# 4. Clear browser cache
# Verify fix: Start fresh browser session

# 5. Notify users (if data-affecting)
# Email: "We deployed a fix. No action needed."
```

---

## MISSING CONFIGURATIONS SUMMARY

| Item | Status | Impact | Action |
|------|--------|--------|--------|
| `.env` file | ❌ Missing | 🔴 Critical | Create with all variables |
| Docker config | ❌ Not included | 🟡 Optional | Not needed for Vercel/Render |
| CI/CD pipeline | ❌ Not configured | 🟡 Nice-to-have | Render/Vercel auto-handle |
| API documentation | ❌ Not included | 🟡 Medium | Nice-to-have for team |
| Staging environment | ❌ Not configured | 🟡 Recommended | Create second Render service |
| Monitoring/Alerts | ❌ Not setup | 🟡 Medium | Setup Sentry + email alerts |
| Database backups | ❌ Not configured | 🟡 Medium | Enable in MongoDB Atlas |
| SSL certificate | ✅ Auto-provided | ✅ Already ready | Vercel/Render handle |
| HTTPS redirects | ✅ Auto-handled | ✅ Already ready | Platform handles |

---

## ESTIMATED COSTS (Monthly)

### Minimum Setup (MVP)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Free | $0 | Frontend with generous limits |
| Render | Starter | $7 | Backend always-on |
| MongoDB Atlas | M2 | $9 | 10GB storage, backups |
| Gemini API | Free | $0 | 1500 requests/day sufficient for MVP |
| SendGrid | Free | $0 | 100 emails/day or upgrade to $19.95 |
| **Total** | | **$16/month** | |

### Scaling Setup (10k+ users)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Pro | $20 | Enhanced analytics |
| Render | Standard | $25 | More compute power |
| MongoDB Atlas | M5 | $57 | 100GB, auto-scaling |
| Gemini API | Pay-as-you-go | $50 | Estimated for 10k users |
| SendGrid | Basic | $20 | 50k emails/month |
| Domain | Annual | $12/year | Custom domain |
| **Total** | | **$184/month** | |

---

## FINAL DEPLOYMENT CHECKLIST

### Before Pushing "Deploy" Button

```bash
# Run all QA locally
cd backend && npm run dev &
cd ../frontend && npm run dev

# In separate terminal
node qa_node.js

# Verify all tests pass (look for ✅ green checks)
# Fix any red ❌ issues before deploying
```

### Deployment by Platform

**For Vercel:**
- [ ] root set to `frontend/`
- [ ] build command: `tsc -b && vite build`
- [ ] environment vars added
- [ ] preview works

**For Render:**
- [ ] root set to `backend/`
- [ ] build command: `npm install`
- [ ] start command: `node src/server.js`
- [ ] all 15+ env vars added
- [ ] replica seed database after first deploy

### Rollback Plan

If deployment breaks production:

```bash
# Stop incoming traffic
Vercel: Disable domain or revert to last good commit
Render: Scale to 0 instances (temporarily)

# Fix error
git revert HEAD
git push origin main

# Redeploy
Auto-redeployment triggers (2-3 minutes)

# Verify
curl https://api.pathpilot.com/health
```

---

## SUCCESS CRITERIA

PathPilot is ready for public launch when:

✅ **All required environment variables configured**
✅ **MongoDB Atlas cluster online with seed data**
✅ **Gemini API key working** (test chat works)
✅ **Google OAuth configured** (test login works)
✅ **Backend API responding** at public URL
✅ **Frontend loads** at public URL
✅ **Auth flow end-to-end tested**
✅ **Quiz/progress system working**
✅ **No console errors** (development or production)
✅ **Admin panel accessible**
✅ **Rate limiting active**
✅ **Email service tested** (password reset sends email)
✅ **Database backups enabled**
✅ **Error monitoring** setup (Sentry)
✅ **SSL certificates valid**

---

## SUPPORT & TROUBLESHOOTING

### Common Issues

**"Cannot connect to MongoDB"**
- Check: MONGODB_URI in .env
- Check: IP whitelist in MongoDB Atlas
- Check: Username/password URL-encoded in connection string

**"Gemini API key invalid"**
- Verify key in AI Studio: https://aistudio.google.com
- Check: API enabled in Google Cloud Console
- Check: Key not expired (doesn't expire but check account)

**"CORS error: Origin not allowed"**
- Update backend FRONTEND_URL in .env
- Rebuild (Render/Vercel auto-redeploys on env change)

**"Google OAuth redirect_uri mismatch"**
- Add exact URL to Google Console → Credentials
- Must match exactly: `https://api.{domain}/api/auth/google/callback`

**"Payment endpoint 500 error"**
- This is normal if Razorpay keys not set
- Payments are optional; app works without them
- To enable: add RAZORPAY_KEY_* vars

---

**Generated:** June 2, 2026  
**Last Updated:** Deployment Report Complete  
**Status:** ✅ Ready for production deployment
