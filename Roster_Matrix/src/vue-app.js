import { createApp, ref, reactive, computed } from 'vue'

const API_BASE = 'http://localhost:3017/api'

createApp({
  setup() {
    const employees = ref([])
    const shifts = ref([])
    const results = ref([])
    const currentGeneration = ref(0)
    const isRunning = ref(false)
    const selectedPreset = ref(null)
    const showAnimation = ref(false)
    const animationType = ref('')
    const dnaAnimationData = reactive({ parent1: [], parent2: [], child: [], crossoverPoint: 0 })
    const fitnessHistory = ref([])
    const conflicts = ref([])
    const filteredPopulation = ref([])
    const scheduleCells = ref([])
    const memoryUsage = ref(0)
    const computationTime = ref(0)

    const fetchPresets = async () => {
      const res = await fetch(`${API_BASE}/presets`)
      return await res.json()
    }

    const loadPreset = async (key) => {
      const res = await fetch(`${API_BASE}/preset/${key}`)
      const data = await res.json()
      employees.value = data.employees
      shifts.value = data.shifts
      selectedPreset.value = key
      results.value = []
      currentGeneration.value = 0
      fitnessHistory.value = []
    }

    const runAlgorithm = async () => {
      if (employees.value.length === 0 || shifts.value.length === 0) return

      isRunning.value = true
      const startTime = performance.now()

      const res = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees: employees.value,
          shifts: shifts.value,
          generations: 50,
          params: { populationSize: 100, mutationRate: 0.02, crossoverRate: 0.7 }
        })
      })

      computationTime.value = performance.now() - startTime
      memoryUsage.value = Math.round((performance.memory?.usedJSHeapSize || 0) / 1024 / 1024)

      results.value = await res.json()
      isRunning.value = false
      
      fitnessHistory.value = results.value.map(r => ({
        generation: r.generation,
        best: r.bestFitness,
        avg: r.avgFitness
      }))

      animateEvolution()
    }

    const animateEvolution = () => {
      if (results.value.length === 0) return

      let gen = 0
      const interval = setInterval(() => {
        if (gen >= results.value.length) {
          clearInterval(interval)
          return
        }

        currentGeneration.value = gen
        const best = results.value[gen].population[0]
        if (best) {
          conflicts.value = best.conflicts
          showConflictsAnimation()
        }

        gen++
      }, 300)
    }

    const showConflictsAnimation = () => {
      animationType.value = 'conflict'
      showAnimation.value = true
      setTimeout(() => { showAnimation.value = false }, 1500)
    }

    const showCrossoverAnimation = () => {
      if (results.value.length === 0) return

      const pop = results.value[currentGeneration.value]?.population || []
      if (pop.length < 2) return

      const p1 = pop[0]?.chromosome.split(',').map(Number) || []
      const p2 = pop[1]?.chromosome.split(',').map(Number) || []
      const point = Math.floor(Math.random() * p1.length)

      dnaAnimationData.parent1 = p1
      dnaAnimationData.parent2 = p2
      dnaAnimationData.crossoverPoint = point
      dnaAnimationData.child = [...p1.slice(0, point), ...p2.slice(point)]

      animationType.value = 'crossover'
      showAnimation.value = true
      setTimeout(() => { showAnimation.value = false }, 2000)
    }

    const showFitnessAnimation = () => {
      animationType.value = 'fitness'
      showAnimation.value = true
      setTimeout(() => { showAnimation.value = false }, 3000)
    }

    const showFilterAnimation = () => {
      if (results.value.length === 0) return

      const pop = results.value[currentGeneration.value]?.population || []
      filteredPopulation.value = [...pop].sort((a, b) => b.fitness - a.fitness).slice(0, 10)

      animationType.value = 'filter'
      showAnimation.value = true
      setTimeout(() => { showAnimation.value = false }, 2000)
    }

    const showScheduleAnimation = () => {
      if (results.value.length === 0) return

      const best = results.value[currentGeneration.value]?.population[0]
      if (!best) return

      const genes = best.chromosome.split(',').map(Number)
      scheduleCells.value = shifts.value.map((shift, i) => ({
        day: shift.day,
        slot: shift.time_slot,
        employee: employees.value[genes[i]],
        skillMatch: shift.required_skills.filter(s => employees.value[genes[i]]?.skills.includes(s)).length,
        totalSkills: shift.required_skills.length,
        conflict: best.conflicts.some(c => c.shiftId === shift.id)
      }))

      animationType.value = 'schedule'
      showAnimation.value = true
      setTimeout(() => { showAnimation.value = false }, 2000)
    }

    const currentBest = computed(() => {
      if (results.value.length === 0) return null
      return results.value[currentGeneration.value]?.population[0] || null
    })

    const maxFitness = computed(() => {
      return Math.max(...fitnessHistory.value.map(f => f.best), 1)
    })

    const getCellContent = (day, slot) => {
      return scheduleCells.value.find(c => c.day === day && c.slot === slot)
    }

    const getCellClass = (day, slot) => {
      const cell = getCellContent(day, slot)
      if (!cell) return ''
      if (cell.conflict) return 'conflict'
      if (cell.skillMatch === cell.totalSkills) return 'skill-full'
      if (cell.skillMatch > 0) return 'skill-partial'
      return ''
    }

    const presets = ref([])

    const resultCells = computed(() => {
      if (!currentBest.value) return []
      const genes = currentBest.value.chromosome.split(',').map(Number)
      return shifts.value.map((shift, i) => ({
        day: shift.day,
        slot: shift.time_slot,
        employee: employees.value[genes[i]],
        skillMatch: shift.required_skills.filter(s => employees.value[genes[i]]?.skills.includes(s)).length,
        totalSkills: shift.required_skills.length,
        conflict: currentBest.value.conflicts.some(c => c.shiftId === shift.id)
      }))
    })

    const getResultCellContent = (day, slot) => {
      return resultCells.value.find(c => c.day === day && c.slot === slot)
    }

    const getResultCellClass = (day, slot) => {
      const cell = getResultCellContent(day, slot)
      if (!cell) return ''
      if (cell.conflict) return 'conflict'
      if (cell.skillMatch === cell.totalSkills) return 'skill-full'
      if (cell.skillMatch > 0) return 'skill-partial'
      return ''
    }

    const getEmployeeHours = (employeeId) => {
      if (!currentBest.value) return 0
      const genes = currentBest.value.chromosome.split(',').map(Number)
      return genes.filter(g => employees.value[g]?.id === employeeId).length
    }

    return {
      employees,
      shifts,
      results,
      currentGeneration,
      isRunning,
      selectedPreset,
      showAnimation,
      animationType,
      dnaAnimationData,
      fitnessHistory,
      conflicts,
      filteredPopulation,
      scheduleCells,
      memoryUsage,
      computationTime,
      currentBest,
      maxFitness,
      presets,
      getCellContent,
      getCellClass,
      getResultCellContent,
      getResultCellClass,
      getEmployeeHours,
      fetchPresets,
      loadPreset,
      runAlgorithm,
      showCrossoverAnimation,
      showFitnessAnimation,
      showFilterAnimation,
      showScheduleAnimation
    }
  },
  mounted() {
    this.fetchPresets().then(data => {
      this.presets = data
    })
  }
}).mount('#app')