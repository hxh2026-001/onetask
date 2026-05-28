let chromosomes = []
let scheduleHistory = []
let employees = []
let nextChromosomeId = 1
let nextScheduleId = 1
let nextEmployeeId = 1

export const insertChromosome = (generation, chromosome, fitness) => {
  const id = nextChromosomeId++
  chromosomes.push({
    id,
    generation,
    chromosome,
    fitness,
    created_at: new Date().toISOString()
  })
  return id
}

export const getChromosomesByGeneration = (generation) => {
  return chromosomes.filter(c => c.generation === generation).sort((a, b) => b.fitness - a.fitness)
}

export const insertScheduleHistory = (name, chromosomeId, scheduleData, fitness, generation) => {
  const id = nextScheduleId++
  scheduleHistory.push({
    id,
    name,
    chromosome_id: chromosomeId,
    schedule_data: scheduleData,
    fitness,
    generation,
    created_at: new Date().toISOString()
  })
  return id
}

export const getAllScheduleHistory = () => {
  return [...scheduleHistory].reverse()
}

export const insertEmployee = (name, skills, preferences) => {
  const id = nextEmployeeId++
  employees.push({
    id,
    name,
    skills: JSON.stringify(skills),
    preferences: JSON.stringify(preferences),
    max_hours: 40,
    created_at: new Date().toISOString()
  })
  return id
}

export const getAllEmployees = () => {
  return employees.map(row => ({
    ...row,
    skills: JSON.parse(row.skills),
    preferences: JSON.parse(row.preferences)
  }))
}

export const deleteEmployee = (id) => {
  employees = employees.filter(e => e.id !== id)
  return { changes: 1 }
}

export const clearChromosomes = () => {
  chromosomes = []
  return { changes: chromosomes.length }
}