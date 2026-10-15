import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface UserEmployee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  current_assignment?: {
    department?: { id: number; code: string; name: string };
    job_position?: { id: number; code: string; name: string };
    work_location?: { id: number; code: string; name: string };
  };
  weekend_pattern?: 'saturday_fixed' | 'sunday_fixed' | 'rotating';
  join_date?: string;
}

export interface WeekendScheduleInfo {
  pattern: 'saturday_fixed' | 'sunday_fixed' | 'rotating' | string;
  assigned_workday: 'saturday' | 'sunday';
  off_workday: 'saturday' | 'sunday';
  label: string;
  subtitle: string;
  is_rotating: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  can_access_backend?: boolean;
  employee?: UserEmployee;
  weekend_schedule?: WeekendScheduleInfo;
}

export type PortalMode = 'user' | 'management';

interface AuthContextType {
  user: User | null;
  token: string | null;
  portalMode: PortalMode;
  canAccessBackend: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchPortal: (mode: PortalMode) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// HR, Direksi, Owner, serta Manager (Dept Head) berhak mengakses backend
export const ALLOWED_BACKEND_ROLES = ['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager'];

export const isHrOrExecutive = (userData: User | null | undefined): boolean => {
  if (!userData) return false;
  return userData.roles?.some((r) => ['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'].includes(r.toLowerCase())) || false;
};

export const isManagerOnly = (userData: User | null | undefined): boolean => {
  if (!userData) return false;
  const isManager = userData.roles?.some((r) => ['dept-head', 'manager'].includes(r.toLowerCase()));
  return Boolean(isManager && !isHrOrExecutive(userData));
};

export const checkCanAccessBackend = (userData: User | null | undefined): boolean => {
  if (!userData) return false;
  const hasAllowedRole = userData.roles?.some((r) => ALLOWED_BACKEND_ROLES.includes(r.toLowerCase()));
  return Boolean(userData.can_access_backend && hasAllowedRole);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    const cachedMode = localStorage.getItem('portal_mode') as PortalMode;
    return cachedMode === 'management' ? 'management' : 'user';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const canAccessBackend = checkCanAccessBackend(user);

  // Auto-correct portalMode: if user cannot access backend, force portalMode to 'user'
  useEffect(() => {
    if (user && !canAccessBackend && portalMode !== 'user') {
      setPortalMode('user');
      localStorage.setItem('portal_mode', 'user');
    }
  }, [user, canAccessBackend, portalMode]);

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/user');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      const hasBackend = checkCanAccessBackend(res.data);
      if (!hasBackend) {
        setPortalMode('user');
        localStorage.setItem('portal_mode', 'user');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    const hasBackend = checkCanAccessBackend(newUser);

    const targetMode: PortalMode = hasBackend ? 'management' : 'user';
    setPortalMode(targetMode);
    localStorage.setItem('portal_mode', targetMode);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('portal_mode');
    setToken(null);
    setUser(null);
    setPortalMode('user');
  };

  const switchPortal = (mode: PortalMode) => {
    if (mode === 'management' && !canAccessBackend) {
      setPortalMode('user');
      localStorage.setItem('portal_mode', 'user');
      return;
    }
    setPortalMode(mode);
    localStorage.setItem('portal_mode', mode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        portalMode,
        canAccessBackend,
        isLoading,
        login,
        logout,
        switchPortal,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
