import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages - use repository name or '/' if using custom domain
  base: process.env.NODE_ENV === 'production' ? '/filterbubble/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/cert.pem'))
    },
    proxy: {
      '/api/openai': {
        target: 'https://api.tao-shen.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        secure: false,
        headers: {
          'Connection': 'keep-alive'
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
