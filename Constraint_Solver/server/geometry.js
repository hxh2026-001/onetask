const ConstraintType = {
  EQUAL_LENGTH: 'equal_length',
  PERPENDICULAR: 'perpendicular',
  TANGENT: 'tangent',
  DISTANCE: 'distance',
  FIXED: 'fixed',
  COINCIDENT: 'coincident',
  PARALLEL: 'parallel',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  RADIUS: 'radius',
  ANGLE: 'angle',
  CONCENTRIC: 'concentric'
};

const ElementType = {
  POINT: 'point',
  LINE: 'line',
  CIRCLE: 'circle'
};

function createPoint(id, x, y, fixed = false) {
  return {
    id,
    type: ElementType.POINT,
    label: `P${id}`,
    params: { x, y, fixed }
  };
}

function createLine(id, startPointId, endPointId) {
  return {
    id,
    type: ElementType.LINE,
    label: `L${id}`,
    params: { startPointId, endPointId }
  };
}

function createCircle(id, centerId, radius, fixedCenter = false) {
  return {
    id,
    type: ElementType.CIRCLE,
    label: `C${id}`,
    params: { centerId, radius, fixedCenter }
  };
}

function extractVariables(elements) {
  const variables = [];
  const variableMap = {};
  
  const points = elements.filter(e => e.type === ElementType.POINT);
  const circles = elements.filter(e => e.type === ElementType.CIRCLE);
  
  for (const point of points) {
    if (!point.params.fixed) {
      const xIdx = variables.length;
      const yIdx = variables.length + 1;
      variables.push({ 
        elementId: point.id, 
        elementType: ElementType.POINT, 
        param: 'x', 
        value: point.params.x 
      });
      variables.push({ 
        elementId: point.id, 
        elementType: ElementType.POINT, 
        param: 'y', 
        value: point.params.y 
      });
      variableMap[`${point.id}_x`] = xIdx;
      variableMap[`${point.id}_y`] = yIdx;
    }
  }
  
  for (const circle of circles) {
    const center = elements.find(e => e.id === circle.params.centerId);
    if (center && !circle.params.fixedCenter && !center.params.fixed) {
      const rIdx = variables.length;
      variables.push({ 
        elementId: circle.id, 
        elementType: ElementType.CIRCLE, 
        param: 'radius', 
        value: circle.params.radius 
      });
      variableMap[`${circle.id}_r`] = rIdx;
    } else {
      const rIdx = variables.length;
      variables.push({ 
        elementId: circle.id, 
        elementType: ElementType.CIRCLE, 
        param: 'radius', 
        value: circle.params.radius 
      });
      variableMap[`${circle.id}_r`] = rIdx;
    }
  }
  
  return { variables, variableMap };
}

function getElementParams(elements, variableMap, x) {
  const params = {};
  
  for (const elem of elements) {
    if (elem.type === ElementType.POINT) {
      const xIdx = variableMap[`${elem.id}_x`];
      const yIdx = variableMap[`${elem.id}_y`];
      params[elem.id] = {
        x: xIdx !== undefined ? x[xIdx] : elem.params.x,
        y: yIdx !== undefined ? x[yIdx] : elem.params.y
      };
    } else if (elem.type === ElementType.CIRCLE) {
      const center = elements.find(e => e.id === elem.params.centerId);
      const cxIdx = variableMap[`${center.id}_x`];
      const cyIdx = variableMap[`${center.id}_y`];
      const rIdx = variableMap[`${elem.id}_r`];
      params[elem.id] = {
        cx: cxIdx !== undefined ? x[cxIdx] : center.params.x,
        cy: cyIdx !== undefined ? x[cyIdx] : center.params.y,
        r: rIdx !== undefined ? x[rIdx] : elem.params.radius
      };
    } else if (elem.type === ElementType.LINE) {
      const start = elements.find(e => e.id === elem.params.startPointId);
      const end = elements.find(e => e.id === elem.params.endPointId);
      const sxIdx = variableMap[`${start.id}_x`];
      const syIdx = variableMap[`${start.id}_y`];
      const exIdx = variableMap[`${end.id}_x`];
      const eyIdx = variableMap[`${end.id}_y`];
      params[elem.id] = {
        sx: sxIdx !== undefined ? x[sxIdx] : start.params.x,
        sy: syIdx !== undefined ? x[syIdx] : start.params.y,
        ex: exIdx !== undefined ? x[exIdx] : end.params.x,
        ey: eyIdx !== undefined ? x[eyIdx] : end.params.y
      };
    }
  }
  
  return params;
}

function getLineLength(lineParams) {
  const dx = lineParams.ex - lineParams.sx;
  const dy = lineParams.ey - lineParams.sy;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPointDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getLineSlope(lineParams) {
  const dx = lineParams.ex - lineParams.sx;
  const dy = lineParams.ey - lineParams.sy;
  return { dx, dy };
}

function dotProduct(v1, v2) {
  return v1.dx * v2.dx + v1.dy * v2.dy;
}

function crossProduct(v1, v2) {
  return v1.dx * v2.dy - v1.dy * v2.dx;
}

module.exports = {
  ConstraintType,
  ElementType,
  createPoint,
  createLine,
  createCircle,
  extractVariables,
  getElementParams,
  getLineLength,
  getPointDistance,
  getLineSlope,
  dotProduct,
  crossProduct
};
