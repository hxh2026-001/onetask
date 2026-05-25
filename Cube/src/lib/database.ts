import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

function getDataDir(): string {
  const dir = path.resolve("./data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDatabase(): Database.Database {
  if (db) return db;

  const dataDir = getDataDir();
  const dbPath = path.join(dataDir, "cube_states.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS cube_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state_hash TEXT UNIQUE NOT NULL,
      corner_index INTEGER NOT NULL,
      edge_index INTEGER NOT NULL,
      binary_encoding TEXT NOT NULL,
      solution_length INTEGER,
      solution_moves TEXT,
      is_valid INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      search_time INTEGER,
      nodes_searched INTEGER,
      memory_used INTEGER
    );

    CREATE TABLE IF NOT EXISTS search_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state_hash TEXT NOT NULL,
      heuristic_value INTEGER NOT NULL,
      depth INTEGER NOT NULL,
      parent_hash TEXT,
      move_to_parent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cube_states_hash ON cube_states(state_hash);
    CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache(state_hash);
  `);

  return db;
}

export interface StoredState {
  id: number;
  state_hash: string;
  corner_index: number;
  edge_index: number;
  binary_encoding: string;
  solution_length: number | null;
  solution_moves: string | null;
  is_valid: number;
  created_at: string;
  search_time: number | null;
  nodes_searched: number | null;
  memory_used: number | null;
}

export function saveState(
  stateHash: string,
  cornerIndex: number,
  edgeIndex: number,
  binaryEncoding: string,
  solutionLength: number | null,
  solutionMoves: string | null,
  isValid: boolean,
  searchTime: number | null,
  nodesSearched: number | null,
  memoryUsed: number | null
): number {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO cube_states
    (state_hash, corner_index, edge_index, binary_encoding, solution_length,
     solution_moves, is_valid, search_time, nodes_searched, memory_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    stateHash,
    cornerIndex,
    edgeIndex,
    binaryEncoding,
    solutionLength,
    solutionMoves,
    isValid ? 1 : 0,
    searchTime,
    nodesSearched,
    memoryUsed
  );

  return result.lastInsertRowid as number;
}

export function getState(stateHash: string): StoredState | null {
  const database = getDatabase();
  const stmt = database.prepare("SELECT * FROM cube_states WHERE state_hash = ?");
  return stmt.get(stateHash) as StoredState | null;
}

export function getAllStates(): StoredState[] {
  const database = getDatabase();
  const stmt = database.prepare("SELECT * FROM cube_states ORDER BY created_at DESC LIMIT 100");
  return stmt.all() as StoredState[];
}

export function deleteState(stateHash: string): boolean {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM cube_states WHERE state_hash = ?");
  const result = stmt.run(stateHash);
  return result.changes > 0;
}

export function clearStates(): number {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM cube_states");
  const result = stmt.run();
  return result.changes;
}

export function getStateCount(): number {
  const database = getDatabase();
  const stmt = database.prepare("SELECT COUNT(*) as count FROM cube_states");
  const result = stmt.get() as { count: number };
  return result.count;
}

export function saveSearchCache(
  stateHash: string,
  heuristicValue: number,
  depth: number,
  parentHash: string | null,
  moveToParent: string | null
): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO search_cache (state_hash, heuristic_value, depth, parent_hash, move_to_parent)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(stateHash, heuristicValue, depth, parentHash, moveToParent);
}

export function getSearchCache(stateHash: string): {
  heuristic_value: number;
  depth: number;
  parent_hash: string | null;
  move_to_parent: string | null;
} | null {
  const database = getDatabase();
  const stmt = database.prepare(
    "SELECT heuristic_value, depth, parent_hash, move_to_parent FROM search_cache WHERE state_hash = ?"
  );
  return stmt.get(stateHash) as any;
}

export function clearSearchCache(): number {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM search_cache");
  const result = stmt.run();
  return result.changes;
}
