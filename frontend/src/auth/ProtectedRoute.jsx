import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { resolveRoute } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth, AuthLoadingBoundary } from '../auth/AuthProvider.jsx';

export function ModernSpinner({ label = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-slate-600">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

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

  const metadata = resolveRoute(location.pathname);
  if (metadata && !canAccess(metadata, user)) return <ForbiddenPage />;
  return children ?? <Outlet />;
}

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès interdit</h1>
        <p className="text-slate-600">Vous n'avez pas les droits nécessaires.</p>
      </div>
    </div>
  );
}
