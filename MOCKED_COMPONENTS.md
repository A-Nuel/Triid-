# Triid App Audit: Mocked Components & Placeholders

This document tracks all frontend components and UI elements that currently use placeholder data or are disconnected from the backend.

## Global / Shared
- **Messaging System (`src/pages/artisan/ArtisanMessaging.tsx`)**: Resident messaging is NOW wired to real-time Supabase WebSockets! Artisan messaging needs to be updated to match. Media uploads and voice notes still need persistence logic.
- **Notifications (`src/pages/resident/Notifications.tsx`, `src/pages/artisan/Notifications.tsx`)**: The backend now supports `web-push` and subscription storage! Frontend UI needs to be built to trigger the subscription prompt and display alerts.
- **Help Center**: Sidebar links are placeholders with no target page.

## Resident Flow
- **Settings > Payments (`src/pages/resident/SettingsPayments.tsx`)**: "Saved Cards" and "Mobile Money" (OPay/Paga) are completely mocked. The backend returns an empty array, and the UI displays static dummy cards.
- **Artisan Directory (`src/pages/resident/ArtisanDirectory.tsx`)**: PostGIS location querying isn't fully implemented on the frontend.
- **Emergency Tracking (`src/pages/resident/EmergencyLiveTracking.tsx`)**: Map view and live ETA tracking is a static UI placeholder without real GPS web-socket integration.
- **Emergency Voice Notes (`src/pages/resident/EmergencyDescribeIssue.tsx`)**: The microphone button is a UI placeholder pending TTS/Voice integration.

## Artisan Flow
- **Settings > Verification (`src/pages/artisan/SettingsVerification.tsx`)**: The identity verification UI (NIN, ID upload) is a placeholder. Not connected to a backend verification service or admin queue.
- **Wallet (`src/pages/artisan/Wallet.tsx`)**: Wallet balances (Available/Pending), transaction history, and "Withdraw" actions are mocked. They do not interact with Paystack or the Escrow models.
- **Analytics / Reports (`src/pages/artisan/ArtisanReports.tsx`)**: The backend API endpoint (`/api/v1/artisan/reports`) is now BUILT and returns real earnings and metrics! Frontend just needs to fetch and display this data instead of dummy data.
- **Job History (`src/pages/artisan/JobHistory.tsx`)**: Uses static placeholder data for past completed jobs.
