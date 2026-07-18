# Ganesh Puja Management System (GPMS)

GPMS is a modern, mobile-first web application designed for the Ganesh Puja Committee (2026) to manage donations, expenses, and digital receipts efficiently. It completely replaces physical receipt books with a fast, secure, and verifiable digital system.

## Architecture

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Authentication:** NextAuth (Auth.js) via Google OAuth
- **Backend / Database:** Google Apps Script + Google Sheets + Google Drive
- **Hosting:** Vercel

## Key Features

- **Role-Based Access Control:** SuperAdmin, Admin, Volunteer, and Viewer roles.
- **Donation Tracking:** Record cash and UPI donations instantly.
- **Expense Tracking:** Record committee expenses with direct Google Drive bill uploads.
- **PDF Generation & QR Codes:** Generate official, shareable PDF receipts with verifiable QR codes.
- **Idempotency & Concurrency:** Advanced lock-based Google Apps Script backend prevents duplicate entries even on slow mobile networks.
- **WhatsApp Integration:** 1-click sharing of receipts via WhatsApp or Native Web Share.

## Environments

- **Production URL:** The application is hosted live on Vercel.
- **Google Sheets:** Acts as the single source of truth for all structured data (Donations, Expenses, Users, Logs).

## Technical Documentation

Refer to the `docs/` folder for system documentation:
- `DATABASE.md`: Schema, indexes, and required Sheet protections.
- `TESTING.md`: Manual production acceptance checklist.
- `LAUNCH_V1.md`: Official V1 Production Launch Sign-off.

---
*Built for the 2026 Ganesh Puja Committee.*
