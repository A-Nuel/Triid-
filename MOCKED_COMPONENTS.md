# Triid App Audit: Mocked Components & Placeholders

This document tracks all frontend components and UI elements that currently use placeholder data or are disconnected from the backend.

## Global / Shared
- **Messaging System (`src/pages/resident/ResidentMessaging.tsx`, `src/pages/artisan/ArtisanMessaging.tsx`)**: Fully mocked. Real-time chat via Supabase websockets is not yet implemented. Media uploads, voice notes, and database persistence need to be wired.
- **Notifications (`src/pages/resident/Notifications.tsx`, `src/pages/artisan/Notifications.tsx`)**: Empty dummy files. No real-time alerts or database persistence for push notifications.
- **Help Center**: Sidebar links are placeholders with no target page.

## Resident Flow
- **Dashboard Sidebar (`src/pages/ResidentDashboard.tsx`)**: Links like "Active Dispatches" and "Analytics" are inactive placeholders.
- **Settings > Payments (`src/pages/resident/SettingsPayments.tsx`)**: "Saved Cards" and "Mobile Money" (OPay/Paga) are completely mocked. The backend returns an empty array, and the UI displays static dummy cards.
- **Artisan Directory (`src/pages/resident/ArtisanDirectory.tsx`)**: PostGIS location querying isn't implemented on the frontend; distance is hardcoded to "1.2km".
- **Emergency Tracking (`src/pages/resident/EmergencyLiveTracking.tsx`)**: Map view and live ETA tracking is a static UI placeholder without real GPS web-socket integration.
- **Emergency Voice Notes (`src/pages/resident/EmergencyDescribeIssue.tsx`)**: The microphone button is a UI placeholder pending TTS/Voice integration.

## Artisan Flow
- **Settings > Verification (`src/pages/artisan/SettingsVerification.tsx`)**: The identity verification UI (NIN, ID upload) is a placeholder. Not connected to a backend verification service or admin queue.
- **Wallet (`src/pages/artisan/Wallet.tsx`)**: Wallet balances (Available/Pending), transaction history, and "Withdraw" actions are mocked. They do not interact with Paystack or the Escrow models.
- **Analytics / Reports (`src/pages/artisan/ArtisanReports.tsx`)**: All charts and metrics (earnings, profile views, job completion rate) use static dummy data.
- **Job History (`src/pages/artisan/JobHistory.tsx`)**: Uses static placeholder data for past completed jobs.
