"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
exports.getDatabase = getDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class DatabaseManager {
    constructor(dbPath) {
        const dbFilePath = dbPath || path_1.default.join(process.cwd(), 'compiler_sandbox.db');
        this.db = new better_sqlite3_1.default(dbFilePath);
        this.initTables();
    }
    initTables() {
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
    saveSnippet(code, scenario, result) {
        const id = (0, uuid_1.v4)();
        const stmt = this.db.prepare('INSERT INTO code_snippets (id, code, scenario, result) VALUES (?, ?, ?, ?)');
        stmt.run(id, code, scenario, result || null);
        return this.getSnippet(id);
    }
    getSnippet(id) {
        const stmt = this.db.prepare('SELECT * FROM code_snippets WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            code: row.code,
            scenario: row.scenario,
            createdAt: row.created_at,
            result: row.result ? JSON.parse(row.result) : undefined,
        };
    }
    getSnippets(limit = 50) {
        const stmt = this.db.prepare('SELECT * FROM code_snippets ORDER BY created_at DESC LIMIT ?');
        const rows = stmt.all(limit);
        return rows.map(row => ({
            id: row.id,
            code: row.code,
            scenario: row.scenario,
            createdAt: row.created_at,
            result: row.result ? JSON.parse(row.result) : undefined,
        }));
    }
    deleteSnippet(id) {
        const stmt = this.db.prepare('DELETE FROM code_snippets WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    saveErrorLog(snippetId, phase, message, line, column) {
        const id = (0, uuid_1.v4)();
        const stmt = this.db.prepare('INSERT INTO error_logs (id, snippet_id, phase, message, line, column) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(id, snippetId, phase, message, line, column);
        return this.getErrorLog(id);
    }
    getErrorLog(id) {
        const stmt = this.db.prepare('SELECT * FROM error_logs WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
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
    getErrorLogs(snippetId, limit = 100) {
        let stmt;
        let params;
        if (snippetId) {
            stmt = this.db.prepare('SELECT * FROM error_logs WHERE snippet_id = ? ORDER BY created_at DESC LIMIT ?');
            params = [snippetId, limit];
        }
        else {
            stmt = this.db.prepare('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?');
            params = [limit];
        }
        const rows = stmt.all(...params);
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
    clearAll() {
        this.db.exec('DELETE FROM error_logs; DELETE FROM code_snippets;');
    }
    close() {
        this.db.close();
    }
}
exports.DatabaseManager = DatabaseManager;
let dbInstance = null;
function getDatabase() {
    if (!dbInstance) {
        dbInstance = new DatabaseManager();
    }
    return dbInstance;
}
//# sourceMappingURL=DatabaseManager.js.map