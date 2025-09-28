
import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/store/auth';
import { UIProvider } from '@/store/ui';
import { ProtectedRoute } from './ProtectedRoute';
import { RoutePath } from './types';

// Import screens
import { LoginScreen, RegisterScreen } from '@/screens/auth';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { ToneListScreen } from '@/screens/tones/ToneListScreen';
import { ToneEditorPage } from '@/screens/tones/ToneEditorPage';
import {
  ProfileScreen,
  SecurityScreen,
  SettingsScreen,
  BillingScreen,
} from '@/screens/account';

export const AppRouter: React.FC = () => {
  return (
    <MemoryRouter>
      <UIProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path={RoutePath.Login} element={<LoginScreen />} />
            <Route path={RoutePath.Register} element={<RegisterScreen />} />

            {/* Protected routes */}
            <Route
              path={RoutePath.Dashboard}
              element={<ProtectedRoute path={RoutePath.Dashboard} element={<DashboardScreen />} />}
            />
            <Route
              path={RoutePath.Tones}
              element={<ProtectedRoute path={RoutePath.Tones} element={<ToneListScreen />} />}
            />
            <Route
              path={RoutePath.ToneEditor}
              element={<ProtectedRoute path={RoutePath.ToneEditor} element={<ToneEditorPage />} />}
            />
            <Route
              path={RoutePath.Account}
              element={<Navigate to={RoutePath.Profile} replace />}
            />
            <Route
              path={RoutePath.Profile}
              element={<ProtectedRoute path={RoutePath.Profile} element={<ProfileScreen />} />}
            />
            <Route
              path={RoutePath.Security}
              element={<ProtectedRoute path={RoutePath.Security} element={<SecurityScreen />} />}
            />
            <Route
              path={RoutePath.Settings}
              element={<ProtectedRoute path={RoutePath.Settings} element={<SettingsScreen />} />}
            />
            <Route
              path={RoutePath.Billing}
              element={<ProtectedRoute path={RoutePath.Billing} element={<BillingScreen />} />}
            />

            {/* Not found route */}
            <Route path='*' element={<div>Not Found</div>} />
          </Routes>
        </AuthProvider>
      </UIProvider>
    </MemoryRouter>
  );
};
