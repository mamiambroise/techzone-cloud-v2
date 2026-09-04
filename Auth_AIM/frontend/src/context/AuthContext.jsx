import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getSession as getSessionApi, refreshToken as refreshTokenApi } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSession(null);
    setIsAuthenticated(false);
    setMfaRequired(false);
    setChallengeToken(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = await getSessionApi();
        if (sessionData) {
          setUser(sessionData.user);
          setAccessToken(sessionData.accessToken);
          setRefreshToken(sessionData.refreshToken);
          setSession(sessionData.session);
          setIsAuthenticated(true);
          setMfaRequired(sessionData.mfaRequired || false);
          setChallengeToken(sessionData.challengeToken || null);
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [clearAuth]);

  const login = async (identifier, password) => {
    const sessionData = await loginApi(identifier, password);
    setUser(sessionData.user);
    setAccessToken(sessionData.accessToken);
    setRefreshToken(sessionData.refreshToken);
    setSession(sessionData.session);
    setIsAuthenticated(true);
    setMfaRequired(sessionData.mfaRequired || false);
    setChallengeToken(sessionData.challengeToken || null);
    return sessionData;
  };

  const refresh = useCallback(async () => {
    try {
      const sessionData = await refreshTokenApi();
      setAccessToken(sessionData.accessToken);
      setRefreshToken(sessionData.refreshToken);
      setSession(sessionData.session);
      return sessionData;
    } catch {
      clearAuth();
      throw new Error('Session expirée');
    }
  }, [clearAuth]);

  const logout = async () => {
    await logoutApi();
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        session,
        isAuthenticated,
        loading,
        mfaRequired,
        challengeToken,
        setMfaRequired,
        setChallengeToken,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider');
  }
  return context;
}

export default AuthContext;
