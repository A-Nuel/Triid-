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
import { Onboarding } from '@/pages/onboarding/Onboarding';
import { RoleSelection } from '@/pages/onboarding/RoleSelection';
import { ResidentDashboard } from '@/pages/ResidentDashboard';
import { EmergencyRequest } from '@/pages/resident/EmergencyRequest';
import { ArtisanDashboard } from '@/pages/ArtisanDashboard';

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
              <EmergencyRequest />
            </ProtectedRoute>
          } />
          
          <Route path="/artisan/dashboard" element={
            <ProtectedRoute>
              <ArtisanDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

