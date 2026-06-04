const math = require('mathjs');
const { 
  ConstraintType, 
  ElementType, 
  extractVariables, 
  getElementParams,
  getLineLength,
  getPointDistance,
  getLineSlope,
  dotProduct
} = require('./geometry');
const { analyzeConstraintSystem } = require('./constraint_graph');

const EPSILON = 1e-6;
const MAX_ITERATIONS = 100;
const CONVERGENCE_TOLERANCE = 1e-8;

function computeResiduals(elements, constraints, variableMap, x) {
  const residuals = [];
  const params = getElementParams(elements, variableMap, x);
  const constraintViolations = [];
  
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i];
    let residual = 0;
    
    switch (constraint.type) {
      case ConstraintType.DISTANCE: {
        const elem = elements.find(e => e.id === constraint.elementIds[0]);
        if (elem.type === ElementType.LINE) {
          const lineParams = params[elem.id];
          const length = getLineLength(lineParams);
          residual = length - constraint.value;
        } else if (elem.type === ElementType.POINT && constraint.elementIds.length >= 2) {
          const p1 = params[constraint.elementIds[0]];
          const p2 = params[constraint.elementIds[1]];
          const dist = getPointDistance(p1, p2);
          residual = dist - constraint.value;
        }
        break;
      }
      
      case ConstraintType.EQUAL_LENGTH: {
        const line1 = elements.find(e => e.id === constraint.elementIds[0]);
        const line2 = elements.find(e => e.id === constraint.elementIds[1]);
        if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
          const len1 = getLineLength(params[line1.id]);
          const len2 = getLineLength(params[line2.id]);
          residual = len1 - len2;
        }
        break;
      }
      
      case ConstraintType.PERPENDICULAR: {
        const line1 = elements.find(e => e.id === constraint.elementIds[0]);
        const line2 = elements.find(e => e.id === constraint.elementIds[1]);
        if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
          const v1 = getLineSlope(params[line1.id]);
          const v2 = getLineSlope(params[line2.id]);
          residual = dotProduct(v1, v2);
        }
        break;
      }
      
      case ConstraintType.PARALLEL: {
        const line1 = elements.find(e => e.id === constraint.elementIds[0]);
        const line2 = elements.find(e => e.id === constraint.elementIds[1]);
        if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
          const v1 = getLineSlope(params[line1.id]);
          const v2 = getLineSlope(params[line2.id]);
          residual = v1.dx * v2.dy - v1.dy * v2.dx;
        }
        break;
      }
      
      case ConstraintType.HORIZONTAL: {
        const elem = elements.find(e => e.id === constraint.elementIds[0]);
        if (elem.type === ElementType.LINE) {
          const lineParams = params[elem.id];
          residual = lineParams.ey - lineParams.sy;
        }
        break;
      }
      
      case ConstraintType.VERTICAL: {
        const elem = elements.find(e => e.id === constraint.elementIds[0]);
        if (elem.type === ElementType.LINE) {
          const lineParams = params[elem.id];
          residual = lineParams.ex - lineParams.sx;
        }
        break;
      }
      
      case ConstraintType.TANGENT: {
        const elem1 = elements.find(e => e.id === constraint.elementIds[0]);
        const elem2 = elements.find(e => e.id === constraint.elementIds[1]);
        
        if (elem1.type === ElementType.CIRCLE && elem2.type === ElementType.CIRCLE) {
          const c1 = params[elem1.id];
          const c2 = params[elem2.id];
          const dist = Math.sqrt((c2.cx - c1.cx) ** 2 + (c2.cy - c1.cy) ** 2);
          residual = dist - (c1.r + c2.r);
        } else if (elem1.type === ElementType.CIRCLE && elem2.type === ElementType.LINE) {
          const circle = params[elem1.id];
          const line = params[elem2.id];
          const A = line.ey - line.sy;
          const B = line.sx - line.ex;
          const C = line.ex * line.sy - line.sx * line.ey;
          const dist = Math.abs(A * circle.cx + B * circle.cy + C) / Math.sqrt(A * A + B * B);
          residual = dist - circle.r;
        } else if (elem1.type === ElementType.LINE && elem2.type === ElementType.CIRCLE) {
          const line = params[elem1.id];
          const circle = params[elem2.id];
          const A = line.ey - line.sy;
          const B = line.sx - line.ex;
          const C = line.ex * line.sy - line.sx * line.ey;
          const dist = Math.abs(A * circle.cx + B * circle.cy + C) / Math.sqrt(A * A + B * B);
          residual = dist - circle.r;
        }
        break;
      }
      
      case ConstraintType.RADIUS: {
        const circle = elements.find(e => e.id === constraint.elementIds[0]);
        if (circle && circle.type === ElementType.CIRCLE) {
          const circleParams = params[circle.id];
          residual = circleParams.r - constraint.value;
        }
        break;
      }
      
      case ConstraintType.CONCENTRIC: {
        const circle1 = elements.find(e => e.id === constraint.elementIds[0]);
        const circle2 = elements.find(e => e.id === constraint.elementIds[1]);
        if (circle1 && circle2 && circle1.type === ElementType.CIRCLE && circle2.type === ElementType.CIRCLE) {
          const c1 = params[circle1.id];
          const c2 = params[circle2.id];
          residuals.push(c1.cx - c2.cx);
          residual = c1.cy - c2.cy;
        }
        break;
      }
      
      case ConstraintType.COINCIDENT: {
        const p1 = params[constraint.elementIds[0]];
        const p2 = params[constraint.elementIds[1]];
        if (p1 && p2) {
          residuals.push(p1.x - p2.x);
          residual = p1.y - p2.y;
        }
        break;
      }
      
      case ConstraintType.ANGLE: {
        const line1 = elements.find(e => e.id === constraint.elementIds[0]);
        const line2 = elements.find(e => e.id === constraint.elementIds[1]);
        if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
          const v1 = getLineSlope(params[line1.id]);
          const v2 = getLineSlope(params[line2.id]);
          const dot = dotProduct(v1, v2);
          const len1 = Math.sqrt(v1.dx * v1.dx + v1.dy * v1.dy);
          const len2 = Math.sqrt(v2.dx * v2.dx + v2.dy * v2.dy);
          const cosAngle = dot / (len1 * len2);
          const targetAngle = constraint.value * Math.PI / 180;
          residual = cosAngle - Math.cos(targetAngle);
        }
        break;
      }
      
      case ConstraintType.FIXED: {
        const point = elements.find(e => e.id === constraint.elementIds[0]);
        if (point && point.type === ElementType.POINT) {
          const p = params[point.id];
          residuals.push(p.x - constraint.value.x);
          residual = p.y - constraint.value.y;
        }
        break;
      }
    }
    
    residuals.push(residual);
    constraintViolations.push({
      constraintId: constraint.id,
      type: constraint.type,
      violation: Math.abs(residual),
      satisfied: Math.abs(residual) < CONVERGENCE_TOLERANCE
    });
  }
  
  return { residuals, constraintViolations };
}

function computeJacobian(elements, constraints, variableMap, variables, x) {
  const n = constraints.length;
  const m = variables.length;
  const jacobian = math.zeros(n * 2, m);
  
  const h = 1e-8;
  
  let row = 0;
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i];
    
    const needsTwoRows = [
      ConstraintType.CONCENTRIC,
      ConstraintType.COINCIDENT,
      ConstraintType.FIXED
    ].includes(constraint.type);
    
    for (let col = 0; col < m; col++) {
      const xPlus = [...x];
      const xMinus = [...x];
      xPlus[col] += h;
      xMinus[col] -= h;
      
      const resPlus = computeResidualsForConstraint(elements, constraints, variableMap, xPlus, i);
      const resMinus = computeResidualsForConstraint(elements, constraints, variableMap, xMinus, i);
      
      if (needsTwoRows && resPlus.length === 2) {
        jacobian.set([row, col], (resPlus[0] - resMinus[0]) / (2 * h));
        jacobian.set([row + 1, col], (resPlus[1] - resMinus[1]) / (2 * h));
      } else {
        jacobian.set([row, col], (resPlus[0] - resMinus[0]) / (2 * h));
      }
    }
    
    if (needsTwoRows) {
      row += 2;
    } else {
      row += 1;
    }
  }
  
  const actualRows = row;
  if (actualRows < jacobian.size()[0]) {
    return jacobian.subset(math.index(math.range(0, actualRows), math.range(0, m)));
  }
  
  return jacobian;
}

function computeResidualsForConstraint(elements, constraints, variableMap, x, constraintIndex) {
  const constraint = constraints[constraintIndex];
  const params = getElementParams(elements, variableMap, x);
  const residuals = [];
  
  switch (constraint.type) {
    case ConstraintType.DISTANCE: {
      const elem = elements.find(e => e.id === constraint.elementIds[0]);
      if (elem.type === ElementType.LINE) {
        const lineParams = params[elem.id];
        const length = getLineLength(lineParams);
        residuals.push(length - constraint.value);
      } else if (elem.type === ElementType.POINT && constraint.elementIds.length >= 2) {
        const p1 = params[constraint.elementIds[0]];
        const p2 = params[constraint.elementIds[1]];
        const dist = getPointDistance(p1, p2);
        residuals.push(dist - constraint.value);
      }
      break;
    }
    
    case ConstraintType.EQUAL_LENGTH: {
      const line1 = elements.find(e => e.id === constraint.elementIds[0]);
      const line2 = elements.find(e => e.id === constraint.elementIds[1]);
      if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
        const len1 = getLineLength(params[line1.id]);
        const len2 = getLineLength(params[line2.id]);
        residuals.push(len1 - len2);
      }
      break;
    }
    
    case ConstraintType.PERPENDICULAR: {
      const line1 = elements.find(e => e.id === constraint.elementIds[0]);
      const line2 = elements.find(e => e.id === constraint.elementIds[1]);
      if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
        const v1 = getLineSlope(params[line1.id]);
        const v2 = getLineSlope(params[line2.id]);
        residuals.push(dotProduct(v1, v2));
      }
      break;
    }
    
    case ConstraintType.PARALLEL: {
      const line1 = elements.find(e => e.id === constraint.elementIds[0]);
      const line2 = elements.find(e => e.id === constraint.elementIds[1]);
      if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
        const v1 = getLineSlope(params[line1.id]);
        const v2 = getLineSlope(params[line2.id]);
        residuals.push(v1.dx * v2.dy - v1.dy * v2.dx);
      }
      break;
    }
    
    case ConstraintType.HORIZONTAL: {
      const elem = elements.find(e => e.id === constraint.elementIds[0]);
      if (elem.type === ElementType.LINE) {
        const lineParams = params[elem.id];
        residuals.push(lineParams.ey - lineParams.sy);
      }
      break;
    }
    
    case ConstraintType.VERTICAL: {
      const elem = elements.find(e => e.id === constraint.elementIds[0]);
      if (elem.type === ElementType.LINE) {
        const lineParams = params[elem.id];
        residuals.push(lineParams.ex - lineParams.sx);
      }
      break;
    }
    
    case ConstraintType.TANGENT: {
      const elem1 = elements.find(e => e.id === constraint.elementIds[0]);
      const elem2 = elements.find(e => e.id === constraint.elementIds[1]);
      
      if (elem1.type === ElementType.CIRCLE && elem2.type === ElementType.CIRCLE) {
        const c1 = params[elem1.id];
        const c2 = params[elem2.id];
        const dist = Math.sqrt((c2.cx - c1.cx) ** 2 + (c2.cy - c1.cy) ** 2);
        residuals.push(dist - (c1.r + c2.r));
      } else if (elem1.type === ElementType.CIRCLE && elem2.type === ElementType.LINE) {
        const circle = params[elem1.id];
        const line = params[elem2.id];
        const A = line.ey - line.sy;
        const B = line.sx - line.ex;
        const C = line.ex * line.sy - line.sx * line.ey;
        const dist = Math.abs(A * circle.cx + B * circle.cy + C) / Math.sqrt(A * A + B * B);
        residuals.push(dist - circle.r);
      } else if (elem1.type === ElementType.LINE && elem2.type === ElementType.CIRCLE) {
        const line = params[elem1.id];
        const circle = params[elem2.id];
        const A = line.ey - line.sy;
        const B = line.sx - line.ex;
        const C = line.ex * line.sy - line.sx * line.ey;
        const dist = Math.abs(A * circle.cx + B * circle.cy + C) / Math.sqrt(A * A + B * B);
        residuals.push(dist - circle.r);
      }
      break;
    }
    
    case ConstraintType.RADIUS: {
      const circle = elements.find(e => e.id === constraint.elementIds[0]);
      if (circle && circle.type === ElementType.CIRCLE) {
        const circleParams = params[circle.id];
        residuals.push(circleParams.r - constraint.value);
      }
      break;
    }
    
    case ConstraintType.CONCENTRIC: {
      const circle1 = elements.find(e => e.id === constraint.elementIds[0]);
      const circle2 = elements.find(e => e.id === constraint.elementIds[1]);
      if (circle1 && circle2 && circle1.type === ElementType.CIRCLE && circle2.type === ElementType.CIRCLE) {
        const c1 = params[circle1.id];
        const c2 = params[circle2.id];
        residuals.push(c1.cx - c2.cx);
        residuals.push(c1.cy - c2.cy);
      }
      break;
    }
    
    case ConstraintType.COINCIDENT: {
      const p1 = params[constraint.elementIds[0]];
      const p2 = params[constraint.elementIds[1]];
      if (p1 && p2) {
        residuals.push(p1.x - p2.x);
        residuals.push(p1.y - p2.y);
      }
      break;
    }
    
    case ConstraintType.ANGLE: {
      const line1 = elements.find(e => e.id === constraint.elementIds[0]);
      const line2 = elements.find(e => e.id === constraint.elementIds[1]);
      if (line1 && line2 && line1.type === ElementType.LINE && line2.type === ElementType.LINE) {
        const v1 = getLineSlope(params[line1.id]);
        const v2 = getLineSlope(params[line2.id]);
        const dot = dotProduct(v1, v2);
        const len1 = Math.sqrt(v1.dx * v1.dx + v1.dy * v1.dy);
        const len2 = Math.sqrt(v2.dx * v2.dx + v2.dy * v2.dy);
        const cosAngle = dot / (len1 * len2);
        const targetAngle = constraint.value * Math.PI / 180;
        residuals.push(cosAngle - Math.cos(targetAngle));
      }
      break;
    }
    
    case ConstraintType.FIXED: {
      const point = elements.find(e => e.id === constraint.elementIds[0]);
      if (point && point.type === ElementType.POINT) {
        const p = params[point.id];
        residuals.push(p.x - constraint.value.x);
        residuals.push(p.y - constraint.value.y);
      }
      break;
    }
  }
  
  return residuals.length > 0 ? residuals : [0];
}

function solveLeastSquares(J, residuals) {
  try {
    const JT = math.transpose(J);
    const JTJ = math.multiply(JT, J);
    const JTr = math.multiply(JT, residuals);
    
    const conditionNumber = math.cond(JTJ);
    let solution;
    
    if (conditionNumber > 1e12) {
      console.log(`⚠️ 雅可比矩阵病态，条件数: ${conditionNumber.toExponential(2)}，使用伪逆求解`);
      const J_pinv = math.pinv(J);
      solution = math.multiply(J_pinv, residuals);
    } else {
      solution = math.lusolve(JTJ, JTr);
    }
    
    return {
      solution: math.squeeze(solution),
      conditionNumber,
      singular: conditionNumber > 1e15
    };
  } catch (e) {
    console.log('⚠️ 矩阵求解失败，使用伪逆:', e.message);
    const J_pinv = math.pinv(J);
    return {
      solution: math.squeeze(math.multiply(J_pinv, residuals)),
      conditionNumber: Infinity,
      singular: true
    };
  }
}

function solveConstraints(elements, constraints, options = {}) {
  const { 
    maxIterations = MAX_ITERATIONS,
    tolerance = CONVERGENCE_TOLERANCE,
    saveHistory = null,
    sceneId = null
  } = options;
  
  const analysis = analyzeConstraintSystem(elements, constraints);
  const { variables, variableMap } = extractVariables(elements);
  
  if (variables.length === 0) {
    return {
      success: true,
      converged: true,
      iterations: 0,
      finalResidual: 0,
      elements,
      residualHistory: [{ iteration: 0, residual: 0, maxConstraintViolation: 0 }],
      searchPath: [],
      analysis,
      elementStates: {},
      constraintStates: {},
      warning: '没有可求解的变量，所有元素已固定'
    };
  }
  
  let x = variables.map(v => v.value);
  const residualHistory = [];
  const searchPath = [];
  const elementStates = {};
  const constraintStates = {};
  
  let previousResidual = Infinity;
  let oscillatingCount = 0;
  let lastResiduals = [];
  
  searchPath.push([...x]);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const { residuals, constraintViolations } = computeResiduals(elements, constraints, variableMap, x);
    
    const residualNorm = math.norm(residuals);
    const maxViolation = Math.max(...constraintViolations.map(v => v.violation));
    
    for (const violation of constraintViolations) {
      const currentState = constraintStates[violation.constraintId] || [];
      let status = 'unsatisfied';
      if (violation.satisfied) status = 'satisfied';
      else if (violation.violation < tolerance * 100) status = 'iterating';
      currentState.push({ iteration: iter, status, violation: violation.violation });
      constraintStates[violation.constraintId] = currentState;
    }
    
    for (const elem of elements) {
      const elemState = elementStates[elem.id] || [];
      let status = 'unsatisfied';
      const relatedConstraints = constraintViolations.filter(v => {
        const c = constraints.find(c => c.id === v.constraintId);
        return c && c.elementIds.includes(elem.id);
      });
      if (relatedConstraints.length === 0) status = 'satisfied';
      else if (relatedConstraints.every(v => v.satisfied)) status = 'satisfied';
      else if (relatedConstraints.every(v => v.violation < tolerance * 100)) status = 'iterating';
      elemState.push({ iteration: iter, status });
      elementStates[elem.id] = elemState;
    }
    
    residualHistory.push({
      iteration: iter,
      residual: residualNorm,
      maxConstraintViolation: maxViolation
    });
    
    if (saveHistory && sceneId !== null) {
      saveHistory(sceneId, iter, residualNorm, maxViolation, elementStates, constraintStates, searchPath[searchPath.length - 1]);
    }
    
    if (residualNorm < tolerance) {
      return {
        success: true,
        converged: true,
        iterations: iter + 1,
        finalResidual: residualNorm,
        elements: updateElements(elements, variableMap, x),
        residualHistory,
        searchPath,
        analysis,
        elementStates,
        constraintStates,
        message: `收敛成功，迭代 ${iter + 1} 次`
      };
    }
    
    lastResiduals.push(residualNorm);
    if (lastResiduals.length > 5) {
      lastResiduals.shift();
      const mean = lastResiduals.reduce((a, b) => a + b, 0) / lastResiduals.length;
      const variance = lastResiduals.reduce((a, b) => a + (b - mean) ** 2, 0) / lastResiduals.length;
      if (variance > 1e-6 && iter > 20) {
        oscillatingCount++;
        if (oscillatingCount > 5) {
          return {
            success: false,
            converged: false,
            iterations: iter + 1,
            finalResidual: residualNorm,
            elements: updateElements(elements, variableMap, x),
            residualHistory,
            searchPath,
            analysis,
            elementStates,
            constraintStates,
            error: '残差震荡，迭代不收敛（可能存在循环依赖）',
            oscillating: true
          };
        }
      }
    }
    
    if (Math.abs(previousResidual - residualNorm) < tolerance * 0.1 && iter > 10) {
      return {
        success: false,
        converged: false,
        iterations: iter + 1,
        finalResidual: residualNorm,
        elements: updateElements(elements, variableMap, x),
        residualHistory,
        searchPath,
        analysis,
        elementStates,
        constraintStates,
        error: '陷入局部最优解，残差不再下降',
        localMinimum: true
      };
    }
    previousResidual = residualNorm;
    
    const J = computeJacobian(elements, constraints, variableMap, variables, x);
    const lsResult = solveLeastSquares(J, residuals);
    
    if (lsResult.singular) {
      return {
        success: false,
        converged: false,
        iterations: iter + 1,
        finalResidual: residualNorm,
        elements: updateElements(elements, variableMap, x),
        residualHistory,
        searchPath,
        analysis,
        elementStates,
        constraintStates,
        error: '雅可比矩阵奇异，数值不稳定',
        singular: true,
        conditionNumber: lsResult.conditionNumber
      };
    }
    
    const dx = lsResult.solution;
    const stepSize = math.norm(dx);
    
    if (stepSize > 100) {
      const scale = 100 / stepSize;
      x = math.add(x, math.multiply(dx, scale));
    } else {
      x = math.add(x, dx);
    }
    
    searchPath.push([...x]);
    
    if (stepSize < tolerance) {
      const finalViolations = computeResiduals(elements, constraints, variableMap, x).constraintViolations;
      const finalMaxViolation = Math.max(...finalViolations.map(v => v.violation));
      
      if (finalMaxViolation < tolerance * 100) {
        return {
          success: true,
          converged: true,
          iterations: iter + 1,
          finalResidual: finalMaxViolation,
          elements: updateElements(elements, variableMap, x),
          residualHistory: [...residualHistory, { iteration: iter + 1, residual: finalMaxViolation, maxConstraintViolation: finalMaxViolation }],
          searchPath,
          analysis,
          elementStates,
          constraintStates,
          message: `收敛成功，迭代 ${iter + 1} 次`
        };
      }
    }
  }
  
  return {
    success: false,
    converged: false,
    iterations: maxIterations,
    finalResidual: residualHistory[residualHistory.length - 1]?.residual || Infinity,
    elements: updateElements(elements, variableMap, x),
    residualHistory,
    searchPath,
    analysis,
    elementStates,
    constraintStates,
    error: '达到最大迭代次数仍未收敛',
    maxIterationsReached: true
  };
}

function updateElements(elements, variableMap, x) {
  return elements.map(elem => {
    if (elem.type === ElementType.POINT) {
      const xIdx = variableMap[`${elem.id}_x`];
      const yIdx = variableMap[`${elem.id}_y`];
      return {
        ...elem,
        params: {
          ...elem.params,
          x: xIdx !== undefined ? x[xIdx] : elem.params.x,
          y: yIdx !== undefined ? x[yIdx] : elem.params.y
        }
      };
    } else if (elem.type === ElementType.CIRCLE) {
      const rIdx = variableMap[`${elem.id}_r`];
      return {
        ...elem,
        params: {
          ...elem.params,
          radius: rIdx !== undefined ? x[rIdx] : elem.params.radius
        }
      };
    }
    return elem;
  });
}

module.exports = {
  computeResiduals,
  computeJacobian,
  solveConstraints,
  solveLeastSquares,
  EPSILON,
  MAX_ITERATIONS,
  CONVERGENCE_TOLERANCE
};
