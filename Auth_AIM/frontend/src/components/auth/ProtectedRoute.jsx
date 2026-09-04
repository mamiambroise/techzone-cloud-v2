import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, session } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const expiresAt = session?.expiresAt;
    if (!expiresAt) return undefined;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return undefined;
    const id = setTimeout(() => setTick((t) => t + 1), remaining + 50);
    return () => clearTimeout(id);
  }, [isAuthenticated, session?.expiresAt, tick]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const expired = session?.expiresAt && Date.now() > session.expiresAt;
  if (expired) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
