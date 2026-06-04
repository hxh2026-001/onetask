const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'fractionflow.db');

let db = null;
let SQL = null;

const initDatabase = async () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  SQL = await initSqlJs();
  
  let fileBuffer = null;
  if (fs.existsSync(dbPath)) {
    fileBuffer = fs.readFileSync(dbPath);
  }

  db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS operation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      operation_type TEXT NOT NULL,
      numerator1 INTEGER,
      denominator1 INTEGER,
      numerator2 INTEGER,
      denominator2 INTEGER,
      operator TEXT,
      result_num INTEGER,
      result_den INTEGER,
      is_valid INTEGER DEFAULT 1,
      error_message TEXT,
      snapshot TEXT,
      shape_type TEXT DEFAULT 'circle'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS student_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      student_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_history_session ON operation_history(session_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_history_timestamp ON operation_history(timestamp)`);

  saveDatabase();
};

const saveDatabase = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('保存数据库失败:', e.message);
  }
};

const createSession = (sessionId, studentName = '匿名学生') => {
  db.run(
    `INSERT OR IGNORE INTO student_sessions (session_id, student_name) VALUES (?, ?)`,
    [sessionId, studentName]
  );
  
  db.run(
    `UPDATE student_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?`,
    [sessionId]
  );
  
  saveDatabase();
};

const saveOperation = (data) => {
  const stmt = db.run(
    `INSERT INTO operation_history 
    (session_id, operation_type, numerator1, denominator1, numerator2, denominator2, 
     operator, result_num, result_den, is_valid, error_message, snapshot, shape_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.sessionId,
      data.operationType,
      data.numerator1,
      data.denominator1,
      data.numerator2,
      data.denominator2,
      data.operator,
      data.resultNum,
      data.resultDen,
      data.isValid ? 1 : 0,
      data.errorMessage,
      JSON.stringify(data.snapshot),
      data.shapeType || 'circle'
    ]
  );
  
  saveDatabase();
  return { lastInsertRowid: stmt.lastInsertRowid };
};

const getHistory = (sessionId, limit = 50) => {
  const stmt = db.prepare(
    `SELECT * FROM operation_history WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`
  );
  stmt.bind([sessionId, limit]);
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  
  return rows.map(row => ({
    ...row,
    snapshot: row.snapshot ? JSON.parse(row.snapshot) : null,
    is_valid: row.is_valid === 1
  }));
};

const getDb = () => db;
const getSql = () => SQL;

module.exports = {
  initDatabase,
  getDb,
  getSql,
  createSession,
  saveOperation,
  getHistory
};
