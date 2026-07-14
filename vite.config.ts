import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'privy',
              test: /node_modules[\\/]@privy-io[\\/]react-auth/,
              maxSize: 500_000,
              includeDependenciesRecursively: false,
            },
            {
              name: 'wallet-connect',
              test: /node_modules[\\/]@walletconnect[\\/]/,
              maxSize: 500_000,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
});
