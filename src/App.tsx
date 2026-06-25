/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Landing from '@/pages/Landing';
import { Splash } from '@/pages/Splash';
import { AuthPage } from '@/pages/AuthPage';
import { ConfirmEmail } from '@/pages/ConfirmEmail';
import { DemoRoleSelection } from '@/pages/DemoRoleSelection';
import { Onboarding } from '@/pages/onboarding/Onboarding';
import { RoleSelection } from '@/pages/onboarding/RoleSelection';
import { ResidentDashboard } from '@/pages/ResidentDashboard';
import { EmergencyRequest } from '@/pages/resident/EmergencyRequest';
import { ArtisanLayout } from '@/pages/artisan/ArtisanLayout';
import { JobFeed } from '@/pages/artisan/JobFeed';
import { EmergencyTakeover } from '@/pages/artisan/EmergencyTakeover';
import { RequestDetails } from '@/pages/artisan/RequestDetails';
import { EnRoute } from '@/pages/artisan/EnRoute';
import { InProgress } from '@/pages/artisan/InProgress';
import { WaitingConfirmation } from '@/pages/artisan/WaitingConfirmation';
import { Wallet } from '@/pages/artisan/Wallet';
import { ArtisanReports } from '@/pages/artisan/ArtisanReports';
import { JobHistory } from '@/pages/artisan/JobHistory';
import { SettingsHub } from '@/pages/artisan/SettingsHub';
import { SettingsProfile } from '@/pages/artisan/SettingsProfile';
import { SettingsVerification } from '@/pages/artisan/SettingsVerification';
import { SettingsAvailability } from '@/pages/artisan/SettingsAvailability';

import { ArtisanDirectory } from '@/pages/resident/ArtisanDirectory';
import { ArtisanProfile } from '@/pages/resident/ArtisanProfile';
import { ScheduledBooking } from '@/pages/resident/ScheduledBooking';
import { EmergencyCategorySelection } from '@/pages/resident/EmergencyCategorySelection';
import { EmergencyDescribeIssue } from '@/pages/resident/EmergencyDescribeIssue';
import { EmergencyMatching } from '@/pages/resident/EmergencyMatching';
import { EmergencySecurePayment } from '@/pages/resident/EmergencySecurePayment';
import { EmergencyLiveTracking } from '@/pages/resident/EmergencyLiveTracking';
import { ConfirmCompletion } from '@/pages/resident/ConfirmCompletion';
import { RateAndVouch } from '@/pages/resident/RateAndVouch';

// Protected Route Component
function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'resident' | 'artisan' }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/auth" replace />;
  
  // Later we can implement role checking here
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/demo/select-role" element={<DemoRoleSelection />} />
          
          <Route path="/onboarding/role" element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/skills" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          <Route path="/resident/dashboard" element={
            <ProtectedRoute>
              <ResidentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/resident/emergency" element={
            <ProtectedRoute>
              <EmergencyCategorySelection />
            </ProtectedRoute>
          } />
          <Route path="/resident/emergency/describe" element={
            <ProtectedRoute>
              <EmergencyDescribeIssue />
            </ProtectedRoute>
          } />
          <Route path="/resident/emergency/matching/:id" element={
            <ProtectedRoute>
              <EmergencyMatching />
            </ProtectedRoute>
          } />
          <Route path="/resident/emergency/payment/:id" element={
            <ProtectedRoute>
              <EmergencySecurePayment />
            </ProtectedRoute>
          } />
          <Route path="/resident/emergency/tracking/:id" element={
            <ProtectedRoute>
              <EmergencyLiveTracking />
            </ProtectedRoute>
          } />
          
          <Route path="/resident/jobs/:id/confirm" element={
            <ProtectedRoute>
              <ConfirmCompletion />
            </ProtectedRoute>
          } />
          
          <Route path="/resident/jobs/:id/rate" element={
            <ProtectedRoute>
              <RateAndVouch />
            </ProtectedRoute>
          } />

          <Route path="/resident/directory" element={
            <ProtectedRoute>
              <ArtisanDirectory />
            </ProtectedRoute>
          } />

          <Route path="/resident/artisan/:id" element={
            <ProtectedRoute>
              <ArtisanProfile />
            </ProtectedRoute>
          } />

          <Route path="/resident/book/:id" element={
            <ProtectedRoute>
              <ScheduledBooking />
            </ProtectedRoute>
          } />
          
          <Route path="/artisan" element={
            <ProtectedRoute role="artisan">
              <ArtisanLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<JobFeed />} />
            <Route path="requests" element={<JobHistory />} />
            <Route path="requests/:id" element={<RequestDetails />} />
            <Route path="en-route/:id" element={<EnRoute />} />
            <Route path="in-progress/:id" element={<InProgress />} />
            <Route path="waiting/:id" element={<WaitingConfirmation />} />
            <Route path="history" element={<JobHistory />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="reports" element={<ArtisanReports />} />
            <Route path="settings" element={<SettingsHub />} />
            <Route path="settings/profile" element={<SettingsProfile />} />
            <Route path="settings/verification" element={<SettingsVerification />} />
            <Route path="settings/availability" element={<SettingsAvailability />} />
          </Route>

          {/* Artisan Full Screen / Active Job Flows */}
          <Route path="/artisan/emergency/:id" element={<ProtectedRoute role="artisan"><EmergencyTakeover /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

