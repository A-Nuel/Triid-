# Triid - Project Plan & Documentation

## 1. Current Progress (Completed)

### Database & Schema Setup (Supabase)
- [x] Initial SQL schema created (`schema.sql`) supporting multi-tenancy (via `community_id`) and core tables (`users`, `artisan_profiles`, `jobs`, `escrow_transactions`, `wallets`, `vouches`, etc.).
- [x] Row-Level Security (RLS) policies defined (`rls_policies.sql`) to enforce access control based on user IDs and roles.

### Backend Infrastructure (Node.js/Express)
- [x] Full-stack architecture initialized (`server.ts`).
- [x] Service-to-service auth initialized via JWT (`createAuthClient`), strictly adhering to the V1 PRD policy bypassing service role keys for standard operations.
- [x] AI integration service (`ai.service.ts`) using Anthropic Claude to classify emergency job descriptions and urgency levels.
- [x] Zod data validation implemented for `POST /api/v1/jobs`.
- [x] Upstash Redis integrated for rate-limiting (keyed per authenticated `user.id` rather than IP).
- [x] Header-based idempotency integrated via Upstash Redis (`Idempotency-Key` requirement for `POST /api/v1/jobs`).

### DevOps & Deployment
- [x] Vercel `vercel.json` configured to host the static React frontend and proxy all `/api/*` requests to the Render backend (`https://triid.onrender.com`).
- [x] Environment variable manifest (`.env.example`) mapped out for both platforms.

---

## 2. Immediate Next Steps (P0 / Hackathon Demo Scope)

### Backend (Express / Render)
- [ ] **Escrow Transactions (PRD 16.1):** Implement atomic Postgres transactions for job status changes and wallet balances. *Must use `FOR UPDATE` row-level locks on wallets to prevent race conditions.*
- [ ] **Job Actions API:** Create endpoints for `accept`, `reject`, `confirm`, and `status` updates.
- [ ] **Paystack Integration (PRD 16.4):** Implement `POST /api/v1/payments/webhook` utilizing **raw body processing** for HMAC signature verification. 
- [ ] **Browse & Book APIs:** Implement `GET /api/v1/artisans/search` (search/filter), `POST /api/v1/bookings` (scheduled jobs bypassing AI module).
- [ ] **Matching Logic:** Swap the dummy 3-second timeout with an actual PostgreSQL query to find and assign the nearest artisan based on rules.

### Frontend (React / Vercel)
- [ ] **Authentication Flow:** Supabase Auth UI (Login/Signup via Google/Email).
- [ ] **Resident UI - Emergency Mode:** Distress Ping screen with text/voice classification.
- [ ] **Resident UI - Browse & Book:** Artisan directory, filtering, public profile view, and a scheduled booking calendar.
- [ ] **Artisan UI:** Job acceptance view, active job tracker, payout wallet dashboard.
- [ ] **PWA Configuration:** Manifest file, caching strategies using Service Workers, and an offline fallback UI.

---

## 3. Backlog (P1 / P2 Features)

### Platform Enhancements (P1)
- [ ] **Trust Tier Gates:** Artisan advance withdrawal percentage based on trust limits (0%, 30%, 50%).
- [ ] **AI Price Suggestions:** Anti-surge fair-price corridor generation.
- [ ] **Vouching Module:** Resident-to-Artisan and Artisan-to-Artisan vouch graphs + fraud detection algorithm.
- [ ] **Dispute Resolution:** Escrow freeze logic with Admin dashboard manual overrides.
- [ ] **Web Push Notifications:** Realtime job updates.

### Future (P2)
- [ ] Predictive demand maps for community security administrators.
- [ ] Multi-city onboarding logic beyond Redemption City.
- [ ] Native mobile build utilizing the exact same REST architecture.

---

## 4. Critical Architecture Reminders
*These rules are non-negotiable based on the PRD:*

1. **Atomic Escrow:** Escrow state changes MUST commit in a single PostgreSQL transaction (job status + transaction record + wallet balance update).
2. **Wallet Locks:** Wallet balances must NEVER be updated with direct `SET`. Always lock the row before updating: `SELECT ... FOR UPDATE`.
3. **Idempotency:** Core endpoints (job creation, payment initiate, withdrawal) must be protected by Redis `Idempotency-Key` to prevent double-charges on bad networks.
4. **Rate Limiting:** Must be per-user (`rate_limit:{user.id}`), not IP-based, due to local NAT configurations at major events.
5. **Paystack Webhook:** The handler must run *before* JSON parsing to verify the HMAC signature on the raw request body. Use V1's `RawBodyMiddleware`.
6. **RLS Override:** Do NOT use the Supabase Service Role Key for standard queries. All standard module queries must be instantiated via `createAuthClient(req)` utilizing the standard user JWT.
