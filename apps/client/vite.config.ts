import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `vite build --mode native` is the build inside the phone apps. There the app files ship
// inside the app, so no service worker is wanted: it could keep serving an old copy.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      disable: mode === 'native',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // Uses /manifest.webmanifest from public
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        // Only the Latin letters of the two fonts are needed offline.
        globIgnores: ['**/*-ext-*', '**/*cyrillic*', '**/*vietnamese*', '**/*greek*'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__\/auth/, /^\/api\//, /^\/(privacy|terms)\.html$/],
        // Task 2.11: Never cache authentication or Firestore API responses
        runtimeCaching: []
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
}));
