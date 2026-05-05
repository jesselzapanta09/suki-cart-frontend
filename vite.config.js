import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const isCordova = mode === 'cordova'

  return {
    base: isCordova ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      outDir: isCordova ? '../cordova-mobile/www' : 'dist',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://jezyk.me',
          // target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/storage': {
          target: 'https://jezyk.me',
          // target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
