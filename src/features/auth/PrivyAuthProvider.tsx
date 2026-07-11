import {PrivyProvider, useLogin, usePrivy} from '@privy-io/react-auth';
import {useMemo, type PropsWithChildren} from 'react';
import {AuthContext} from './auth-context';

interface ProviderProps extends PropsWithChildren {
  appId: string;
}

function PrivyBridge({children}: PropsWithChildren) {
  const {ready, authenticated, user, logout} = usePrivy();
  const {login} = useLogin();
  const value = useMemo(() => ({
    ready,
    authenticated,
    canLogin: true,
    userId: user?.id ?? null,
    parentEmail: user?.email?.address ?? null,
    login,
    logout,
  }), [authenticated, login, logout, ready, user?.email?.address, user?.id]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function PrivyAuthProvider({appId, children}: ProviderProps) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#d8aa55',
          logo: '/assets/growth-planet-orbital-atlas.png',
        },
      }}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  );
}
