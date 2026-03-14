import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'ADMIN' | 'OPERADOR' | 'LECTOR';
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('petho_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('petho_token'));

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('petho_token', newToken);
    localStorage.setItem('petho_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('petho_token');
    localStorage.removeItem('petho_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
