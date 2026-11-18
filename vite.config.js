import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { weatherlyApi } from './server/apiMiddleware.js';

export default defineConfig(({ mode }) => {
  // Load ALL env vars (no prefix filter) for server-side use only.
  // Secrets without the VITE_ prefix are never bundled into client code.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), weatherlyApi(env)],
    server: { port: 5173 },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            maps: ['leaflet', 'react-leaflet'],
          },
        },
      },
    },
  };
});
