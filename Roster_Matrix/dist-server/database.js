const db = new Database('roster.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS chromosomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generation INTEGER NOT NULL,
    chromosome TEXT NOT NULL,
    fitness REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS schedule_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    chromosome_id INTEGER,
    schedule_data TEXT NOT NULL,
    fitness REAL NOT NULL,
    generation INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chromosome_id) REFERENCES chromosomes(id)
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    skills TEXT NOT NULL,
    preferences TEXT NOT NULL,
    max_hours INTEGER DEFAULT 40,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
export const insertChromosome = (generation, chromosome, fitness) => {
    const stmt = db.prepare('INSERT INTO chromosomes (generation, chromosome, fitness) VALUES (?, ?, ?)');
    const result = stmt.run(generation, chromosome, fitness);
    return result.lastInsertRowid;
};
export const getChromosomesByGeneration = (generation) => {
    const stmt = db.prepare('SELECT * FROM chromosomes WHERE generation = ? ORDER BY fitness DESC');
    return stmt.all(generation);
};
export const insertScheduleHistory = (name, chromosomeId, scheduleData, fitness, generation) => {
    const stmt = db.prepare('INSERT INTO schedule_history (name, chromosome_id, schedule_data, fitness, generation) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name, chromosomeId, scheduleData, fitness, generation);
    return result.lastInsertRowid;
};
export const getAllScheduleHistory = () => {
    const stmt = db.prepare('SELECT * FROM schedule_history ORDER BY created_at DESC');
    return stmt.all();
};
export const insertEmployee = (name, skills, preferences) => {
    const stmt = db.prepare('INSERT INTO employees (name, skills, preferences) VALUES (?, ?, ?)');
    const result = stmt.run(name, JSON.stringify(skills), JSON.stringify(preferences));
    return result.lastInsertRowid;
};
export const getAllEmployees = () => {
    const stmt = db.prepare('SELECT * FROM employees');
    const rows = stmt.all();
    return rows.map(row => ({
        ...row,
        skills: JSON.parse(row.skills),
        preferences: JSON.parse(row.preferences)
    }));
};
export const deleteEmployee = (id) => {
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    return stmt.run(id);
};
export const clearChromosomes = () => {
    const stmt = db.prepare('DELETE FROM chromosomes');
    return stmt.run();
};
export default db;
