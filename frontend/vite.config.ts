import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';


export default defineConfig({
  plugins: [
    react(),
    wasm(),
    
  ],
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext'
  }
});

