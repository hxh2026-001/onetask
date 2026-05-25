import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "cube_states.db");
const db = new Database(dbPath);

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

app.get("/api/states", (req, res) => {
  const action = req.query.action;

  if (action === "count") {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM cube_states");
    const result = stmt.get() as { count: number };
    return res.json({ count: result.count });
  }

  if (action === "list") {
    const stmt = db.prepare(
      "SELECT * FROM cube_states ORDER BY created_at DESC LIMIT 100"
    );
    const states = stmt.all();
    return res.json({ states });
  }

  if (action === "get") {
    const hash = req.query.hash as string;
    if (hash) {
      const stmt = db.prepare("SELECT * FROM cube_states WHERE state_hash = ?");
      const state = stmt.get(hash);
      return res.json({ state });
    }
  }

  res.json({ error: "Invalid action" });
});

app.post("/api/states", (req, res) => {
  const {
    action,
    state,
    solutionLength,
    solutionMoves,
    isValid,
    searchTime,
    nodesSearched,
    memoryUsed,
    hash,
  } = req.body;

  if (action === "save") {
    const { cornerIndex, edgeIndex, fullIndex, binary } = encodeState(state);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cube_states
      (state_hash, corner_index, edge_index, binary_encoding, solution_length,
       solution_moves, is_valid, search_time, nodes_searched, memory_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      fullIndex,
      cornerIndex,
      edgeIndex,
      binary,
      solutionLength || null,
      solutionMoves || null,
      isValid ? 1 : 0,
      searchTime || null,
      nodesSearched || null,
      memoryUsed || null
    );

    return res.json({ id: result.lastInsertRowid, hash: fullIndex });
  }

  if (action === "delete") {
    const stmt = db.prepare("DELETE FROM cube_states WHERE state_hash = ?");
    const result = stmt.run(hash);
    return res.json({ deleted: result.changes > 0 });
  }

  if (action === "encode") {
    const encoded = encodeState(state);
    return res.json(encoded);
  }

  res.json({ error: "Invalid action" });
});

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function permutationToIndex(perm: number[]): number {
  const n = perm.length;
  let index = 0;
  const used = new Array(n).fill(false);

  for (let i = 0; i < n; i++) {
    let count = 0;
    for (let j = 0; j < perm[i]; j++) {
      if (!used[j]) count++;
    }
    used[perm[i]] = true;
    index += count * factorial(n - 1 - i);
  }
  return index;
}

function encodeOrientation(orient: number[], base: number): number {
  let result = 0;
  for (let i = 0; i < orient.length - 1; i++) {
    result = result * base + orient[i];
  }
  return result;
}

function encodeState(state: any) {
  const cornerPermIdx = permutationToIndex(state.cornerPermutation);
  const cornerOrientIdx = encodeOrientation(state.cornerOrientation, 3);
  const edgePermIdx = permutationToIndex(state.edgePermutation);
  const edgeOrientIdx = encodeOrientation(state.edgeOrientation, 2);

  const cornerIndex = cornerPermIdx * 2187 + cornerOrientIdx;
  const edgeIndex = edgePermIdx * 2048 + edgeOrientIdx;
  const fullIndex = `${cornerIndex}-${edgeIndex}`;

  const cornerBinary = cornerIndex.toString(2).padStart(20, "0");
  const edgeBinary = edgeIndex.toString(2).padStart(22, "0");
  const binary = cornerBinary + edgeBinary;

  return { cornerIndex, edgeIndex, fullIndex, binary };
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
});
