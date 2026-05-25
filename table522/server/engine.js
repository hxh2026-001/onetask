// 依赖图引擎 - 拓扑排序、循环引用检测、增量重算
import { parseFormula, collectRefs, cellNameToRC, rcToCellName } from './formula/parser.js';
import { evaluateAST, setIterationMode, resetIterationContext, setCachedValue } from './formula/evaluator.js';
import { setCellStore } from './formula/evaluator.js';

export class DependencyGraph {
  constructor() {
    this.graph = new Map();   // key -> Set(downstream keys)
    this.reverse = new Map(); // key -> Set(upstream keys)
    this.formulas = new Map(); // key -> { ast, raw, sheet, row, col }
  }

  addCell(key, deps) {
    // 先移除旧依赖
    this.removeCell(key);
    this.graph.set(key, new Set());
    if (!this.reverse.has(key)) this.reverse.set(key, new Set());
    for (const dep of deps) {
      if (!this.graph.has(dep)) this.graph.set(dep, new Set());
      if (!this.reverse.has(dep)) this.reverse.set(dep, new Set());
      this.graph.get(dep).add(key);
      this.reverse.get(key).add(dep);
    }
  }

  removeCell(key) {
    // 从下游中移除
    if (this.reverse.has(key)) {
      for (const dep of this.reverse.get(key)) {
        if (this.graph.has(dep)) this.graph.get(dep).delete(key);
      }
    }
    // 从上游中移除
    if (this.graph.has(key)) {
      for (const dep of this.graph.get(key)) {
        if (this.reverse.has(dep)) this.reverse.get(dep).delete(key);
      }
    }
    this.graph.delete(key);
    this.reverse.delete(key);
    this.formulas.delete(key);
  }

  getDownstream(key) {
    return this.graph.get(key) || new Set();
  }

  // 拓扑排序 - 检测循环引用，返回 { order: [], cycleCells: Set() }
  topologicalSort(startKeys) {
    const visited = new Set();
    const visiting = new Set();
    const order = [];
    const cycleCells = new Set();
    const stack = [];

    function visit(key, graph) {
      if (visited.has(key)) return;
      if (visiting.has(key)) {
        // 检测到循环 - 收集循环中的所有单元格
        const cycleStart = stack.indexOf(key);
        if (cycleStart !== -1) {
          for (let i = cycleStart; i < stack.length; i++) {
            cycleCells.add(stack[i]);
          }
        }
        return;
      }
      visiting.add(key);
      stack.push(key);
      const deps = graph.reverse.get(key) || new Set();
      for (const dep of deps) {
        visit(dep, graph);
      }
      stack.pop();
      visiting.delete(key);
      visited.add(key);
      order.push(key);
    }

    const allDeps = new Set();
    function collectAllDeps(keys) {
      for (const k of keys) {
        if (allDeps.has(k)) continue;
        allDeps.add(k);
        const deps = this.reverse.get(k) || new Set();
        collectAllDeps.call(this, deps);
      }
    }
    collectAllDeps.call(this, startKeys);

    for (const key of allDeps) {
      visit(key, this);
    }

    // 对循环引用的单元格，仍然加入 order（放在后面）
    for (const c of cycleCells) {
      if (!visited.has(c)) {
        order.push(c);
        visited.add(c);
      }
    }

    return { order, cycleCells };
  }

  // 获取需要重算的所有单元格（从变更点开始向下传播）
  getRecalcSet(changedKeys) {
    const result = new Set();
    const queue = [...changedKeys];
    while (queue.length) {
      const key = queue.shift();
      if (result.has(key)) continue;
      result.add(key);
      const downstream = this.getDownstream(key);
      for (const d of downstream) {
        if (!result.has(d)) queue.push(d);
      }
    }
    return result;
  }
}

export class CalcEngine {
  constructor() {
    this.dg = new DependencyGraph();
    this.cellStore = new Map(); // key -> { sheet, row, col, raw, value, dtype }
    this.arraySpills = new Map(); // key -> Set(spilledKeys) 记录数组溢出区域
    setCellStore({
      get: (sheet, row, col) => {
        const key = `${sheet}!${rcToCellName(row, col)}`;
        return this.cellStore.get(key);
      }
    });
  }

  key(sheet, row, col) {
    return `${sheet}!${rcToCellName(row, col)}`;
  }

  parseKey(key) {
    const [sheet, name] = key.split('!');
    const rc = cellNameToRC(name);
    return { sheet, row: rc.row, col: rc.col, name };
  }

  setCell(sheet, row, col, raw) {
    const key = this.key(sheet, row, col);
    // 清除旧的数组溢出
    this._clearArraySpill(key);

    if (raw && raw.startsWith('=')) {
      try {
        const ast = parseFormula(raw);
        const deps = collectRefs(ast, sheet);
        this.dg.formulas.set(key, { ast, raw, sheet, row, col });
        this.dg.addCell(key, deps);
        this.cellStore.set(key, { sheet, row, col, raw, value: '', dtype: 'formula' });
      } catch (e) {
        this.dg.removeCell(key);
        this.dg.formulas.delete(key);
        this.cellStore.set(key, { sheet, row, col, raw, value: `#ERROR: ${e.message}`, dtype: 'error' });
      }
    } else {
      this.dg.removeCell(key);
      this.dg.formulas.delete(key);
      let value = raw ?? '';
      let dtype = 'string';
      if (raw !== '' && raw !== null && raw !== undefined) {
        const num = parseFloat(raw);
        if (!isNaN(num) && String(num) === String(raw).trim()) {
          value = num;
          dtype = 'number';
        }
      }
      this.cellStore.set(key, { sheet, row, col, raw: String(raw ?? ''), value, dtype });
    }

    return key;
  }

  _clearArraySpill(key) {
    if (this.arraySpills.has(key)) {
      for (const sk of this.arraySpills.get(key)) {
        if (this.cellStore.has(sk)) {
          const cell = this.cellStore.get(sk);
          if (cell._spillSource === key) {
            this.cellStore.delete(sk);
          }
        }
      }
      this.arraySpills.delete(key);
    }
  }

  _applyArraySpill(sheet, row, col, arrayData) {
    const sourceKey = this.key(sheet, row, col);
    const spilled = new Set();
    for (let r = 0; r < arrayData.length; r++) {
      for (let c = 0; c < arrayData[r].length; c++) {
        if (r === 0 && c === 0) continue; // 源单元格
        const tr = row + r, tc = col + c;
        const targetKey = this.key(sheet, tr, tc);
        const existing = this.cellStore.get(targetKey);
        // 静默覆盖：若溢出区域被其他单元格占据，跳过该位置（返回部分结果）
        if (existing && !existing._spillSource) {
          continue;
        }
        this.cellStore.set(targetKey, {
          sheet, row: tr, col: tc,
          raw: '', value: arrayData[r][c],
          dtype: 'number', _spillSource: sourceKey
        });
        spilled.add(targetKey);
      }
    }
    this.arraySpills.set(sourceKey, spilled);
  }

  // 增量重算 - 返回变更的单元格列表和波纹路径
  recalc(changedKeys, { maxIterations = 100, tolerance = 1e-6 } = {}) {
    const recalcSet = this.dg.getRecalcSet(changedKeys);
    const { order, cycleCells } = this.dg.topologicalSort([...recalcSet]);

    // 构建波纹扩散路径：按依赖层级
    const ripplePath = this._buildRipplePath(changedKeys, recalcSet);

    const changedCells = [];
    const progressSteps = [];

    if (cycleCells.size > 0) {
      // 迭代模式
      const cache = new Map();
      setIterationMode(true, new Set(), cycleCells, cache);

      // 初始化 cycle 单元格的值为 0（或保留旧值）
      for (const ck of cycleCells) {
        const cell = this.cellStore.get(ck);
        if (cell) {
          cache.set(ck, { value: cell.value ?? 0, dtype: cell.dtype ?? 'number' });
        }
      }

      let converged = false;
      for (let iter = 0; iter < maxIterations && !converged; iter++) {
        converged = true;
        for (const key of order) {
          if (!this.dg.formulas.has(key)) continue;
          const { ast, sheet, row, col } = this.dg.formulas.get(key);
          const ctx = { sheet, row, col, engine: this };
          try {
            const result = evaluateAST(ast, ctx);
            const old = cache.get(key);
            const oldVal = old ? old.value : 0;
            const newVal = result.value;

            if (cycleCells.has(key)) {
              if (typeof newVal === 'number' && typeof oldVal === 'number') {
                if (Math.abs(newVal - oldVal) > tolerance) converged = false;
                if (isNaN(newVal) || !isFinite(newVal)) {
                  // 发散
                  cache.set(key, { value: '#NUM!', dtype: 'error' });
                  converged = true;
                  break;
                }
              }
              cache.set(key, { value: newVal, dtype: result.dtype });
            } else {
              cache.set(key, { value: newVal, dtype: result.dtype });
            }
          } catch (e) {
            cache.set(key, { value: '#ERROR', dtype: 'error' });
          }
        }
        progressSteps.push({ iteration: iter + 1, converged, snapshot: {} });
      }

      // 应用最终结果
      for (const key of order) {
        const val = cache.get(key);
        if (val && this.cellStore.has(key)) {
          const cell = this.cellStore.get(key);
          cell.value = val.value;
          cell.dtype = val.dtype;
          changedCells.push({ key, value: val.value, dtype: val.dtype });
        }
      }

      resetIterationContext();
    } else {
      // 正常求值
      for (const key of order) {
        if (!this.dg.formulas.has(key)) continue;
        const { ast, sheet, row, col } = this.dg.formulas.get(key);
        const ctx = { sheet, row, col, engine: this };
        try {
          const result = evaluateAST(ast, ctx);
          this.cellStore.set(key, {
            sheet, row, col,
            raw: this.dg.formulas.get(key).raw,
            value: result.value,
            dtype: result.dtype
          });
          changedCells.push({ key, value: result.value, dtype: result.dtype });

          // 处理数组溢出
          if (result.array && result.array.length > 0) {
            this._clearArraySpill(key);
            this._applyArraySpill(sheet, row, col, result.array);
            for (const sk of this.arraySpills.get(key) || []) {
              const c = this.cellStore.get(sk);
              if (c) changedCells.push({ key: sk, value: c.value, dtype: c.dtype });
            }
          } else {
            this._clearArraySpill(key);
          }
        } catch (e) {
          this.cellStore.set(key, {
            sheet, row, col,
            raw: this.dg.formulas.get(key).raw,
            value: '#ERROR', dtype: 'error'
          });
          changedCells.push({ key, value: '#ERROR', dtype: 'error' });
        }
        progressSteps.push({ key, done: true });
      }
    }

    return { changedCells, cycleCells: [...cycleCells], ripplePath, progressSteps };
  }

  _buildRipplePath(changedKeys, recalcSet) {
    const levels = new Map();
    for (const k of changedKeys) levels.set(k, 0);
    let maxLevel = 0;
    // BFS
    const queue = [...changedKeys];
    while (queue.length) {
      const key = queue.shift();
      const level = levels.get(key) || 0;
      const downstream = this.dg.getDownstream(key);
      for (const d of downstream) {
        if (!levels.has(d)) {
          levels.set(d, level + 1);
          maxLevel = Math.max(maxLevel, level + 1);
          queue.push(d);
        }
      }
    }
    const path = [];
    for (let i = 0; i <= maxLevel; i++) {
      path.push([...levels.entries()].filter(([k, l]) => l === i).map(([k]) => k));
    }
    return path;
  }

  getAllCells() {
    return [...this.cellStore.values()];
  }

  getCellData(sheet, row, col) {
    const key = this.key(sheet, row, col);
    return this.cellStore.get(key);
  }

  // 获取依赖关系（用于前端显示）
  getDependencyInfo() {
    const deps = [];
    for (const [key, upstreamSet] of this.dg.reverse.entries()) {
      for (const up of upstreamSet) {
        deps.push({ from: up, to: key });
      }
    }
    return deps;
  }
}
