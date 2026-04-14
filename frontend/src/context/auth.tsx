'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'faculty' | 'student';
  department_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, role: string, userObj?: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (error) {
        console.error('Auth verification failed', error);
        Cookies.remove('token');
        Cookies.remove('role');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, role: string, userObj?: User) => {
    Cookies.set('token', token, { path: '/', sameSite: 'lax' });
    Cookies.set('role', role, { path: '/', sameSite: 'lax' });
    
    if (userObj) {
      setUser(userObj);
    }
    
    // Explicitly route after state is updated
    if (role === 'admin') router.push('/dashboard/admin');
    else if (role === 'faculty') router.push('/dashboard/faculty');
    else router.push('/');
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('role');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
