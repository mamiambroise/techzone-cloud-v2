import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, getSession } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await getSession();
        if (session) {
          setUser(session.user);
          setToken(session.token);
          setIsAuthenticated(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (username, password) => {
    const result = await loginApi(username, password);
    setUser(result.user);
    setToken(result.token);
    setIsAuthenticated(true);
    return result;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
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
