import { CodeSnippet, ErrorLog } from '../types/compiler';
export declare class DatabaseManager {
    private db;
    constructor(dbPath?: string);
    private initTables;
    saveSnippet(code: string, scenario: string, result?: string): CodeSnippet;
    getSnippet(id: string): CodeSnippet | null;
    getSnippets(limit?: number): CodeSnippet[];
    deleteSnippet(id: string): boolean;
    saveErrorLog(snippetId: string, phase: string, message: string, line: number, column: number): ErrorLog;
    getErrorLog(id: string): ErrorLog | null;
    getErrorLogs(snippetId?: string, limit?: number): ErrorLog[];
    clearAll(): void;
    close(): void;
}
export declare function getDatabase(): DatabaseManager;
//# sourceMappingURL=DatabaseManager.d.ts.map