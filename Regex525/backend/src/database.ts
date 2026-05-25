import Database from 'better-sqlite3';
import { RegexHistory, AutomatonSnapshot, MatchLog, MatchResult, NFA, DFA, MinimizedDFA } from './types.js';

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS regex_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        test_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        result TEXT
      );

      CREATE TABLE IF NOT EXISTS automaton_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regex_history_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        snapshot TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (regex_history_id) REFERENCES regex_history(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS match_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regex_history_id INTEGER NOT NULL,
        steps TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (regex_history_id) REFERENCES regex_history(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_history_created ON regex_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_snapshots_history ON automaton_snapshots(regex_history_id);
      CREATE INDEX IF NOT EXISTS idx_logs_history ON match_logs(regex_history_id);
    `);
  }

  saveRegexHistory(pattern: string, testText: string, result: MatchResult | null): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO regex_history (pattern, test_text, created_at, result)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(pattern, testText, now, result ? JSON.stringify(result) : null);
    return Number(info.lastInsertRowid);
  }

  saveAutomatonSnapshot(regexHistoryId: number, type: 'NFA' | 'DFA' | 'MINIMIZED_DFA', snapshot: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO automaton_snapshots (regex_history_id, type, snapshot, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(regexHistoryId, type, snapshot, now);
  }

  saveMatchLog(regexHistoryId: number, steps: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO match_logs (regex_history_id, steps, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(regexHistoryId, steps, now);
  }

  getRegexHistory(limit: number = 50): RegexHistory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM regex_history ORDER BY created_at DESC LIMIT ?
    `);
    const rows = stmt.all(limit) as Array<{
      id: number;
      pattern: string;
      test_text: string;
      created_at: string;
      result: string | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      pattern: row.pattern,
      testText: row.test_text,
      createdAt: row.created_at,
      result: row.result ? JSON.parse(row.result) : null
    }));
  }

  getAutomatonSnapshots(regexHistoryId: number): AutomatonSnapshot[] {
    const stmt = this.db.prepare(`
      SELECT * FROM automaton_snapshots WHERE regex_history_id = ? ORDER BY id
    `);
    const rows = stmt.all(regexHistoryId) as Array<{
      id: number;
      regex_history_id: number;
      type: string;
      snapshot: string;
      created_at: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      regexHistoryId: row.regex_history_id,
      type: row.type as 'NFA' | 'DFA' | 'MINIMIZED_DFA',
      snapshot: row.snapshot,
      createdAt: row.created_at
    }));
  }

  getMatchLogs(regexHistoryId: number): MatchLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM match_logs WHERE regex_history_id = ? ORDER BY id
    `);
    const rows = stmt.all(regexHistoryId) as Array<{
      id: number;
      regex_history_id: number;
      steps: string;
      created_at: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      regexHistoryId: row.regex_history_id,
      steps: row.steps,
      createdAt: row.created_at
    }));
  }

  deleteRegexHistory(id: number): void {
    const stmt = this.db.prepare('DELETE FROM regex_history WHERE id = ?');
    stmt.run(id);
  }

  clearHistory(): void {
    this.db.exec('DELETE FROM match_logs; DELETE FROM automaton_snapshots; DELETE FROM regex_history;');
  }

  serializeNFA(nfa: NFA): string {
    return JSON.stringify({
      states: [...nfa.states.entries()].map(([id, state]) => ({
        id,
        transitions: [...state.transitions.entries()].map(([sym, targets]) => ({
          symbol: sym,
          targets: [...targets]
        })),
        isAccept: state.isAccept,
        label: state.label
      })),
      start: nfa.start,
      accept: nfa.accept,
      alphabet: [...nfa.alphabet],
      buildSteps: nfa.buildSteps.map(step => ({
        step: step.step,
        description: step.description,
        states: [...step.states.entries()].map(([id, state]) => ({
          id,
          transitions: [...state.transitions.entries()].map(([sym, targets]) => ({
            symbol: sym,
            targets: [...targets]
          })),
          isAccept: state.isAccept,
          label: state.label
        })),
        start: step.start,
        accept: step.accept,
        newStateIds: step.newStateIds,
        newTransitions: step.newTransitions
      }))
    });
  }

  serializeDFA(dfa: DFA): string {
    return JSON.stringify({
      states: [...dfa.states.entries()].map(([id, state]) => ({
        id,
        nfaStates: [...state.nfaStates],
        transitions: [...state.transitions.entries()],
        isAccept: state.isAccept,
        isStart: state.isStart,
        label: state.label
      })),
      start: dfa.start,
      acceptStates: [...dfa.acceptStates],
      alphabet: [...dfa.alphabet],
      buildSteps: dfa.buildSteps.map(step => ({
        step: step.step,
        description: step.description,
        dfaStates: [...step.dfaStates.entries()].map(([id, state]) => ({
          id,
          nfaStates: [...state.nfaStates],
          transitions: [...state.transitions.entries()],
          isAccept: state.isAccept,
          isStart: state.isStart,
          label: state.label
        })),
        epsilonClosureSteps: step.epsilonClosureSteps.map(ecs => ({
          fromState: ecs.fromState,
          visitedStates: [...ecs.visitedStates],
          newVisited: [...ecs.newVisited],
          wave: ecs.wave
        })),
        newStateId: step.newStateId,
        transitionDetails: step.transitionDetails
      }))
    });
  }

  serializeMinimizedDFA(minimizedDfa: MinimizedDFA): string {
    return JSON.stringify({
      states: [...minimizedDfa.states.entries()].map(([id, state]) => ({
        id,
        originalStates: [...state.originalStates],
        transitions: [...state.transitions.entries()],
        isAccept: state.isAccept,
        isStart: state.isStart
      })),
      start: minimizedDfa.start,
      acceptStates: [...minimizedDfa.acceptStates],
      alphabet: [...minimizedDfa.alphabet],
      equivalenceClasses: minimizedDfa.equivalenceClasses,
      mergeSteps: minimizedDfa.mergeSteps
    });
  }

  close(): void {
    this.db.close();
  }
}
