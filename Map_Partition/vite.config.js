import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

export default {
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}
