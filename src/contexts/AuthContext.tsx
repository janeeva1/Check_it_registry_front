import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Unified API base: prefer VITE_API_BASE_URL, fallback to VITE_API_URL or dev proxy '/api'
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        // First set user from localStorage for immediate UI update
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Then verify token is still valid
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            setUser(data.user);
          } catch {
            console.warn('Auth check: server returned non-JSON response');
          }
        } else if (response.status === 401 || response.status === 403) {
          // Token is invalid/expired, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setUser(null);
        } else {
          // Non-auth errors (network/5xx). Keep existing session to avoid forced logout on refresh.
          console.warn('Auth check non-OK status:', response.status);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Network or unexpected error; preserve existing session.
      console.error('Auth check error (preserving session):', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};