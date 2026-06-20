# Triid - Implementation Plan

## 1. Product Overview
Triid is a dual-mode artisan verification and smart-procurement platform designed for gated mega-communities (piloting in Redemption City, Nigeria).
- **Emergency Dispatch:** AI-triaged distress pings matched to nearby, vetted artisans in under 30 minutes.
- **Browse & Book:** General services marketplace for scheduling planned work.

**Core Mechanics:** 
- Trust via community-vouching ledger.
- Zero surge-pricing (fair price suggestions via AI).
- Payments held in automated escrow, released upon confirmation.
- Offline-resilient PWA UI.

## 2. Tech Stack & Environment
- **Frontend:** React + TypeScript + Tailwind CSS + PWA (Service Worker for shell caching).
- **Backend:** NestJS-style Modular Monolith (Node.js/TypeScript) built within the containerized full-stack environment.
- **Database & Auth:** Supabase (Auth via JWT, Postgres, PostGIS for location, Row-Level Security, Storage).
- **Caching/Rate Limiting:** Upstash Redis.
- **Payments:** Paystack API (wallet, split payments).
- **AI Triage:** Server-side LLM via Google AI/Anthropic for dispatch, categorization, and fair pricing.

## 3. Architecture: Modular Monolith
The backend will be structured into distinct, decoupled modules to allow future microservice extraction:
- `AuthModule`: Supabase JWT, API Key guards.
- `UsersModule` & `CommunitiesModule`: Residents, Roles, Tenants.
- `ArtisansModule`: Profiles, skills, availability calendar, and public directory search.
- `JobsModule`: Job lifecycle for both modes (`emergency` and `scheduled`).
- `MatchingModule`: Proximity and trust scoring.
- `EscrowModule`: Paystack ledger, wallet management.
- `AiModule`: Triage classification.
- `VouchingModule`, `ReviewsModule`, `NotificationsModule`, `AdminModule`.

## 4. Critical Build Directives (Non-Negotiable)
1. **Atomic Escrow States:** All wallet and escrow ledger changes MUST happen within a single Postgres transaction.
2. **Row-Level Wallet Locks:** Use `FOR UPDATE` in SQL to lock rows; never use direct `SET` calculations to avoid concurrent write failures.
3. **Idempotency:** Implement `Idempotency-Key` headers backed by Upstash Redis for all critical endpoints (`POST /jobs`, acceptance, payments).
4. **Compare-and-Set Job Assignment:** Prevent race conditions in job acceptance by using atomic SQL updates (`UPDATE jobs SET artisan_id = $1 WHERE artisan_id IS NULL`).
5. **Paystack Webhook Verification:** Ensure a `RawBodyMiddleware` captures the raw byte stream BEFORE standard JSON parsing middleware runs to allow accurate HMAC signature verification.
6. **JWT-Based Rate Limiting:** Rate limiting must be keyed off the authenticated `User ID` within the JWT, NOT the IP address.
7. **Supabase Client Scoping:** `service_role` key is strictly for `AdminModule` and background workers. All other operations MUST use the JWT-scoped client to enforce RLS.

## 5. Development Phasing

### Phase 0: Hackathon Demo (Must Work)
- [x] Database Schema Setup & Supabase connection.
- [x] Authentication (Google OAuth + Email fallback).
- [x] Core Job Lifecycles (Emergency Ping -> AI Triage -> Match -> Accept -> Escrow Hold -> Confirm -> Release).
- [x] Browse & Book core path (Directory Search -> Profile View -> Scheduled Booking).
- [x] Escrow/Wallet backend scaffolding (Test-mode Paystack).
- [x] Vouching & Ratings.
- [x] Initial PWA Shell Support.

### Phase 1: Robust Features
- [ ] Artisan Availability Calendar (Time-slot picking).
- [ ] AI Fair-price suggestions.
- [ ] Vouch-graph fraud detection.
- [ ] Advance withdrawal capabilities based on trust tiers.
- [ ] Subscriptions/Pro Tier.

### Phase 2: Scale
- [ ] Native Mobile App shell linking to the core APIs.
- [ ] SMS Gateway Fallback.
- [ ] Demand prediction.

### Phase 3: "LocalConnect" Ecosystem Integration (Future)
- [ ] **Hybrid Trust Model**: Combine Triid's P2P community vouching graph with LocalConnect's dedicated admin "Verified" shield credentialing.
- [ ] **Community Crowdsourcing**: Allow residents to submit unlisted local service providers to the directory to earn contribution points (XP) and rewards. 
- [ ] **City-Wide Discovery Expansion**: Broaden the geographical matching logic to support wider city-level directory browsing beyond highly gated mega-communities.
- [ ] **Consolidated Booking Management**: Merge LocalConnect's scheduling interface with Triid's escrow/payment backbone.

## 6. Next Steps
1. **Awaiting UI Designs:** Evaluate incoming UI/UX specifications.
2. **Setup Initialization:** Configure `tsconfig.json` and build scripts for `reflect-metadata` support required by NestJS (or structurally adapt an Express-based modular controller system). 
3. **Database Scaffolding:** Draft initial `schema.ts`/SQL migrations for Supabase.
