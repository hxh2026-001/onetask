import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [qwikVite()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})