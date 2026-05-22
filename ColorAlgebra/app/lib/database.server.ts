import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "color_algebra.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS color_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      l REAL NOT NULL,
      a REAL NOT NULL,
      b REAL NOT NULL,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS algebra_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      source_l REAL NOT NULL,
      source_a REAL NOT NULL,
      source_b REAL NOT NULL,
      target_l REAL NOT NULL,
      target_a REAL NOT NULL,
      target_b REAL NOT NULL,
      operator_l REAL DEFAULT 0,
      operator_a REAL DEFAULT 0,
      operator_b REAL DEFAULT 0,
      is_closed INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      input_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      is_valid INTEGER DEFAULT 1,
      error_message TEXT,
      execution_time REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      config_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_axiom_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closure INTEGER DEFAULT 0,
      associativity INTEGER DEFAULT 0,
      identity INTEGER DEFAULT 0,
      inverse INTEGER DEFAULT 0,
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const presetCheck = db.prepare("SELECT COUNT(*) as count FROM presets");
  if ((presetCheck.get() as { count: number }).count === 0) {
    const insertPreset = db.prepare(
      "INSERT INTO presets (name, description, config_json) VALUES (?, ?, ?)"
    );

    insertPreset.run(
      "non-associative-mixing",
      "预设一：非结合律色彩混合 - (A+B)+C ≠ A+(B+C)，展示浮点误差累积",
      JSON.stringify({
        type: "non_associative",
        colors: [
          { l: 50, a: 80, b: 20, label: "A" },
          { l: 60, a: -60, b: 40, label: "B" },
          { l: 40, a: 30, b: -50, label: "C" }
        ],
        operation: "add",
        epsilon: 0.001
      })
    );

    insertPreset.run(
      "zero-element-absorb",
      "预设二：零元色彩吞噬 - 任何色彩与零元运算结果为零元",
      JSON.stringify({
        type: "zero_absorb",
        zeroElement: { l: 0, a: 0, b: 0, label: "Null" },
        colors: [
          { l: 70, a: 60, b: 30, label: "X" },
          { l: 80, a: -40, b: 50, label: "Y" }
        ],
        operation: "multiply"
      })
    );

    insertPreset.run(
      "inverse-element-cancel",
      "预设三：逆元色彩抵消 - 色彩与其逆元运算结果为恒等元",
      JSON.stringify({
        type: "inverse_cancel",
        identity: { l: 100, a: 0, b: 0, label: "Identity" },
        pairs: [
          { color: { l: 50, a: 80, b: 20 }, inverse: { l: 50, a: -80, b: -20 } },
          { color: { l: 30, a: -60, b: 40 }, inverse: { l: 30, a: 60, b: -40 } }
        ]
      })
    );

    insertPreset.run(
      "singular-color-mapping",
      "预设四：奇异色彩映射 - 非线性变换导致的度量失真",
      JSON.stringify({
        type: "singular_mapping",
        baseColors: [
          { l: 20, a: 40, b: 10 },
          { l: 50, a: 80, b: 60 },
          { l: 80, a: -30, b: -20 }
        ],
        transform: "nonlinear_warp",
        gamma: 2.2
      })
    );
  }
}

export type ColorSample = {
  id: number;
  l: number;
  a: number;
  b: number;
  label: string | null;
  created_at: string;
};

export type AlgebraRule = {
  id: number;
  name: string;
  rule_type: string;
  source_l: number;
  source_a: number;
  source_b: number;
  target_l: number;
  target_a: number;
  target_b: number;
  operator_l: number;
  operator_a: number;
  operator_b: number;
  is_closed: number;
  created_at: string;
};

export type Preset = {
  id: number;
  name: string;
  description: string;
  config_json: string;
  created_at: string;
};
