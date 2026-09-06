'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => void;
  switchRole: (targetRole?: 'citizen' | 'officer') => Promise<User>;
  isAuthenticated: boolean;
  isCitizen: boolean;
  isOfficer: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('civicai_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const userData = await api.get<User>('/api/auth/me');
      setUser(userData);
    } catch {
      localStorage.removeItem('civicai_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (data: LoginRequest): Promise<User> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    localStorage.setItem('civicai_token', response.token);
    setUser(response.user);
    return response.user;
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    localStorage.setItem('civicai_token', response.token);
    setUser(response.user);
    return response.user;
  };

  const switchRole = async (targetRole?: 'citizen' | 'officer'): Promise<User> => {
    const res = await api.post<{ status: string; role: 'citizen' | 'officer' | 'admin'; token: string; user: User }>(
      '/api/auth/switch-role',
      { role: targetRole }
    );
    localStorage.setItem('civicai_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('civicai_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchRole,
        isAuthenticated: !!user,
        isCitizen: user?.role === 'citizen',
        isOfficer: user?.role === 'officer' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
