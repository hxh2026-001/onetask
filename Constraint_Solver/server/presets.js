const { createPoint, createLine, createCircle, ConstraintType } = require('./geometry');

function createOverConstrainedPreset() {
  const elements = [
    createPoint(1, 100, 300, true),
    createPoint(2, 200, 300, false),
    createPoint(3, 300, 300, false),
    createPoint(4, 200, 200, false),
    createLine(1, 1, 2),
    createLine(2, 2, 3),
    createLine(3, 2, 4),
    createLine(4, 4, 1)
  ];
  
  const constraints = [
    { id: 1, type: ConstraintType.DISTANCE, elementIds: [1], value: 100 },
    { id: 2, type: ConstraintType.DISTANCE, elementIds: [2], value: 100 },
    { id: 3, type: ConstraintType.DISTANCE, elementIds: [3], value: 100 },
    { id: 4, type: ConstraintType.DISTANCE, elementIds: [4], value: 100 },
    { id: 5, type: ConstraintType.PERPENDICULAR, elementIds: [3, 4] }
  ];
  
  return {
    name: '预设一：过约束系统',
    presetType: 'over-constrained',
    description: '五个约束条件四个自由度，求解器将使用最小二乘法，可观察到解偏离期望值',
    elements,
    constraints
  };
}

function createUnderConstrainedPreset() {
  const elements = [
    createPoint(1, 100, 300, true),
    createPoint(2, 250, 300, false),
    createPoint(3, 400, 250, false),
    createPoint(4, 250, 200, false),
    createLine(1, 1, 2),
    createLine(2, 2, 3),
    createLine(3, 3, 4),
    createLine(4, 4, 1)
  ];
  
  const constraints = [
    { id: 1, type: ConstraintType.DISTANCE, elementIds: [1], value: 150 },
    { id: 2, type: ConstraintType.PERPENDICULAR, elementIds: [1, 2] },
    { id: 3, type: ConstraintType.EQUAL_LENGTH, elementIds: [1, 3] }
  ];
  
  return {
    name: '预设二：欠约束系统',
    presetType: 'under-constrained',
    description: '缺少两个距离约束，解不唯一，可观察到几何体自由移动',
    elements,
    constraints
  };
}

function createConflictingPreset() {
  const elements = [
    createPoint(1, 100, 300, true),
    createPoint(2, 200, 300, false),
    createPoint(3, 300, 250, false),
    createLine(1, 1, 2),
    createLine(2, 2, 3)
  ];
  
  const constraints = [
    { id: 1, type: ConstraintType.DISTANCE, elementIds: [1], value: 100 },
    { id: 2, type: ConstraintType.DISTANCE, elementIds: [1], value: 166.67 },
    { id: 3, type: ConstraintType.HORIZONTAL, elementIds: [1] },
    { id: 4, type: ConstraintType.DISTANCE, elementIds: [2], value: 111.8 }
  ];
  
  return {
    name: '预设三：矛盾约束',
    presetType: 'conflicting',
    description: '线段 L1 同时要求等于 100 和 166.67，系统无解，可观察到错误高亮',
    elements,
    constraints
  };
}

function createCyclicPreset() {
  const elements = [
    createPoint(1, 200, 300, false),
    createPoint(2, 350, 300, false),
    createPoint(3, 275, 175, false),
    createCircle(1, 1, 60, false),
    createCircle(2, 2, 60, false),
    createCircle(3, 3, 60, false)
  ];
  
  const constraints = [
    { id: 1, type: ConstraintType.TANGENT, elementIds: [1, 2] },
    { id: 2, type: ConstraintType.TANGENT, elementIds: [2, 3] },
    { id: 3, type: ConstraintType.TANGENT, elementIds: [3, 1] },
    { id: 4, type: ConstraintType.RADIUS, elementIds: [1], value: 60 },
    { id: 5, type: ConstraintType.RADIUS, elementIds: [2], value: 60 },
    { id: 6, type: ConstraintType.RADIUS, elementIds: [3], value: 60 }
  ];
  
  return {
    name: '预设四：循环依赖约束',
    presetType: 'cyclic',
    description: '圆A相切于圆B，圆B相切于圆C，圆C相切于圆A，可观察到迭代不收敛，残差震荡',
    elements,
    constraints
  };
}

function createLocalMinimumPreset() {
  const elements = [
    createPoint(1, 100, 300, true),
    createPoint(2, 200, 100, false),
    createPoint(3, 300, 300, true),
    createLine(1, 1, 2),
    createLine(2, 2, 3),
    createLine(3, 3, 1)
  ];
  
  const constraints = [
    { id: 1, type: ConstraintType.DISTANCE, elementIds: [1], value: 200 },
    { id: 2, type: ConstraintType.DISTANCE, elementIds: [2], value: 200 },
    { id: 3, type: ConstraintType.DISTANCE, elementIds: [3], value: 200 }
  ];
  
  return {
    name: '预设五：局部最优解',
    presetType: 'local-minimum',
    description: '初始猜测不佳导致求解器陷入局部最优，可观察到残差不再下降但未收敛',
    elements,
    constraints
  };
}

function createSingularPreset() {
  const elements = [
    createPoint(1, 100, 300, true),
    createPoint(2, 150, 300, false),
    createPoint(3, 200, 300, false),
    createPoint(4, 250, 300, false),
    createLine(1, 1, 2),
    createLine(2, 2, 3),
    createLine(3, 3, 4)
  ];
  
  const constraints = [
    { id: 1, type: ConstraintType.HORIZONTAL, elementIds: [1] },
    { id: 2, type: ConstraintType.HORIZONTAL, elementIds: [2] },
    { id: 3, type: ConstraintType.HORIZONTAL, elementIds: [3] },
    { id: 4, type: ConstraintType.DISTANCE, elementIds: [1], value: 50 },
    { id: 5, type: ConstraintType.DISTANCE, elementIds: [2], value: 50 }
  ];
  
  return {
    name: '预设六：数值奇异',
    presetType: 'singular',
    description: '共线点导致雅可比矩阵接近奇异，可观察到条件数很大',
    elements,
    constraints
  };
}

const PRESETS = {
  'over-constrained': createOverConstrainedPreset,
  'under-constrained': createUnderConstrainedPreset,
  'conflicting': createConflictingPreset,
  'cyclic': createCyclicPreset,
  'local-minimum': createLocalMinimumPreset,
  'singular': createSingularPreset
};

function getPreset(presetType) {
  const creator = PRESETS[presetType];
  if (creator) {
    return creator();
  }
  return null;
}

function listPresets() {
  return Object.keys(PRESETS).map(type => {
    const preset = PRESETS[type]();
    return {
      type,
      name: preset.name,
      description: preset.description
    };
  });
}

module.exports = {
  getPreset,
  listPresets,
  createOverConstrainedPreset,
  createUnderConstrainedPreset,
  createConflictingPreset,
  createCyclicPreset,
  createLocalMinimumPreset,
  createSingularPreset
};
