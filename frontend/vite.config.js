import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Detect which app to build (main or admin)
const isAdmin = process.env.VITE_APP === 'admin';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_APP': JSON.stringify(process.env.VITE_APP || 'main'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: isAdmin ? 5175 : 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: isAdmin ? 'dist-admin' : 'dist',
    sourcemap: false,
    rollupOptions: {
      input: isAdmin 
        ? path.resolve(__dirname, 'admin.html')
        : path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          query: ['@tanstack/react-query', 'axios', 'zustand'],
        },
      },
    },
  },
});
