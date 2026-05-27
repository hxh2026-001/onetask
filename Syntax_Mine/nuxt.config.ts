export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  port: 3013,

  app: {
    head: {
      title: '依存句法树解析器',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: '基于Arc-Standard转换系统的依存句法分析器' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  modules: [],

  nitro: {
    preset: 'node-server'
  },

  build: {
    transpile: ['better-sqlite3']
  }
})
