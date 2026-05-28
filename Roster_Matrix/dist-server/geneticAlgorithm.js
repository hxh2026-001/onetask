export class GeneticAlgorithm {
    employees = [];
    shifts = [];
    populationSize = 50;
    mutationRate = 0.02;
    crossoverRate = 0.7;
    elitismCount = 2;
    setEmployees(employees) {
        this.employees = employees;
    }
    setShifts(shifts) {
        this.shifts = shifts;
    }
    setParameters(params) {
        if (params.populationSize)
            this.populationSize = params.populationSize;
        if (params.mutationRate)
            this.mutationRate = params.mutationRate;
        if (params.crossoverRate)
            this.crossoverRate = params.crossoverRate;
    }
    generateChromosome() {
        const length = this.shifts.length;
        const genes = [];
        for (let i = 0; i < length; i++) {
            genes.push(Math.floor(Math.random() * this.employees.length));
        }
        return genes.join(',');
    }
    decodeChromosome(chromosome) {
        return chromosome.split(',').map(Number);
    }
    calculateFitness(chromosome) {
        const genes = this.decodeChromosome(chromosome);
        let fitness = 0;
        const conflicts = [];
        const employeeHours = {};
        this.employees.forEach(emp => employeeHours[emp.id] = 0);
        for (let i = 0; i < this.shifts.length; i++) {
            const shift = this.shifts[i];
            const employeeIndex = genes[i];
            const employee = this.employees[employeeIndex];
            employeeHours[employee.id] += 1;
            let skillMatch = 0;
            shift.required_skills.forEach(skill => {
                if (employee.skills.includes(skill)) {
                    skillMatch++;
                }
            });
            if (skillMatch === 0) {
                conflicts.push({
                    type: 'hard',
                    message: `技能覆盖盲区：员工 ${employee.name} 不具备班次 ${shift.id} 所需技能`,
                    employeeId: employee.id,
                    shiftId: shift.id
                });
                fitness -= 100;
            }
            else {
                fitness += skillMatch * 10;
            }
            if (employeeHours[employee.id] > employee.max_hours) {
                conflicts.push({
                    type: 'hard',
                    message: `连续工时超限：员工 ${employee.name} 工时超过最大限制`,
                    employeeId: employee.id,
                    shiftId: shift.id
                });
                fitness -= 50 * (employeeHours[employee.id] - employee.max_hours);
            }
            if (employee.preferences.includes(`day${shift.day}_slot${shift.time_slot}`)) {
                fitness += 5;
            }
        }
        return { fitness, conflicts };
    }
    select(population) {
        const totalFitness = population.reduce((sum, s) => sum + Math.max(s.fitness, 1), 0);
        let random = Math.random() * totalFitness;
        for (const schedule of population) {
            random -= Math.max(schedule.fitness, 1);
            if (random <= 0) {
                return schedule;
            }
        }
        return population[Math.floor(Math.random() * population.length)];
    }
    crossover(parent1, parent2) {
        if (Math.random() > this.crossoverRate) {
            return parent1;
        }
        const genes1 = this.decodeChromosome(parent1);
        const genes2 = this.decodeChromosome(parent2);
        const crossoverPoint = Math.floor(Math.random() * genes1.length);
        const child = [...genes1.slice(0, crossoverPoint), ...genes2.slice(crossoverPoint)];
        return child.join(',');
    }
    mutate(chromosome) {
        const genes = this.decodeChromosome(chromosome);
        for (let i = 0; i < genes.length; i++) {
            if (Math.random() < this.mutationRate) {
                genes[i] = Math.floor(Math.random() * this.employees.length);
            }
        }
        return genes.join(',');
    }
    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const chromosome = this.generateChromosome();
            const { fitness, conflicts } = this.calculateFitness(chromosome);
            population.push({ chromosome, fitness, conflicts });
        }
        return population;
    }
    evolve(population) {
        const newPopulation = [];
        population.sort((a, b) => b.fitness - a.fitness);
        for (let i = 0; i < this.elitismCount; i++) {
            if (population[i]) {
                newPopulation.push(population[i]);
            }
        }
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.select(population);
            const parent2 = this.select(population);
            let child = this.crossover(parent1.chromosome, parent2.chromosome);
            child = this.mutate(child);
            const { fitness, conflicts } = this.calculateFitness(child);
            newPopulation.push({ chromosome: child, fitness, conflicts });
        }
        return newPopulation;
    }
    run(generations) {
        const results = [];
        let population = this.initializePopulation();
        for (let gen = 0; gen < generations; gen++) {
            const bestFitness = Math.max(...population.map(s => s.fitness));
            const avgFitness = population.reduce((sum, s) => sum + s.fitness, 0) / population.length;
            results.push({
                generation: gen,
                bestFitness,
                avgFitness,
                population: [...population]
            });
            population = this.evolve(population);
        }
        return results;
    }
}
export const generateShifts = (days = 7, slotsPerDay = 3) => {
    const skills = ['编程', '测试', '设计', '运维', '管理'];
    const shifts = [];
    let id = 0;
    for (let day = 0; day < days; day++) {
        for (let slot = 0; slot < slotsPerDay; slot++) {
            const requiredSkills = [];
            const numSkills = Math.floor(Math.random() * 2) + 1;
            const shuffled = [...skills].sort(() => Math.random() - 0.5);
            requiredSkills.push(...shuffled.slice(0, numSkills));
            shifts.push({
                id: id++,
                day,
                time_slot: slot,
                required_skills: requiredSkills
            });
        }
    }
    return shifts;
};
export const generateTestEmployees = (count = 10) => {
    const skills = ['编程', '测试', '设计', '运维', '管理'];
    const employees = [];
    for (let i = 0; i < count; i++) {
        const numSkills = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...skills].sort(() => Math.random() - 0.5);
        const empSkills = shuffled.slice(0, numSkills);
        const preferences = [];
        if (Math.random() > 0.5) {
            const day = Math.floor(Math.random() * 7);
            const slot = Math.floor(Math.random() * 3);
            preferences.push(`day${day}_slot${slot}`);
        }
        employees.push({
            id: i,
            name: `员工${i + 1}`,
            skills: empSkills,
            preferences,
            max_hours: 8 + Math.floor(Math.random() * 4)
        });
    }
    return employees;
};
