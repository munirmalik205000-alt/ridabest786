# PRD - SmartPay360 (Mobile Recharge + MLM + Investments)

## Original Problem Statement
Full-stack mobile-friendly web app: Mobile Recharge + Utility Bills + MLM (20-level) + Dual Wallet + 4-digit PIN + Admin Panel.
Iter-1 (Apr 2026): redo UI/UX, add Investment Packages, Withdraw v2, extras.
Iter-2 (Apr 2026): Admin UI for Packages/Withdrawals/KYC, fix Login/Signup, mobile screen support.

## Tech Stack
React (CRA + CRACO) + Tailwind + shadcn/ui + framer-motion + phosphor-icons | FastAPI (cookie JWT) | MongoDB (Motor)

## Personas
- **User**: signs up via referral, adds funds, invests in packages, recharges, withdraws to Bank/UPI, KYC submission.
- **Admin**: approves fund-requests, withdrawals, KYC; creates/toggles/deletes investment packages; manages banners & commissions.

## Core Features (complete)
1. JWT cookie auth + OTP password/PIN reset
2. 20-level MLM referral (auto-placement, cycles)
3. Dual Wallet (Main + E-Wallet) + Coins
4. Mobile/DTH/Electricity/Gas/Water recharge with PIN confirm
5. Add Fund with UTR + screenshot (admin-approved)
6. **Investment Packages v2** (Apr 2026)
   - 6 default tiers; user buy with PIN from E-Wallet
   - Daily income lazy-credit to Main Wallet; MLM commission on purchase
   - Admin CRUD: create/toggle/deactivate/delete packages
7. **Withdraw v2** (Apr 2026)
   - Bank **or** UPI; 2% platform fee; net-amount summary
   - User withdrawal history page
   - Admin approve/reject withdrawals (auto-refund on reject)
8. **Notifications** in-app bell, unread badge, auto-refresh 30s
9. **KYC Management** (Apr 2026): admin list + approve/reject with in-app notification
10. Shopping/Vendor (basic)
11. Banner (text + image slider) admin-controlled

## UI/UX
- Dashboard: dark fintech theme (`#05070f`) with ambient gradient blobs, sticky glass header, hero balance card, 8-grid quick actions, package teaser, stat-grid
- **Login/Register redesigned** (Apr 2026): mobile-first dark theme, emerald accent, bank-grade trust footer, inline validations
- **BottomNav (mobile)**: 5 tabs (Home / Invest / Wallet / Refer / Profile), auto-hidden on auth/admin pages
- Admin Panel: 8 tabs (Dashboard / Users / Fund Requests / Withdrawals / Packages / KYC / Coin Packages / Banner), horizontally scrollable with icons

## Routes
`/login /register /forgot-password /setup-pin /dashboard /profile /shopping /recharge /wallet /add-fund /transactions /referrals /packages /withdrawals /admin`

## Admin Credentials
Mobile: 9999999999 · Password: Admin@123 · PIN: 1234

## Testing
- Iter-1: Backend 41/41 (100%)
- Iter-2: Backend 70/70 (100%) — 29 new admin tests

## Backlog
### P1
- Real payment gateway (Razorpay/Stripe) for Add Fund
- KYC document upload (Aadhaar/PAN images with preview)
### P2
- Push notifications / WebSocket realtime
- Referral-tree visualization
- Transaction CSV export
### P3
- Multi-language UI (Hindi/English)
- Dark/Light theme toggle
