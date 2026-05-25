import {
  CubeState,
  Move,
  applyMove,
  createSolvedState,
  compareStates,
} from "./cube";
import { stateToIndex } from "./group";

interface WorkerMessage {
  type: "solve" | "validate" | "encode";
  state: CubeState;
  maxDepth?: number;
}

interface WorkerResult {
  type: "solution" | "progress" | "error" | "validation" | "encoding";
  solution?: Move[];
  stateHash?: string;
  isValid?: boolean;
  errors?: string[];
  nodes?: number;
  depth?: number;
  memory?: number;
  time?: number;
}

const CORNER_HEURISTIC: Record<string, number> = {};
const EDGE_HEURISTIC: Record<string, number> = {};

function cornerHeuristic(state: CubeState): number {
  const { cornerIndex } = stateToIndex(state);
  if (CORNER_HEURISTIC[cornerIndex] !== undefined) {
    return CORNER_HEURISTIC[cornerIndex];
  }

  let cost = 0;
  for (let i = 0; i < 8; i++) {
    if (state.cornerPermutation[i] !== i) cost++;
  }
  for (let i = 0; i < 8; i++) {
    if (state.cornerOrientation[i] !== 0) cost++;
  }
  const h = Math.ceil(cost / 4);
  CORNER_HEURISTIC[cornerIndex] = h;
  return h;
}

function edgeHeuristic(state: CubeState): number {
  const { edgeIndex } = stateToIndex(state);
  if (EDGE_HEURISTIC[edgeIndex] !== undefined) {
    return EDGE_HEURISTIC[edgeIndex];
  }

  let cost = 0;
  for (let i = 0; i < 12; i++) {
    if (state.edgePermutation[i] !== i) cost++;
  }
  for (let i = 0; i < 12; i++) {
    if (state.edgeOrientation[i] !== 0) cost++;
  }
  const h = Math.ceil(cost / 4);
  EDGE_HEURISTIC[edgeIndex] = h;
  return h;
}

function heuristic(state: CubeState): number {
  return Math.max(cornerHeuristic(state), edgeHeuristic(state));
}

function idaStar(
  startState: CubeState,
  maxDepth: number = 20
): {
  solution: Move[] | null;
  nodes: number;
  time: number;
  memory: number;
} {
  const startTime = Date.now();
  const solved = createSolvedState();
  let nodesSearched = 0;
  let peakMemory = 0;

  const ALL_MOVES: Move[] = [
    "U", "U'", "U2",
    "D", "D'", "D2",
    "F", "F'", "F2",
    "B", "B'", "B2",
    "L", "L'", "L2",
    "R", "R'", "R2",
  ];

  function search(
    state: CubeState,
    path: Move[],
    g: number,
    threshold: number,
    lastFace: string
  ): number | Move[] {
    nodesSearched++;
    peakMemory = Math.max(peakMemory, path.length * 128);

    if (compareStates(state, solved)) {
      return [...path];
    }

    const h = heuristic(state);
    const f = g + h;

    if (f > threshold) {
      return f;
    }

    if (g >= maxDepth) {
      return Infinity;
    }

    let min = Infinity;

    for (const move of ALL_MOVES) {
      if (move[0] === lastFace) continue;

      const newState = applyMove(state, move);
      path.push(move);

      const result = search(newState, path, g + 1, threshold, move[0]);

      if (Array.isArray(result)) {
        return result;
      }

      if (result < min) {
        min = result;
      }

      path.pop();
    }

    return min;
  }

  let threshold = heuristic(startState);

  while (threshold <= maxDepth) {
    const result = search(startState, [], 0, threshold, "");

    if (Array.isArray(result)) {
      return {
        solution: result,
        nodes: nodesSearched,
        time: Date.now() - startTime,
        memory: peakMemory,
      };
    }

    if (result === Infinity) {
      return {
        solution: null,
        nodes: nodesSearched,
        time: Date.now() - startTime,
        memory: peakMemory,
      };
    }

    threshold = result as number;
  }

  return {
    solution: null,
    nodes: nodesSearched,
    time: Date.now() - startTime,
    memory: peakMemory,
  };
}

function validateState(state: CubeState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const cornerSum = state.cornerOrientation.reduce((a, b) => a + b, 0);
  if (cornerSum % 3 !== 0) {
    errors.push("角块朝向和必须是3的倍数");
  }

  const edgeSum = state.edgeOrientation.reduce((a, b) => a + b, 0);
  if (edgeSum % 2 !== 0) {
    errors.push("棱块朝向和必须是2的倍数");
  }

  if (state.parities.corner !== state.parities.edge) {
    errors.push("角块和棱块奇偶性必须相同");
  }

  const cornerSet = new Set(state.cornerPermutation);
  if (cornerSet.size !== 8) {
    errors.push("角块排列不合法");
  }

  const edgeSet = new Set(state.edgePermutation);
  if (edgeSet.size !== 12) {
    errors.push("棱块排列不合法");
  }

  return { isValid: errors.length === 0, errors };
}

let isBusy = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, state, maxDepth } = e.data;

  switch (type) {
    case "solve":
      if (isBusy) {
        self.postMessage({
          type: "error",
          message: "Worker 正忙，请等待当前任务完成",
        } as any);
        return;
      }

      isBusy = true;
      const result = idaStar(state, maxDepth || 20);
      isBusy = false;

      self.postMessage({
        type: "solution",
        ...result,
      } as WorkerResult);
      break;

    case "validate":
      const validation = validateState(state);
      self.postMessage({
        type: "validation",
        isValid: validation.isValid,
        errors: validation.errors,
      } as WorkerResult);
      break;

    case "encode":
      const { fullIndex } = stateToIndex(state);
      self.postMessage({
        type: "encoding",
        stateHash: fullIndex,
      } as WorkerResult);
      break;
  }
};
