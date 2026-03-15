import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'ADMIN' | 'OPERADOR' | 'LECTOR';
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBackendUser = async (idToken: string): Promise<User> => {
    const { data } = await api.post<{ user: User }>('/auth/firebase', { idToken });
    return data.user;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      try {
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        const backendUser = await fetchBackendUser(idToken);
        setUser(backendUser);
      } catch {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const idToken = await fbUser.getIdToken();
    const backendUser = await fetchBackendUser(idToken);
    setToken(idToken);
    setUser(backendUser);
    setFirebaseUser(fbUser);
  };

  const register = async (email: string, password: string, username: string) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await fbUser.getIdToken();
    await api.post('/auth/firebase/register', { idToken, username });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setToken(null);
    setFirebaseUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, firebaseUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
