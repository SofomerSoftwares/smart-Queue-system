import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  demoLogin: (role: RoleName) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem('queue_access_token');
        if (token) {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          }
        }
      } catch (err) {
        localStorage.removeItem('queue_access_token');
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password });
      if (res.success) {
        localStorage.setItem('queue_access_token', res.accessToken);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    localStorage.removeItem('queue_access_token');
    setUser(null);
  };

  const demoLogin = async (role: RoleName) => {
    const creds: Record<RoleName, { u: string; p: string }> = {
      ADMIN: { u: 'admin', p: 'Admin@123' },
      RECEPTIONIST: { u: 'reception', p: 'Reception@123' },
      SERVICE_OFFICER: { u: 'officer1', p: 'Officer@123' }
    };
    const c = creds[role];
    if (c) {
      await login(c.u, c.p);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
