
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/hooks/useAuth';
import { RoutePath, type ProtectedRouteProps } from './types';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const { authState } = useAuth();

  if (authState.loading) {
    // You can replace this with a loading spinner component
    return <div>Loading...</div>;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to={RoutePath.Login} replace />;
  }

  return element;
};
