import { component$, useStore } from '@builder.io/qwik'
import ScheduleApp from './components/ScheduleApp'

export default component$(() => {
  const state = useStore({
    employees: [],
    shifts: [],
    results: [],
    currentGeneration: 0,
    isRunning: false,
    selectedPreset: null as string | null,
  })

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>智能排班系统 - 遗传算法</title>
        <link rel="stylesheet" href="/styles.css" />
        <script type="importmap">
          {
            "imports": {
              "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
            }
          }
        </script>
      </head>
      <body>
        <div id="app"></div>
        <ScheduleApp />
        <script type="module" src="/src/vue-app.js"></script>
      </body>
    </html>
  )
})