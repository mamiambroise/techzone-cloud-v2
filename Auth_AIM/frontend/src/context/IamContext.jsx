import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resolveContext as resolveContextApi } from '../api/context';

export const IamContext = createContext(null);

export function IamProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolve = useCallback(async (payload = {}) => {
    if (!accessToken) return null;
    try {
      const result = await resolveContextApi(payload);
      setContext(result.data || null);
      setError(null);
      return result.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setContext(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    resolve()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, resolve]);

  return (
    <IamContext.Provider
      value={{
        context,
        loading,
        error,
        resolveContext: resolve,
      }}
    >
      {children}
    </IamContext.Provider>
  );
}

export function useIamContext() {
  const ctx = useContext(IamContext);
  if (!ctx) {
    throw new Error('useIamContext doit etre utilise dans un IamProvider');
  }
  return ctx;
}

export default IamContext;
