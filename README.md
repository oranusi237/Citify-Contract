# Citify Contractors

Citify Contractors is a Vite + React real estate web app with a public marketing site, property listing flows, inspection request handling, and protected admin pages for managing listings, tours, and contact submissions.

## Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Framer Motion
- Firebase Auth + Firestore
- Supabase storage
- Vitest

## What This Repo Contains

- Public pages for home, about, events, properties, property detail, contact, privacy policy, and 404 handling
- Admin pages for projects, tours, and contact requests
- Firestore-backed contact and tour request workflows
- Client-side anti-abuse controls for contact submissions
- Shared SEO and observability utilities

## Source Of Truth

The active application lives in [src](src).

This repository now enforces a single-source structure. If a nested duplicate app folder appears, strict structure checks will fail.

See [scripts/check-single-source.cjs](scripts/check-single-source.cjs).

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment variables

Copy values into a local `.env` file using [.env.example](.env.example) as the template.

Required client variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_BUCKET=

VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_CONTACT_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

### 3. Start the app

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

## Available Scripts

- `npm run dev`: Start the Vite development server
- `npm run build`: Create a production build
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint across the repo
- `npm run test`: Run the Vitest suite once
- `npm run test:watch`: Run Vitest in watch mode
- `npm run check:secrets`: Scan tracked files for secret-like values
- `npm run check:structure`: Run structure check in warning mode
- `npm run check:structure:strict`: Fail when duplicate nested app structure is detected
- `npm run ci`: Run secrets check, strict structure check, tests, and build
- `npm run ci:full`: Run secrets check, strict structure check, lint, tests, and build

## Firebase

Firestore configuration is defined in [firebase.json](firebase.json), [firestore.rules](firestore.rules), and [firestore.index.json](firestore.index.json).

The project includes an admin helper script at [setAdminByEmail.cjs](setAdminByEmail.cjs) for assigning admin claims by email when needed.

## App Structure

### Main app

- [src/App.jsx](src/App.jsx): Route registration, route-level code splitting, page transitions, auth provider, toast container
- [src/main.jsx](src/main.jsx): BrowserRouter bootstrap and observability initialization
- [src/pages](src/pages): Route-level page components
- [src/components](src/components): Shared UI and route-specific content components
- [src/context](src/context): App-wide auth state
- [src/utils](src/utils): Firestore stores, validation, anti-abuse, motion, SEO, observability, and shared config

### Important shared modules

- [src/utils/siteConfig.js](src/utils/siteConfig.js): Centralized company metadata, social links, office hours, privacy date, and animated stats values
- [src/utils/useContactRequestForm.js](src/utils/useContactRequestForm.js): Shared contact form workflow for validation, abuse checks, offline handling, and submission state
- [src/utils/useAnimatedStats.js](src/utils/useAnimatedStats.js): Shared stats counter animation hook
- [src/components/SitePageLayout.jsx](src/components/SitePageLayout.jsx): Standard public-page shell with Navbar and Footer
- [src/components/RouteSeo.jsx](src/components/RouteSeo.jsx): Route-aware SEO defaults

## Admin Areas

Protected admin routes include:

- `/admin/login`
- `/admin/properties`
- `/admin/tours`
- `/admin/contacts`

Route protection is handled in [src/components/ProtectedRoute.jsx](src/components/ProtectedRoute.jsx).

## Quality Checks

Before shipping changes, the expected minimum pass is:

```bash
npm run lint
npm run test
npm run build
```

For a fuller pre-merge pass, use:

```bash
npm run ci:full
```

## Onboarding Notes

- Start in [src/App.jsx](src/App.jsx) to understand the route map.
- Use [src/utils/siteConfig.js](src/utils/siteConfig.js) for business details instead of hardcoding company metadata in components.
- Reuse [src/utils/useContactRequestForm.js](src/utils/useContactRequestForm.js) for future contact-style forms instead of duplicating validation and submission logic.
- Reuse [src/components/SitePageLayout.jsx](src/components/SitePageLayout.jsx) for standard public pages that need Navbar plus content plus Footer.
- Keep all application changes inside [src](src) and avoid creating nested duplicate app roots.

## Deployment Notes

- Firestore rules can be deployed with Firebase CLI.
- The app uses client-side Firebase, client-side Supabase storage access, and client-side EmailJS configuration, so environment values must be present at build time.
