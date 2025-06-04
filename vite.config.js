import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mars3dPlugin } from 'vite-plugin-mars3d'
import tailwindcss from  'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mars3dPlugin()
  ],
  server: {
    port: 4399,
    host: true,
    open: true,
    proxy: {
      '/gmf': {
        // target: `http://118.31.41.139:52/`,
        // target: `http://192.168.2.170:8000/`,
        target: `http://127.0.0.1:8000/`,
        // target: `http://192.169.28.110:8080/`,
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/gml/, '')
      },
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ]
    }
  }
})
