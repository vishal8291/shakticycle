# HealthMap AI Mobile

React Native + Expo mobile app for HealthMap AI — a personal health record and AI health companion.

## Features

- **Auth** — email/password login, signup, forgot-password, mobile OTP
- **Dashboard** — greeting, key metrics, quick-add actions, upcoming visits
- **Reports** — PDF / image upload via document picker, AI summaries, rebuild AI
- **Timeline** — symptom assistant with guidance, typed activity log
- **Appointments** — upcoming / past split, local push reminders
- **More tab** — vitals, medications, consultations, emergency card, ABDM workflow, AI insights, profile, settings
- **Push notifications** — Expo Push + local scheduled reminders for appointments
- **Offline-first** — AsyncStorage cache hydrates on launch, writes on every successful sync
- **Branding** — splash screen, adaptive icon, notification icon, favicon (generated from Node script)
- **Error boundary + toasts** — global crash screen, animated toast feedback

## Prerequisites

- Node.js 18+
- Expo Go (for quick testing) OR Expo Dev Client (for push notifications)
- The HealthMap backend running (see `../server/`)

## Local setup

```bash
cd mobile
npm install
npm run assets        # generates icon, splash, adaptive-icon, favicon, notification-icon PNGs
```

Set the API URL for your phone to reach your laptop:

```bash
# macOS / Linux
export EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001/api

# Windows PowerShell
$env:EXPO_PUBLIC_API_URL = "http://YOUR_LOCAL_IP:3001/api"
```

Start:

```bash
npm run start        # Expo dev server
npm run android      # Android emulator
npm run ios          # iOS simulator
```

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api` |

For EAS builds these are baked in via `eas.json` per-profile `env` blocks.

## Assets

Assets are generated programmatically (no design tool required):

```bash
npm run assets
```

This runs `scripts/generate-assets.mjs` which emits PNGs into `assets/`:

- `icon.png` — 1024×1024 app icon
- `splash.png` — 1242×2436 splash
- `adaptive-icon.png` — 1024×1024 Android adaptive foreground
- `favicon.png` — 48×48 web favicon
- `notification-icon.png` — 96×96 Android notification

Brand colors: primary `#2c73d9`, accent `#4ebd95`.

## Push notifications

1. The app requests notification permission on the Appointments screen or Settings.
2. `registerForPushNotifications` gets an Expo push token and POSTs it to `/api/push/register`.
3. The backend (`server/services/pushService.js`) sends via the Expo Push API.
4. Local reminders for appointments are scheduled via `expo-notifications` on the device.

**Note:** Push tokens require a configured `projectId` in `app.json` under `extra.eas.projectId`. For Expo Go development without EAS, local notifications still work.

## Offline support

- `src/services/cache.ts` wraps AsyncStorage with a namespaced prefix.
- `RecordProvider` hydrates from cache on mount, writes after every successful fetch.
- `ApiError.offline` is set when requests time out or fail with no network; the UI shows a banner and continues using cached data.

## Navigation structure

```
app/
  _layout.tsx                 # providers: SafeArea > ErrorBoundary > Toast > Auth > Record
  (auth)/
    login, signup, forgot, otp
  (app)/
    _layout.tsx               # 5 bottom tabs
    index.tsx                 # Home
    reports.tsx
    timeline.tsx
    appointments.tsx
    more/
      _layout.tsx             # nested stack
      index.tsx               # menu
      vitals, medications, consultations, emergency,
      abdm, insights, profile, settings
```

## Build & submit (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

Profiles in `eas.json`:
- `development` — dev client, internal distribution
- `preview` — internal APK / TestFlight
- `production` — Play Store bundle + App Store
