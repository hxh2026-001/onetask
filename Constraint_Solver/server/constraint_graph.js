const { ElementType, ConstraintType } = require('./geometry');

function buildConstraintGraph(elements, constraints) {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();
  
  for (const elem of elements) {
    const node = {
      id: elem.id,
      type: elem.type,
      element: elem,
      degree: 0,
      constrained: false
    };
    nodes.push(node);
    nodeMap.set(elem.id, node);
  }
  
  for (const constraint of constraints) {
    const involvedElements = constraint.elementIds;
    
    const edge = {
      id: constraint.id,
      type: constraint.type,
      constraint,
      nodes: involvedElements.map(id => nodeMap.get(id)).filter(Boolean),
      removesDOF: getConstraintDOF(constraint.type)
    };
    
    for (const node of edge.nodes) {
      if (node) {
        node.degree++;
        node.constrained = true;
      }
    }
    
    edges.push(edge);
  }
  
  return { nodes, edges, nodeMap };
}

function getConstraintDOF(constraintType) {
  const dofMap = {
    [ConstraintType.EQUAL_LENGTH]: 1,
    [ConstraintType.PERPENDICULAR]: 1,
    [ConstraintType.TANGENT]: 1,
    [ConstraintType.DISTANCE]: 1,
    [ConstraintType.FIXED]: 2,
    [ConstraintType.COINCIDENT]: 2,
    [ConstraintType.PARALLEL]: 1,
    [ConstraintType.HORIZONTAL]: 1,
    [ConstraintType.VERTICAL]: 1,
    [ConstraintType.RADIUS]: 1,
    [ConstraintType.ANGLE]: 1,
    [ConstraintType.CONCENTRIC]: 2
  };
  return dofMap[constraintType] || 1;
}

function calculateDegreesOfFreedom(elements, constraints) {
  let totalDOF = 0;
  let totalConstraints = 0;
  
  for (const elem of elements) {
    if (elem.type === ElementType.POINT) {
      totalDOF += elem.params.fixed ? 0 : 2;
    } else if (elem.type === ElementType.LINE) {
      const start = elements.find(e => e.id === elem.params.startPointId);
      const end = elements.find(e => e.id === elem.params.endPointId);
      if (start && !start.params.fixed) totalDOF += 2;
      if (end && !end.params.fixed) totalDOF += 2;
    } else if (elem.type === ElementType.CIRCLE) {
      const center = elements.find(e => e.id === elem.params.centerId);
      if (center && !center.params.fixed) totalDOF += 2;
      totalDOF += 1;
    }
  }
  
  for (const constraint of constraints) {
    totalConstraints += getConstraintDOF(constraint.type);
  }
  
  const netDOF = totalDOF - totalConstraints;
  let status = 'well-constrained';
  if (netDOF > 0) status = 'under-constrained';
  else if (netDOF < 0) status = 'over-constrained';
  
  return {
    totalDOF,
    totalConstraints,
    netDOF,
    status
  };
}

function detectCycles(graph) {
  const { nodes, edges } = graph;
  const visited = new Set();
  const recStack = new Set();
  const cycles = [];
  
  function dfs(node, path) {
    visited.add(node.id);
    recStack.add(node.id);
    path.push(node.id);
    
    const adjacent = edges
      .filter(e => e.nodes.includes(node))
      .flatMap(e => e.nodes)
      .filter(n => n && n.id !== node.id);
    
    for (const neighbor of adjacent) {
      if (!visited.has(neighbor.id)) {
        dfs(neighbor, path);
      } else if (recStack.has(neighbor.id)) {
        const cycleStart = path.indexOf(neighbor.id);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor.id);
          cycles.push(cycle);
        }
      }
    }
    
    path.pop();
    recStack.delete(node.id);
  }
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node, []);
    }
  }
  
  return cycles;
}

function detectConflicts(elements, constraints) {
  const conflicts = [];
  
  const lineLengthConstraints = constraints.filter(
    c => c.type === ConstraintType.DISTANCE || c.type === ConstraintType.EQUAL_LENGTH
  );
  
  const lineConstraintMap = new Map();
  for (const constraint of lineLengthConstraints) {
    for (const elemId of constraint.elementIds) {
      const elem = elements.find(e => e.id === elemId);
      if (elem && elem.type === ElementType.LINE) {
        if (!lineConstraintMap.has(elemId)) {
          lineConstraintMap.set(elemId, []);
        }
        lineConstraintMap.get(elemId).push(constraint);
      }
    }
  }
  
  for (const [lineId, consts] of lineConstraintMap) {
    const distanceConstraints = consts.filter(c => c.type === ConstraintType.DISTANCE);
    if (distanceConstraints.length >= 2) {
      const values = distanceConstraints.map(c => c.value).sort((a, b) => a - b);
      if (values[values.length - 1] - values[0] > 0.01) {
        conflicts.push({
          type: 'contradictory_length',
          elementIds: [lineId],
          constraintIds: distanceConstraints.map(c => c.id),
          message: `线段 ${lineId} 有多个矛盾的距离约束: ${values.join(' ≠ ')}`
        });
      }
    }
  }
  
  return conflicts;
}

function analyzeConstraintSystem(elements, constraints) {
  const graph = buildConstraintGraph(elements, constraints);
  const dofAnalysis = calculateDegreesOfFreedom(elements, constraints);
  const cycles = detectCycles(graph);
  const conflicts = detectConflicts(elements, constraints);
  
  const hasCycleDependency = cycles.length > 0;
  const hasConflict = conflicts.length > 0;
  
  let overallStatus = dofAnalysis.status;
  if (hasConflict) overallStatus = 'conflicting';
  if (hasCycleDependency && overallStatus === 'well-constrained') overallStatus = 'cyclic';
  
  return {
    graph,
    degreesOfFreedom: dofAnalysis,
    cycles,
    conflicts,
    hasCycleDependency,
    hasConflict,
    overallStatus,
    analysis: generateAnalysisReport(dofAnalysis, cycles, conflicts, overallStatus)
  };
}

function generateAnalysisReport(dofAnalysis, cycles, conflicts, overallStatus) {
  const report = [];
  
  report.push(`自由度分析: ${dofAnalysis.totalDOF} 个自由度, ${dofAnalysis.totalConstraints} 个约束方程`);
  report.push(`系统状态: ${overallStatus}`);
  
  if (dofAnalysis.status === 'under-constrained') {
    report.push(`⚠️ 欠约束系统: 缺少 ${dofAnalysis.netDOF} 个约束，解不唯一`);
  } else if (dofAnalysis.status === 'over-constrained') {
    report.push(`⚠️ 过约束系统: 多余 ${-dofAnalysis.netDOF} 个约束，可能无解，将使用最小二乘法求解`);
  }
  
  if (cycles.length > 0) {
    report.push(`⚠️ 检测到 ${cycles.length} 个循环依赖，可能导致迭代不收敛`);
    cycles.forEach((cycle, i) => {
      report.push(`  循环 ${i + 1}: ${cycle.join(' → ')}`);
    });
  }
  
  if (conflicts.length > 0) {
    report.push(`❌ 检测到 ${conflicts.length} 个矛盾约束，系统无解`);
    conflicts.forEach(conflict => {
      report.push(`  ${conflict.message}`);
    });
  }
  
  return report;
}

module.exports = {
  buildConstraintGraph,
  calculateDegreesOfFreedom,
  detectCycles,
  detectConflicts,
  analyzeConstraintSystem,
  getConstraintDOF
};
