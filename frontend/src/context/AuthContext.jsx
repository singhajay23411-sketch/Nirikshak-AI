import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const AUTH_STORAGE_KEY = 'nirikshak_auth';
const API_BASE = '/api';

// Canonical role names
export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  MOSPI_NATIONAL_OFFICER: 'MOSPI_NATIONAL_OFFICER',
  STATE_NODAL_OFFICER: 'STATE_NODAL_OFFICER',
  DISTRICT_AUTHORITY: 'DISTRICT_AUTHORITY',
  MEMBER_OF_PARLIAMENT: 'MEMBER_OF_PARLIAMENT',
  FIELD_INSPECTOR: 'FIELD_INSPECTOR',
  AI_RISK_ANALYST: 'AI_RISK_ANALYST',
  PUBLIC_VIEWER: 'PUBLIC_VIEWER',
};

// Legacy → canonical mapping
const LEGACY_ROLE_MAP = {
  ADMIN: ROLES.SYSTEM_ADMIN,
  MOSPI_OFFICER: ROLES.MOSPI_NATIONAL_OFFICER,
  STATE_OFFICER: ROLES.STATE_NODAL_OFFICER,
  DISTRICT_OFFICER: ROLES.DISTRICT_AUTHORITY,
  MP: ROLES.MEMBER_OF_PARLIAMENT,
  FIELD_INSPECTOR: ROLES.FIELD_INSPECTOR,
  ANALYST: ROLES.AI_RISK_ANALYST,
  VIEWER: ROLES.PUBLIC_VIEWER,
};

export function resolveRole(role) {
  if (Object.values(ROLES).includes(role)) return role;
  return LEGACY_ROLE_MAP[role] || role;
}

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => ({ success: false }),
  logout: () => {},
  hasPermission: () => false,
  isScopeAllowed: () => false,
  isRole: () => false,
  authFetch: async () => null,
});

export const AuthProvider = ({ children }) => {
  // Synchronously initialize auth state from localStorage to avoid initial redirect bounce
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) {
          return { ...parsed.user, role: resolveRole(parsed.user.role) };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved user from localStorage:', e);
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.token || null;
      }
    } catch (e) {
      console.warn('Failed to parse saved token from localStorage:', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = useCallback((tokenVal, userVal) => {
    try {
      if (tokenVal && userVal) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: tokenVal, user: userVal })
        );
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not persist auth session:', e);
    }
  }, []);

  // Verify session in background if token exists
  useEffect(() => {
    if (!token) return;

    let isCurrent = true;
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) throw new Error('Session expired');
        return null;
      })
      .then((data) => {
        if (isCurrent && data?.user) {
          const u = { ...data.user, role: resolveRole(data.user.role) };
          setUser(u);
          persistSession(token, u);
        }
      })
      .catch((err) => {
        if (isCurrent && err.message === 'Session expired') {
          setUser(null);
          setToken(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token, persistSession]);

  const login = useCallback(
    async (email, password, rememberMe = false) => {
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
          const errMsg = data.detail || 'Login failed';
          setError(errMsg);
          setIsLoading(false);
          return { success: false, error: errMsg };
        }

        const resolvedUser = {
          ...data.user,
          role: resolveRole(data.user.role),
        };

        setToken(data.token);
        setUser(resolvedUser);
        if (rememberMe || true) {
          persistSession(data.token, resolvedUser);
        }
        setIsLoading(false);
        return { success: true, user: resolvedUser };
      } catch (e) {
        const errMsg = 'Network error — please check your connection';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    // Call server logout for audit
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore logout errors
      }
    }
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [token]);

  const hasPermission = useCallback(
    (permission) => {
      if (!user || !user.permissions) return false;
      const perms = user.permissions;
      if (perms.includes('*')) return true;
      if (perms.includes(permission)) return true;
      // Wildcard check
      for (const p of perms) {
        if (p.endsWith('.*')) {
          const prefix = p.slice(0, -2);
          if (permission.startsWith(prefix + '.')) return true;
        }
      }
      return false;
    },
    [user]
  );

  const isScopeAllowed = useCallback(
    (state, district, constituency) => {
      if (!user || !user.scope) return false;
      const scope = user.scope;
      const scopeType = scope.type || 'NATIONAL';

      if (scopeType === 'NATIONAL') return true;

      if (scopeType === 'STATE') {
        if (state && scope.state) {
          return state.toLowerCase() === scope.state.toLowerCase();
        }
        return true;
      }

      if (scopeType === 'DISTRICT') {
        let ok = true;
        if (state && scope.state) {
          ok = ok && state.toLowerCase() === scope.state.toLowerCase();
        }
        if (district && scope.district) {
          ok = ok && district.toLowerCase() === scope.district.toLowerCase();
        }
        return ok;
      }

      if (scopeType === 'CONSTITUENCY') {
        if (constituency && scope.constituency) {
          return constituency.toLowerCase() === scope.constituency.toLowerCase();
        }
        if (district && scope.district) {
          return district.toLowerCase() === scope.district.toLowerCase();
        }
        return true;
      }

      return true;
    },
    [user]
  );

  const isRole = useCallback(
    (...roles) => {
      if (!user) return false;
      const userRole = resolveRole(user.role);
      const flat = roles.flat ? roles.flat() : roles;
      return flat.some((r) => resolveRole(r) === userRole);
    },
    [user]
  );

  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        const res = await fetch(url, { ...options, headers });

        if (res.status === 401) {
          // Token expired
          setUser(null);
          setToken(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return null;
        }

        return res;
      } catch (e) {
        console.error('Auth fetch error:', e);
        return null;
      }
    },
    [token]
  );

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
    isRole,
    authFetch,
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
