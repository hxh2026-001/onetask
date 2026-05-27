import Database from 'better-sqlite3'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'syntax.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initializeDb(db)
  }
  return db
}

function initializeDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS lexicon (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      pos TEXT NOT NULL,
      attrs TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      state TEXT NOT NULL,
      result TEXT NOT NULL,
      score REAL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS parse_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sentence TEXT NOT NULL,
      parse_result TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_lexicon_word ON lexicon(word);
    CREATE INDEX IF NOT EXISTS idx_transitions_action ON transitions(action);
  `)

  const count = database.prepare('SELECT COUNT(*) as cnt FROM lexicon').get() as { cnt: number }
  if (count.cnt === 0) {
    seedLexicon(database)
  }
}

function seedLexicon(database: Database.Database) {
  const words = [
    { word: '我', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 1 }) },
    { word: '你', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 2 }) },
    { word: '他', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 3 }) },
    { word: '她', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 3 }) },
    { word: '它', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 3 }) },
    { word: '我们', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 1 }) },
    { word: '你们', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 2 }) },
    { word: '他们', pos: 'PN', attrs: JSON.stringify({ type: 'personal', person: 3 }) },

    { word: '是', pos: 'VC', attrs: JSON.stringify({ type: 'copula' }) },
    { word: '在', pos: 'P', attrs: JSON.stringify({}) },
    { word: '有', pos: 'VE', attrs: JSON.stringify({}) },

    { word: '看', pos: 'VV', attrs: JSON.stringify({ verb_type: 'action' }) },
    { word: '吃', pos: 'VV', attrs: JSON.stringify({ verb_type: 'action' }) },
    { word: '喝', pos: 'VV', attrs: JSON.stringify({ verb_type: 'action' }) },
    { word: '走', pos: 'VV', attrs: JSON.stringify({ verb_type: 'movement' }) },
    { word: '跑', pos: 'VV', attrs: JSON.stringify({ verb_type: 'movement' }) },
    { word: '飞', pos: 'VV', attrs: JSON.stringify({ verb_type: 'movement' }) },
    { word: '喜欢', pos: 'VV', attrs: JSON.stringify({ verb_type: 'cognitive' }) },
    { word: '爱', pos: 'VV', attrs: JSON.stringify({ verb_type: 'emotion' }) },
    { word: '知道', pos: 'VV', attrs: JSON.stringify({ verb_type: 'cognitive' }) },
    { word: '认为', pos: 'VV', attrs: JSON.stringify({ verb_type: 'cognitive' }) },
    { word: '相信', pos: 'VV', attrs: JSON.stringify({ verb_type: 'cognitive' }) },
    { word: '使', pos: 'VV', attrs: JSON.stringify({ verb_type: 'causative' }) },
    { word: '让', pos: 'VV', attrs: JSON.stringify({ verb_type: 'causative' }) },
    { word: '给', pos: 'VV', attrs: JSON.stringify({ verb_type: 'give' }) },
    { word: '送', pos: 'VV', attrs: JSON.stringify({ verb_type: 'give' }) },
    { word: '拿', pos: 'VV', attrs: JSON.stringify({ verb_type: 'take' }) },
    { word: '打', pos: 'VV', attrs: JSON.stringify({ verb_type: 'action' }) },
    { word: '说', pos: 'VV', attrs: JSON.stringify({ verb_type: 'communication' }) },
    { word: '想', pos: 'VV', attrs: JSON.stringify({ verb_type: 'cognitive' }) },

    { word: '的', pos: 'DEC', attrs: JSON.stringify({}) },
    { word: '了', pos: 'AS', attrs: JSON.stringify({}) },
    { word: '着', pos: 'AS', attrs: JSON.stringify({}) },
    { word: '过', pos: 'AS', attrs: JSON.stringify({}) },
    { word: '吗', pos: 'Q', attrs: JSON.stringify({}) },
    { word: '呢', pos: 'Q', attrs: JSON.stringify({}) },
    { word: '吧', pos: 'Q', attrs: JSON.stringify({}) },

    { word: '和', pos: 'CC', attrs: JSON.stringify({}) },
    { word: '与', pos: 'CC', attrs: JSON.stringify({}) },
    { word: '或', pos: 'CC', attrs: JSON.stringify({}) },
    { word: '但是', pos: 'CC', attrs: JSON.stringify({}) },
    { word: '而且', pos: 'CC', attrs: JSON.stringify({}) },

    { word: '这', pos: 'DT', attrs: JSON.stringify({ demonstrative: 'proximal' }) },
    { word: '那', pos: 'DT', attrs: JSON.stringify({ demonstrative: 'distal' }) },
    { word: '这个', pos: 'DT', attrs: JSON.stringify({ demonstrative: 'proximal' }) },
    { word: '那个', pos: 'DT', attrs: JSON.stringify({ demonstrative: 'distal' }) },

    { word: '一', pos: 'CD', attrs: JSON.stringify({}) },
    { word: '两', pos: 'CD', attrs: JSON.stringify({}) },
    { word: '三', pos: 'CD', attrs: JSON.stringify({}) },
    { word: '十', pos: 'CD', attrs: JSON.stringify({}) },
    { word: '百', pos: 'CD', attrs: JSON.stringify({}) },

    { word: '个', pos: 'M', attrs: JSON.stringify({ measure: 'classifier' }) },
    { word: '只', pos: 'M', attrs: JSON.stringify({ measure: 'classifier' }) },
    { word: '条', pos: 'M', attrs: JSON.stringify({ measure: 'classifier' }) },
    { word: '本', pos: 'M', attrs: JSON.stringify({ measure: 'classifier' }) },

    { word: '大', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'size' }) },
    { word: '小', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'size' }) },
    { word: '好', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'evaluation' }) },
    { word: '新', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'newness' }) },
    { word: '老', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'age' }) },
    { word: '红', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'color' }) },
    { word: '漂亮', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'evaluation' }) },
    { word: '长', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'length' }) },
    { word: '短', pos: 'JJ', attrs: JSON.stringify({ adjective_type: 'length' }) },

    { word: '不', pos: 'AD', attrs: JSON.stringify({ negation: true }) },
    { word: '很', pos: 'AD', attrs: JSON.stringify({ degree: 'very' }) },
    { word: '非常', pos: 'AD', attrs: JSON.stringify({ degree: 'very' }) },
    { word: '也', pos: 'AD', attrs: JSON.stringify({ additive: true }) },
    { word: '都', pos: 'AD', attrs: JSON.stringify({}) },
    { word: '还', pos: 'AD', attrs: JSON.stringify({}) },

    { word: '人', pos: 'N', attrs: JSON.stringify({ noun_type: 'common' }) },
    { word: '猫', pos: 'N', attrs: JSON.stringify({ noun_type: 'common' }) },
    { word: '狗', pos: 'N', attrs: JSON.stringify({ noun_type: 'common' }) },
    { word: '书', pos: 'N', attrs: JSON.stringify({ noun_type: 'common' }) },
    { word: '苹果', pos: 'N', attrs: JSON.stringify({ noun_type: 'common' }) },
    { word: '桌子', pos: 'N', attrs: JSON.stringify({ noun_type: 'common' }) },
    { word: '学校', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },
    { word: '城市', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },
    { word: '国家', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },
    { word: '时间', pos: 'N', attrs: JSON.stringify({ noun_type: 'abstract' }) },
    { word: '事情', pos: 'N', attrs: JSON.stringify({ noun_type: 'abstract' }) },
    { word: '问题', pos: 'N', attrs: JSON.stringify({ noun_type: 'abstract' }) },
    { word: '话', pos: 'N', attrs: JSON.stringify({ noun_type: 'abstract' }) },

    { word: '银行', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },
    { word: '医院', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },
    { word: '商店', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },

    { word: '去', pos: 'VV', attrs: JSON.stringify({ verb_type: 'movement', direction: 'away' }) },
    { word: '来', pos: 'VV', attrs: JSON.stringify({ verb_type: 'movement', direction: 'toward' }) },

    { word: '把', pos: 'BA', attrs: JSON.stringify({}) },
    { word: '被', pos: 'SB', attrs: JSON.stringify({}) },

    { word: '如果', pos: 'CS', attrs: JSON.stringify({}) },
    { word: '因为', pos: 'CS', attrs: JSON.stringify({}) },
    { word: '所以', pos: 'CS', attrs: JSON.stringify({}) },

    { word: '花园', pos: 'N', attrs: JSON.stringify({ noun_type: 'place' }) },
    { word: '路径', pos: 'N', attrs: JSON.stringify({}) },
    { word: '中心', pos: 'N', attrs: JSON.stringify({}) },
    { word: '词', pos: 'N', attrs: JSON.stringify({}) },
    { word: '悬空', pos: 'JJ', attrs: JSON.stringify({}) },
    { word: '并列', pos: 'JJ', attrs: JSON.stringify({}) },
    { word: '结构', pos: 'N', attrs: JSON.stringify({}) },
    { word: '长距离', pos: 'JJ', attrs: JSON.stringify({}) },
    { word: '依赖', pos: 'N', attrs: JSON.stringify({}) },
  ]

  const insert = database.prepare('INSERT INTO lexicon (word, pos, attrs) VALUES (?, ?, ?)')
  const insertMany = database.transaction((items) => {
    for (const item of items) {
      insert.run(item.word, item.pos, item.attrs)
    }
  })
  insertMany(words)
}

export function lookupWord(word: string) {
  const db = getDb()
  return db.prepare('SELECT * FROM lexicon WHERE word = ?').get(word) as any
}

export function saveParseResult(sentence: string, parseResult: string) {
  const db = getDb()
  db.prepare('INSERT INTO parse_history (sentence, parse_result) VALUES (?, ?)').run(sentence, parseResult)
}

export function getTransition(state: string, action: string) {
  const db = getDb()
  return db.prepare('SELECT * FROM transitions WHERE state = ? AND action = ?').get(state, action) as any
}
