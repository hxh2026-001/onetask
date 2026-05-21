import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/typeface.db');
const db = new Database(dbPath, { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS typefaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    glyphs TEXT NOT NULL,
    metrics TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS composition_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    settings TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertComposition = db.prepare(`
  INSERT INTO composition_history (content, settings) VALUES (?, ?)
`);

const getAllCompositions = db.prepare(`
  SELECT * FROM composition_history ORDER BY createdAt DESC
`);

const defaultGlyphs = {
  "regular": {
    "一": { width: 100, height: 140, advance: 100, baseline: 120 },
    "二": { width: 100, height: 140, advance: 100, baseline: 120 },
    "三": { width: 100, height: 140, advance: 100, baseline: 120 },
    "中": { width: 100, height: 140, advance: 100, baseline: 120 },
    "国": { width: 100, height: 140, advance: 100, baseline: 120 },
    "a": { width: 50, height: 80, advance: 50, baseline: 70 },
    "b": { width: 55, height: 90, advance: 55, baseline: 80 },
    "c": { width: 50, height: 80, advance: 50, baseline: 70 },
    "d": { width: 55, height: 90, advance: 55, baseline: 80 },
    "e": { width: 50, height: 80, advance: 50, baseline: 70 },
    "f": { width: 45, height: 90, advance: 45, baseline: 80 },
    "g": { width: 55, height: 100, advance: 55, baseline: 70 },
    "h": { width: 55, height: 90, advance: 55, baseline: 80 },
    "i": { width: 25, height: 90, advance: 25, baseline: 80 },
    "j": { width: 30, height: 100, advance: 30, baseline: 70 },
    "k": { width: 55, height: 90, advance: 55, baseline: 80 },
    "l": { width: 25, height: 90, advance: 25, baseline: 80 },
    "m": { width: 80, height: 80, advance: 80, baseline: 70 },
    "n": { width: 55, height: 80, advance: 55, baseline: 70 },
    "o": { width: 55, height: 80, advance: 55, baseline: 70 },
    "p": { width: 55, height: 100, advance: 55, baseline: 70 },
    "q": { width: 55, height: 100, advance: 55, baseline: 70 },
    "r": { width: 45, height: 80, advance: 45, baseline: 70 },
    "s": { width: 50, height: 80, advance: 50, baseline: 70 },
    "t": { width: 40, height: 90, advance: 40, baseline: 80 },
    "u": { width: 55, height: 80, advance: 55, baseline: 70 },
    "v": { width: 50, height: 80, advance: 50, baseline: 70 },
    "w": { width: 80, height: 80, advance: 80, baseline: 70 },
    "x": { width: 50, height: 80, advance: 50, baseline: 70 },
    "y": { width: 50, height: 100, advance: 50, baseline: 70 },
    "z": { width: 50, height: 80, advance: 50, baseline: 70 },
    "A": { width: 65, height: 90, advance: 65, baseline: 80 },
    "B": { width: 65, height: 90, advance: 65, baseline: 80 },
    "C": { width: 65, height: 90, advance: 65, baseline: 80 },
    "D": { width: 70, height: 90, advance: 70, baseline: 80 },
    "E": { width: 60, height: 90, advance: 60, baseline: 80 },
    "F": { width: 55, height: 90, advance: 55, baseline: 80 },
    "G": { width: 70, height: 90, advance: 70, baseline: 80 },
    "H": { width: 70, height: 90, advance: 70, baseline: 80 },
    "I": { width: 30, height: 90, advance: 30, baseline: 80 },
    "J": { width: 60, height: 100, advance: 60, baseline: 70 },
    "K": { width: 70, height: 90, advance: 70, baseline: 80 },
    "L": { width: 50, height: 90, advance: 50, baseline: 80 },
    "M": { width: 85, height: 90, advance: 85, baseline: 80 },
    "N": { width: 70, height: 90, advance: 70, baseline: 80 },
    "O": { width: 70, height: 90, advance: 70, baseline: 80 },
    "P": { width: 60, height: 90, advance: 60, baseline: 80 },
    "Q": { width: 70, height: 100, advance: 70, baseline: 70 },
    "R": { width: 70, height: 90, advance: 70, baseline: 80 },
    "S": { width: 65, height: 90, advance: 65, baseline: 80 },
    "T": { width: 60, height: 90, advance: 60, baseline: 80 },
    "U": { width: 70, height: 90, advance: 70, baseline: 80 },
    "V": { width: 65, height: 90, advance: 65, baseline: 80 },
    "W": { width: 95, height: 90, advance: 95, baseline: 80 },
    "X": { width: 70, height: 90, advance: 70, baseline: 80 },
    "Y": { width: 70, height: 100, advance: 70, baseline: 70 },
    "Z": { width: 65, height: 90, advance: 65, baseline: 80 },
    "0": { width: 55, height: 80, advance: 55, baseline: 70 },
    "1": { width: 40, height: 80, advance: 40, baseline: 70 },
    "2": { width: 55, height: 80, advance: 55, baseline: 70 },
    "3": { width: 55, height: 80, advance: 55, baseline: 70 },
    "4": { width: 55, height: 80, advance: 55, baseline: 70 },
    "5": { width: 55, height: 80, advance: 55, baseline: 70 },
    "6": { width: 55, height: 80, advance: 55, baseline: 70 },
    "7": { width: 55, height: 80, advance: 55, baseline: 70 },
    "8": { width: 55, height: 80, advance: 55, baseline: 70 },
    "9": { width: 55, height: 80, advance: 55, baseline: 70 },
    "，": { width: 30, height: 140, advance: 30, baseline: 120 },
    "。": { width: 40, height: 140, advance: 40, baseline: 120 },
    "！": { width: 30, height: 140, advance: 30, baseline: 120 },
    "？": { width: 40, height: 140, advance: 40, baseline: 120 },
    "、": { width: 20, height: 140, advance: 20, baseline: 120 },
    "；": { width: 30, height: 140, advance: 30, baseline: 120 },
    "：": { width: 30, height: 140, advance: 30, baseline: 120 },
    "“": { width: 35, height: 140, advance: 35, baseline: 120 },
    "”": { width: 35, height: 140, advance: 35, baseline: 120 },
    "（": { width: 35, height: 140, advance: 35, baseline: 120 },
    "）": { width: 35, height: 140, advance: 35, baseline: 120 },
    "—": { width: 60, height: 140, advance: 60, baseline: 120 },
    "·": { width: 25, height: 140, advance: 25, baseline: 120 },
    "「": { width: 30, height: 140, advance: 30, baseline: 120 },
    "」": { width: 30, height: 140, advance: 30, baseline: 120 },
    "『": { width: 30, height: 140, advance: 30, baseline: 120 },
    "』": { width: 30, height: 140, advance: 30, baseline: 120 },
    " ": { width: 30, height: 0, advance: 30, baseline: 0 }
  }
};

const ligatureGlyphs = {
  "fi": { width: 85, height: 90, advance: 85, baseline: 80 },
  "fl": { width: 85, height: 90, advance: 85, baseline: 80 },
  "ff": { width: 90, height: 80, advance: 90, baseline: 70 },
  "ffi": { width: 120, height: 90, advance: 120, baseline: 80 },
  "ffl": { width: 120, height: 90, advance: 120, baseline: 80 },
  "ae": { width: 90, height: 80, advance: 90, baseline: 70 },
  "oe": { width: 90, height: 80, advance: 90, baseline: 70 },
  "ß": { width: 60, height: 80, advance: 60, baseline: 70 },
  "ch": { width: 95, height: 80, advance: 95, baseline: 70 },
  "ck": { width: 90, height: 80, advance: 90, baseline: 70 },
  "ll": { width: 85, height: 80, advance: 85, baseline: 70 },
  "nn": { width: 95, height: 80, advance: 95, baseline: 70 }
};

const multiLangGlyphs = {
  "α": { width: 55, height: 80, advance: 55, baseline: 70 },
  "β": { width: 55, height: 80, advance: 55, baseline: 70 },
  "γ": { width: 55, height: 80, advance: 55, baseline: 70 },
  "δ": { width: 55, height: 80, advance: 55, baseline: 70 },
  "ε": { width: 50, height: 80, advance: 50, baseline: 70 },
  "ζ": { width: 45, height: 80, advance: 45, baseline: 70 },
  "η": { width: 55, height: 80, advance: 55, baseline: 70 },
  "θ": { width: 55, height: 80, advance: 55, baseline: 70 },
  "λ": { width: 35, height: 80, advance: 35, baseline: 70 },
  "μ": { width: 60, height: 80, advance: 60, baseline: 70 },
  "π": { width: 55, height: 80, advance: 55, baseline: 70 },
  "σ": { width: 55, height: 80, advance: 55, baseline: 70 },
  "τ": { width: 50, height: 80, advance: 50, baseline: 70 },
  "φ": { width: 60, height: 80, advance: 60, baseline: 70 },
  "χ": { width: 55, height: 80, advance: 55, baseline: 70 },
  "ψ": { width: 60, height: 80, advance: 60, baseline: 70 },
  "ω": { width: 60, height: 80, advance: 60, baseline: 70 },
  "あ": { width: 100, height: 120, advance: 100, baseline: 100 },
  "い": { width: 80, height: 120, advance: 80, baseline: 100 },
  "う": { width: 90, height: 120, advance: 90, baseline: 100 },
  "え": { width: 90, height: 120, advance: 90, baseline: 100 },
  "お": { width: 90, height: 120, advance: 90, baseline: 100 },
  "か": { width: 100, height: 120, advance: 100, baseline: 100 },
  "き": { width: 100, height: 120, advance: 100, baseline: 100 },
  "く": { width: 90, height: 120, advance: 90, baseline: 100 },
  "け": { width: 100, height: 120, advance: 100, baseline: 100 },
  "こ": { width: 90, height: 120, advance: 90, baseline: 100 },
  "漢": { width: 100, height: 140, advance: 100, baseline: 120 },
  "字": { width: 100, height: 140, advance: 100, baseline: 120 },
  "文": { width: 100, height: 140, advance: 100, baseline: 120 },
  "化": { width: 100, height: 140, advance: 100, baseline: 120 },
  "가": { width: 100, height: 140, advance: 100, baseline: 120 },
  "나": { width: 100, height: 140, advance: 100, baseline: 120 },
  "다": { width: 100, height: 140, advance: 100, baseline: 120 },
  "라": { width: 100, height: 140, advance: 100, baseline: 120 },
  "마": { width: 100, height: 140, advance: 100, baseline: 120 }
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

app.post('/api/compose', (req, res) => {
  const { text, settings } = req.body;
  try {
    insertComposition.run(text, JSON.stringify(settings));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/compositions', (req, res) => {
  try {
    const compositions = getAllCompositions.all();
    res.json(compositions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/glyphs', (req, res) => {
  res.json({
    default: defaultGlyphs,
    ligature: ligatureGlyphs,
    multiLang: multiLangGlyphs
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
