import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDB, getDB } from './db.js';
import { CalcEngine } from './engine.js';
import { loadScenario, getScenarioList, SCENARIOS } from './scenarios.js';
import { cellNameToRC, rcToCellName } from './formula/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5220;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// 初始化数据库
const db = initDB();

// 初始化计算引擎
const engine = new CalcEngine();

// 从数据库加载数据
function loadFromDB() {
  const sheets = db.prepare('SELECT * FROM sheets').all();
  if (sheets.length === 0) {
    // 创建默认 sheet
    const info = db.prepare('INSERT INTO sheets (name) VALUES (?)').run('Sheet1');
    sheets.push({ id: info.lastInsertRowid, name: 'Sheet1' });
  }
  for (const sheet of sheets) {
    const cells = db.prepare('SELECT * FROM cells WHERE sheet_id = ?').all(sheet.id);
    for (const cell of cells) {
      engine.setCell(sheet.name, cell.row, cell.col, cell.raw || '');
    }
  }
  // 首次加载后重算
  const allFormulas = [...engine.dg.formulas.keys()];
  if (allFormulas.length) engine.recalc(allFormulas);
}
loadFromDB();

function saveCellToDB(sheet, row, col, raw, value, dtype) {
  const sheetRow = db.prepare('SELECT * FROM sheets WHERE name = ?').get(sheet);
  if (!sheetRow) return;
  const existing = db.prepare('SELECT * FROM cells WHERE sheet_id = ? AND row = ? AND col = ?')
    .get(sheetRow.id, row, col);
  if (existing) {
    db.prepare('UPDATE cells SET raw = ?, value = ?, dtype = ? WHERE id = ?')
      .run(raw, String(value ?? ''), dtype, existing.id);
  } else {
    db.prepare('INSERT INTO cells (sheet_id, row, col, raw, value, dtype) VALUES (?, ?, ?, ?, ?, ?)')
      .run(sheetRow.id, row, col, raw, String(value ?? ''), dtype);
  }
}

// API 路由
app.get('/api/sheets', (req, res) => {
  const sheets = db.prepare('SELECT * FROM sheets').all();
  res.json(sheets);
});

app.post('/api/sheets', (req, res) => {
  const { name } = req.body;
  const info = db.prepare('INSERT INTO sheets (name) VALUES (?)').run(name);
  res.json({ id: info.lastInsertRowid, name });
});

app.get('/api/cells', (req, res) => {
  const cells = engine.getAllCells().map(c => ({
    sheet: c.sheet, row: c.row, col: c.col,
    raw: c.raw, value: c.value, dtype: c.dtype,
    key: `${c.sheet}!${rcToCellName(c.row, c.col)}`
  }));
  res.json(cells);
});

app.get('/api/cells/:sheet/:row/:col', (req, res) => {
  const { sheet, row, col } = req.params;
  const data = engine.getCellData(sheet, parseInt(row), parseInt(col));
  if (data) {
    res.json({ ...data, key: `${sheet}!${rcToCellName(parseInt(row), parseInt(col))}` });
  } else {
    res.json({ sheet, row: parseInt(row), col: parseInt(col), raw: '', value: '', dtype: 'string' });
  }
});

app.post('/api/cells', (req, res) => {
  const { sheet, row, col, raw } = req.body;
  const changedKey = engine.setCell(sheet, row, col, raw || '');
  const result = engine.recalc([changedKey]);

  // 保存到数据库
  for (const cc of result.changedCells) {
    const [s, name] = cc.key.split('!');
    const rc = cellNameToRC(name);
    const cell = engine.cellStore.get(cc.key);
    if (cell) {
      saveCellToDB(s, rc.row, rc.col, cell.raw || '', cc.value, cc.dtype);
    }
  }

  res.json({
    changed: result.changedCells,
    cycleCells: result.cycleCells,
    ripplePath: result.ripplePath,
    progressSteps: result.progressSteps,
    dependencies: engine.getDependencyInfo()
  });
});

app.get('/api/dependencies', (req, res) => {
  res.json(engine.getDependencyInfo());
});

app.get('/api/scenarios', (req, res) => {
  res.json(getScenarioList());
});

app.post('/api/scenarios/:key/load', (req, res) => {
  const { key } = req.params;
  if (!SCENARIOS[key]) {
    return res.status(404).json({ error: '场景不存在' });
  }
  const result = loadScenario(engine, key);

  // 保存到数据库
  db.prepare('DELETE FROM cells').run();
  for (const cell of engine.getAllCells()) {
    saveCellToDB(cell.sheet, cell.row, cell.col, cell.raw || '', cell.value, cell.dtype);
  }

  res.json({
    changed: result.changedCells,
    cycleCells: result.cycleCells,
    ripplePath: result.ripplePath,
    progressSteps: result.progressSteps,
    cells: engine.getAllCells().map(c => ({
      sheet: c.sheet, row: c.row, col: c.col,
      raw: c.raw, value: c.value, dtype: c.dtype,
      key: `${c.sheet}!${rcToCellName(c.row, c.col)}`
    })),
    dependencies: engine.getDependencyInfo()
  });
});

// 清空
app.post('/api/clear', (req, res) => {
  db.prepare('DELETE FROM cells').run();
  engine.cellStore.clear();
  engine.arraySpills.clear();
  engine.dg = new (Object.getPrototypeOf(engine.dg).constructor)();
  res.json({ success: true });
});

// 单步计算（用于进度条动画）
app.post('/api/recalc-step', (req, res) => {
  const { keys } = req.body;
  const result = engine.recalc(keys);
  res.json(result);
});

// 提供静态文件
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`电子表格公式计算引擎服务启动: http://localhost:${PORT}`);
});
