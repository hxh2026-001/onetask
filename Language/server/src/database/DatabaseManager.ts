import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CodeSnippet, ErrorLog } from '../types/compiler';

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const dbFilePath = dbPath || path.join(process.cwd(), 'compiler_sandbox.db');
    this.db = new Database(dbFilePath);
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS code_snippets (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        scenario TEXT NOT NULL DEFAULT 'custom',
        result TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS error_logs (
        id TEXT PRIMARY KEY,
        snippet_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        message TEXT NOT NULL,
        line INTEGER NOT NULL DEFAULT 0,
        column INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (snippet_id) REFERENCES code_snippets(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_error_logs_snippet_id ON error_logs(snippet_id);
      CREATE INDEX IF NOT EXISTS idx_code_snippets_created_at ON code_snippets(created_at DESC);
    `);
  }

  saveSnippet(code: string, scenario: string, result?: string): CodeSnippet {
    const id = uuidv4();
    const stmt = this.db.prepare(
      'INSERT INTO code_snippets (id, code, scenario, result) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, code, scenario, result || null);

    return this.getSnippet(id)!;
  }

  getSnippet(id: string): CodeSnippet | null {
    const stmt = this.db.prepare('SELECT * FROM code_snippets WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      code: row.code,
      scenario: row.scenario,
      createdAt: row.created_at,
      result: row.result ? JSON.parse(row.result) : undefined,
    };
  }

  getSnippets(limit: number = 50): CodeSnippet[] {
    const stmt = this.db.prepare(
      'SELECT * FROM code_snippets ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      code: row.code,
      scenario: row.scenario,
      createdAt: row.created_at,
      result: row.result ? JSON.parse(row.result) : undefined,
    }));
  }

  deleteSnippet(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM code_snippets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  saveErrorLog(snippetId: string, phase: string, message: string, line: number, column: number): ErrorLog {
    const id = uuidv4();
    const stmt = this.db.prepare(
      'INSERT INTO error_logs (id, snippet_id, phase, message, line, column) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, snippetId, phase, message, line, column);

    return this.getErrorLog(id)!;
  }

  getErrorLog(id: string): ErrorLog | null {
    const stmt = this.db.prepare('SELECT * FROM error_logs WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      snippetId: row.snippet_id,
      phase: row.phase,
      message: row.message,
      line: row.line,
      column: row.column,
      createdAt: row.created_at,
    };
  }

  getErrorLogs(snippetId?: string, limit: number = 100): ErrorLog[] {
    let stmt: Database.Statement;
    let params: any[];

    if (snippetId) {
      stmt = this.db.prepare(
        'SELECT * FROM error_logs WHERE snippet_id = ? ORDER BY created_at DESC LIMIT ?'
      );
      params = [snippetId, limit];
    } else {
      stmt = this.db.prepare(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?'
      );
      params = [limit];
    }

    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      snippetId: row.snippet_id,
      phase: row.phase,
      message: row.message,
      line: row.line,
      column: row.column,
      createdAt: row.created_at,
    }));
  }

  clearAll(): void {
    this.db.exec('DELETE FROM error_logs; DELETE FROM code_snippets;');
  }

  close(): void {
    this.db.close();
  }
}

let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}
