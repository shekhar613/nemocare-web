# Nemo Care (Web)

Next.js web client for [Nemo Care](../nemocare) — the same personal health records companion as the Flutter app.

## Features

- Firebase Auth (email/password + Google)
- Onboarding profile wizard
- Home chat grounded on your Firestore labs (Express + NVIDIA)
- Health records timeline + report details
- Vitals panels from uploaded labs
- Insights cards from Firestore / `/insights/refresh`
- Report image upload via Groq vision

## Setup

1. **Add a Firebase web app** in [Firebase Console](https://console.firebase.google.com/) → project `nemocare-2ce11` → Project settings → Your apps → Web. Copy `apiKey` and `appId` into `.env.local`.

2. **Enable Google sign-in** for the web domain (`localhost`) under Authentication → Settings → Authorized domains.

3. Copy env template and fill keys:

```bash
cp .env.local.example .env.local
```

4. Start the Express backend from the Flutter repo:

```bash
cd ../nemocare/backend
npm install
npm start
```

5. Run the web app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config |
| `NEXT_PUBLIC_BACKEND_BASE_URL` | Express API (default `http://localhost:8080`) |
| `NEXT_PUBLIC_GROQ_API_KEY` | Medical document image extraction |

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Firebase Auth + Firestore
- Outfit / Sora fonts (same brand as mobile)
- Sibling Express backend for chat + insights
