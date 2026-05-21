import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function useDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(process.cwd(), 'data', 'heraldry.db')
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    db = new Database(dbPath)
    initTables(db)
  }
  return db
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS arms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      family_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS layers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arms_id INTEGER NOT NULL,
      layer_type TEXT NOT NULL,
      shape TEXT,
      tincture TEXT,
      color_hex TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      width REAL DEFAULT 100,
      height REAL DEFAULT 100,
      z_index INTEGER DEFAULT 0,
      parent_layer_id INTEGER,
      path_data TEXT,
      FOREIGN KEY (arms_id) REFERENCES arms(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_layer_id) REFERENCES layers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS heraldry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arms_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT,
      generation INTEGER,
      ancestor_arms_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (arms_id) REFERENCES arms(id) ON DELETE CASCADE,
      FOREIGN KEY (ancestor_arms_id) REFERENCES arms(id)
    );

    CREATE TABLE IF NOT EXISTS validation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS family_tree (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arms_id INTEGER NOT NULL,
      person_name TEXT NOT NULL,
      generation INTEGER NOT NULL,
      parent_id INTEGER,
      FOREIGN KEY (arms_id) REFERENCES arms(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES family_tree(id)
    );
  `)

  const rules = db.prepare('SELECT COUNT(*) as count FROM validation_rules').get() as { count: number }
  if (rules.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO validation_rules (rule_code, rule_name, description) VALUES (?, ?, ?)
    `)
    insertRule.run('TINCTURE_RULE', '色彩对比律', '金属色不可叠加金属色，颜色色不可叠加颜色色')
    insertRule.run('INHERITANCE_RULE', '继承规则', '长子继承完整纹章，次子需加标识')
    insertRule.run('MARSHALING_RULE', '婚姻合并规则', '夫妻纹章并列或分区展示')
  }
}
