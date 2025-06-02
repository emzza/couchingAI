import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }: { mode: string }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        port: 3000,
        host: true,
        proxy: {
          '/socket.io': {
            target: 'http://localhost:3000',
            ws: true,
            changeOrigin: true
          },
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true
          }
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: true
      }
    };
});
