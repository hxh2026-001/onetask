// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    plugins: ['~/server/plugins/db.ts']
  },
  css: ['~/assets/css/main.css']
})
