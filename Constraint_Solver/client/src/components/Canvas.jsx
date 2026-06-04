import { createEffect, onMount, createSignal, onCleanup } from 'solid-js';

const COLORS = {
  satisfied: '#10b981',
  iterating: '#f59e0b',
  unsatisfied: '#ef4444',
  conflicting: '#dc2626',
  default: '#60a5fa',
  fixed: '#94a3b8',
  skeleton: 'rgba(239, 68, 68, 0.3)',
  searchPath: 'rgba(167, 139, 250, 0.6)'
};

export default function Canvas(props) {
  let canvasRef;
  let animationRef;
  const [canvasSize, setCanvasSize] = createSignal({ width: 800, height: 600 });
  const [dragging, setDragging] = createSignal(null);
  const [time, setTime] = createSignal(0);
  const [conflictingElements, setConflictingElements] = createSignal(new Set());
  const [selectedElements, setSelectedElements] = createSignal(new Set());
  const [hoveredElement, setHoveredElement] = createSignal(null);

  onMount(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    function animate() {
      setTime(t => t + 0.016);
      animationRef = requestAnimationFrame(animate);
    }
    animate();
    
    onCleanup(() => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationRef);
    });
  });

  function updateCanvasSize() {
    const container = canvasRef?.parentElement;
    if (container) {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight
      });
    }
  }

  createEffect(() => {
    if (props.analysis?.conflicts) {
      const conflicting = new Set();
      for (const conflict of props.analysis.conflicts) {
        for (const elemId of conflict.elementIds) {
          conflicting.add(elemId);
        }
      }
      setConflictingElements(conflicting);
    }
  });

  function getElementStatus(elemId) {
    if (!props.solveResult?.elementStates?.[elemId]) return 'unsatisfied';
    const states = props.solveResult.elementStates[elemId];
    const idx = Math.min(props.currentIteration, states.length - 1);
    return states[idx]?.status || 'unsatisfied';
  }

  function getConstraintStatus(constraintId) {
    if (!props.solveResult?.constraintStates?.[constraintId]) return 'unsatisfied';
    const states = props.solveResult.constraintStates[constraintId];
    const idx = Math.min(props.currentIteration, states.length - 1);
    return states[idx]?.status || 'unsatisfied';
  }

  function getStatusColor(status, isConflicting = false) {
    if (isConflicting) return COLORS.conflicting;
    return COLORS[status] || COLORS.default;
  }

  function interpolateColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function getAnimatedColor(status, isConflicting, elementId) {
    const t = time();
    
    if (isConflicting) {
      const flashIntensity = (Math.sin(t * 8) + 1) / 2;
      return interpolateColor(COLORS.conflicting, '#fca5a5', flashIntensity);
    }
    
    if (status === 'unsatisfied' && props.showSkeleton) {
      return COLORS.unsatisfied;
    } else if (status === 'iterating') {
      const pulse = (Math.sin(t * 4) + 1) / 2;
      return interpolateColor(COLORS.iterating, '#fcd34d', pulse);
    } else if (status === 'satisfied') {
      return COLORS.satisfied;
    }
    return COLORS.default;
  }

  function getJitterOffset(elementId, status) {
    if (!props.showSkeleton || status === 'satisfied') return { x: 0, y: 0 };
    
    const seed = elementId * 12345.6789;
    const frequency = status === 'unsatisfied' ? 10 : 3;
    const amplitude = status === 'unsatisfied' ? 8 : 2;
    
    return {
      x: Math.sin(time() * frequency + seed) * amplitude,
      y: Math.cos(time() * frequency * 0.7 + seed) * amplitude
    };
  }

  function getPointPosition(point, elementId) {
    const status = getElementStatus(elementId);
    const isConflicting = conflictingElements().has(elementId);
    const jitter = getJitterOffset(elementId, status);
    
    return {
      x: point.params.x + jitter.x,
      y: point.params.y + jitter.y,
      status,
      isConflicting
    };
  }

  function getElementById(id) {
    return props.elements.find(e => e.id === id);
  }

  function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1; yy = y1;
    } else if (param > 1) {
      xx = x2; yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    return {
      distance: Math.sqrt((px - xx) ** 2 + (py - yy) ** 2),
      x: xx, y: yy,
      param,
      startDist: Math.sqrt((px - x1) ** 2 + (py - y1) ** 2),
      endDist: Math.sqrt((px - x2) ** 2 + (py - y2) ** 2)
    };
  }

  function pointToCircleDistance(px, py, cx, cy, r) {
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    return {
      distance: Math.abs(dist - r),
      centerDistance: dist,
      isOnCircumference: Math.abs(dist - r) < 15,
      isNearCenter: dist < 20
    };
  }

  function hitTest(x, y) {
    for (const elem of props.elements) {
      if (elem.type === 'point' && !elem.params.fixed) {
        const dx = elem.params.x - x;
        const dy = elem.params.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          return { type: 'point', element: elem, offsetX: dx, offsetY: dy };
        }
      }
    }

    for (const elem of props.elements) {
      if (elem.type === 'line') {
        const start = getElementById(elem.params.startPointId);
        const end = getElementById(elem.params.endPointId);
        if (!start || !end) continue;
        
        const hit = pointToLineDistance(x, y, start.params.x, start.params.y, end.params.x, end.params.y);
        if (hit.distance < 12) {
          if (hit.startDist < 15 && !start.params.fixed) {
            return {
              type: 'point',
              element: start,
              offsetX: start.params.x - x,
              offsetY: start.params.y - y
            };
          } else if (hit.endDist < 15 && !end.params.fixed) {
            return {
              type: 'point',
              element: end,
              offsetX: end.params.x - x,
              offsetY: end.params.y - y
            };
          } else if (!start.params.fixed && !end.params.fixed) {
            return {
              type: 'line',
              element: elem,
              startPoint: start,
              endPoint: end,
              startOffsetX: start.params.x - x,
              startOffsetY: start.params.y - y,
              endOffsetX: end.params.x - x,
              endOffsetY: end.params.y - y
            };
          }
        }
      }
    }

    for (const elem of props.elements) {
      if (elem.type === 'circle') {
        const center = getElementById(elem.params.centerId);
        if (!center) continue;
        
        const hit = pointToCircleDistance(x, y, center.params.x, center.params.y, elem.params.radius);
        
        if (hit.isNearCenter && !center.params.fixed) {
          return {
            type: 'circle_center',
            element: elem,
            center: center,
            offsetX: center.params.x - x,
            offsetY: center.params.y - y
          };
        } else if (hit.isOnCircumference) {
          return {
            type: 'circle_radius',
            element: elem,
            center: center,
            originalRadius: elem.params.radius
          };
        }
      }
    }

    return null;
  }

  function render(ctx) {
    const { width, height } = canvasSize();
    ctx.clearRect(0, 0, width, height);
    
    drawGrid(ctx, width, height);
    
    if (props.showSearchPath && props.solveResult?.searchPath) {
      drawSearchPath(ctx);
    }
    
    for (const elem of props.elements) {
      if (elem.type === 'line') {
        drawLine(ctx, elem);
      }
    }
    
    for (const elem of props.elements) {
      if (elem.type === 'circle') {
        drawCircle(ctx, elem);
      }
    }
    
    for (const elem of props.elements) {
      if (elem.type === 'point') {
        drawPoint(ctx, elem);
      }
    }
    
    drawConstraints(ctx);
  }

  function drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawPoint(ctx, point) {
    const pos = getPointPosition(point, point.id);
    const color = getAnimatedColor(pos.status, pos.isConflicting, point.id);
    
    const isSelected = selectedElements().has(point.id);
    const isHovered = hoveredElement()?.type === 'point' && hoveredElement()?.element?.id === point.id;
    
    const baseRadius = point.params.fixed ? 8 : 6;
    const radius = isSelected ? baseRadius + 2 : baseRadius;
    
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.fill();
    } else if (isHovered) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = `${color}33`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = point.params.fixed ? COLORS.fixed : color;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#facc15' : '#ffffff';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(point.label, pos.x, pos.y - 12);
  }

  function drawLine(ctx, line) {
    const startPoint = getElementById(line.params.startPointId);
    const endPoint = getElementById(line.params.endPointId);
    
    if (!startPoint || !endPoint) return;
    
    const startPos = getPointPosition(startPoint, line.id);
    const endPos = getPointPosition(endPoint, line.id);
    
    const status = getElementStatus(line.id);
    const isConflicting = conflictingElements().has(line.id);
    const color = getAnimatedColor(status, isConflicting, line.id);
    
    const isSelected = selectedElements().has(line.id);
    const isHovered = hoveredElement()?.type === 'line' && hoveredElement()?.element?.id === line.id;
    
    if (isSelected) {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endPos.x, endPos.y);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else if (isHovered) {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endPos.x, endPos.y);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 5 : 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2;
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(line.label, midX, midY - 8);
  }

  function drawCircle(ctx, circle) {
    const center = getElementById(circle.params.centerId);
    if (!center) return;
    
    const centerPos = getPointPosition(center, circle.id);
    const status = getElementStatus(circle.id);
    const isConflicting = conflictingElements().has(circle.id);
    const color = getAnimatedColor(status, isConflicting, circle.id);
    
    const isSelected = selectedElements().has(circle.id);
    const isHovered = hoveredElement()?.type?.startsWith('circle') && hoveredElement()?.element?.id === circle.id;
    
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(centerPos.x, centerPos.y, circle.params.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      ctx.lineWidth = 10;
      ctx.stroke();
    } else if (isHovered) {
      ctx.beginPath();
      ctx.arc(centerPos.x, centerPos.y, circle.params.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(centerPos.x, centerPos.y, circle.params.radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 5 : 3;
    ctx.stroke();
    
    ctx.fillStyle = `${color}22`;
    ctx.fill();
    
    if (isHovered || isSelected) {
      const angle = Math.atan2(centerPos.y - 200, centerPos.x - 200);
      const rx = centerPos.x + Math.cos(angle) * circle.params.radius;
      const ry = centerPos.y + Math.sin(angle) * circle.params.radius;
      
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(circle.label, centerPos.x, centerPos.y - circle.params.radius - 8);
  }

  function drawConstraints(ctx) {
    for (const constraint of props.constraints) {
      const status = getConstraintStatus(constraint.id);
      const isConflicting = props.analysis?.conflicts?.some(
        c => c.constraintIds.includes(constraint.id)
      );
      const color = getAnimatedColor(status, isConflicting, constraint.id);
      
      const elem1 = getElementById(constraint.elementIds[0]);
      if (!elem1) continue;
      
      if (elem1.type === 'line') {
        const start = getElementById(elem1.params.startPointId);
        const end = getElementById(elem1.params.endPointId);
        if (!start || !end) continue;
        
        const startPos = getPointPosition(start, elem1.id);
        const endPos = getPointPosition(end, elem1.id);
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        
        if (constraint.type === 'distance' && constraint.value) {
          ctx.fillStyle = color;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`=${constraint.value}`, midX, midY + 16);
        } else if (constraint.type === 'horizontal') {
          drawConstraintIcon(ctx, midX, midY + 20, '⇌', color);
        } else if (constraint.type === 'vertical') {
          drawConstraintIcon(ctx, midX, midY + 20, '⇅', color);
        }
      }
      
      if (constraint.type === 'perpendicular' && constraint.elementIds.length >= 2) {
        drawPerpendicularMarker(ctx, constraint, color);
      } else if (constraint.type === 'tangent' && constraint.elementIds.length >= 2) {
        drawTangentMarker(ctx, constraint, color);
      }
    }
  }

  function drawConstraintIcon(ctx, x, y, icon, color) {
    ctx.fillStyle = color;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, x, y);
  }

  function drawPerpendicularMarker(ctx, constraint, color) {
    const line1 = getElementById(constraint.elementIds[0]);
    const line2 = getElementById(constraint.elementIds[1]);
    if (!line1 || !line2 || line1.type !== 'line' || line2.type !== 'line') return;
    
    const start1 = getElementById(line1.params.startPointId);
    const end1 = getElementById(line1.params.endPointId);
    const start2 = getElementById(line2.params.startPointId);
    const end2 = getElementById(line2.params.endPointId);
    
    const commonId = [start1?.id, end1?.id].find(id => 
      id === start2?.id || id === end2?.id
    );
    
    if (commonId) {
      const commonPoint = getElementById(commonId);
      const pos = getPointPosition(commonPoint, commonId);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - 6, pos.y - 6, 12, 12);
    }
  }

  function drawTangentMarker(ctx, constraint, color) {
    const elem1 = getElementById(constraint.elementIds[0]);
    const elem2 = getElementById(constraint.elementIds[1]);
    if (!elem1 || !elem2) return;
    
    let center1, center2, r1, r2;
    
    if (elem1.type === 'circle') {
      const c1 = getElementById(elem1.params.centerId);
      center1 = getPointPosition(c1, elem1.id);
      r1 = elem1.params.radius;
    }
    if (elem2.type === 'circle') {
      const c2 = getElementById(elem2.params.centerId);
      center2 = getPointPosition(c2, elem2.id);
      r2 = elem2.params.radius;
    }
    
    if (center1 && center2) {
      const dx = center2.x - center1.x;
      const dy = center2.y - center1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const t = r1 / (r1 + r2);
      const tx = center1.x + dx * t;
      const ty = center1.y + dy * t;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tx, ty, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSearchPath(ctx) {
    const path = props.solveResult.searchPath;
    if (!path || path.length < 2) return;
    
    const variableMap = buildVariableMap();
    
    ctx.strokeStyle = COLORS.searchPath;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const visibleIterations = Math.min(props.currentIteration + 1, path.length);
    
    for (const [varName, varInfo] of Object.entries(variableMap)) {
      if (varInfo.elemType !== 'point') continue;
      
      ctx.beginPath();
      for (let i = 0; i < visibleIterations; i++) {
        const state = path[i];
        const x = state[varInfo.xIdx];
        const y = state[varInfo.yIdx];
        
        if (x === undefined || y === undefined) continue;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      for (let i = 0; i < visibleIterations; i += Math.max(1, Math.floor(visibleIterations / 20))) {
        const state = path[i];
        const x = state[varInfo.xIdx];
        const y = state[varInfo.yIdx];
        
        if (x === undefined || y === undefined) continue;
        
        const alpha = i / visibleIterations;
        ctx.fillStyle = `rgba(167, 139, 250, ${0.3 + alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.setLineDash([]);
  }

  function buildVariableMap() {
    const map = {};
    let idx = 0;
    
    for (const elem of props.elements) {
      if (elem.type === 'point' && !elem.params.fixed) {
        map[`${elem.id}_pos`] = {
          elemType: 'point',
          elemId: elem.id,
          xIdx: idx,
          yIdx: idx + 1
        };
        idx += 2;
      } else if (elem.type === 'circle') {
        const center = getElementById(elem.params.centerId);
        if (center && !center.params.fixed) {
          idx += 2;
        }
        idx += 1;
      }
    }
    
    return map;
  }

  function handleMouseDown(e) {
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = hitTest(x, y);
    if (hit) {
      setDragging(hit);
      
      if (e.shiftKey) {
        const newSelected = new Set(selectedElements());
        if (newSelected.has(hit.element.id)) {
          newSelected.delete(hit.element.id);
        } else {
          newSelected.add(hit.element.id);
        }
        setSelectedElements(newSelected);
      } else {
        setSelectedElements(new Set([hit.element.id]));
      }
      
      props.onSelect?.(hit.element);
    } else {
      setSelectedElements(new Set());
      setDragging(null);
    }
  }

  function handleMouseMove(e) {
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hovered = hitTest(x, y);
    setHoveredElement(hovered);
    
    canvasRef.style.cursor = hovered ? (hovered.type === 'circle_radius' ? 'nesw-resize' : 'move') : 'default';
    
    if (!dragging()) return;
    
    const drag = dragging();
    let updatedElements = [...props.elements];
    
    if (drag.type === 'point') {
      updatedElements = updatedElements.map(elem => {
        if (elem.id === drag.element.id && elem.type === 'point') {
          return {
            ...elem,
            params: { ...elem.params, x: x + drag.offsetX, y: y + drag.offsetY }
          };
        }
        return elem;
      });
    } else if (drag.type === 'line') {
      const newStartX = x + drag.startOffsetX;
      const newStartY = y + drag.startOffsetY;
      const newEndX = x + drag.endOffsetX;
      const newEndY = y + drag.endOffsetY;
      
      updatedElements = updatedElements.map(elem => {
        if (elem.id === drag.startPoint.id) {
          return { ...elem, params: { ...elem.params, x: newStartX, y: newStartY } };
        }
        if (elem.id === drag.endPoint.id) {
          return { ...elem, params: { ...elem.params, x: newEndX, y: newEndY } };
        }
        return elem;
      });
    } else if (drag.type === 'circle_center') {
      updatedElements = updatedElements.map(elem => {
        if (elem.id === drag.center.id && elem.type === 'point') {
          return {
            ...elem,
            params: { ...elem.params, x: x + drag.offsetX, y: y + drag.offsetY }
          };
        }
        return elem;
      });
    } else if (drag.type === 'circle_radius') {
      const dx = x - drag.center.params.x;
      const dy = y - drag.center.params.y;
      const newRadius = Math.max(20, Math.sqrt(dx * dx + dy * dy));
      
      updatedElements = updatedElements.map(elem => {
        if (elem.id === drag.element.id && elem.type === 'circle') {
          return { ...elem, params: { ...elem.params, radius: newRadius } };
        }
        return elem;
      });
    }
    
    props.onUpdate?.(updatedElements);
  }

  function handleMouseUp() {
    if (dragging()) {
      props.onDragEnd?.();
    }
    setDragging(null);
  }

  function handleContextMenu(e) {
    e.preventDefault();
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTest(x, y);
    if (hit) {
      props.onContextMenu?.(hit.element, x, y);
    }
  }

  createEffect(() => {
    if (!canvasRef) return;
    
    const ctx = canvasRef.getContext('2d');
    canvasRef.width = canvasSize().width;
    canvasRef.height = canvasSize().height;
    
    render(ctx);
  });

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
