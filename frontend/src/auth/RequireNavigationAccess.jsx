import React from 'react';
import { useLocation } from 'react-router-dom';
import { resolveRoute } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth } from './AuthProvider.jsx';
import ForbiddenPage from './ForbiddenPage.jsx';

// Masquer un menu ne suffit jamais : ce garde rend un 403 explicite pour toute
// URL directe d'une page dont l'utilisateur ne possède pas la permission.
export default function RequireNavigationAccess({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const metadata = resolveRoute(pathname);
  if (metadata && !canAccess(metadata, user)) return <ForbiddenPage />;
  return children;
}