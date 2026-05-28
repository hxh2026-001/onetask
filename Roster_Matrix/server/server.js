import express from 'express'
import cors from 'cors'
import { GeneticAlgorithm, generateShifts, generateTestEmployees } from './geneticAlgorithm.js'
import { insertChromosome, insertScheduleHistory, getAllScheduleHistory, insertEmployee, getAllEmployees, deleteEmployee, clearChromosomes } from './database.js'

const app = express()
const PORT = 3017

app.use(cors())
app.use(express.json())

const presets = {
  preset1: {
    name: '连续工时超限',
    description: '员工数量少，班次多，容易出现工时超限',
    employees: [
      { id: 0, name: '张三', skills: ['编程'], preferences: [], max_hours: 5 },
      { id: 1, name: '李四', skills: ['测试'], preferences: [], max_hours: 5 },
      { id: 2, name: '王五', skills: ['设计'], preferences: [], max_hours: 5 },
    ],
    shifts: generateShifts(7, 4),
    params: { populationSize: 50, mutationRate: 0.02, crossoverRate: 0.7 }
  },
  preset2: {
    name: '技能覆盖盲区',
    description: '某些班次所需技能无人具备',
    employees: [
      { id: 0, name: '张三', skills: ['编程'], preferences: [], max_hours: 8 },
      { id: 1, name: '李四', skills: ['测试'], preferences: [], max_hours: 8 },
      { id: 2, name: '王五', skills: ['设计'], preferences: [], max_hours: 8 },
      { id: 3, name: '赵六', skills: ['运维'], preferences: [], max_hours: 8 },
    ],
    shifts: [
      { id: 0, day: 0, time_slot: 0, required_skills: ['编程'] },
      { id: 1, day: 0, time_slot: 1, required_skills: ['测试'] },
      { id: 2, day: 0, time_slot: 2, required_skills: ['设计'] },
      { id: 3, day: 0, time_slot: 3, required_skills: ['管理'] },
      { id: 4, day: 1, time_slot: 0, required_skills: ['编程'] },
      { id: 5, day: 1, time_slot: 1, required_skills: ['测试'] },
      { id: 6, day: 1, time_slot: 2, required_skills: ['设计'] },
      { id: 7, day: 1, time_slot: 3, required_skills: ['管理'] },
    ],
    params: { populationSize: 50, mutationRate: 0.02, crossoverRate: 0.7 }
  },
  preset3: {
    name: '基因早熟收敛',
    description: '搜索空间过大，容易陷入局部最优',
    employees: generateTestEmployees(20),
    shifts: generateShifts(14, 4),
    params: { populationSize: 30, mutationRate: 0.01, crossoverRate: 0.9 }
  },
  preset4: {
    name: '排班孤岛',
    description: '某些员工被过度使用，其他员工空闲',
    employees: [
      { id: 0, name: '张三', skills: ['编程', '测试', '设计'], preferences: [], max_hours: 12 },
      { id: 1, name: '李四', skills: ['编程'], preferences: [], max_hours: 8 },
      { id: 2, name: '王五', skills: ['编程'], preferences: [], max_hours: 8 },
      { id: 3, name: '赵六', skills: ['编程'], preferences: [], max_hours: 8 },
      { id: 4, name: '钱七', skills: ['编程'], preferences: [], max_hours: 8 },
      { id: 5, name: '孙八', skills: ['编程'], preferences: [], max_hours: 8 },
    ],
    shifts: generateShifts(7, 3),
    params: { populationSize: 50, mutationRate: 0.02, crossoverRate: 0.7 }
  }
}

app.get('/api/presets', (req, res) => {
  res.json(Object.keys(presets).map(key => ({
    key,
    name: presets[key].name,
    description: presets[key].description
  })))
})

app.get('/api/preset/:key', (req, res) => {
  const preset = presets[req.params.key]
  if (preset) {
    res.json(preset)
  } else {
    res.status(404).json({ error: 'Preset not found' })
  }
})

app.post('/api/schedule', async (req, res) => {
  try {
    const { employees, shifts, generations, params } = req.body
    
    const ga = new GeneticAlgorithm()
    ga.setEmployees(employees)
    ga.setShifts(shifts)
    if (params) {
      ga.setParameters(params)
    }
    
    const results = ga.run(generations)
    
    results.forEach(result => {
      result.population.forEach(schedule => {
        const chromId = insertChromosome(result.generation, schedule.chromosome, schedule.fitness)
        insertScheduleHistory(
          `Generation ${result.generation}`,
          chromId,
          JSON.stringify(schedule),
          schedule.fitness,
          result.generation
        )
      })
    })
    
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/history', (req, res) => {
  try {
    const history = getAllScheduleHistory()
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/employees', (req, res) => {
  try {
    const { name, skills, preferences } = req.body
    const id = insertEmployee(name, skills, preferences)
    res.json({ id, name, skills, preferences })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/employees', (req, res) => {
  try {
    const employees = getAllEmployees()
    res.json(employees)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/employees/:id', (req, res) => {
  try {
    deleteEmployee(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/clear', (req, res) => {
  try {
    clearChromosomes()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

import path from 'path'

app.use(express.static('.'))
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})