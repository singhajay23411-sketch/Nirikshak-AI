import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'nirikshak_auth';
const API_BASE = 'http://localhost:8000/api';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  hasPermission: () => false,
  isScopeAllowed: () => false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
    }
  }, []);

  const persistSession = useCallback((tokenVal, userVal) => {
    try {
      if (tokenVal && userVal) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: tokenVal, user: userVal }));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not persist auth session:', e);
    }
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.detail || 'Authentication failed';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      setToken(data.token);
      setUser(data.user);
      persistSession(data.token, data.user);
      setIsLoading(false);
      return { success: true, user: data.user };

    } catch (e) {
      const errMsg = 'Unable to connect to server. Please try again.';
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    // Fire-and-forget server logout
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    setUser(null);
    setToken(null);
    setError(null);
    persistSession(null, null);
  }, [token, persistSession]);

  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.some(p => {
      if (p === permission) return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      return false;
    });
  }, [user]);

  const isScopeAllowed = useCallback((targetState, targetDistrict) => {
    if (!user || !user.scope) return false;
    const scopeType = user.scope.type;

    if (scopeType === 'NATIONAL') return true;
    if (scopeType === 'STATE') {
      if (!targetState) return true;
      return (user.state || '').toLowerCase() === targetState.toLowerCase();
    }
    if (scopeType === 'DISTRICT') {
      let stateOk = true;
      let districtOk = true;
      if (targetState && user.state) {
        stateOk = user.state.toLowerCase() === targetState.toLowerCase();
      }
      if (targetDistrict && user.district) {
        districtOk = user.district.toLowerCase() === targetDistrict.toLowerCase();
      }
      return stateOk && districtOk;
    }
    return true;
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    isScopeAllowed,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
