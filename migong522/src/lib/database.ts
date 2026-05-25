import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

const DB_PATH = path.join(process.cwd(), 'chronomaze.db');

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbExists = fs.existsSync(DB_PATH);

  db = new Database(DB_PATH);

  if (!dbExists) {
    initializeDatabase(db);
  }

  return db;
}

function initializeDatabase(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS time_nodes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      node_type TEXT DEFAULT 'normal',
      gregorian_year INTEGER,
      gregorian_month INTEGER,
      gregorian_day INTEGER,
      lunar_year INTEGER,
      lunar_month INTEGER,
      lunar_day INTEGER,
      mayan_baktun INTEGER,
      mayan_katun INTEGER,
      mayan_tun INTEGER,
      mayan_uinal INTEGER,
      mayan_kin INTEGER,
      persian_year INTEGER,
      persian_month INTEGER,
      persian_day INTEGER,
      pos_x REAL,
      pos_y REAL,
      pos_z REAL,
      pos_w REAL,
      unlocked INTEGER DEFAULT 0,
      timezone INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS conversion_rules (
      id TEXT PRIMARY KEY,
      source_calendar TEXT NOT NULL,
      target_calendar TEXT NOT NULL,
      formula TEXT,
      precision_loss REAL DEFAULT 0,
      conflicts TEXT,
      discovered INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_node TEXT NOT NULL,
      to_node TEXT NOT NULL,
      cost REAL DEFAULT 1,
      calendar TEXT,
      FOREIGN KEY (from_node) REFERENCES time_nodes(id),
      FOREIGN KEY (to_node) REFERENCES time_nodes(id)
    );

    CREATE TABLE IF NOT EXISTS maze_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      current_node TEXT,
      target_node TEXT,
      active_calendar TEXT,
      timezone INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      current_node TEXT,
      target_node TEXT,
      active_calendar TEXT,
      timezone INTEGER,
      unlocked_nodes TEXT,
      discovered_rules TEXT,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS path_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      from_node TEXT,
      to_node TEXT,
      path TEXT,
      cost REAL,
      warnings TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const insertRule = database.prepare(`
    INSERT OR IGNORE INTO conversion_rules (id, source_calendar, target_calendar, formula, precision_loss, conflicts)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const rules: [string, string, string, string, string, string][] = [
    ['gregorian-basic', 'gregorian', 'gregorian', 'identity', '0', '[]'],
    ['lunar-basic', 'lunar', 'lunar', 'identity', '0', '[]'],
    ['mayan-basic', 'mayan', 'mayan', 'identity', '0', '[]'],
    ['persian-basic', 'persian', 'persian', 'identity', '0', '[]'],
    ['gregorian-to-lunar', 'gregorian', 'lunar', 'lunar_convert', '0.5', '["leap_month_mismatch"]'],
    ['lunar-to-gregorian', 'lunar', 'gregorian', 'gregorian_convert', '0.5', '["leap_month_mismatch"]'],
    ['gregorian-to-mayan', 'gregorian', 'mayan', 'mayan_convert', '1.0', '["cycle_overflow"]'],
    ['mayan-to-gregorian', 'mayan', 'gregorian', 'gregorian_convert', '1.0', '["cycle_overflow"]'],
    ['gregorian-to-persian', 'gregorian', 'persian', 'persian_convert', '0.8', '["epoch_diff"]'],
    ['persian-to-gregorian', 'persian', 'gregorian', 'gregorian_convert', '0.8', '["epoch_diff"]'],
    ['lunar-to-mayan', 'lunar', 'mayan', 'mayan_cycle', '2.0', '["cycle_resonance", "leap_second"]'],
    ['mayan-to-persian', 'mayan', 'persian', 'persian_cycle', '2.5', '["epoch_conflict"]'],
    ['leap-second-detection', 'gregorian', 'gregorian', 'leap_second_check', '0.1', '["utc_offset"]'],
    ['calendar-gap-jump', 'gregorian', 'gregorian', 'gap_jump_1582', '10.0', '["missing_days_1582"]'],
    ['cycle-detection', 'mayan', 'lunar', 'cycle_sync', '1.5', '["infinite_loop"]'],
    ['conflict-resolution', 'gregorian', 'persian', 'vernal_equinox', '3.0', '["multi_calendar_conflict"]']
  ];

  for (const rule of rules) {
    insertRule.run(rule[0], rule[1], rule[2], rule[3], parseFloat(rule[4]), rule[5]);
  }

  const insertPreset = database.prepare(`
    INSERT OR IGNORE INTO maze_presets (id, name, description, current_node, target_node, active_calendar, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const presets: [string, string, string, string, string, string, string][] = [
    ['leap-second', '预设一：闰秒堆积陷阱', '探索闰秒累积导致的时间偏移，发现隐藏的闰秒陷阱节点', 'start', 'target', 'gregorian', '0'],
    ['calendar-gap', '预设二：历法断代跳跃', '穿越1582年格里高利历改革造成的10天断层', 'start', 'target', 'lunar', '1'],
    ['cyclic-loop', '预设三：周期性循环死路', '玛雅历与农历的周期性共振形成的无限循环', 'start', 'target', 'mayan', '6'],
    ['coordinate-conflict', '预设四：多历法坐标冲突', '四种历法在春分点附近的坐标冲突与转换精度丢失', 'start', 'target', 'persian', '4']
  ];

  for (const preset of presets) {
    insertPreset.run(preset[0], preset[1], preset[2], preset[3], preset[4], preset[5], parseInt(preset[6]));
  }
}

export function getNodeById(id: string) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM time_nodes WHERE id = ?').get(id);
}

export function getAllNodes() {
  const database = getDatabase();
  return database.prepare('SELECT * FROM time_nodes').all();
}

export function getUnlockedNodes() {
  const database = getDatabase();
  return database.prepare('SELECT * FROM time_nodes WHERE unlocked = 1').all();
}

export function unlockNode(id: string) {
  const database = getDatabase();
  return database.prepare('UPDATE time_nodes SET unlocked = 1 WHERE id = ?').run(id);
}

export function getConnections() {
  const database = getDatabase();
  return database.prepare('SELECT * FROM connections').all();
}

export function getConversionRules() {
  const database = getDatabase();
  return database.prepare('SELECT * FROM conversion_rules').all();
}

export function discoverRule(id: string) {
  const database = getDatabase();
  return database.prepare('UPDATE conversion_rules SET discovered = 1 WHERE id = ?').run(id);
}

export function getPreset(id: string) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM maze_presets WHERE id = ?').get(id);
}

export function savePath(sessionId: string, fromNode: string, toNode: string, path: string[], cost: number, warnings: string[]) {
  const database = getDatabase();
  const insertPath = database.prepare(`
    INSERT INTO path_history (session_id, from_node, to_node, path, cost, warnings)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return insertPath.run(sessionId, fromNode, toNode, JSON.stringify(path), cost, JSON.stringify(warnings));
}

export function getPathHistory(sessionId: string) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM path_history WHERE session_id = ? ORDER BY created_at DESC LIMIT 10').all(sessionId);
}

export function saveSession(sessionId: string, state: {
  currentNode: string;
  targetNode: string;
  activeCalendar: string;
  timezone: number;
  unlockedNodes: string[];
  discoveredRules: string[];
}) {
  const database = getDatabase();
  const insertSession = database.prepare(`
    INSERT OR REPLACE INTO user_sessions (id, current_node, target_node, active_calendar, timezone, unlocked_nodes, discovered_rules, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  return insertSession.run(
    sessionId,
    state.currentNode,
    state.targetNode,
    state.activeCalendar,
    state.timezone,
    JSON.stringify(state.unlockedNodes),
    JSON.stringify(state.discoveredRules)
  );
}

export function getSession(sessionId: string) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM user_sessions WHERE id = ?').get(sessionId);
}
