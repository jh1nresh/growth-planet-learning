import {lazy, Suspense, type PropsWithChildren} from 'react';
import {AuthContext, type AuthState} from './auth-context';

const PrivyAuthProvider = lazy(() => import('./PrivyAuthProvider'));
const appId = import.meta.env.VITE_PRIVY_APP_ID?.trim();

const guestAuth: AuthState = {
  ready: true,
  authenticated: false,
  canLogin: false,
  userId: null,
  parentEmail: null,
  getAccessToken: async () => null,
  login: () => undefined,
  logout: async () => undefined,
};

export function AuthProvider({children}: PropsWithChildren) {
  if (!appId) {
    return <AuthContext.Provider value={guestAuth}>{children}</AuthContext.Provider>;
  }

  return (
    <Suspense fallback={<div className="app-loading" role="status">正在準備家長登入…</div>}>
      <PrivyAuthProvider appId={appId}>{children}</PrivyAuthProvider>
    </Suspense>
  );
}
