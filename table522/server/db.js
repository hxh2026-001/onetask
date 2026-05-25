import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'workbook.db');

let db;

export function initDB() {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cells (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_id INTEGER NOT NULL,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      raw TEXT DEFAULT '',
      value TEXT DEFAULT '',
      dtype TEXT DEFAULT 'string',
      UNIQUE(sheet_id, row, col),
      FOREIGN KEY(sheet_id) REFERENCES sheets(id)
    );
    CREATE TABLE IF NOT EXISTS eval_cache (
      cell_id INTEGER PRIMARY KEY,
      value TEXT,
      dtype TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(cell_id) REFERENCES cells(id)
    );
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
  `);
  return db;
}

export function getDB() {
  return db;
}
