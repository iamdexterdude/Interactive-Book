import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' is critical -> the built app is loaded from a custom
// 'app://' protocol inside Electron (not http://), so all asset paths
// must be relative, not absolute ('/assets/...' would break in production).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
});
