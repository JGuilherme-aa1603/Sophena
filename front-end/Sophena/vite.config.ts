import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  server: createDevServerConfig(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})

function createDevServerConfig() {
  return {
    host: 'localhost',
    proxy: createApiProxyConfig(),
  }
}

function createApiProxyConfig() {
  const target = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000'

  return {
    '/auth': {
      target,
      changeOrigin: true,
      secure: false,
    },
    '/admin': {
      target,
      changeOrigin: true,
      secure: false,
    },
    '/books': {
      target,
      changeOrigin: true,
      secure: false,
    },
    '/lists': {
      target,
      changeOrigin: true,
      secure: false,
    },
  }
}
