import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { iamAuthService, iamTokenStore } from '../services/api';

const AuthContext = createContext(null);

function readUser() {
  const stored = iamTokenStore.getUser();
  if (stored) return stored;
  // Compat: utilisateur Dolibarr cache precedemment
  try {
    const cached = localStorage.getItem('erp_current_user_v2');
    if (cached) {
      const c = JSON.parse(cached);
      if (c) {
        return {
          id: c.id,
          username: c.login || c.username,
          primaryEmail: c.email,
          firstName: c.firstname,
          lastName: c.name,
          status: c.active ? 'ACTIVE' : 'PENDING',
        };
      }
    }
  } catch {}
  return null;
}

function getDeviceFingerprint() {
  let fp = localStorage.getItem('iam_device_fingerprint');
  if (!fp) {
    fp = 'det-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('iam_device_fingerprint', fp);
  }
  return fp;
}

// Lit le token transmis par le Business Manager via l'iframe (?iam_token=...)
export function importEmbedAuth() {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('iam_token');
  if (!urlToken) return false;
  const urlRefresh = params.get('iam_refresh');
  const urlUser = params.get('iam_user');
  iamTokenStore.setTokens(urlToken, urlRefresh);
  if (urlUser) {
    try {
      iamTokenStore.setUser(JSON.parse(urlUser));
    } catch {
      /* ignore */
    }
  }
  return true;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readUser());
  const [loading, setLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    iamTokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      // 1. Token passe par l'embed Business Manager (?iam_token&iam_user&iam_refresh)
      const imported = importEmbedAuth();
      if (imported) {
        const importedUser = iamTokenStore.getUser();
        if (active) {
          setUser(importedUser || { username: 'Utilisateur', primaryEmail: '' });
          setLoading(false);
        }
        return;
      }

      if (!iamTokenStore.access()) {
        if (active) setLoading(false);
        return;
      }
      try {
        const res = await iamAuthService.me();
        const me = res?.data?.data?.user;
        if (active && me) {
          setUser(me);
          iamTokenStore.setUser(me);
        }
      } catch (err) {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    boot();
    window.addEventListener('iam:unauthorized', handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('iam:unauthorized', handleUnauthorized);
    };
  }, [handleUnauthorized]);

  const login = useCallback(async (identifier, password) => {
    const res = await iamAuthService.login({
      identifier,
      password,
      deviceFingerprint: getDeviceFingerprint(),
      deviceName: 'ERP Adapter Web',
      deviceType: 'browser',
    });
    const data = res?.data?.data;
    if (!data?.accessToken) {
      throw new Error(data?.message || 'Réponse de connexion invalide');
    }
    iamTokenStore.setTokens(data.accessToken, data.refreshToken);
    if (data.user) {
      setUser(data.user);
      iamTokenStore.setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (iamTokenStore.access()) {
        await iamAuthService.logout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      iamTokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUser, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}