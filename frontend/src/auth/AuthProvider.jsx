import React, { createContext, useContext, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { iamAuthService, getDeviceFingerprint } from '../services/authService.js';
import { useDispatch } from 'react-redux';
import { setActiveUser, setApiStatus, setActiveTenant } from '../store/platformSlice.js';
export const AuthContext = createContext(null);
export const AUTH_STATES = { BOOTING:'BOOTING', AUTHENTICATED:'AUTHENTICATED', UNAUTHENTICATED:'UNAUTHENTICATED', DATABASE_UNAVAILABLE:'DATABASE_UNAVAILABLE', ERROR:'ERROR' };
let bootstrapPromise;
function loadSession() {
  // Coalesce StrictMode bootstrap. apiClient owns the only refresh/retry mechanism.
  if (!bootstrapPromise) bootstrapPromise = iamAuthService.me().finally(() => { bootstrapPromise = null; });
  return bootstrapPromise;
}
const unwrap = response => response?.data?.data ?? response?.data;
export function AuthProvider({ children }) {
  const wasAuthenticated = useRef(false);
  const [sessionExpired,setSessionExpired] = useState(false);
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(AUTH_STATES.BOOTING);
  const dispatch = useDispatch();
  const clearAuth = useCallback((event) => {
    if (event?.type && wasAuthenticated.current) setSessionExpired(true);
    wasAuthenticated.current = false;
    setUser(null); setAuthState(AUTH_STATES.UNAUTHENTICATED);
    dispatch(setActiveUser(null)); dispatch(setActiveTenant(null)); dispatch(setApiStatus('DISCONNECTED'));
  }, [dispatch]);
  const setAuthenticated = useCallback(data => {
    const profile = data?.user ?? data;
    if (!profile?.id) { clearAuth(); return; }
    wasAuthenticated.current = true; setSessionExpired(false);
    setUser(profile); setAuthState(AUTH_STATES.AUTHENTICATED);
    dispatch(setActiveUser(profile)); dispatch(setActiveTenant(data?.activeTenant ?? null)); dispatch(setApiStatus('CONNECTED'));
  }, [dispatch, clearAuth]);
  useEffect(() => {
    let active = true;
    loadSession().then(response => { if (active) setAuthenticated(unwrap(response)); }).catch(error => {
      if (!active) return;
      if (error.response?.status === 401) clearAuth();
      else {
        setUser(null);
        setAuthState(error.normalized?.code === 'DATABASE_UNAVAILABLE' ? AUTH_STATES.DATABASE_UNAVAILABLE : AUTH_STATES.ERROR);
        dispatch(setApiStatus('DISCONNECTED'));
      }
    });
    window.addEventListener('iam:unauthorized', clearAuth);
    window.addEventListener('iam:session-expired', clearAuth);
    return () => { active = false; window.removeEventListener('iam:unauthorized', clearAuth); window.removeEventListener('iam:session-expired', clearAuth); };
  }, [clearAuth, setAuthenticated, dispatch]);
  const login = useCallback(async (identifier, password) => {
    const data = unwrap(await iamAuthService.login({identifier,password,deviceFingerprint:await getDeviceFingerprint(),deviceName:'Techzone Cloud Console',deviceType:'browser'}));
    if (data?.mfaRequired) return data;
    setAuthenticated(unwrap(await iamAuthService.me()));
    return data;
  }, [setAuthenticated]);
  const logout = useCallback(async () => { try { await iamAuthService.logout(); } finally { clearAuth(); } }, [clearAuth]);
  const refreshPrincipal = useCallback(async () => { setAuthenticated(unwrap(await iamAuthService.me())); }, [setAuthenticated]);
  const value = useMemo(() => ({user,authState,sessionExpired,refreshPrincipal,loading:authState===AUTH_STATES.BOOTING,isAuthenticated:authState===AUTH_STATES.AUTHENTICATED,apiStatus:authState===AUTH_STATES.AUTHENTICATED?'CONNECTED':'DISCONNECTED',login,logout,clearAuth,refreshAccessToken:iamAuthService.refresh}), [user,authState,sessionExpired,refreshPrincipal,login,logout,clearAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function AuthLoadingBoundary({ children }) {
  const { authState } = useAuth();
  if (authState === AUTH_STATES.BOOTING) return <div role="status" className="min-h-screen flex items-center justify-center">Vérification de la session…</div>;
  if ([AUTH_STATES.DATABASE_UNAVAILABLE, AUTH_STATES.ERROR].includes(authState)) return <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-3"><h1>Service momentanément indisponible</h1><p>Impossible de vérifier la session.</p><button onClick={() => window.location.reload()}>Réessayer</button></div>;
  return children;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
