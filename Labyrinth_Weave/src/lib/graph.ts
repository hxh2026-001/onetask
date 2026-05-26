export interface Node {
  id: number;
  x: number;
  y: number;
  isStart?: boolean;
  isEnd?: boolean;
  isObstacle?: boolean;
  isExplored?: boolean;
}

export interface Edge {
  from: number;
  to: number;
  weight: number;
  isBlocked?: boolean;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  adjacencyMatrix: number[][];
}

export interface PathResult {
  path: number[];
  visited: number[];
  distance: number;
  algorithm: 'dijkstra' | 'astar';
  crashed?: boolean;
  error?: string;
}

export class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }
    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

export function dijkstra(
  graph: GraphData,
  startId: number,
  endId: number,
  onVisit?: (nodeId: number) => void
): PathResult {
  const distances = new Map<number, number>();
  const previous = new Map<number, number | null>();
  const visited = new Set<number>();
  const visitedOrder: number[] = [];
  const pq = new PriorityQueue<number>();
  const maxIterations = graph.nodes.length * 100;
  let iterations = 0;

  for (const node of graph.nodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }
  distances.set(startId, 0);
  pq.enqueue(startId, 0);

  while (!pq.isEmpty()) {
    iterations++;
    if (iterations > maxIterations) {
      return {
        path: [],
        visited: visitedOrder,
        distance: Infinity,
        algorithm: 'dijkstra',
        crashed: true,
        error: '检测到负权重环！算法陷入无限循环。'
      };
    }

    const current = pq.dequeue()!;
    
    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);
    onVisit?.(current);

    if (current === endId) break;

    const currentDist = distances.get(current)!;
    const edges = graph.edges.filter(
      e => e.from === current && !e.isBlocked
    );

    for (const edge of edges) {
      const neighbor = edge.to;
      const neighborNode = graph.nodes.find(n => n.id === neighbor);
      
      if (neighborNode?.isObstacle || visited.has(neighbor)) continue;

      const newDist = currentDist + edge.weight;
      const oldDist = distances.get(neighbor)!;

      if (newDist < oldDist) {
        distances.set(neighbor, newDist);
        previous.set(neighbor, current);
        pq.enqueue(neighbor, newDist);
      }
    }
  }

  const path: number[] = [];
  let current: number | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  const finalDist = distances.get(endId) ?? Infinity;
  
  if (finalDist === -Infinity || !isFinite(finalDist)) {
    return {
      path: path[0] === startId ? path : [],
      visited: visitedOrder,
      distance: finalDist,
      algorithm: 'dijkstra',
      crashed: true,
      error: '负权重导致距离计算崩溃！'
    };
  }

  return {
    path: path[0] === startId ? path : [],
    visited: visitedOrder,
    distance: finalDist,
    algorithm: 'dijkstra'
  };
}

export function astar(
  graph: GraphData,
  startId: number,
  endId: number,
  heuristic: (a: Node, b: Node) => number,
  onVisit?: (nodeId: number) => void
): PathResult {
  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const previous = new Map<number, number | null>();
  const visited = new Set<number>();
  const visitedOrder: number[] = [];
  const pq = new PriorityQueue<number>();

  const startNode = graph.nodes.find(n => n.id === startId)!;
  const endNode = graph.nodes.find(n => n.id === endId)!;

  for (const node of graph.nodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
    previous.set(node.id, null);
  }
  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startNode, endNode));
  pq.enqueue(startId, fScore.get(startId)!);

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    
    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);
    onVisit?.(current);

    if (current === endId) break;

    const currentG = gScore.get(current)!;
    const currentNode = graph.nodes.find(n => n.id === current)!;
    const edges = graph.edges.filter(
      e => e.from === current && !e.isBlocked
    );

    for (const edge of edges) {
      const neighbor = edge.to;
      const neighborNode = graph.nodes.find(n => n.id === neighbor);
      
      if (neighborNode?.isObstacle || visited.has(neighbor)) continue;

      const tentativeG = currentG + edge.weight;
      const oldG = gScore.get(neighbor)!;

      if (tentativeG < oldG) {
        gScore.set(neighbor, tentativeG);
        const h = heuristic(neighborNode!, endNode);
        const newF = tentativeG + h;
        fScore.set(neighbor, newF);
        previous.set(neighbor, current);
        pq.enqueue(neighbor, newF);
      }
    }
  }

  const path: number[] = [];
  let current: number | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  const finalDist = gScore.get(endId) ?? Infinity;

  return {
    path: path[0] === startId ? path : [],
    visited: visitedOrder,
    distance: finalDist,
    algorithm: 'astar'
  };
}

export function euclideanDistance(a: Node, b: Node): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function manhattanDistance(a: Node, b: Node): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function badHeuristic(a: Node, b: Node): number {
  return 0;
}

export function misleadingHeuristic(a: Node, b: Node): number {
  return -euclideanDistance(a, b) * 10;
}

export function buildAdjacencyMatrix(nodes: Node[], edges: Edge[]): number[][] {
  const size = nodes.length;
  const matrix: number[][] = Array(size).fill(null).map(() => 
    Array(size).fill(Infinity)
  );
  
  const idToIndex = new Map<number, number>();
  nodes.forEach((node, idx) => idToIndex.set(node.id, idx));

  for (const edge of edges) {
    const fromIdx = idToIndex.get(edge.from);
    const toIdx = idToIndex.get(edge.to);
    if (fromIdx !== undefined && toIdx !== undefined) {
      matrix[fromIdx][toIdx] = edge.weight;
    }
  }

  return matrix;
}
