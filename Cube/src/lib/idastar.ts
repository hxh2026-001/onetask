import {
  CubeState,
  Move,
  ALL_MOVES,
  applyMove,
  compareStates,
  createSolvedState,
} from "./cube";
import { stateToIndex } from "./group";

const CORNER_HEURISTIC_COST: number[] = [];
const EDGE_HEURISTIC_COST: number[] = [];

function precomputeHeuristics(): void {
  if (CORNER_HEURISTIC_COST.length > 0) return;

  const solved = createSolvedState();
  const visited = new Map<string, number>();
  const queue: { state: CubeState; depth: number }[] = [];

  const { fullIndex } = stateToIndex(solved);
  visited.set(fullIndex, 0);
  queue.push({ state: solved, depth: 0 });

  while (queue.length > 0) {
    const { state, depth } = queue.shift()!;
    if (depth >= 4) continue;

    for (const move of ALL_MOVES) {
      const newState = applyMove(state, move);
      const { fullIndex: idx } = stateToIndex(newState);
      if (!visited.has(idx)) {
        visited.set(idx, depth + 1);
        queue.push({ state: newState, depth: depth + 1 });
      }
    }
  }
}

function cornerHeuristic(state: CubeState): number {
  let cost = 0;
  for (let i = 0; i < 8; i++) {
    if (state.cornerPermutation[i] !== i) cost++;
  }
  for (let i = 0; i < 8; i++) {
    if (state.cornerOrientation[i] !== 0) cost++;
  }
  return Math.ceil(cost / 4);
}

function edgeHeuristic(state: CubeState): number {
  let cost = 0;
  for (let i = 0; i < 12; i++) {
    if (state.edgePermutation[i] !== i) cost++;
  }
  for (let i = 0; i < 12; i++) {
    if (state.edgeOrientation[i] !== 0) cost++;
  }
  return Math.ceil(cost / 4);
}

export function heuristic(state: CubeState): number {
  return Math.max(cornerHeuristic(state), edgeHeuristic(state));
}

interface SearchResult {
  solution: Move[] | null;
  nodesSearched: number;
  time: number;
  maxDepth: number;
  memory: number;
}

export function idaStar(
  startState: CubeState,
  maxDepth: number = 25,
  onProgress?: (info: { depth: number; nodes: number }) => void
): SearchResult {
  const startTime = Date.now();
  const solved = createSolvedState();
  let nodesSearched = 0;
  let memory = 0;

  function search(
    state: CubeState,
    path: Move[],
    g: number,
    threshold: number,
    lastFace: string
  ): number | Move[] {
    nodesSearched++;
    memory = Math.max(memory, path.length * 100);

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

      if (onProgress && nodesSearched % 1000 === 0) {
        onProgress({ depth: g + 1, nodes: nodesSearched });
      }

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
    if (onProgress) {
      onProgress({ depth: threshold, nodes: nodesSearched });
    }

    const result = search(startState, [], 0, threshold, "");

    if (Array.isArray(result)) {
      return {
        solution: result,
        nodesSearched,
        time: Date.now() - startTime,
        maxDepth: threshold,
        memory,
      };
    }

    if (result === Infinity) {
      return {
        solution: null,
        nodesSearched,
        time: Date.now() - startTime,
        maxDepth: threshold,
        memory,
      };
    }

    threshold = result as number;
  }

  return {
    solution: null,
    nodesSearched,
    time: Date.now() - startTime,
    maxDepth,
    memory,
  };
}

export const SEARCH_CONSTANTS = {
  MAX_NODES: 1000000,
  MAX_MEMORY_BYTES: 512 * 1024 * 1024,
  TIMEOUT_MS: 30000,
};
