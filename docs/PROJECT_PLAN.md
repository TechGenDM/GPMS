# GPMS Project Plan

This document outlines the roadmap and version scope for the Ganesh Puja Management System.

## Version Scope

### GPMS v1.0 (Must Ship)

The absolute minimum required to successfully run this year's Ganesh Puja.

- Login
- Dashboard (Totals & Recent Activity)
- Donation Management (Create, Search, Cancel)
- Expense Management (Create, Search, Cancel)
- Receipt PDF Generation
- WhatsApp Share integration
- Public Dashboard
- Users Management
- Audit Logging
- Basic Reports

### GPMS v1.1 (Nice to Have)

Features that are useful but not strictly necessary for launch. Deferred until v1.0 is stable in production.

- QR donation support
- Offline mode
- SMS receipts
- Analytics charts
- Email receipts
- Dark mode
- Multi-language support
- Push notifications

---

## Engineering Sprints

We track progress using Sprints to focus on delivering complete, usable vertical slices of functionality.

### Sprint 1: Backend (✅ Done)

- Google Sheets Database Schema
- Apps Script Backend Architecture
- Core Services (Users, Donations, Expenses, Dashboard, Audit, Settings)
- Acceptance & Stress Testing
- Tag: `v1.0.0-backend`

### Sprint 2: Frontend Foundation (Current)

- Next.js Project Setup & Configuration
- Tailwind CSS theming (Mobile-first, Typography rules)
- Core UI Components (Card, Feedback, ConfirmModal, CurrencyDisplay)
- Central API fetch wrapper (`lib/api.ts`)
- Documentation finalization

### Sprint 3: Authentication

- Login UI
- Auth Context & State Management
- Route protection (Middleware or Higher-Order Components)
- Connecting frontend to `UserService.authenticate`

### Sprint 4: Donation UI

- Donation Form (Optimized for max 3 taps)
- Receipt Generation & WhatsApp Share implementation
- Volunteer flow validation

### Sprint 5: Expense UI

- Expense Form
- Dynamic category loading
- Validation and submission

### Sprint 6: Dashboard & Search

- Main Dashboard UI (Totals, Recent Activity)
- Search Interface (Donations & Expenses)
- Public Dashboard View

### Sprint 7: Admin & Reports (✅ Done)

- User Management UI (Admins only)
- Settings UI
- Cancellation flows & Audit viewing
- Export/Report generation

### Sprint 8: Production

- Final End-to-End Testing
- Vercel Deployment configuration
- Production Database switch
- Volunteer Training & Handoff
