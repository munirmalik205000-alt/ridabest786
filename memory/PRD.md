# Rida786 - Product Requirements Document

## Original Problem Statement
User provided the `rida123-main.zip` codebase (existing FastAPI + React MLM/recharge/wallet app) and asked:
1. "Is file @ remove karo vercel me deploy ho jaye" – Remove `@/` alias imports from all pages so Vercel deployment works.
2. "Profile me pin fix karo set nhi ho raha" – Fix Profile page PIN setup (was not saving).
3. "Recharge me utility bills bi add karo" – Add utility bill payments (electricity, water, gas, DTH, etc.).
4. "recharge bill service ya wallet transfer ya bank withdrawal me pin required ho" – PIN required for recharge, bills, wallet transfer, bank withdrawal.
5. "ui ux light aur dark ho theme blue purple green ho" – Light + Dark mode with blue / purple / green theme.
6. "firbase ka eh code backend forent set kar do" – Initialize Firebase (web-SDK config provided) in backend + frontend.

## Implementation Status

### Completed (2026-01-20)
- [x] All `@/` alias imports in `src/pages/**` and `src/components/**` converted to relative paths (63 files touched). Vercel deploy no longer breaks.
- [x] Added `/app/frontend/vercel.json` with SPA rewrites.
- [x] Firebase Web SDK initialised at `/app/frontend/src/lib/firebase.js` (project: rida786) and imported from `index.js`. Backend exposes `/api/config/firebase` and ships `backend/firebase_config.py`.
- [x] Profile PIN setup rewritten with `key={pinStep}` reset + strict validation → works end-to-end (verified via UI: "PIN created successfully!" toast).
- [x] Utility Bill Payments module:
  - Backend: `GET /api/bills/categories`, `GET /api/bills/billers/{category}`, `POST /api/bills/pay` (PIN required), `GET /api/bills/history`.
  - 12 categories (Electricity, Water, Gas, Broadband, Landline, DTH, Insurance, LPG, Credit Card, FASTag, Education, Municipal) with 5–10 billers each.
  - Frontend: new tabbed Recharge page (📱 Mobile / 🧾 Bills) with biller picker, consumer-number flow, wallet source, bottom sheet confirmation.
- [x] PIN now mandatory on:
  - `POST /api/recharge` (mobile recharge) – backend verifies.
  - `POST /api/bills/pay` – backend verifies.
  - `POST /api/wallet/self-transfer`, `/api/wallet/user-transfer`, `/api/wallet/withdraw` – already verified; frontend uses shared `PinDialog` component.
- [x] Tri-color theme (Blue #4F46E5 + Purple #A855F7 + Green #10B981) via CSS variables in `index.css` with dark mode class toggle.
- [x] `ThemeProvider` + `ThemeToggle` component; toggle placed on Login header, Profile header, Dashboard header.
- [x] Redesigned Login, Dashboard header, BottomNav, Profile header, Recharge/Bills, core CSS with brand gradient + glassy surfaces + Sora/Plus Jakarta Sans fonts.
- [x] Backend `JWT_SECRET` and Firebase env-vars added to `backend/.env`.

## Architecture
- **Backend**: FastAPI + Motor(MongoDB). Auth via JWT (cookies + Authorization header). Admin auto-seeded (mobile 9999999999, password Admin@123, PIN 1234).
- **Frontend**: React 18 + Craco + Tailwind + shadcn/ui + Phosphor icons + Framer Motion + Sonner toasts.
- **Deploy**: Vercel for frontend (vercel.json) with REACT_APP_BACKEND_URL pointing to FastAPI host.

## Test Credentials (see `test_credentials.md`)
- Admin: 9999999999 / Admin@123 / PIN 1234
- Any signup: mobile + password (min 6 chars); PIN set on Profile.

## Backlog / Next
- P1: Wire Register + remaining screens (Packages, AddFund, Withdrawals, Shopping, AdminPanel) to full brand-theme CSS tokens (emerald CSS mapping handles most of it).
- P1: Firebase Cloud Messaging for push notifications on recharge / bill status.
- P2: Bill payment history screen + receipts.
- P2: Biller aliasing to real BBPS provider for production payouts.

## Enhancement Idea
Add a "Schedule Bill" option where users can set auto-pay reminders 3 days before due date – drives repeat visits & monetises reminder push-ads.
