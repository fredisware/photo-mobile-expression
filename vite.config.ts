import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Important for Capacitor: use relative paths for assets
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});