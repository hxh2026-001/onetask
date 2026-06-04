const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let SQL = null;
const dbPath = path.join(__dirname, 'constraint_solver.db');

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str.toString();
  return "'" + str.replace(/'/g, "''") + "'";
}

function buildQuery(sql, params = []) {
  let idx = 0;
  return sql.replace(/\?/g, () => {
    const param = params[idx++];
    return escapeString(param);
  });
}

async function initDB() {
  if (db) return db;
  
  if (!SQL) {
    SQL = await initSqlJs();
  }
  
  let dbData = null;
  if (fs.existsSync(dbPath)) {
    try {
      dbData = fs.readFileSync(dbPath);
    } catch (e) {
      console.log('数据库文件损坏，创建新数据库');
    }
  }
  
  db = new SQL.Database(dbData);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      preset_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS geometric_elements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      label TEXT,
      params TEXT NOT NULL,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS constraints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      element_ids TEXT NOT NULL,
      value REAL,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS solve_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id INTEGER NOT NULL,
      iteration INTEGER NOT NULL,
      residual REAL NOT NULL,
      max_constraint_violation REAL NOT NULL,
      element_states TEXT NOT NULL,
      constraint_states TEXT NOT NULL,
      search_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_elements_scene ON geometric_elements(scene_id);
    CREATE INDEX IF NOT EXISTS idx_constraints_scene ON constraints(scene_id);
    CREATE INDEX IF NOT EXISTS idx_history_scene ON solve_history(scene_id);
  `);
  
  saveDatabase();
  
  return db;
}

function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('保存数据库失败:', e.message);
    }
  }
}

async function getDB() {
  if (!db) await initDB();
  return db;
}

function runQuery(sql, params = []) {
  const finalSql = buildQuery(sql, params);
  
  db.exec(finalSql);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const lastID = lastIdResult[0]?.values[0]?.[0] || 0;
  
  return {
    lastID,
    changes: db.getRowsModified()
  };
}

function getQuery(sql, params = []) {
  const finalSql = buildQuery(sql, params);
  const results = db.exec(finalSql);
  
  if (results.length === 0) return null;
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  if (values.length === 0) return null;
  
  const row = {};
  columns.forEach((col, idx) => {
    row[col] = values[0][idx];
  });
  
  return row;
}

function allQuery(sql, params = []) {
  const finalSql = buildQuery(sql, params);
  const results = db.exec(finalSql);
  
  if (results.length === 0) return [];
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

async function saveScene(scene) {
  await getDB();
  const { name, presetType, elements, constraints } = scene;
  
  const result = runQuery(
    'INSERT INTO scenes (name, preset_type) VALUES (?, ?)',
    [name, presetType || null]
  );
  const sceneId = result.lastID;

  for (const elem of elements) {
    runQuery(
      'INSERT INTO geometric_elements (scene_id, type, label, params) VALUES (?, ?, ?, ?)',
      [sceneId, elem.type, elem.label || null, JSON.stringify(elem.params)]
    );
  }

  for (const constraint of constraints) {
    runQuery(
      'INSERT INTO constraints (scene_id, type, element_ids, value) VALUES (?, ?, ?, ?)',
      [sceneId, constraint.type, JSON.stringify(constraint.elementIds), constraint.value || null]
    );
  }

  return sceneId;
}

async function loadScene(sceneId) {
  await getDB();
  
  const scene = getQuery('SELECT * FROM scenes WHERE id = ?', [sceneId]);
  if (!scene) return null;

  const elements = allQuery('SELECT * FROM geometric_elements WHERE scene_id = ?', [sceneId]);
  const constraints = allQuery('SELECT * FROM constraints WHERE scene_id = ?', [sceneId]);

  return {
    id: scene.id,
    name: scene.name,
    presetType: scene.preset_type,
    elements: elements.map(e => ({
      id: e.id,
      type: e.type,
      label: e.label,
      params: JSON.parse(e.params)
    })),
    constraints: constraints.map(c => ({
      id: c.id,
      type: c.type,
      elementIds: JSON.parse(c.element_ids),
      value: c.value
    }))
  };
}

async function listScenes() {
  await getDB();
  return allQuery('SELECT id, name, preset_type, created_at FROM scenes ORDER BY created_at DESC');
}

async function deleteScene(sceneId) {
  await getDB();
  runQuery('DELETE FROM solve_history WHERE scene_id = ?', [sceneId]);
  runQuery('DELETE FROM constraints WHERE scene_id = ?', [sceneId]);
  runQuery('DELETE FROM geometric_elements WHERE scene_id = ?', [sceneId]);
  runQuery('DELETE FROM scenes WHERE id = ?', [sceneId]);
}

async function saveSolveStep(sceneId, iteration, residual, maxViolation, elementStates, constraintStates, searchPath) {
  await getDB();
  runQuery(
    `INSERT INTO solve_history 
     (scene_id, iteration, residual, max_constraint_violation, element_states, constraint_states, search_path) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sceneId, iteration, residual, maxViolation, JSON.stringify(elementStates), JSON.stringify(constraintStates), searchPath ? JSON.stringify(searchPath) : null]
  );
}

async function getSolveHistory(sceneId) {
  await getDB();
  const history = allQuery(
    'SELECT iteration, residual, max_constraint_violation, search_path FROM solve_history WHERE scene_id = ? ORDER BY iteration',
    [sceneId]
  );
  return history.map(h => ({
    iteration: h.iteration,
    residual: h.residual,
    maxConstraintViolation: h.max_constraint_violation,
    searchPath: h.search_path ? JSON.parse(h.search_path) : null
  }));
}

async function clearSolveHistory(sceneId) {
  await getDB();
  runQuery('DELETE FROM solve_history WHERE scene_id = ?', [sceneId]);
}

module.exports = {
  initDB,
  getDB,
  saveScene,
  loadScene,
  listScenes,
  deleteScene,
  saveSolveStep,
  getSolveHistory,
  clearSolveHistory
};
