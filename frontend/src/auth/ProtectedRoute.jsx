import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AuthLoadingBoundary } from '../auth/AuthProvider.jsx';

export function ModernSpinner({ label = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-slate-600">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// Garde d'authentification uniquement. Le contrôle d'accès IAM est appliqué par
// RequireNavigationAccess, à l'intérieur du layout, afin que le 403 conserve
// la navigation et permette de changer de module ou de se déconnecter.
export default function ProtectedRoute({ children }) {
  const { user, loading, authState } = useAuth();
  const location = useLocation();

  if (loading || ['DATABASE_UNAVAILABLE', 'ERROR'].includes(authState)) {
    return (
      <AuthLoadingBoundary>
        <div />
      </AuthLoadingBoundary>
    );
  }

  if (authState === 'UNAUTHENTICATED' || authState === 'ERROR') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
