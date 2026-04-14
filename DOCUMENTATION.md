# HealthMap AI - Complete Project Documentation

> **Version:** 1.0.0 | **Last Updated:** April 2026
> **Built by:** Vishal Tiwari | **Contact:** +91 8291569470
> **GitHub:** [vishal8291](https://github.com/vishal8291/vishal8291) | **LinkedIn:** [vishal-tiwari-158a5216b](https://www.linkedin.com/in/vishal-tiwari-158a5216b)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Environment Configuration](#5-environment-configuration)
6. [Backend Architecture](#6-backend-architecture)
7. [API Reference](#7-api-reference)
8. [Database Models](#8-database-models)
9. [Server Services](#9-server-services)
10. [Mobile App Architecture](#10-mobile-app-architecture)
11. [Screens & Navigation](#11-screens--navigation)
12. [Providers (State Management)](#12-providers-state-management)
13. [Mobile Services](#13-mobile-services)
14. [Component Library](#14-component-library)
15. [Feature Documentation](#15-feature-documentation)
16. [Subscription & Payments](#16-subscription--payments)
17. [Indian Food & Nutrition System](#17-indian-food--nutrition-system)
18. [AI Health Assistant](#18-ai-health-assistant)
19. [ABDM / ABHA Integration](#19-abdm--abha-integration)
20. [Security & Auth](#20-security--auth)
21. [Offline Support & Caching](#21-offline-support--caching)
22. [Push Notifications](#22-push-notifications)
23. [Theming & Design System](#23-theming--design-system)
24. [Known Limitations](#24-known-limitations)
25. [Future Roadmap](#25-future-roadmap)

---

## 1. Project Overview

**HealthMap AI** is a comprehensive personal health management mobile application that helps users track, analyze, and manage their health data. It combines AI-powered insights, Indian nutrition guidance, digital health record management, and integration with India's national health infrastructure (ABDM/ABHA).

### Core Value Propositions

- **Health Record Management** — Store vitals, medications, doctor visits, appointments, and uploaded medical reports in one place
- **AI-Powered Analysis** — Get smart summaries of uploaded medical reports and AI health chat for wellness guidance
- **Indian Food & Nutrition** — 93+ Indian foods database with condition-specific diet plans and meal recommendations
- **Daily Health Tracking** — Log water intake, sleep, exercise, mood, and steps daily
- **Health Score** — Personalized 0-100 health score across 7 categories
- **Subscription Model** — Free, Premium (Rs.199/mo), and Family (Rs.399/mo) tiers with Razorpay payments
- **ABDM Integration** — Link ABHA health ID and import records from India's national health system
- **Offline-First** — AsyncStorage caching for uninterrupted access

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Mobile Framework** | React Native (Expo) | SDK 55 / RN 0.83.4 |
| **UI Library** | React | 19.2.0 |
| **Navigation** | Expo Router (file-based) | ~55.0.10 |
| **Web Support** | react-native-web | ^0.21.0 |
| **Backend Runtime** | Node.js (native HTTP) | 20+ |
| **Database** | MongoDB Atlas (Mongoose) | Mongoose 9.3.3 |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | - |
| **Payments** | Razorpay (Web Checkout) | API v1 |
| **PDF Parsing** | pdf-parse | ^2.4.5 |
| **Email** | Nodemailer | ^8.0.4 |
| **SMS** | Twilio | ^5.13.1 |
| **Push Notifications** | Expo Push API | - |
| **Language** | TypeScript (mobile) / JavaScript ES Modules (server) | TS 5.9+ |

---

## 3. Project Structure

```
F:/shakticycle/
├── .claude/
│   ├── launch.json                  # Dev server launch configs
│   └── settings.local.json
├── .env                             # Environment variables
├── .env.example                     # Template for env setup
├── .gitignore
├── README.md
├── DOCUMENTATION.md                 # This file
├── package.json                     # Server dependencies
│
├── server/
│   ├── index.js                     # Main server (~1500 lines, 40+ endpoints)
│   ├── data/
│   │   ├── indianFoods.js           # 93 Indian foods + 8 conditions + 5 meal plans
│   │   └── record.json              # Default record template
│   ├── db/
│   │   └── connect.js               # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js                  # User authentication model
│   │   ├── HealthRecord.js          # Core health data model
│   │   ├── DailyLog.js              # Daily tracking model
│   │   ├── Subscription.js          # Subscription plan model
│   │   └── Payment.js               # Payment transaction model
│   ├── services/
│   │   ├── abdmService.js           # ABDM/ABHA national health integration
│   │   ├── healthMapAi.js           # AI report analysis engine
│   │   ├── messagingService.js      # Email (Nodemailer) + SMS (Twilio)
│   │   ├── paymentService.js        # Razorpay order creation + verification
│   │   ├── pushService.js           # Expo push notification delivery
│   │   └── reportExtraction.js      # PDF text extraction & parsing
│   ├── validation/
│   │   └── recordValidation.js      # Input validation for all record types
│   └── uploads/                     # Uploaded report PDFs
│
└── mobile/
    ├── app.json                     # Expo app config
    ├── eas.json                     # EAS Build config
    ├── package.json                 # Mobile dependencies
    ├── tsconfig.json                # TypeScript config
    ├── app/
    │   ├── _layout.tsx              # Root layout (providers wrapping)
    │   ├── index.tsx                # Entry redirect
    │   ├── (auth)/                  # Authentication screens (4)
    │   ├── (onboarding)/            # Onboarding flow (1)
    │   └── (app)/                   # Main app screens
    │       ├── index.tsx            # Dashboard
    │       ├── reports.tsx          # Reports list
    │       ├── timeline.tsx         # Health timeline
    │       ├── appointments.tsx     # Appointments
    │       └── more/                # More menu (18 screens)
    └── src/
        ├── components/
        │   ├── MobileUI.tsx         # 20+ reusable UI components
        │   ├── HealthScoreRing.tsx  # Animated circular progress
        │   └── ErrorBoundary.tsx    # Error boundary wrapper
        ├── providers/               # React Context providers (5)
        ├── services/                # API, cache, notifications, storage (4)
        ├── theme/
        │   └── colors.ts           # Design tokens, typography, shadows
        ├── hooks/                   # Custom hooks (2)
        ├── constants/
        │   └── symptoms.ts         # Symptom definitions
        └── utils/                   # Date, health score, validation (3)
```

---

## 4. Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- MongoDB Atlas account (or local MongoDB)
- (Optional) Razorpay account for payments
- (Optional) Twilio account for SMS
- (Optional) SMTP server for emails

### Installation

```bash
# Clone the project
git clone <repo-url>
cd shakticycle

# Install server dependencies
npm install

# Install mobile dependencies
cd mobile
npm install
cd ..

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see Section 5)
```

### Running the App

**Terminal 1 — Backend Server:**
```bash
npm run dev
# Server starts on http://localhost:3001
# Uses --watch for auto-restart on file changes
```

**Terminal 2 — Mobile App (Web Preview):**
```bash
cd mobile
npx expo start --web
# Opens on http://localhost:8081
```

**For LAN Mobile Testing:**
```bash
# Set in mobile's environment
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3001/api

# Access from phone browser at http://<your-lan-ip>:8081
```

### Available Scripts

| Script | Location | Command | Description |
|--------|----------|---------|-------------|
| dev | root | `npm run dev` | Start server with file watching |
| start | root | `npm start` | Start server (production) |
| start | mobile | `expo start` | Start Expo dev server |
| web | mobile | `expo start --web` | Start web preview directly |
| android | mobile | `expo run:android` | Build and run on Android |
| ios | mobile | `expo run:ios` | Build and run on iOS |

---

## 5. Environment Configuration

All environment variables are defined in `.env` at the project root.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB Atlas connection string |
| `PORT` | No | 3001 | Server port |
| `CLIENT_ORIGIN` | No | `*` | CORS allowed origin |
| `JWT_SECRET` | Yes (prod) | `dev-secret-change-me` | JWT signing key (64+ char hex recommended) |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth 2.0 secret |
| `SMTP_HOST` | No | - | Email SMTP hostname |
| `SMTP_PORT` | No | 587 | Email SMTP port |
| `SMTP_USER` | No | - | Email username |
| `SMTP_PASS` | No | - | Email password/app password |
| `SMTP_FROM` | No | - | Sender email address |
| `TWILIO_ACCOUNT_SID` | No | - | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | No | - | Twilio auth token |
| `TWILIO_SMS_FROM` | No | - | Twilio sender phone number |
| `RAZORPAY_KEY_ID` | No | - | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | No | - | Razorpay secret key |
| `ABDM_MODE` | No | demo | ABDM mode: demo or sandbox |
| `ABDM_BASE_URL` | No | - | ABDM gateway URL |
| `ABDM_CLIENT_ID` | No | - | ABDM client ID |
| `ABDM_CLIENT_SECRET` | No | - | ABDM client secret |
| `ABDM_HIU_ID` | No | - | ABDM Health Information User ID |
| `ABDM_CM_ID` | No | - | ABDM Consent Manager ID |

**Notes:**
- Server refuses to start in production if `JWT_SECRET` is the default value
- Services gracefully degrade when optional credentials are missing (email/SMS/Razorpay/ABDM)
- Razorpay: when keys are not configured, the plans screen auto-upgrades in dev mode

---

## 6. Backend Architecture

The backend is a **single-file raw Node.js HTTP server** (`server/index.js`, ~1500 lines) using zero web frameworks. It handles routing, CORS, authentication, file uploads, and all business logic directly.

### Design Decisions

- **No Express/Fastify** — Minimal dependency footprint; raw `node:http` with manual routing
- **ES Modules** — Uses `import`/`export` throughout (`"type": "module"` in package.json)
- **File uploads** — Handled via `busboy` streaming parser (5MB limit)
- **CORS** — Manual `Access-Control-Allow-*` headers on every response
- **Authentication** — JWT Bearer tokens validated on every `/api/*` route (except auth routes)

### Request Flow

```
Client Request
  → CORS preflight check (OPTIONS → 204)
  → Health check (/health → 200)
  → Static file serving (/uploads/* → stream file)
  → Auth routes (/api/auth/* → no token required)
  → Token validation (JWT verify → 401 if invalid)
  → Route matching (method + url pattern)
  → Input validation (recordValidation.js)
  → Business logic + DB operations
  → JSON response with CORS headers
```

---

## 7. API Reference

### Authentication (No token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account (fullName, email, password) |
| POST | `/api/auth/login` | Email + password login → JWT token |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with code |
| POST | `/api/auth/request-mobile-otp` | Request OTP via SMS |
| POST | `/api/auth/verify-mobile-otp` | Verify OTP → JWT token |
| POST | `/api/auth/google` | Google OAuth login/signup |
| GET | `/api/auth/me` | Get current user profile (token required) |

### Health Records (Token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/record` | Fetch complete health record |
| PUT | `/api/patient` | Update patient demographics |
| PUT | `/api/emergency-info` | Update emergency contacts/allergies |
| POST | `/api/timeline` | Add timeline entry |
| POST | `/api/reports` | Add report metadata |
| POST | `/api/reports/upload` | Upload report PDF (multipart, 5MB max) |
| PUT | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Delete report |
| POST | `/api/vitals` | Add vital measurement |
| PUT | `/api/vitals/:id` | Update vital |
| DELETE | `/api/vitals/:id` | Delete vital |
| POST | `/api/appointments` | Add appointment |
| PUT | `/api/appointments/:id` | Update appointment |
| DELETE | `/api/appointments/:id` | Delete appointment |
| POST | `/api/medications` | Add medication |
| PUT | `/api/medications/:id` | Update medication |
| DELETE | `/api/medications/:id` | Delete medication |
| POST | `/api/consultations` | Add consultation |
| POST | `/api/reset` | Reset all user health data |

### AI & Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | AI health assistant chat |
| POST | `/api/ai/rebuild-reports` | Re-analyze all reports with AI |

### Food & Nutrition

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/foods` | List all foods (93 items) |
| GET | `/api/foods?q=ragi` | Search foods by name/hindi/tag |
| GET | `/api/foods?category=lentil` | Filter by category |
| GET | `/api/foods?condition=diabetes` | Condition-specific recommendations |
| GET | `/api/foods?meal_plan=balanced` | Get meal plan |

### Subscriptions & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Current subscription status |
| POST | `/api/subscription/upgrade` | Upgrade plan (free→premium→family) |
| POST | `/api/subscription/cancel` | Cancel subscription |
| GET | `/api/payment/config` | Razorpay public key for frontend |
| POST | `/api/payment/create-order` | Create Razorpay payment order |
| POST | `/api/payment/verify` | Verify payment signature (HMAC SHA256) |

### Daily Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-log` | Get today's log |
| GET | `/api/daily-log/week` | Get 7-day log history |
| PUT | `/api/daily-log` | Update today's log |

### Push Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/push/register` | Register Expo push token |
| POST | `/api/push/unregister` | Unregister push token |

### ABDM / ABHA

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/abdm/status` | ABDM configuration status |
| POST | `/api/abha/connect` | Link ABHA health ID |
| POST | `/api/abdm/discover` | Discover care contexts |
| POST | `/api/abdm/request-consent` | Request health record consent |
| POST | `/api/abdm/approve-demo-consent` | Auto-approve in demo mode |
| POST | `/api/abha/import-demo` | Import demo health records |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/uploads/:filename` | Serve uploaded files |

---

## 8. Database Models

### User (`server/models/User.js`)

```
fullName        String (required)
email           String (required, unique, indexed)
mobileNumber    String
googleId        String
avatarUrl       String
passwordHash    String
passwordResetCodeHash   String
passwordResetExpiresAt  Date
loginOtpCodeHash        String
loginOtpExpiresAt       Date
role            String (enum: user/admin, default: user)
pushTokens      [{ token, platform, registeredAt }]
createdAt       Date (auto)
updatedAt       Date (auto)
```

### HealthRecord (`server/models/HealthRecord.js`)

The central model storing all health data for a user. Contains nested sub-documents:

- **patient** — name, age, sex, bloodGroup, phone, emergencyContact, address
- **emergencyInfo** — contacts[], allergies[], conditions[], insuranceProvider, insurancePolicyNumber, bloodGroup, organDonor
- **timeline** — [{ title, detail, date, type }]
- **reports** — [{ name, doctor, date, status, file info, AI extraction fields, aiSummary, aiFollowUp, aiTimelineItems }]
- **vitals** — [{ type, value, unit, date, notes }]
- **medications** — [{ name, dosage, frequency, startDate, endDate, prescribedBy, notes, active }]
- **consultations** — [{ doctorName, specialty, date, notes, diagnosis, prescription }]
- **appointments** — [{ doctorName, specialty, date, location, notes, status }]
- **importedRecords** — ABDM imported records
- **careContexts** — ABDM care context references
- **consentRequests** — ABDM consent tracking

### DailyLog (`server/models/DailyLog.js`)

```
userId    ObjectId (ref: User, required)
date      String (YYYY-MM-DD, required)
water     Number (glasses, default: 0)
sleep     Number (hours, default: 0)
exercise  Number (minutes, default: 0)
mood      String (enum: great/good/okay/bad/terrible)
steps     Number (default: 0)
notes     String
```
Unique compound index: `{ userId, date }`

### Subscription (`server/models/Subscription.js`)

```
userId              ObjectId (unique ref: User)
plan                String (enum: free/premium/family, default: free)
status              String (enum: active/cancelled/expired/trial, default: active)
features {
  aiInsights        Boolean
  unlimitedReports  Boolean
  exportPdf         Boolean
  familyMembers     Number
  prioritySupport   Boolean
  advancedAnalytics Boolean
  aiChat            Boolean
  customReminders   Boolean
}
trialEndsAt         Date
currentPeriodStart  Date
currentPeriodEnd    Date
cancelledAt         Date
```

### Payment (`server/models/Payment.js`)

```
userId              ObjectId (ref: User)
razorpayOrderId     String
razorpayPaymentId   String
razorpaySignature   String
plan                String (enum: premium/family)
amount              Number
currency            String (default: INR)
status              String (enum: created/paid/failed/refunded)
```

---

## 9. Server Services

### Report Extraction (`reportExtraction.js`)
Extracts text from uploaded PDF reports using `pdf-parse`. Identifies patient details (name, age, sex, date) and clinical observations (hemoglobin, glucose, TSH, creatinine, cholesterol, blood pressure, etc.) using regex pattern matching.

### Health Map AI (`healthMapAi.js`)
Analyzes extracted report data to generate:
- Report type classification (Lab/Imaging/Prescription/Hospital)
- Source highlights (key findings)
- AI summary (plain language explanation)
- Follow-up suggestions
- Timeline items for automatic history building

### Payment Service (`paymentService.js`)
- `createRazorpayOrder(amount, currency, receipt)` — Creates Razorpay order via API
- `verifyRazorpaySignature(orderId, paymentId, signature)` — HMAC SHA256 verification
- `isPaymentConfigured()` — Checks if Razorpay keys are set
- `getRazorpayKeyId()` — Returns public key for frontend

### Messaging Service (`messagingService.js`)
- **Email**: Nodemailer with configurable SMTP (password reset, appointment reminders)
- **SMS**: Twilio (OTP delivery, appointment reminders)
- Both gracefully degrade to console logging when not configured

### Push Service (`pushService.js`)
- Expo Push API integration (no external SDK needed)
- Validates `ExponentPushToken[...]` format
- Batches notifications (100/batch)
- `sendPushToUser(userId, title, body, data)` — Delivers to all registered devices

### ABDM Service (`abdmService.js`)
- **Demo mode**: Returns simulated health records for testing
- **Sandbox mode**: Connects to ABDM sandbox gateway
- Handles: care context discovery, consent requests, record imports

---

## 10. Mobile App Architecture

The mobile app uses **Expo Router** for file-based navigation with a nested layout structure:

```
Root Layout (_layout.tsx)
  ├── Providers: Auth → Subscription → Record → DailyLog → Toast
  │
  ├── (onboarding)/
  │   └── welcome.tsx          → First-time user experience
  │
  ├── (auth)/
  │   ├── login.tsx            → Email/password + Google OAuth
  │   ├── signup.tsx           → Registration with terms agreement
  │   ├── forgot.tsx           → Password reset request
  │   └── otp.tsx              → OTP verification
  │
  └── (app)/
      ├── index.tsx            → Dashboard (home)
      ├── reports.tsx          → Reports list & upload
      ├── timeline.tsx         → Health timeline
      ├── appointments.tsx     → Appointments
      └── more/               → 18 additional screens
```

### State Management
- **React Context** — 5 providers wrapping the entire app
- **No Redux/Zustand** — Simplified state through provider pattern
- **AsyncStorage** — Persistent cache layer for offline support

---

## 11. Screens & Navigation

### Authentication Flow (4 screens)

| Screen | File | Features |
|--------|------|----------|
| Login | `(auth)/login.tsx` | Email/password, show/hide password toggle, gradient header, Google OAuth |
| Sign Up | `(auth)/signup.tsx` | Name/email/password, password strength bar, terms checkbox, validation |
| Forgot Password | `(auth)/forgot.tsx` | Email input, sends reset link |
| OTP Verification | `(auth)/otp.tsx` | 6-digit OTP input, resend timer |

### Main App (4 screens + bottom tabs)

| Screen | File | Features |
|--------|------|----------|
| Dashboard | `(app)/index.tsx` | AI Assistant card, Health Score ring, quick actions, metrics, activity feed |
| Reports | `(app)/reports.tsx` | Report list, PDF upload, AI extraction status |
| Timeline | `(app)/timeline.tsx` | Chronological health events |
| Appointments | `(app)/appointments.tsx` | Upcoming/past appointments |

### More Menu (18 screens)

| Screen | File | Features |
|--------|------|----------|
| More Index | `more/index.tsx` | Menu with all options |
| Subscription Plans | `more/plans.tsx` | Free/Premium/Family tiers, Razorpay checkout |
| Daily Tracking | `more/daily-log.tsx` | Water, sleep, exercise, mood, steps logging |
| Vitals | `more/vitals.tsx` | BP, glucose, weight, pulse tracking |
| Medications | `more/medications.tsx` | Prescription management |
| Doctor Visits | `more/consultations.tsx` | Consultation records |
| Emergency Card | `more/emergency.tsx` | Emergency contacts, allergies, insurance |
| ABDM / ABHA | `more/abdm.tsx` | National health ID linking |
| AI Health Chat | `more/ai-chat.tsx` | Chat interface with AI assistant |
| Indian Food Guide | `more/food-guide.tsx` | 93+ foods, conditions, meal plans |
| Health Score | `more/health-score.tsx` | Detailed score breakdown |
| AI Insights | `more/insights.tsx` | Report analysis summaries |
| Export & Share | `more/export.tsx` | Data export, doctor sharing |
| Search | `more/search.tsx` | Full-text record search |
| Profile | `more/profile.tsx` | Personal & medical info |
| Settings | `more/settings.tsx` | Notifications, cache, developer info, sign out |
| Terms | `more/terms.tsx` | Full Terms & Conditions (222 lines) |
| Privacy | `more/privacy.tsx` | Full Privacy Policy (216 lines) |

### Onboarding (1 screen)

| Screen | File | Features |
|--------|------|----------|
| Welcome | `(onboarding)/welcome.tsx` | 3-slide carousel: overview, AI features, offline access |

---

## 12. Providers (State Management)

### AuthProvider
- **Purpose**: User authentication, session management
- **State**: `user`, `token`, `loading`
- **Methods**: `signIn`, `signUp`, `signOut`, `forgotPassword`, `resetPassword`, `requestMobileOtp`, `verifyMobileOtp`, `refreshMe`
- **Storage**: JWT token persisted via SecureStore (native) / localStorage (web)

### SubscriptionProvider
- **Purpose**: Plan management and feature gating
- **State**: `subscription`, `loading`, `isPremium`, `isFamily`, `isTrial`, `trialDaysLeft`
- **Methods**: `hasFeature(key)`, `upgrade(plan)`, `cancel()`, `refresh()`
- **Feature flags**: aiInsights, unlimitedReports, exportPdf, familyMembers, prioritySupport, advancedAnalytics, aiChat, customReminders

### RecordProvider
- **Purpose**: Central health data management (largest provider)
- **State**: `record`, `loading`, `saving`, `offline`, `lastSyncedAt`, `abdmStatus`
- **CRUD**: Full create/update/delete for timeline, reports, vitals, appointments, medications, consultations
- **AI**: `rebuildAi()` for batch report re-analysis
- **ABDM**: `connectAbha()`, `discoverCareContexts()`, `requestConsent()`, `importAbdm()`
- **Caching**: Writes to AsyncStorage on every successful fetch

### DailyLogProvider
- **Purpose**: Daily health metrics tracking
- **State**: `today`, `week` (7-day array), `loading`
- **Methods**: `updateToday(updates)`, `refresh()`

### ToastProvider
- **Purpose**: In-app toast notifications
- **Types**: success, error, info, warning
- **Features**: Auto-dismiss (3.2s), animated fade, tap to dismiss

---

## 13. Mobile Services

### API Client (`services/api.ts`)
- Base URL from `EXPO_PUBLIC_API_URL` env var (default: `http://localhost:3001/api`)
- `apiRequest<T>(path, options, token)` — Generic typed HTTP client
- Auto Bearer token injection
- Retry logic: 2 retries with exponential backoff (300ms * attempt)
- Timeout: 15 seconds default
- Offline detection via AbortError / network error messages
- Custom `ApiError` class with `status` and `offline` flags

### Cache (`services/cache.ts`)
- AsyncStorage wrapper with `healthmap-cache:` prefix
- `readCache<T>(key)` / `writeCache(key, value)` / `clearCache(key)`
- Stores metadata: `{ value, savedAt: timestamp }`
- Non-throwing — swallows storage quota errors

### Notifications (`services/notifications.ts`)
- `registerForPushNotifications()` — Permission request + Expo push token
- `scheduleLocalReminder(id, title, body, date)` — Date-based local notifications
- `cancelReminder(id)` / `cancelAllReminders()`
- Creates Android notification channel

### Secure Storage (`services/secureStorage.ts`)
- Platform-aware abstraction over `expo-secure-store`
- Mobile: Encrypted SecureStore
- Web: `window.localStorage` (fallback since SecureStore is native-only)
- Functions: `getItem`, `setItem`, `deleteItem`

---

## 14. Component Library

`MobileUI.tsx` provides 20+ reusable components:

| Component | Description |
|-----------|-------------|
| `AppScreen` | Safe-area scrollable screen wrapper |
| `HeroCard` | Large gradient hero banner |
| `SectionCard` | Grouped content card with title |
| `GlassCard` | Frosted glass effect card |
| `StatRow` | Label-value pair display |
| `MetricGrid` | Grid of metric cards |
| `PrimaryButton` | Solid primary action button |
| `GradientButton` | Gradient-styled button |
| `SecondaryButton` | Outlined secondary button |
| `GhostButton` | Text-only button |
| `IconButton` | Icon-only circular button |
| `Field` | Text input with label |
| `SelectChips` | Chip-based selection |
| `Badge` | Status badge |
| `ProBadge` | Premium feature badge |
| `EmptyState` | Empty content placeholder |
| `ListItem` | Standard list row |
| `Divider` | Horizontal separator |
| `Row` / `Spacer` | Layout utilities |
| `Banner` | Alert banner |
| `PaywallGate` | Premium feature gate overlay |
| `ProgressBar` | Linear progress indicator |
| `Skeleton` | Loading placeholder |

`HealthScoreRing.tsx` — Animated circular progress ring using two-half-circle clipping technique with score display.

---

## 15. Feature Documentation

### Dashboard
The home screen displays:
1. **Top navbar** — Logo, search button, settings, user avatar
2. **AI Assistant card** — "VishalBytes" branded purple gradient card linking to AI chat
3. **Health Score ring** — Animated 0-100 score with category breakdown
4. **Quick actions** — Report upload, vital entry, appointment, daily tracking
5. **Metrics grid** — Today's water, sleep, exercise, mood
6. **Upcoming visits** — Next 3 appointments
7. **Recent activity** — Latest timeline entries

### Health Score Algorithm
Score calculated across 7 weighted categories (0-100 total):
- Profile completeness
- Emergency info
- Vitals tracking
- Report uploads
- Medication adherence
- Appointment scheduling
- Timeline activity

### Daily Tracking
Users log daily:
- Water intake (glasses)
- Sleep duration (hours)
- Exercise duration (minutes)
- Mood (great/good/okay/bad/terrible)
- Steps count
- Free-text notes

7-day history visualization available.

### Report Upload & AI Analysis
1. User uploads PDF via document picker or camera
2. Server extracts text using `pdf-parse`
3. Regex patterns identify clinical values (hemoglobin, glucose, TSH, etc.)
4. AI engine generates: summary, follow-up suggestions, timeline entries
5. Results stored in report record and auto-added to timeline

---

## 16. Subscription & Payments

### Plans

| Feature | Free | Premium (Rs.199/mo) | Family (Rs.399/mo) |
|---------|------|---------------------|---------------------|
| Basic tracking | Yes | Yes | Yes |
| Report uploads | 5/month | Unlimited | Unlimited |
| AI Chat | No | Yes | Yes |
| AI Insights | No | Yes | Yes |
| Export PDF | No | Yes | Yes |
| Custom Reminders | No | Yes | Yes |
| Advanced Analytics | No | No | Yes |
| Family Members | 1 | 1 | 5 |
| Priority Support | No | No | Yes |

### Payment Flow (Razorpay)
1. User selects plan on `plans.tsx` screen
2. Frontend calls `POST /api/payment/create-order` → Razorpay order created
3. Razorpay Web Checkout opens (dynamic script injection)
4. On payment success, frontend calls `POST /api/payment/verify` with orderId + paymentId + signature
5. Server verifies HMAC SHA256 signature
6. Subscription upgraded, Payment record saved
7. **Dev mode**: When `RAZORPAY_KEY_ID` is empty, auto-upgrades without payment

---

## 17. Indian Food & Nutrition System

### Food Database (`server/data/indianFoods.js`)

**93 Indian foods** across 10 categories:

| Category | Count | Examples |
|----------|-------|---------|
| Grains | 11 | Roti, Brown Rice, Bajra, Jowar, Ragi, Oats, Poha, Daliya |
| Lentils | 9 | Moong Dal, Toor Dal, Chana Dal, Rajma, Chole, Soybean |
| Vegetables | 20 | Palak, Methi, Karela, Lauki, Bhindi, Drumstick, Sweet Potato |
| Fruits | 13 | Banana, Guava, Pomegranate, Jamun, Amla, Papaya |
| Dairy | 6 | Milk, Curd, Buttermilk, Paneer, Ghee, Lassi |
| Nuts & Seeds | 8 | Almonds, Walnuts, Flaxseeds, Chia Seeds, Sesame |
| Spices | 6 | Turmeric, Cumin, Cinnamon, Cardamom, Fenugreek Seeds |
| Non-Veg | 6 | Chicken, Egg, Rohu Fish, Mutton, Pomfret, Prawns |
| Snacks | 8 | Idli, Dosa, Dhokla, Khichdi, Sprouts, Upma |
| Beverages | 6 | Turmeric Milk, Green Tea, Lemon Water, Coconut Water |

Each food includes: name, Hindi name, category, veg/non-veg, calories, protein, carbs, fat, fiber (per 100g), health tags, and regional origin.

### Condition-Specific Diets (8 conditions)

| Condition | Recommended Foods | Tips |
|-----------|-------------------|------|
| Diabetes | Karela, Methi, Moong Dal, Millets, Jamun, Dalchini | 7 actionable tips |
| High BP | Banana, Beetroot, Coconut Water, Garlic, Flaxseed | 7 tips |
| Anemia | Palak, Beetroot, Ragi, Masoor Dal, Pomegranate, Jaggery | 7 tips |
| Cholesterol | Oats, Flaxseed, Walnuts, Fish, Garlic, Amla | 7 tips |
| Weight Loss | Moong Dal, Lauki, Sprouts, Millets, Green Tea, Chaach | 8 tips |
| Thyroid | Dahi, Eggs, Fish, Almonds, Coconut Water | 7 tips |
| Immunity | Turmeric, Amla, Ginger, Garlic, Dahi, Green Tea | 7 tips |
| Pregnancy | Palak, Masoor Dal, Milk, Ragi, Almonds, Walnuts | 8 tips |

### Meal Plans (5 plans)

Each plan provides time-wise meals: early morning, breakfast, mid-morning, lunch, evening snack, dinner, bedtime.

- **Balanced Indian Diet** — General wellness
- **Diabetes-Friendly** — Low GI, blood sugar control
- **Weight Loss** — Calorie-conscious with protein focus
- **Heart-Healthy** — Low sodium, omega-3 rich
- **Pregnancy Nutrition** — Trimester-aware nutrition

### Food Guide Screen (`more/food-guide.tsx`)

3-tab interface:
1. **Browse** — Search bar + 10 category filter chips + food cards with nutrition pills (cal/protein/carbs/fat/fiber) and health tags
2. **By Condition** — Select from 8 health conditions → view recommended foods, foods to avoid, actionable diet tips
3. **Meal Plans** — Select from 5 curated plans → view full day meal breakdown

---

## 18. AI Health Assistant

### Chat Interface (`more/ai-chat.tsx`)
- Premium feature (requires subscription)
- Chat bubble UI with AI avatar
- Sends messages to `POST /api/ai/chat`
- Includes user's health record context (patient info, vitals count, reports count, medications count)

### AI Response Engine (`generateAiChatReply` in `server/index.js`)

**30+ health topics** handled via keyword matching:

| Category | Triggers | Response Type |
|----------|----------|---------------|
| Emergency | chest pain, stroke, seizure, etc. | Emergency numbers (112/108) + first aid |
| Headache/Migraine | headache, migraine | Symptoms + when to see doctor |
| Fever | fever, temperature | Management + red flags |
| Cold/Flu | cold, flu, sore throat | Home remedies + warning signs |
| Stomach/Digestion | stomach, acidity, nausea | Diet + BRAT protocol |
| Blood Pressure | BP, hypertension | Targets + lifestyle tips |
| Diabetes | sugar, glucose, HbA1c | Ranges + management |
| Cholesterol | LDL, HDL, lipid | Targets + diet |
| Thyroid | TSH, T3, T4 | Medication + monitoring |
| Anemia | iron, hemoglobin | Diet + supplements |
| Mental Health | depression, anxiety, suicide | Helplines (iCall, AASRA) + coping |
| Sleep | insomnia, sleep hygiene | 4-7-8 breathing + habits |
| Skin/Eye/Dental | various | Specific care tips |
| Pregnancy | prenatal, trimester | Trimester-wise guidance |
| First Aid | burns, cuts, fractures | RICE protocol + emergency |

**Indian Food-Aware Responses** (7 condition-specific diet handlers):
- "diabetes diet" → Diabetes-friendly Indian foods + sample meal
- "BP food" → Blood pressure control foods + beetroot juice tip
- "weight loss diet" → Full Indian weight loss meal plan
- "pregnancy food" → Trimester-wise Indian nutrition plan
- "anemia food" → Iron-rich Indian diet + power drink recipe
- "cholesterol diet" → Heart-healthy Indian food plan
- "immunity food" → Immunity-boosting Indian superfoods + kadha recipe
- "Indian food" / "desi diet" → Complete balanced Indian meal plan

Every response includes medical disclaimer: *"This is AI-generated health guidance, not medical advice."*

---

## 19. ABDM / ABHA Integration

Integrates with India's **Ayushman Bharat Digital Mission** for national health record interoperability.

### Modes
- **Demo**: Simulated data for development/testing (default)
- **Sandbox**: Connects to ABDM sandbox gateway for integration testing

### Flow
1. User enters ABHA number → `POST /api/abha/connect`
2. Discover care contexts from linked hospitals → `POST /api/abdm/discover`
3. Request consent for health records → `POST /api/abdm/request-consent`
4. (In demo) Auto-approve consent → `POST /api/abdm/approve-demo-consent`
5. Import records → `POST /api/abha/import-demo`

### Required Configuration (Sandbox)
- `ABDM_BASE_URL` — Gateway URL
- `ABDM_CLIENT_ID` / `ABDM_CLIENT_SECRET` — API credentials
- `ABDM_HIU_ID` — Health Information User identifier
- `ABDM_CM_ID` — Consent Manager identifier

---

## 20. Security & Auth

### Authentication
- **JWT tokens** — 7-day expiry, signed with `JWT_SECRET`
- **Password hashing** — bcryptjs with salt rounds
- **OTP codes** — SHA256 hashed before storage, never exposed in API responses
- **Password reset codes** — SHA256 hashed, time-limited expiry
- **Google OAuth** — Token verification via Google API

### API Security
- All `/api/*` routes (except auth) require valid JWT Bearer token
- CORS headers on every response
- Request body size limit: 50KB (JSON), 5MB (file uploads)
- Input validation via `recordValidation.js` for all record mutations
- OTP/reset codes never returned in API responses (server-side only)

### Production Safeguards
- Server refuses to start if `JWT_SECRET` is default value in production
- Razorpay payment signature verified with HMAC SHA256
- File uploads restricted to PDF mime types

---

## 21. Offline Support & Caching

### Strategy: Cache-First with Background Sync

1. On successful API fetch → data written to AsyncStorage cache
2. On app load → cached data hydrated immediately (instant UI)
3. API request fires in background → updates cache on success
4. On network failure → `ApiError.offline = true` flag set
5. UI shows cached data with offline indicator

### Cache Keys
- `healthmap-cache:record` — Full health record
- `healthmap-cache:daily-log` — Today's daily log
- `healthmap-cache:subscription` — Current subscription

### Retry Logic
- API client retries failed requests twice
- Exponential backoff: 300ms, 600ms
- Network errors detected via AbortError / "network" / "offline" / "internet" messages

---

## 22. Push Notifications

### Architecture
- **Server**: Expo Push API (HTTP-based, no SDK needed)
- **Client**: `expo-notifications` library

### Flow
1. App registers for notifications → gets `ExponentPushToken[...]`
2. Token sent to server → `POST /api/push/register`
3. Server stores token in User document
4. On events (appointment reminders, etc.) → server pushes via Expo Push API
5. Client handles received notifications

### Local Notifications
- Appointment reminders scheduled locally
- Uses `expo-notifications` scheduling API
- Android: Custom notification channel created

---

## 23. Theming & Design System

### Design Tokens (`src/theme/colors.ts`)

**Colors**: 30+ semantic tokens including:
- `primary`, `primaryDark` — Blue palette
- `accent`, `accentDark` — Green palette
- `text`, `textMuted`, `textLight` — Text hierarchy
- `surface`, `surfaceAlt`, `bg` — Background layers
- `border`, `borderLight` — Separators
- `success`, `warning`, `error`, `info` — Status colors
- `gradient` — Tuple for gradient backgrounds

**Typography**: 10 text styles (`hero`, `h1`-`h3`, `body`, `bodySmall`, `small`, `tiny`, `label`, `mono`)

**Spacing**: 8-point grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

**Radii**: `sm`(8), `md`(12), `lg`(16), `xl`(20), `xxl`(28), `pill`(999)

**Shadows**: `sm`, `md`, `lg`, `glow` — Platform-aware (iOS shadowOffset vs Android elevation)

---

## 24. Known Limitations

1. **Expo Go Incompatibility** — SDK 55 is too new for older Expo Go versions; use web preview or dev builds
2. **Web SecureStore** — Falls back to unencrypted localStorage on web (acceptable for dev, not production web)
3. **AI Chat** — Keyword-based matching, not LLM-powered; handles 30+ topics but can miss nuanced queries
4. **ABDM** — Only demo mode functional; sandbox integration requires ABDM credentials and approval
5. **Email/SMS** — Requires external service configuration (Nodemailer SMTP + Twilio)
6. **Single Server File** — `index.js` at ~1500 lines could benefit from route-level splitting for maintainability
7. **No Automated Tests** — Test infrastructure exists (`npm test`) but no test files written yet
8. **Report AI** — PDF extraction is regex-based; may miss complex report formats

---

## 25. Future Roadmap

- [ ] Full ABDM sandbox/production gateway integration
- [ ] LLM-powered AI chat (Claude/GPT integration for more natural conversations)
- [ ] Family member management (for Family plan subscribers)
- [ ] Doctor sharing portal (read-only links for healthcare providers)
- [ ] Wearable device integration (Google Fit, Apple Health)
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Medication interaction checker
- [ ] Automated appointment reminders via SMS/email
- [ ] Progressive Web App (PWA) support for web deployment
- [ ] EAS Build for production APK/IPA distribution
- [ ] Chart visualizations for vitals trends
- [ ] Comprehensive test suite (unit + integration)
- [ ] Route-level code splitting for server maintainability
