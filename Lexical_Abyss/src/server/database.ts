import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/regex_test.db');

export interface RegexPattern {
  id: number;
  pattern: string;
  name: string;
  description: string;
  created_at: string;
}

export interface TestCase {
  id: number;
  pattern_id: number;
  input: string;
  expected_match: boolean;
  actual_match: boolean | null;
  backtrack_count: number | null;
  time_ms: number | null;
  trap_detected: boolean;
  trap_type: string | null;
  created_at: string;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS regex_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS test_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_id INTEGER NOT NULL,
        input TEXT NOT NULL,
        expected_match BOOLEAN NOT NULL,
        actual_match BOOLEAN,
        backtrack_count INTEGER,
        time_ms INTEGER,
        trap_detected BOOLEAN DEFAULT FALSE,
        trap_type TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pattern_id) REFERENCES regex_patterns(id) ON DELETE CASCADE
      );
    `);
  }

  savePattern(pattern: string, name: string, description: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO regex_patterns (pattern, name, description)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(pattern, name, description);
    return result.lastInsertRowid as number;
  }

  getPatterns(): RegexPattern[] {
    const stmt = this.db.prepare('SELECT * FROM regex_patterns ORDER BY created_at DESC');
    return stmt.all() as RegexPattern[];
  }

  getPatternById(id: number): RegexPattern | undefined {
    const stmt = this.db.prepare('SELECT * FROM regex_patterns WHERE id = ?');
    return stmt.get(id) as RegexPattern | undefined;
  }

  deletePattern(id: number): void {
    const stmt = this.db.prepare('DELETE FROM regex_patterns WHERE id = ?');
    stmt.run(id);
  }

  saveTestCase(patternId: number, input: string, expectedMatch: boolean): number {
    const stmt = this.db.prepare(`
      INSERT INTO test_cases (pattern_id, input, expected_match)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(patternId, input, expectedMatch);
    return result.lastInsertRowid as number;
  }

  updateTestCase(
    id: number,
    actualMatch: boolean,
    backtrackCount: number,
    timeMs: number,
    trapDetected: boolean,
    trapType: string | null
  ): void {
    const stmt = this.db.prepare(`
      UPDATE test_cases
      SET actual_match = ?, backtrack_count = ?, time_ms = ?, trap_detected = ?, trap_type = ?
      WHERE id = ?
    `);
    stmt.run(actualMatch, backtrackCount, timeMs, trapDetected, trapType, id);
  }

  getTestCases(patternId: number): TestCase[] {
    const stmt = this.db.prepare('SELECT * FROM test_cases WHERE pattern_id = ? ORDER BY created_at DESC');
    return stmt.all(patternId) as TestCase[];
  }

  deleteTestCase(id: number): void {
    const stmt = this.db.prepare('DELETE FROM test_cases WHERE id = ?');
    stmt.run(id);
  }

  close(): void {
    this.db.close();
  }
}

export const dbManager = new DatabaseManager();
