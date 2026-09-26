import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { iamAuthService, getDeviceFingerprint } from '../services/authService.js';
import { useDispatch } from 'react-redux';
import { setActiveUser, setApiStatus } from '../store/platformSlice.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const clearAuth = useCallback(() => {
    setUser(null);
    dispatch(setActiveUser(null));
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      try {
        let res;
        try {
          res = await iamAuthService.me();
        } catch (error) {
          if (error.response?.status !== 401) throw error;
          await iamAuthService.refresh();
          res = await iamAuthService.me();
        }
        const me = res?.data?.data || res?.data;
        if (active && me) {
          setUser(me);
          dispatch(setActiveUser(me));
        } else if (active) {
          await iamAuthService.refresh();
          const res2 = await iamAuthService.me();
          const me2 = res2?.data?.data || res2?.data;
          if (active && me2) {
            setUser(me2);
            dispatch(setActiveUser(me2));
          }
        }
      } catch {
        if (active) {
          clearAuth();
          dispatch(setApiStatus('DISCONNECTED'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    boot();

    const handleUnauthorized = () => clearAuth();
    window.addEventListener('iam:unauthorized', handleUnauthorized);

    return () => {
      active = false;
      window.removeEventListener('iam:unauthorized', handleUnauthorized);
    };
  }, [clearAuth, dispatch]);

  const login = useCallback(
    async (identifier, password) => {
      const deviceFingerprint = await getDeviceFingerprint();
      const res = await iamAuthService.login({
        identifier,
        password,
        deviceFingerprint,
        deviceName: 'Techzone Cloud Console',
        deviceType: 'browser',
      });
      const data = res?.data?.data || res?.data;
      if (data?.user) {
        setUser(data.user);
        dispatch(setActiveUser(data.user));
      }
      return data;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await iamAuthService.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      clearAuth,
    }),
    [user, loading, login, logout, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
