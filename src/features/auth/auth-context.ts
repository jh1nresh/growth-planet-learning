import {createContext, useContext} from 'react';

export interface AuthState {
  ready: boolean;
  authenticated: boolean;
  canLogin: boolean;
  userId: string | null;
  parentEmail: string | null;
  getAccessToken: () => Promise<string | null>;
  login: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
