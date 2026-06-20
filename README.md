# Triid

**Triid is an artisan verification and smart-procurement platform for gated mega-communities.**

Designed initially for Redemption City, Nigeria, Triid solves the problem of finding vetted, reliable artisans during emergencies or high-congestion events when utilities or vehicles fail, and it also serves as a general services marketplace for scheduled jobs.

## Two Products on One Trust and Escrow Backbone

1. **Emergency Dispatch**
   - Handles the urgent cases where a resident logs a distress ping.
   - AI triages the request, matches the resident to community-vouched artisans based on proximity, trust tier, and current job load.
   - Pings nearby artisans in real-time to find help in under 30 minutes.

2. **Browse & Book**
   - The general services marketplace for planned work (cleaning, painting, AC servicing, tailoring, etc.).
   - Residents can search artisans by category, view public profiles (portfolio, reviews, pricing), and schedule work for a future date and time without routing through the emergency triage.

Both modes share the same artisan pool, trust/vouching system, and automated escrow payment flow.

## Key Features

- **PWA / Offline Resilience**: Built as an offline-resilient PWA so that it remains usable with a cached shell even when the network is heavily degraded.
- **Fair Pricing via Escrow**: No surge pricing anomalies. Payment is held in an automated escrow at booking and only released to the artisan's wallet upon confirmed completion, minus platform commission.
- **Vouching & Trust Tiers**: A social vouching ledger replaces heavy KYC paperwork. Artisans level up their Trust Tier by completing jobs successfully, receiving positive ratings, and being vouched for by residents and other trusted artisans.
- **AI Matching & Triage**: Uses Anthropic/Google LLMs to classify distress pings contextually. 

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons.
- **Backend**: Express modular application handling API routes and backend validations.
- **Database**: Supabase (Postgres with PostGIS, Row Level Security, Auth).
- **Payments**: Ready for Paystack Escrow.

## Getting Started

### Local Development

1. Run `npm install` to install dependencies.
2. Initialize your `.env` file from `.env.example` to supply your Supabase and AI project keys (see Environment Variables section).
3. Start the dev server using `npm run dev` (this handles both the backend express endpoints + Vite frontend proxying).
4. For building for production, run `npm run build`.

### Testing Authentication

Triid's authentication supports both standard Email/Password combinations as well as Google OAuth. 

**Can I sign up now?**
Yes! Assuming you have added your valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Environment Settings (using the gear icon inside AI Studio, or via `.env`), you can register as a Resident or Artisan.
- Simply navigate to the signup screen and enter an email and password to begin the flow. This interacts directly with your Supabase connected project.
- *Note:* Google Sign-in requires you to configure the OAuth credentials within your Supabase authentication console settings.

## Database & Structure

Triid relies heavily on PostgreSQL features via Supabase. Schema definitions and trigger functions handle `updated_at` time tracking and geographical queries using PostGIS.

To setup the necessary database state, apply the provided SQL scripts using the Supabase SQL Editor. 

## Core Architecture Design Principles

- **Security via RLS**: Row-Level Security ensures a resident or artisan can only access their specific jobs, payments, and data scopes.
- **Idempotency**: Essential endpoints implement idempotency to endure network retries safely.
- **Atomic Operations**: Job state changes along with equivalent ledger/wallet balances execute within single Postgres transactions to avoid desyncs.
