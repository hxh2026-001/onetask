// 公式求值器 - 支持迭代收敛循环引用、数组溢出、#REF 错误传播
import { N, cellNameToRC, rcToCellName, expandRange } from './parser.js';

let CELL_STORE = null;
let CURRENT_CELL = null;
let VISITING = null;
let CYCLE_CELLS = null;
let ITERATION_MODE = false;
let ITERATION_COUNT = 0;
let CELL_VALUE_CACHE = null;

export function setCellStore(store) { CELL_STORE = store; }

export function getCellValue(sheet, row, col, opts = {}) {
  if (!CELL_STORE) return { value: 0, dtype: 'number' };
  const name = rcToCellName(row, col);
  const key = `${sheet}!${name}`;
  // 若在 cycle cells 中且非迭代模式，返回占位值或错误
  if (CYCLE_CELLS && CYCLE_CELLS.has(key) && !ITERATION_MODE) {
    return { value: '#CIRC!', dtype: 'error' };
  }
  if (CELL_VALUE_CACHE && CELL_VALUE_CACHE.has(key)) {
    return CELL_VALUE_CACHE.get(key);
  }
  const data = CELL_STORE.get(sheet, row, col);
  if (!data) return { value: 0, dtype: 'number' };
  if (data.raw && data.raw.startsWith && data.raw.startsWith('=')) {
    return { value: data.value ?? 0, dtype: data.dtype ?? 'number' };
  }
  return { value: data.value ?? '', dtype: data.dtype ?? 'string' };
}

export function setCachedValue(key, val) {
  if (CELL_VALUE_CACHE) CELL_VALUE_CACHE.set(key, val);
}

// 数值转换
function toNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return Number(v) || 0;
}
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0 && v.toLowerCase() !== 'false';
  return !!v;
}

// 展开函数参数中的范围/数组为扁平数组（用于 SUM/AVERAGE 等）
function flattenArgs(args, ctx) {
  const out = [];
  for (const a of args) {
    if (a.type === N.RANGE) {
      const sheet = a.sheet || ctx.sheet;
      const cells = expandRange(a.start, a.end);
      for (const c of cells) {
        const rc = cellNameToRC(c);
        const v = getCellValue(sheet, rc.row, rc.col);
        out.push(v.value);
      }
    } else if (a.type === N.CELL) {
      const sheet = a.sheet || ctx.sheet;
      const rc = cellNameToRC(a.name);
      const v = getCellValue(sheet, rc.row, rc.col);
      out.push(v.value);
    } else {
      const v = evalNode(a, ctx);
      if (v && v.array) {
        for (const row of v.array) for (const c of row) out.push(c);
      } else {
        out.push(v.value);
      }
    }
  }
  return out;
}

function evalNode(node, ctx) {
  if (!node) return { value: 0, dtype: 'number' };
  switch (node.type) {
    case N.NUMBER: return { value: node.value, dtype: 'number' };
    case N.STRING: return { value: node.value, dtype: 'string' };
    case N.CELL: {
      const sheet = node.sheet || ctx.sheet;
      try {
        const rc = cellNameToRC(node.name);
        const v = getCellValue(sheet, rc.row, rc.col);
        return { value: v.value, dtype: v.dtype };
      } catch (e) {
        return { value: '#REF!', dtype: 'error' };
      }
    }
    case N.RANGE: {
      const sheet = node.sheet || ctx.sheet;
      const cells = expandRange(node.start, node.end);
      const arr = cells.map(c => {
        const rc = cellNameToRC(c);
        const v = getCellValue(sheet, rc.row, rc.col);
        return v.value;
      });
      // 保持二维
      const s = cellNameToRC(node.start), e = cellNameToRC(node.end);
      const rows = Math.abs(e.row - s.row) + 1;
      const cols = Math.abs(e.col - s.col) + 1;
      const r1 = Math.min(s.row, e.row), c1 = Math.min(s.col, e.col);
      const out = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const v = getCellValue(sheet, r1 + r, c1 + c);
          row.push(v.value);
        }
        out.push(row);
      }
      return { value: out[0][0], array: out, dtype: 'array' };
    }
    case N.BINOP: {
      if (node.op === '&') {
        const l = evalNode(node.left, ctx), r = evalNode(node.right, ctx);
        return { value: String(l.value ?? '') + String(r.value ?? ''), dtype: 'string' };
      }
      const l = evalNode(node.left, ctx), r = evalNode(node.right, ctx);
      if (l.dtype === 'error' || r.dtype === 'error') return { value: '#REF!', dtype: 'error' };
      const a = toNum(l.value), b = toNum(r.value);
      switch (node.op) {
        case '+': return { value: a + b, dtype: 'number' };
        case '-': return { value: a - b, dtype: 'number' };
        case '*': return { value: a * b, dtype: 'number' };
        case '/': return b === 0 ? { value: '#DIV/0!', dtype: 'error' } : { value: a / b, dtype: 'number' };
        case '^': return { value: Math.pow(a, b), dtype: 'number' };
      }
      return { value: 0, dtype: 'number' };
    }
    case N.COMPARE: {
      const l = evalNode(node.left, ctx), r = evalNode(node.right, ctx);
      let a = l.value, b = r.value;
      if (l.dtype === 'number' && r.dtype === 'number') { a = toNum(a); b = toNum(b); }
      let res = false;
      switch (node.op) {
        case '=': res = a == b; break;
        case '<>': res = a != b; break;
        case '<': res = a < b; break;
        case '>': res = a > b; break;
        case '<=': res = a <= b; break;
        case '>=': res = a >= b; break;
      }
      return { value: res, dtype: 'boolean' };
    }
    case N.UNARY:
      if (node.op === '-') {
        const v = evalNode(node.operand, ctx);
        return { value: -toNum(v.value), dtype: 'number' };
      }
      return evalNode(node.operand, ctx);
    case N.ARRAY: {
      const rows = node.rows.map(r => r.map(c => evalNode(c, ctx).value));
      return { value: rows[0][0], array: rows, dtype: 'array' };
    }
    case N.FUNC: return evalFunc(node, ctx);
  }
  return { value: 0, dtype: 'number' };
}

function evalFunc(node, ctx) {
  const name = node.name;
  const args = node.args;
  switch (name) {
    case 'SUM': {
      const flat = flattenArgs(args, ctx);
      return { value: flat.reduce((s, v) => s + (toNum(v) || 0), 0), dtype: 'number' };
    }
    case 'SUM_BOTTOM_UP': {
      // 从底部向上累加（模拟浮点精度差异）
      const flat = flattenArgs(args, ctx);
      let s = 0;
      for (let i = flat.length - 1; i >= 0; i--) s += toNum(flat[i]) || 0;
      return { value: s, dtype: 'number' };
    }
    case 'SUM_TOP_DOWN': {
      const flat = flattenArgs(args, ctx);
      let s = 0;
      for (const v of flat) s += toNum(v) || 0;
      return { value: s, dtype: 'number' };
    }
    case 'AVERAGE': {
      const flat = flattenArgs(args, ctx).map(toNum);
      return flat.length ? { value: flat.reduce((s, v) => s + v, 0) / flat.length, dtype: 'number' } : { value: 0, dtype: 'number' };
    }
    case 'COUNT': {
      const flat = flattenArgs(args, ctx).filter(v => typeof v === 'number' || !isNaN(parseFloat(v)));
      return { value: flat.length, dtype: 'number' };
    }
    case 'MAX': {
      const flat = flattenArgs(args, ctx).map(toNum);
      return { value: flat.length ? Math.max(...flat) : 0, dtype: 'number' };
    }
    case 'MIN': {
      const flat = flattenArgs(args, ctx).map(toNum);
      return { value: flat.length ? Math.min(...flat) : 0, dtype: 'number' };
    }
    case 'IF': {
      const cond = evalNode(args[0], ctx);
      if (toBool(cond.value)) return evalNode(args[1], ctx);
      return evalNode(args[2], ctx);
    }
    case 'ABS': return { value: Math.abs(toNum(evalNode(args[0], ctx).value)), dtype: 'number' };
    case 'ROUND': {
      const v = toNum(evalNode(args[0], ctx).value);
      const d = args[1] ? toNum(evalNode(args[1], ctx).value) : 0;
      const p = Math.pow(10, d);
      return { value: Math.round(v * p) / p, dtype: 'number' };
    }
    case 'SQRT': return { value: Math.sqrt(toNum(evalNode(args[0], ctx).value)), dtype: 'number' };
    case 'POWER': {
      const a = toNum(evalNode(args[0], ctx).value);
      const b = toNum(evalNode(args[1], ctx).value);
      return { value: Math.pow(a, b), dtype: 'number' };
    }
    case 'CONCAT': {
      const parts = args.map(a => String(evalNode(a, ctx).value ?? ''));
      return { value: parts.join(''), dtype: 'string' };
    }
    case 'TODAY': return { value: new Date().toISOString().slice(0, 10), dtype: 'string' };
    case 'PI': return { value: Math.PI, dtype: 'number' };
    // 数组函数
    case 'ARRAY':
    case 'MSEQUENCE': {
      const n = args.length >= 1 ? toNum(evalNode(args[0], ctx).value) : 3;
      const m = args.length >= 2 ? toNum(evalNode(args[1], ctx).value) : 1;
      const start = args.length >= 3 ? toNum(evalNode(args[2], ctx).value) : 1;
      const step = args.length >= 4 ? toNum(evalNode(args[3], ctx).value) : 1;
      const arr = [];
      for (let r = 0; r < m; r++) {
        const row = [];
        for (let c = 0; c < n; c++) row.push(start + step * (r * n + c));
        arr.push(row);
      }
      return { value: arr[0][0], array: arr, dtype: 'array' };
    }
    case 'TRANSPOSE': {
      const v = evalNode(args[0], ctx);
      if (!v.array) return v;
      const arr = v.array;
      const out = [];
      for (let c = 0; c < arr[0].length; c++) {
        const row = [];
        for (let r = 0; r < arr.length; r++) row.push(arr[r][c]);
        out.push(row);
      }
      return { value: out[0][0], array: out, dtype: 'array' };
    }
    case 'SPLIT_ARRAY': {
      // 将范围按逗号分隔返回数组
      const flat = flattenArgs(args, ctx);
      return { value: flat, array: [flat], dtype: 'array' };
    }
  }
  return { value: `#NAME?`, dtype: 'error' };
}

export function evaluateAST(ast, ctx) {
  return evalNode(ast, ctx);
}

export function setIterationMode(on, visiting, cycleCells, cache) {
  ITERATION_MODE = on;
  VISITING = visiting;
  CYCLE_CELLS = cycleCells;
  if (cache) CELL_VALUE_CACHE = cache;
  else CELL_VALUE_CACHE = new Map();
}

export function resetIterationContext() {
  ITERATION_MODE = false;
  VISITING = null;
  CYCLE_CELLS = null;
  CELL_VALUE_CACHE = null;
  ITERATION_COUNT = 0;
}
