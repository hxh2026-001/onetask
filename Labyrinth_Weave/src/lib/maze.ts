import { Node, Edge, GraphData, buildAdjacencyMatrix } from './graph';

export interface MazeConfig {
  id: string;
  name: string;
  description: string;
  graph: GraphData;
  startNode: number;
  endNode: number;
}

export class DynamicObstacleManager {
  private obstacles: Set<number> = new Set();
  private blockedEdges: Set<string> = new Set();

  addNodeObstacle(nodeId: number): void {
    this.obstacles.add(nodeId);
  }

  removeNodeObstacle(nodeId: number): void {
    this.obstacles.delete(nodeId);
  }

  blockEdge(from: number, to: number): void {
    this.blockedEdges.add(`${from}-${to}`);
  }

  unblockEdge(from: number, to: number): void {
    this.blockedEdges.delete(`${from}-${to}`);
  }

  applyToGraph(graph: GraphData): GraphData {
    const nodes = graph.nodes.map(node => ({
      ...node,
      isObstacle: this.obstacles.has(node.id) || node.isObstacle
    }));

    const edges = graph.edges.map(edge => ({
      ...edge,
      isBlocked: this.blockedEdges.has(`${edge.from}-${edge.to}`) || 
                 this.blockedEdges.has(`${edge.to}-${edge.from}`) ||
                 edge.isBlocked
    }));

    return {
      nodes,
      edges,
      adjacencyMatrix: buildAdjacencyMatrix(nodes, edges)
    };
  }

  clear(): void {
    this.obstacles.clear();
    this.blockedEdges.clear();
  }

  getObstacleNodes(): number[] {
    return Array.from(this.obstacles);
  }

  getBlockedEdges(): string[] {
    return Array.from(this.blockedEdges);
  }
}

export function generateGridMaze(
  rows: number,
  cols: number,
  cellSize: number = 60,
  offsetX: number = 100,
  offsetY: number = 100
): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      nodes.push({
        id: nodeId++,
        x: offsetX + col * cellSize,
        y: offsetY + row * cellSize
      });
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const current = row * cols + col;
      
      if (col < cols - 1) {
        const right = row * cols + col + 1;
        edges.push({ from: current, to: right, weight: 1 });
        edges.push({ from: right, to: current, weight: 1 });
      }
      
      if (row < rows - 1) {
        const down = (row + 1) * cols + col;
        edges.push({ from: current, to: down, weight: 1 });
        edges.push({ from: down, to: current, weight: 1 });
      }
    }
  }

  return {
    nodes,
    edges,
    adjacencyMatrix: buildAdjacencyMatrix(nodes, edges)
  };
}

export function createNegativeCycleTrap(): MazeConfig {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const centerX = 400;
  const centerY = 300;
  const radius = 150;
  const nodeCount = 6;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    nodes.push({
      id: i,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }

  nodes.push({ id: nodeCount, x: 100, y: 300, isStart: true });
  nodes.push({ id: nodeCount + 1, x: 700, y: 300, isEnd: true });

  for (let i = 0; i < nodeCount; i++) {
    const next = (i + 1) % nodeCount;
    edges.push({ from: i, to: next, weight: -2 });
    edges.push({ from: next, to: i, weight: 3 });
  }

  edges.push({ from: nodeCount, to: 0, weight: 5 });
  edges.push({ from: 0, to: nodeCount, weight: 5 });
  edges.push({ from: nodeCount - 1, to: nodeCount + 1, weight: 5 });
  edges.push({ from: nodeCount + 1, to: nodeCount - 1, weight: 5 });

  edges.push({ from: nodeCount, to: nodeCount + 1, weight: 100 });
  edges.push({ from: nodeCount + 1, to: nodeCount, weight: 100 });

  return {
    id: 'negative-cycle',
    name: '预设一：权重负环陷阱',
    description: '负权重环会导致 Dijkstra 算法崩溃或产生无限循环',
    graph: {
      nodes,
      edges,
      adjacencyMatrix: buildAdjacencyMatrix(nodes, edges)
    },
    startNode: nodeCount,
    endNode: nodeCount + 1
  };
}

export function createBridgeNodeCutoff(): MazeConfig {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < 5; i++) {
    nodes.push({ id: i, x: 150 + i * 50, y: 200 });
  }

  const bridgeNodeId = 5;
  nodes.push({ id: bridgeNodeId, x: 300, y: 300 });

  for (let i = 6; i < 11; i++) {
    nodes.push({ id: i, x: 150 + (i - 6) * 50, y: 400 });
  }

  nodes.push({ id: 11, x: 80, y: 300, isStart: true });
  nodes.push({ id: 12, x: 520, y: 300, isEnd: true });

  for (let i = 0; i < 4; i++) {
    edges.push({ from: i, to: i + 1, weight: 1 });
    edges.push({ from: i + 1, to: i, weight: 1 });
  }

  for (let i = 6; i < 10; i++) {
    edges.push({ from: i, to: i + 1, weight: 1 });
    edges.push({ from: i + 1, to: i, weight: 1 });
  }

  edges.push({ from: 2, to: bridgeNodeId, weight: 1 });
  edges.push({ from: bridgeNodeId, to: 2, weight: 1 });
  edges.push({ from: bridgeNodeId, to: 8, weight: 1 });
  edges.push({ from: 8, to: bridgeNodeId, weight: 1 });

  edges.push({ from: 11, to: 0, weight: 2 });
  edges.push({ from: 0, to: 11, weight: 2 });
  edges.push({ from: 4, to: 12, weight: 2 });
  edges.push({ from: 12, to: 4, weight: 2 });

  return {
    id: 'bridge-cutoff',
    name: '预设二：桥节点切断',
    description: '切断唯一的桥节点会导致图分裂，路径被迫绕行',
    graph: {
      nodes,
      edges,
      adjacencyMatrix: buildAdjacencyMatrix(nodes, edges)
    },
    startNode: 11,
    endNode: 12
  };
}

export function createSparseGraphDeadEnd(): MazeConfig {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({ id: 0, x: 100, y: 300, isStart: true });

  const deadEndCount = 8;
  for (let i = 1; i <= deadEndCount; i++) {
    const angle = (i - 1) * (Math.PI / (deadEndCount - 1));
    nodes.push({
      id: i,
      x: 250 + Math.cos(angle) * 120,
      y: 150 + Math.sin(angle) * 200
    });
    edges.push({ from: 0, to: i, weight: 2 });
    edges.push({ from: i, to: 0, weight: 2 });
  }

  const mainPath = [0, 4];
  for (let i = 1; i <= 5; i++) {
    const nodeId = deadEndCount + i;
    nodes.push({
      id: nodeId,
      x: 250 + i * 90,
      y: 300
    });
    const prevId = i === 1 ? 4 : deadEndCount + i - 1;
    edges.push({ from: prevId, to: nodeId, weight: 1 });
    edges.push({ from: nodeId, to: prevId, weight: 1 });
    mainPath.push(nodeId);
  }

  const endNodeId = deadEndCount + 6;
  nodes.push({ id: endNodeId, x: 720, y: 300, isEnd: true });
  edges.push({ from: deadEndCount + 5, to: endNodeId, weight: 1 });
  edges.push({ from: endNodeId, to: deadEndCount + 5, weight: 1 });

  return {
    id: 'sparse-deadend',
    name: '预设三：稀疏图死胡同',
    description: '大量死胡同导致算法探索效率低下，频繁回溯',
    graph: {
      nodes,
      edges,
      adjacencyMatrix: buildAdjacencyMatrix(nodes, edges)
    },
    startNode: 0,
    endNode: endNodeId
  };
}

export function createMisleadingHeuristic(): MazeConfig {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({ id: 0, x: 100, y: 300, isStart: true });
  nodes.push({ id: 1, x: 300, y: 150 });
  nodes.push({ id: 2, x: 500, y: 150 });
  nodes.push({ id: 3, x: 700, y: 150 });
  nodes.push({ id: 4, x: 300, y: 300 });
  nodes.push({ id: 5, x: 500, y: 450 });
  nodes.push({ id: 6, x: 700, y: 450, isEnd: true });

  edges.push({ from: 0, to: 1, weight: 1 });
  edges.push({ from: 1, to: 0, weight: 1 });
  edges.push({ from: 1, to: 2, weight: 1 });
  edges.push({ from: 2, to: 1, weight: 1 });
  edges.push({ from: 2, to: 3, weight: 1 });
  edges.push({ from: 3, to: 2, weight: 1 });
  edges.push({ from: 3, to: 6, weight: 100 });
  edges.push({ from: 6, to: 3, weight: 100 });

  edges.push({ from: 0, to: 4, weight: 100 });
  edges.push({ from: 4, to: 0, weight: 100 });
  edges.push({ from: 4, to: 5, weight: 1 });
  edges.push({ from: 5, to: 4, weight: 1 });
  edges.push({ from: 5, to: 6, weight: 1 });
  edges.push({ from: 6, to: 5, weight: 1 });

  edges.push({ from: 0, to: 5, weight: 100 });
  edges.push({ from: 5, to: 0, weight: 100 });

  return {
    id: 'misleading-heuristic',
    name: '预设四：启发函数误导',
    description: '欧氏距离看似更近的路径实际代价极高，导致 A* 绕远路',
    graph: {
      nodes,
      edges,
      adjacencyMatrix: buildAdjacencyMatrix(nodes, edges)
    },
    startNode: 0,
    endNode: 6
  };
}

export function getAllPresets(): MazeConfig[] {
  return [
    createNegativeCycleTrap(),
    createBridgeNodeCutoff(),
    createSparseGraphDeadEnd(),
    createMisleadingHeuristic()
  ];
}
