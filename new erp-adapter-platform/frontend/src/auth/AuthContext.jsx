import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { iamAuthService, iamTokenStore } from '../services/api';

const AuthContext = createContext(null);

function readUser() {
  const stored = iamTokenStore.getUser();
  return stored;
}

function getDeviceFingerprint() {
  let fp = localStorage.getItem('iam_device_fingerprint');
  if (!fp) {
    fp = 'det-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('iam_device_fingerprint', fp);
  }
  return fp;
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
    if (data.user) {
      setUser(data.user);
      iamTokenStore.setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await iamAuthService.logout();
    } catch (err) {
      console.error(err);
    } finally {
      iamTokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, setUser, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout, setUser],
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
