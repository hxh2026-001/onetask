import type { MazeLayout, TimeNode } from './types';
import { calculatePrecisionLoss, detectConflicts } from './calendar';

interface PathNode {
  id: string;
  gScore: number;
  fScore: number;
  parent: string | null;
}

function heuristic(node: TimeNode, target: TimeNode): number {
  const dx = node.position.x - target.position.x;
  const dy = node.position.y - target.position.y;
  const dz = node.position.z - target.position.z;
  const dw = node.position.w - target.position.w;

  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}

export function findShortestPath(
  layout: MazeLayout,
  startId: string,
  targetId: string,
  activeCalendar: string = 'gregorian'
): { path: string[]; cost: number; warnings: string[] } {
  const warnings: string[] = [];
  const nodes = new Map<string, TimeNode>();
  const adjacency = new Map<string, { to: string; cost: number; calendar: string }[]>();

  for (const node of layout.nodes) {
    nodes.set(node.id, node);
    adjacency.set(node.id, []);
  }

  for (const conn of layout.connections) {
    const fromAdj = adjacency.get(conn.from);
    if (fromAdj) {
      fromAdj.push({ to: conn.to, cost: conn.cost, calendar: conn.calendar });
    }
    const toAdj = adjacency.get(conn.to);
    if (toAdj) {
      toAdj.push({ to: conn.from, cost: conn.cost, calendar: conn.calendar });
    }
  }

  const start = nodes.get(startId);
  const target = nodes.get(targetId);

  if (!start || !target) {
    return { path: [], cost: Infinity, warnings: ['找不到起点或目标节点'] };
  }

  const openSet = new Set<string>();
  const closedSet = new Set<string>();
  const pathNodes = new Map<string, PathNode>();

  const startPathNode: PathNode = {
    id: startId,
    gScore: 0,
    fScore: heuristic(start, target),
    parent: null
  };

  openSet.add(startId);
  pathNodes.set(startId, startPathNode);

  let iterations = 0;
  const maxIterations = 10000;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    let currentId = '';
    let lowestFScore = Infinity;

    for (const id of openSet) {
      const pathNode = pathNodes.get(id);
      if (pathNode && pathNode.fScore < lowestFScore) {
        lowestFScore = pathNode.fScore;
        currentId = id;
      }
    }

    if (currentId === targetId) {
      const path: string[] = [];
      let current: string | null = currentId;

      while (current) {
        path.unshift(current);
        const node = pathNodes.get(current);
        current = node?.parent || null;
      }

      const cost = pathNodes.get(targetId)?.gScore || 0;

      for (let i = 0; i < path.length - 1; i++) {
        const node = nodes.get(path[i]);
        if (node) {
          const nodeConflicts = detectConflicts({
            year: node.coordinates.gregorian.year,
            month: node.coordinates.gregorian.month,
            day: node.coordinates.gregorian.day,
            calendar: activeCalendar as any
          });
          warnings.push(...nodeConflicts);
        }
      }

      if (iterations > 1000) {
        warnings.push('路径搜索迭代次数过多，可能存在循环');
      }

      return { path, cost, warnings: [...new Set(warnings)] };
    }

    openSet.delete(currentId);
    closedSet.add(currentId);

    const currentNode = nodes.get(currentId);
    const currentPathNode = pathNodes.get(currentId);
    const neighbors = adjacency.get(currentId) || [];

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.to)) continue;

      const neighborNode = nodes.get(neighbor.to);
      if (!neighborNode) continue;

      if (!neighborNode.unlocked && neighbor.to !== targetId) continue;

      const calendarBonus = neighbor.calendar === activeCalendar ? 0.5 : 1;
      const precisionLoss = calculatePrecisionLoss(activeCalendar as any, neighbor.calendar as any);

      const tentativeGScore = (currentPathNode?.gScore || 0) + neighbor.cost * calendarBonus + precisionLoss;

      const existingPathNode = pathNodes.get(neighbor.to);

      if (!existingPathNode || tentativeGScore < existingPathNode.gScore) {
        pathNodes.set(neighbor.to, {
          id: neighbor.to,
          gScore: tentativeGScore,
          fScore: tentativeGScore + heuristic(neighborNode, target),
          parent: currentId
        });

        if (precisionLoss > 0) {
          warnings.push(`精度丢失: ${activeCalendar} -> ${neighbor.calendar} (${precisionLoss.toFixed(1)})`);
        }

        if (neighborNode.type === 'trap') {
          warnings.push(`陷阱节点: ${neighborNode.label}`);
        }

        if (neighborNode.type === 'deadend') {
          warnings.push(`死胡同: ${neighborNode.label}`);
        }

        openSet.add(neighbor.to);
      }
    }
  }

  if (iterations >= maxIterations) {
    warnings.push('达到最大迭代次数，可能存在死循环');
  }

  return { path: [], cost: Infinity, warnings: ['找不到路径', ...warnings] };
}

export function detectEndlessLoops(layout: MazeLayout): string[] {
  const loops: string[] = [];
  const adjacency = new Map<string, string[]>();

  for (const node of layout.nodes) {
    adjacency.set(node.id, []);
  }

  for (const conn of layout.connections) {
    adjacency.get(conn.from)?.push(conn.to);
  }

  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(nodeId: string): boolean {
    if (stack.includes(nodeId)) {
      const cycleStart = stack.indexOf(nodeId);
      const cycle = stack.slice(cycleStart);
      if (cycle.length > 2) {
        loops.push(`循环: ${cycle.join(' -> ')}`);
      }
      return true;
    }

    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.push(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (dfs(neighbor)) return true;
    }

    stack.pop();
    return false;
  }

  for (const node of layout.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return loops;
}

export function detectTimezoneConflicts(layout: MazeLayout): string[] {
  const conflicts: string[] = [];

  for (let i = 0; i < layout.nodes.length; i++) {
    for (let j = i + 1; j < layout.nodes.length; j++) {
      const node1 = layout.nodes[i];
      const node2 = layout.nodes[j];

      const timezoneDiff = Math.abs(node1.timezone - node2.timezone);
      if (timezoneDiff >= 12) {
        conflicts.push(`时区冲突: ${node1.label}(UTC${node1.timezone}) <-> ${node2.label}(UTC${node2.timezone})`);
      }
    }
  }

  return conflicts;
}

export function detectPrecisionLoss(layout: MazeLayout, fromId: string, toId: string): number {
  const from = layout.nodes.find(n => n.id === fromId);
  const to = layout.nodes.find(n => n.id === toId);

  if (!from || !to) return 0;

  const dw = Math.abs(from.position.w - to.position.w);
  if (dw > 100) {
    return dw * 0.01;
  }

  return 0;
}
