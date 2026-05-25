// 电子表格公式计算引擎 - 前端应用
// 使用原生 JavaScript 实现 Svelte 风格的响应式 UI

const API_BASE = 'http://localhost:5220';
const ROWS = 30;
const COLS = 15;

class SpreadsheetApp {
  constructor() {
    this.cells = new Map(); // key -> cell data
    this.selectedCell = null;
    this.editingCell = null;
    this.currentSheet = 'Sheet1';
    this.sheets = ['Sheet1', 'Sheet2', 'Sheet3'];
    this.activeSidebar = 'deps';
    this.cycleCells = new Set();
    this.dependencies = [];
    this.rippleTimers = [];
    this.scenarioButtons = [];
    this.activeScenario = null;
    this.progress = 0;
    this.progressTimer = null;
    this.isCalculating = false;
    this.init();
  }

  async init() {
    this.render();
    await this.loadAllCells();
    await this.loadDependencies();
    this.updateCellDisplays();
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="toolbar">
        <h1>📊 电子表格公式计算引擎</h1>
        <div class="scenario-btns" id="scenarioBtns"></div>
        <div style="margin-left:auto">
          <span class="calc-indicator normal" id="calcIndicator">
            <span class="dot"></span><span id="calcStatus">就绪</span>
          </span>
        </div>
      </div>
      <div class="formula-bar">
        <input type="text" class="cell-address" id="cellAddress" readonly>
        <input type="text" class="formula-input" id="formulaInput" placeholder="输入数值或公式 (以=开头)">
      </div>
      <div class="main">
        <div class="spreadsheet-container" id="spreadsheetContainer">
          <div class="spreadsheet" id="spreadsheet"></div>
          <div class="animation-overlay" id="animationOverlay"></div>
        </div>
        <div class="sidebar">
          <div class="sidebar-tabs">
            <button class="sidebar-tab active" data-tab="deps">依赖图</button>
            <button class="sidebar-tab" data-tab="progress">计算进度</button>
            <button class="sidebar-tab" data-tab="info">单元格信息</button>
          </div>
          <div class="sidebar-content" id="sidebarContent"></div>
        </div>
      </div>
      <div class="sheet-tabs" id="sheetTabs"></div>
    `;

    this.bindEvents();
    this.renderScenarios();
    this.renderSheetTabs();
    this.renderSidebar();
    this.renderSpreadsheet();
  }

  bindEvents() {
    const formulaInput = document.getElementById('formulaInput');
    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.selectedCell) {
        this.setCellRaw(formulaInput.value);
      } else if (e.key === 'Escape') {
        formulaInput.value = '';
      }
    });

    formulaInput.addEventListener('input', () => {
      this.highlightFormula(formulaInput.value);
    });

    // 侧边栏标签切换
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeSidebar = tab.dataset.tab;
        this.renderSidebar();
      });
    });
  }

  renderScenarios() {
    fetch(`${API_BASE}/api/scenarios`)
      .then(r => r.json())
      .then(scenarios => {
        const container = document.getElementById('scenarioBtns');
        container.innerHTML = '';
        scenarios.forEach(s => {
          const btn = document.createElement('button');
          btn.className = 'scenario-btn';
          btn.textContent = s.name;
          btn.dataset.key = s.key;
          btn.title = s.description;
          btn.addEventListener('click', () => this.loadScenario(s.key));
          container.appendChild(btn);
          this.scenarioButtons.push(btn);
        });
      });
  }

  renderSheetTabs() {
    const container = document.getElementById('sheetTabs');
    container.innerHTML = '';
    this.sheets.forEach(sheet => {
      const tab = document.createElement('div');
      tab.className = `sheet-tab ${sheet === this.currentSheet ? 'active' : ''}`;
      tab.textContent = sheet;
      tab.addEventListener('click', () => {
        this.currentSheet = sheet;
        this.renderSheetTabs();
        this.renderSpreadsheet();
        this.updateCellDisplays();
      });
      container.appendChild(tab);
    });
  }

  renderSpreadsheet() {
    const container = document.getElementById('spreadsheet');
    container.style.gridTemplateColumns = `40px repeat(${COLS}, 100px)`;
    container.innerHTML = '';

    // 表头 - 空白
    const corner = document.createElement('div');
    corner.className = 'cell header';
    container.appendChild(corner);

    // 列表头 A, B, C...
    for (let c = 0; c < COLS; c++) {
      const header = document.createElement('div');
      header.className = 'cell header';
      header.textContent = this.colToLetter(c);
      container.appendChild(header);
    }

    // 行
    for (let r = 0; r < ROWS; r++) {
      // 行号
      const rowHeader = document.createElement('div');
      rowHeader.className = 'cell header';
      rowHeader.textContent = r + 1;
      container.appendChild(rowHeader);

      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        const key = `${this.currentSheet}!${this.rcToName(r, c)}`;
        cell.className = 'cell';
        cell.dataset.key = key;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', (e) => this.selectCell(key, e));
        cell.addEventListener('dblclick', () => this.editCell(key));
        container.appendChild(cell);
      }
    }
  }

  renderSidebar() {
    const container = document.getElementById('sidebarContent');
    if (this.activeSidebar === 'deps') {
      container.innerHTML = `
        <div class="sidebar-section">
          <h3>依赖关系图</h3>
          <div class="dep-graph" id="depGraph">
            <div class="dep-list" id="depList"></div>
          </div>
        </div>
        <div class="sidebar-section">
          <h3>循环引用检测</h3>
          <div id="cycleInfo" style="font-size:12px;color:#5f6368">无循环引用</div>
        </div>
      `;
      this.updateDepList();
    } else if (this.activeSidebar === 'progress') {
      container.innerHTML = `
        <div class="sidebar-section">
          <h3>计算进度</h3>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-info" id="progressInfo">等待计算...</div>
          </div>
        </div>
        <div class="sidebar-section">
          <h3>迭代信息</h3>
          <div class="info-panel" id="iterationInfo">
            <div class="info-row">
              <span class="info-label">迭代次数:</span>
              <span class="info-value" id="iterCount">0</span>
            </div>
            <div class="info-row">
              <span class="info-label">收敛状态:</span>
              <span class="info-value" id="convergeStatus">-</span>
            </div>
            <div class="info-row">
              <span class="info-label">容忍度:</span>
              <span class="info-value">1e-6</span>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeSidebar === 'info') {
      if (this.selectedCell) {
        const cell = this.cells.get(this.selectedCell);
        container.innerHTML = `
          <div class="sidebar-section">
            <h3>单元格信息</h3>
            <div class="info-panel">
              <div class="info-row">
                <span class="info-label">位置:</span>
                <span class="info-value">${this.selectedCell}</span>
              </div>
              <div class="info-row">
                <span class="info-label">原始值:</span>
                <span class="info-value">${cell?.raw ?? '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">计算值:</span>
                <span class="info-value">${cell?.value ?? '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">数据类型:</span>
                <span class="info-value">${cell?.dtype ?? '-'}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="sidebar-section">
            <h3>单元格信息</h3>
            <div style="font-size:12px;color:#5f6368;padding:12px;text-align:center">请选择一个单元格</div>
          </div>
        `;
      }
    }
  }

  updateDepList() {
    const list = document.getElementById('depList');
    if (!list) return;
    list.innerHTML = '';
    if (this.dependencies.length === 0) {
      list.innerHTML = '<div style="padding:8px;color:#999;font-size:12px">暂无依赖关系</div>';
      return;
    }
    this.dependencies.forEach(dep => {
      const item = document.createElement('div');
      item.className = `dep-item ${this.cycleCells.has(dep.from) || this.cycleCells.has(dep.to) ? 'cycle' : ''}`;
      item.innerHTML = `<span>${dep.from}</span><span class="arrow">→</span><span>${dep.to}</span>`;
      item.addEventListener('mouseenter', () => this.highlightDep(dep));
      item.addEventListener('mouseleave', () => this.clearDepHighlight());
      list.appendChild(item);
    });

    // 更新循环引用信息
    const cycleInfo = document.getElementById('cycleInfo');
    if (cycleInfo) {
      if (this.cycleCells.size > 0) {
        cycleInfo.innerHTML = `
          <div style="color:#d93025;font-weight:600;margin-bottom:4px">
            ⚠ 检测到 ${this.cycleCells.size} 个循环引用单元格:
          </div>
          <div style="font-family:Consolas,monospace">${[...this.cycleCells].join(', ')}</div>
        `;
      } else {
        cycleInfo.innerHTML = '<div style="color:#1e8e3e">✓ 无循环引用</div>';
      }
    }
  }

  highlightDep(dep) {
    const fromEl = document.querySelector(`[data-key="${dep.from}"]`);
    const toEl = document.querySelector(`[data-key="${dep.to}"]`);
    if (fromEl) fromEl.style.boxShadow = '0 0 8px #1a73e8';
    if (toEl) toEl.style.boxShadow = '0 0 8px #d93025';
  }

  clearDepHighlight() {
    document.querySelectorAll('.cell').forEach(c => {
      if (!c.classList.contains('selected')) c.style.boxShadow = '';
    });
  }

  async loadAllCells() {
    try {
      const res = await fetch(`${API_BASE}/api/cells`);
      const data = await res.json();
      this.cells.clear();
      data.forEach(c => this.cells.set(c.key, c));
    } catch (e) {
      console.error('加载单元格失败:', e);
    }
  }

  async loadDependencies() {
    try {
      const res = await fetch(`${API_BASE}/api/dependencies`);
      this.dependencies = await res.json();
    } catch (e) {
      console.error('加载依赖失败:', e);
    }
  }

  updateCellDisplays() {
    document.querySelectorAll('.cell').forEach(el => {
      const key = el.dataset.key;
      if (!key) return;
      if (!key.startsWith(this.currentSheet + '!')) return;
      const cell = this.cells.get(key);
      const classes = ['cell'];

      if (cell) {
        el.textContent = cell.value ?? '';
        if (cell.raw?.startsWith('=')) classes.push('formula');
        if (cell.dtype === 'error') classes.push('error');
        if (this.cycleCells.has(key)) classes.push('cycle pulse-cycle');
        if (cell._spillSource) classes.push('spill');
        if (key === this.selectedCell) classes.push('selected');
        el.className = classes.join(' ');
      } else {
        el.textContent = '';
        el.className = `cell ${key === this.selectedCell ? 'selected' : ''}`;
      }
    });
  }

  selectCell(key, e) {
    this.selectedCell = key;
    const cell = this.cells.get(key);
    const addressEl = document.getElementById('cellAddress');
    const formulaEl = document.getElementById('formulaInput');
    addressEl.value = key.split('!')[1];
    formulaEl.value = cell?.raw ?? '';
    this.updateCellDisplays();
    if (this.activeSidebar === 'info') this.renderSidebar();
  }

  editCell(key) {
    this.editingCell = key;
    const el = document.querySelector(`[data-key="${key}"]`);
    if (!el) return;
    const cell = this.cells.get(key);
    const input = document.createElement('input');
    input.className = 'cell-input';
    input.value = cell?.raw ?? '';
    el.innerHTML = '';
    el.appendChild(input);
    input.focus();
    input.select();

    const finish = (save) => {
      if (save) {
        this.setCellRaw(input.value);
      } else {
        this.updateCellDisplays();
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { finish(true); e.preventDefault(); }
      else if (e.key === 'Escape') { finish(false); e.preventDefault(); }
    });
    input.addEventListener('blur', () => finish(true));
  }

  async setCellRaw(raw) {
    if (!this.selectedCell) return;
    const [sheet, name] = this.selectedCell.split('!');
    const rc = this.nameToRC(name);

    this.setCalcStatus('calculating', '计算中...');
    this.showProgress();

    try {
      const res = await fetch(`${API_BASE}/api/cells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet, row: rc.row, col: rc.col, raw })
      });
      const data = await res.json();
      this.handleCalcResult(data);
    } catch (e) {
      console.error('设置单元格失败:', e);
      this.setCalcStatus('normal', '就绪');
    }
  }

  async loadScenario(key) {
    this.scenarioButtons.forEach(b => b.classList.remove('active'));
    const btn = this.scenarioButtons.find(b => b.dataset.key === key);
    if (btn) btn.classList.add('active');
    this.activeScenario = key;

    this.setCalcStatus('calculating', '加载场景...');
    this.showProgress();

    try {
      const res = await fetch(`${API_BASE}/api/scenarios/${key}/load`, {
        method: 'POST'
      });
      const data = await res.json();

      // 更新所有单元格
      this.cells.clear();
      data.cells.forEach(c => this.cells.set(c.key, c));
      this.dependencies = data.dependencies;
      this.handleCalcResult(data);

      // 切换到对应工作表
      if (data.cells.length > 0) {
        const firstSheet = data.cells[0].sheet;
        if (firstSheet && !this.sheets.includes(firstSheet)) {
          this.sheets.push(firstSheet);
        }
      }
      this.renderSheetTabs();
    } catch (e) {
      console.error('加载场景失败:', e);
      this.setCalcStatus('normal', '就绪');
    }
  }

  handleCalcResult(data) {
    // 更新变更的单元格
    data.changed.forEach(cc => {
      const cell = this.cells.get(cc.key);
      if (cell) {
        cell.value = cc.value;
        cell.dtype = cc.dtype;
      } else {
        this.cells.set(cc.key, {
          key: cc.key,
          sheet: cc.key.split('!')[0],
          raw: '',
          value: cc.value,
          dtype: cc.dtype
        });
      }
    });

    this.cycleCells = new Set(data.cycleCells);
    this.dependencies = data.dependencies;

    // 显示波纹动画
    this.showRippleAnimation(data.ripplePath);
    this.showCascadeAnimation(data.changed);

    // 更新显示
    setTimeout(() => {
      this.updateCellDisplays();
      this.updateDepList();

      if (this.cycleCells.size > 0) {
        this.setCalcStatus('cycle', `循环引用 (${this.cycleCells.size})`);
      } else {
        this.setCalcStatus('normal', '就绪');
      }

      this.updateProgress(data.progressSteps);
    }, 300);
  }

  showRippleAnimation(ripplePath) {
    this.clearRippleTimers();
    const overlay = document.getElementById('animationOverlay');
    if (!ripplePath || ripplePath.length === 0) return;

    ripplePath.forEach((layer, layerIdx) => {
      layer.forEach(key => {
        const el = document.querySelector(`[data-key="${key}"]`);
        if (el) {
          const timer = setTimeout(() => {
            el.classList.remove('ripple', 'ripple-layer-1', 'ripple-layer-2', 'ripple-layer-3', 'ripple-layer-4', 'ripple-layer-5');
            void el.offsetWidth; // 强制重绘
            el.classList.add('ripple', `ripple-layer-${Math.min(layerIdx + 1, 5)}`);

            // 创建波纹波
            const rect = el.getBoundingClientRect();
            const containerRect = document.getElementById('spreadsheetContainer').getBoundingClientRect();
            const wave = document.createElement('div');
            wave.className = 'ripple-wave';
            wave.style.left = (rect.left + rect.width / 2 - containerRect.left) + 'px';
            wave.style.top = (rect.top + rect.height / 2 - containerRect.top) + 'px';
            overlay.appendChild(wave);
            setTimeout(() => wave.remove(), 1000);
          }, layerIdx * 50);
          this.rippleTimers.push(timer);
        }
      });
    });
  }

  clearRippleTimers() {
    this.rippleTimers.forEach(t => clearTimeout(t));
    this.rippleTimers = [];
  }

  showCascadeAnimation(changed) {
    changed.forEach((cc, idx) => {
      const el = document.querySelector(`[data-key="${cc.key}"]`);
      if (el) {
        setTimeout(() => {
          el.classList.remove('cascade');
          void el.offsetWidth;
          el.classList.add('cascade');

          // 发散检测
          if (cc.value === '#NUM!' || (typeof cc.value === 'number' && !isFinite(cc.value))) {
            el.classList.add('divergent');
          }

          // #REF 传播
          if (cc.dtype === 'error' && typeof cc.value === 'string' && cc.value.includes('REF')) {
            el.classList.add('ref-error');
          }
        }, idx * 30);
      }
    });
  }

  showProgress() {
    this.progress = 0;
    const fill = document.getElementById('progressFill');
    const info = document.getElementById('progressInfo');
    if (fill) fill.style.width = '0%';
    if (info) info.textContent = '初始化...';

    let step = 0;
    if (this.progressTimer) clearInterval(this.progressTimer);
    this.progressTimer = setInterval(() => {
      step++;
      const pct = Math.min(step * 5, 95);
      if (fill) fill.style.width = pct + '%';
      if (info) info.textContent = `计算中... ${pct}%`;
      if (step >= 20) clearInterval(this.progressTimer);
    }, 50);
  }

  updateProgress(steps) {
    if (this.progressTimer) clearInterval(this.progressTimer);
    const fill = document.getElementById('progressFill');
    const info = document.getElementById('progressInfo');
    const iterCount = document.getElementById('iterCount');
    const convergeStatus = document.getElementById('convergeStatus');

    if (fill) fill.style.width = '100%';

    if (steps && steps.length > 0) {
      if (info) {
        const lastStep = steps[steps.length - 1];
        if (lastStep.iteration !== undefined) {
          info.textContent = `迭代 ${lastStep.iteration} 次 ${lastStep.converged ? '(已收敛)' : '(最大迭代次数)'}`;
        } else {
          info.textContent = `计算完成，共 ${steps.length} 步`;
        }
      }
      if (iterCount && steps[0].iteration !== undefined) {
        iterCount.textContent = steps[steps.length - 1].iteration;
      }
      if (convergeStatus && steps[0].iteration !== undefined) {
        convergeStatus.textContent = steps[steps.length - 1].converged ? '✓ 已收敛' : '⚠ 未收敛/发散';
      }
    } else {
      if (info) info.textContent = '计算完成';
    }

    setTimeout(() => {
      if (fill) fill.style.width = '0%';
    }, 2000);
  }

  setCalcStatus(type, text) {
    const indicator = document.getElementById('calcIndicator');
    const status = document.getElementById('calcStatus');
    if (indicator) {
      indicator.className = `calc-indicator ${type}`;
    }
    if (status) status.textContent = text;
  }

  highlightFormula(text) {
    // 公式栏语法着色 - 渐变动画
    const formulaInput = document.getElementById('formulaInput');
    if (text.startsWith('=')) {
      formulaInput.classList.add('formula-gradient');
    } else {
      formulaInput.classList.remove('formula-gradient');
    }
  }

  // 工具方法
  colToLetter(col) {
    let s = '';
    col++;
    while (col > 0) {
      const r = (col - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      col = Math.floor((col - 1) / 26);
    }
    return s;
  }

  rcToName(row, col) {
    return this.colToLetter(col) + (row + 1);
  }

  nameToRC(name) {
    const m = /^([A-Za-z]+)(\d+)$/.exec(name);
    if (!m) return { row: 0, col: 0 };
    let col = 0;
    for (const c of m[1].toUpperCase()) col = col * 26 + (c.charCodeAt(0) - 64);
    return { row: parseInt(m[2], 10) - 1, col: col - 1 };
  }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SpreadsheetApp();
});
