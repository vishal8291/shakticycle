# HealthMap AI

Personal health record + AI health companion. Mobile-first with a Node/MongoDB backend.

## Stack

- **Mobile** — React Native + Expo (see [`mobile/`](./mobile/README.md))
- **Backend** — Node.js HTTP server + Mongoose + MongoDB Atlas
- **Push** — Expo Push API
- **ABDM / ABHA** — demo + sandbox-ready service mode

## Repo layout

```
/
├── mobile/          # Expo React Native app (primary client)
├── server/          # Node HTTP API, MongoDB models, services
├── scripts/         # Dev helpers
└── package.json     # Server dependencies + dev scripts
```

## Backend setup

1. Create a MongoDB Atlas cluster, database user, and allow your IP.
2. Copy `.env.example` → `.env` and fill in:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/healthmap?retryWrites=true&w=majority
JWT_SECRET=change-me
PORT=3001
```

3. Install and run:

```bash
npm install
npm run dev:server
```

The API serves on `http://localhost:3001/api`.

## Mobile setup

See [`mobile/README.md`](./mobile/README.md). Quick start:

```bash
cd mobile
npm install
npm run assets
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001/api npm run start
```

## ABDM integration modes

- `ABDM_MODE=demo` — simulated ABHA linking, discovery, consent, import
- `ABDM_MODE=sandbox` — validates config and calls the real gateway (gateway calls in [`server/services/abdmService.js`](./server/services/abdmService.js) must still be completed)

Sandbox env vars:

```env
ABDM_MODE=sandbox
ABDM_BASE_URL=https://your-abdm-sandbox-base-url
ABDM_CLIENT_ID=your-abdm-client-id
ABDM_CLIENT_SECRET=your-abdm-client-secret
ABDM_HIU_ID=your-registered-hiu-id
ABDM_CM_ID=your-consent-manager-id
```

## Key API endpoints

Auth: `POST /api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/auth/forgot`, `/api/auth/reset`, `/api/auth/otp/request`, `/api/auth/otp/verify`

Record: `GET /api/record`, `PUT /api/patient`, `PUT /api/emergency`, `POST /api/reset`

Data: `/api/timeline`, `/api/reports`, `/api/vitals`, `/api/appointments`, `/api/medications`, `/api/consultations` (CRUD)

AI: `POST /api/reports/upload`, `POST /api/ai/rebuild-reports`

Push: `POST /api/push/register`, `POST /api/push/unregister`

ABDM: `/api/abha/connect`, `/api/abdm/discover`, `/api/abdm/request-consent`, `/api/abdm/approve-demo-consent`, `/api/abha/import-demo`

## Next milestones

- complete ABDM sandbox gateway calls
- unify local and imported records in one timeline
- doctor sharing + audit trail
- migrate prototype storage to PostgreSQL
