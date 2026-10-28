import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string, remember_me?: boolean) => Promise<User>;
  register: (userData: any) => Promise<any>;
  verifyEmail: (token: string, email: string) => Promise<any>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('connectoo_token') || localStorage.getItem('civicai_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('connectoo_token') || localStorage.getItem('civicai_token');
      if (storedToken) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch (err) {
          localStorage.removeItem('connectoo_token');
          localStorage.removeItem('civicai_token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, remember_me: boolean = false) => {
    const data = await api.auth.login({ email, password, remember_me });
    localStorage.setItem('connectoo_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData: any) => {
    const data = await api.auth.register(userData);
    if (data.access_token && data.user) {
      localStorage.setItem('connectoo_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    }
    return data;
  };

  const verifyEmail = async (vToken: string, email: string) => {
    const data = await api.auth.verifyEmail({ token: vToken, email });
    if (data.access_token && data.user) {
      localStorage.setItem('connectoo_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('connectoo_token');
    localStorage.removeItem('civicai_token');
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      admin: { email: 'admin@connectoo.gov', pass: 'admin123' },
      citizen: { email: 'citizen@connectoo.gov', pass: 'citizen123' },
      worker: { email: 'worker.roads@connectoo.gov', pass: 'worker123' },
    };
    const creds = roleCredentials[targetRole];
    await login(creds.email, creds.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user ? user.role : null,
        login,
        register,
        verifyEmail,
        logout,
        switchDemoRole,
        loading,
      }}
    >
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
