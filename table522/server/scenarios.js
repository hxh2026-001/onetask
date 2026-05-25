// 四个预设场景
export const SCENARIOS = {
  financial: {
    name: '正常财务报表场景',
    description: '资产负债表、利润表基本财务公式',
    sheets: ['Sheet1'],
    cells: [
      { sheet: 'Sheet1', row: 0, col: 0, raw: '项目' },
      { sheet: 'Sheet1', row: 0, col: 1, raw: '金额' },
      { sheet: 'Sheet1', row: 0, col: 2, raw: '公式' },
      { sheet: 'Sheet1', row: 1, col: 0, raw: '营业收入' },
      { sheet: 'Sheet1', row: 1, col: 1, raw: '1000000' },
      { sheet: 'Sheet1', row: 2, col: 0, raw: '营业成本' },
      { sheet: 'Sheet1', row: 2, col: 1, raw: '600000' },
      { sheet: 'Sheet1', row: 3, col: 0, raw: '毛利润' },
      { sheet: 'Sheet1', row: 3, col: 1, raw: '=B2-B3' },
      { sheet: 'Sheet1', row: 3, col: 2, raw: '=B2-B3' },
      { sheet: 'Sheet1', row: 4, col: 0, raw: '销售费用' },
      { sheet: 'Sheet1', row: 4, col: 1, raw: '80000' },
      { sheet: 'Sheet1', row: 5, col: 0, raw: '管理费用' },
      { sheet: 'Sheet1', row: 5, col: 1, raw: '120000' },
      { sheet: 'Sheet1', row: 6, col: 0, raw: '财务费用' },
      { sheet: 'Sheet1', row: 6, col: 1, raw: '20000' },
      { sheet: 'Sheet1', row: 7, col: 0, raw: '营业利润' },
      { sheet: 'Sheet1', row: 7, col: 1, raw: '=B4-B5-B6-B7' },
      { sheet: 'Sheet1', row: 7, col: 2, raw: '=B4-B5-B6-B7' },
      { sheet: 'Sheet1', row: 8, col: 0, raw: '利润总额' },
      { sheet: 'Sheet1', row: 8, col: 1, raw: '=B8' },
      { sheet: 'Sheet1', row: 9, col: 0, raw: '所得税(25%)' },
      { sheet: 'Sheet1', row: 9, col: 1, raw: '=B9*0.25' },
      { sheet: 'Sheet1', row: 10, col: 0, raw: '净利润' },
      { sheet: 'Sheet1', row: 10, col: 1, raw: '=B9-B10' },
      { sheet: 'Sheet1', row: 10, col: 2, raw: '=B9-B10' },
      { sheet: 'Sheet1', row: 12, col: 0, raw: '从上到下累加' },
      { sheet: 'Sheet1', row: 12, col: 1, raw: '=SUM_TOP_DOWN(B2:B11)' },
      { sheet: 'Sheet1', row: 13, col: 0, raw: '从底向上累加' },
      { sheet: 'Sheet1', row: 13, col: 1, raw: '=SUM_BOTTOM_UP(B2:B11)' },
      { sheet: 'Sheet1', row: 14, col: 0, raw: '差异' },
      { sheet: 'Sheet1', row: 14, col: 1, raw: '=B13-B14' },
      { sheet: 'Sheet1', row: 14, col: 2, raw: '浮点精度差异' },
    ]
  },

  circular: {
    name: '循环引用场景',
    description: '迭代近似收敛与发散演示',
    sheets: ['Sheet1'],
    cells: [
      { sheet: 'Sheet1', row: 0, col: 0, raw: '收敛型循环引用' },
      { sheet: 'Sheet1', row: 1, col: 0, raw: 'X = 0.5*Y + 1' },
      { sheet: 'Sheet1', row: 2, col: 0, raw: 'Y = 0.5*X + 1' },
      { sheet: 'Sheet1', row: 1, col: 1, raw: '=0.5*B3+1' },
      { sheet: 'Sheet1', row: 2, col: 1, raw: '=0.5*B2+1' },
      { sheet: 'Sheet1', row: 4, col: 0, raw: '理论解 X=Y=2' },
      { sheet: 'Sheet1', row: 6, col: 0, raw: '发散型循环引用' },
      { sheet: 'Sheet1', row: 7, col: 0, raw: 'A = 2*B + 1' },
      { sheet: 'Sheet1', row: 8, col: 0, raw: 'B = 2*A + 1' },
      { sheet: 'Sheet1', row: 7, col: 1, raw: '=2*B9+1' },
      { sheet: 'Sheet1', row: 8, col: 1, raw: '=2*B8+1' },
      { sheet: 'Sheet1', row: 10, col: 0, raw: '初值均为1，将发散到#NUM!' },
    ]
  },

  crossSheet: {
    name: '跨工作表依赖场景',
    description: '跨表间接依赖长链与#REF传播',
    sheets: ['Sheet1', 'Sheet2', 'Sheet3'],
    cells: [
      { sheet: 'Sheet1', row: 0, col: 0, raw: '数据源' },
      { sheet: 'Sheet1', row: 0, col: 1, raw: '100' },
      { sheet: 'Sheet1', row: 1, col: 0, raw: 'A1' },
      { sheet: 'Sheet1', row: 1, col: 1, raw: '200' },
      { sheet: 'Sheet2', row: 0, col: 0, raw: '中间层' },
      { sheet: 'Sheet2', row: 0, col: 1, raw: '=Sheet1!B1' },
      { sheet: 'Sheet2', row: 1, col: 0, raw: '中间层2' },
      { sheet: 'Sheet2', row: 1, col: 1, raw: '=Sheet1!B2' },
      { sheet: 'Sheet3', row: 0, col: 0, raw: '汇总层' },
      { sheet: 'Sheet3', row: 0, col: 1, raw: '=Sheet2!B1' },
      { sheet: 'Sheet3', row: 1, col: 0, raw: '汇总层2' },
      { sheet: 'Sheet3', row: 1, col: 1, raw: '=Sheet2!B2' },
      { sheet: 'Sheet3', row: 2, col: 0, raw: '总计' },
      { sheet: 'Sheet3', row: 2, col: 1, raw: '=B1+B2' },
      { sheet: 'Sheet3', row: 3, col: 0, raw: '（删除Sheet2!B1后此处变#REF!）' },
    ]
  },

  arrayFormula: {
    name: '大范围数组公式场景',
    description: '数组溢出与静默返回部分结果',
    sheets: ['Sheet1'],
    cells: [
      { sheet: 'Sheet1', row: 0, col: 0, raw: '数组公式：=MSEQUENCE(5,3,1,1)' },
      { sheet: 'Sheet1', row: 0, col: 1, raw: '=MSEQUENCE(5,3,1,1)' },
      { sheet: 'Sheet1', row: 7, col: 0, raw: '障碍单元格（阻止溢出）' },
      { sheet: 'Sheet1', row: 3, col: 4, raw: '999' },
      { sheet: 'Sheet1', row: 10, col: 0, raw: '正常溢出：=TRANSPOSE({1,2,3;4,5,6})' },
      { sheet: 'Sheet1', row: 10, col: 1, raw: '=TRANSPOSE({1,2,3;4,5,6})' },
      { sheet: 'Sheet1', row: 15, col: 0, raw: '财务求和精度测试' },
      { sheet: 'Sheet1', row: 16, col: 0, raw: '=0.1' },
      { sheet: 'Sheet1', row: 17, col: 0, raw: '=0.2' },
      { sheet: 'Sheet1', row: 18, col: 0, raw: 'SUM_TOP_DOWN' },
      { sheet: 'Sheet1', row: 18, col: 1, raw: '=SUM_TOP_DOWN(A17:A18)' },
      { sheet: 'Sheet1', row: 19, col: 0, raw: 'SUM_BOTTOM_UP' },
      { sheet: 'Sheet1', row: 19, col: 1, raw: '=SUM_BOTTOM_UP(A17:A18)' },
    ]
  }
};

export function loadScenario(engine, scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) return [];

  // 清除所有数据
  engine.dg = new (Object.getPrototypeOf(engine.dg).constructor)();
  engine.cellStore.clear();
  engine.arraySpills.clear();

  const changedKeys = [];
  for (const cell of scenario.cells) {
    const key = engine.setCell(cell.sheet, cell.row, cell.col, cell.raw);
    changedKeys.push(key);
  }

  const result = engine.recalc(changedKeys);
  return result;
}

export function getScenarioList() {
  return Object.entries(SCENARIOS).map(([key, val]) => ({
    key, name: val.name, description: val.description
  }));
}
