export type Face = "U" | "D" | "F" | "B" | "L" | "R";

export const FACES: Face[] = ["U", "D", "F", "B", "L", "R"];

export const FACE_COLORS: Record<Face, string> = {
  U: "#ffffff",
  D: "#ffff00",
  F: "#009b48",
  B: "#0046ad",
  L: "#ff5900",
  R: "#b71234",
};

export interface Cubelet {
  id: number;
  position: [number, number, number];
  faces: {
    U?: Face;
    D?: Face;
    F?: Face;
    B?: Face;
    L?: Face;
    R?: Face;
  };
  orientation: {
    U: number;
    D: number;
    F: number;
    B: number;
    L: number;
    R: number;
  };
}

export interface CubeState {
  cornerPermutation: number[];
  cornerOrientation: number[];
  edgePermutation: number[];
  edgeOrientation: number[];
  parities: {
    corner: boolean;
    edge: boolean;
  };
}

export type Move = "U" | "U'" | "U2" | "D" | "D'" | "D2" |
  "F" | "F'" | "F2" | "B" | "B'" | "B2" |
  "L" | "L'" | "L2" | "R" | "R'" | "R2";

export const ALL_MOVES: Move[] = [
  "U", "U'", "U2",
  "D", "D'", "D2",
  "F", "F'", "F2",
  "B", "B'", "B2",
  "L", "L'", "L2",
  "R", "R'", "R2",
];

export const CORNER_COUNT = 8;
export const EDGE_COUNT = 12;

export const CORNER_NAMES = [
  "URF", "UFL", "ULB", "UBR",
  "DFR", "DLF", "DBL", "DRB",
];

export const EDGE_NAMES = [
  "UR", "UF", "UL", "UB",
  "DR", "DF", "DL", "DB",
  "FR", "FL", "BL", "BR",
];

export function createSolvedState(): CubeState {
  return {
    cornerPermutation: [0, 1, 2, 3, 4, 5, 6, 7],
    cornerOrientation: [0, 0, 0, 0, 0, 0, 0, 0],
    edgePermutation: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    edgeOrientation: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    parities: { corner: false, edge: false },
  };
}

export function cloneState(state: CubeState): CubeState {
  return {
    cornerPermutation: [...state.cornerPermutation],
    cornerOrientation: [...state.cornerOrientation],
    edgePermutation: [...state.edgePermutation],
    edgeOrientation: [...state.edgeOrientation],
    parities: { ...state.parities },
  };
}

export function compareStates(a: CubeState, b: CubeState): boolean {
  for (let i = 0; i < CORNER_COUNT; i++) {
    if (a.cornerPermutation[i] !== b.cornerPermutation[i]) return false;
    if (a.cornerOrientation[i] !== b.cornerOrientation[i]) return false;
  }
  for (let i = 0; i < EDGE_COUNT; i++) {
    if (a.edgePermutation[i] !== b.edgePermutation[i]) return false;
    if (a.edgeOrientation[i] !== b.edgeOrientation[i]) return false;
  }
  return true;
}

const CORNER_MOVE_TABLE: Record<string, number[]> = {
  "U": [3, 0, 1, 2, 4, 5, 6, 7],
  "D": [0, 1, 2, 3, 5, 6, 7, 4],
  "F": [4, 1, 2, 3, 7, 5, 6, 0],
  "B": [0, 1, 6, 2, 4, 5, 7, 3],
  "L": [0, 2, 6, 3, 4, 1, 5, 7],
  "R": [7, 1, 2, 0, 4, 5, 6, 3],
};

const CORNER_ORIENT_TABLE: Record<string, number[]> = {
  "U": [0, 0, 0, 0, 0, 0, 0, 0],
  "D": [0, 0, 0, 0, 0, 0, 0, 0],
  "F": [1, 0, 0, 0, 2, 0, 0, 1],
  "B": [0, 0, 1, 2, 0, 0, 1, 2],
  "L": [0, 1, 2, 0, 0, 2, 1, 0],
  "R": [2, 0, 0, 1, 0, 0, 0, 2],
};

const EDGE_MOVE_TABLE: Record<string, number[]> = {
  "U": [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
  "D": [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
  "F": [0, 8, 2, 3, 4, 9, 6, 7, 5, 1, 10, 11],
  "B": [0, 1, 2, 10, 4, 5, 6, 11, 8, 9, 7, 3],
  "L": [0, 1, 9, 3, 4, 5, 8, 7, 6, 2, 10, 11],
  "R": [11, 1, 2, 3, 8, 5, 6, 7, 4, 9, 10, 0],
};

const EDGE_ORIENT_TABLE: Record<string, number[]> = {
  "U": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "D": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "F": [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  "B": [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  "L": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  "R": [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
};

function applyCornerMove(perm: number[], orient: number[], baseFace: string, count: number): void {
  const permTable = CORNER_MOVE_TABLE[baseFace];
  const orientTable = CORNER_ORIENT_TABLE[baseFace];
  const newPerm = [...perm];
  const newOrient = [...orient];

  for (let c = 0; c < CORNER_COUNT; c++) {
    let target = c;
    let orientChange = 0;
    for (let i = 0; i < count; i++) {
      orientChange = (orientChange + orientTable[target]) % 3;
      target = permTable[target];
    }
    newPerm[target] = perm[c];
    newOrient[target] = (orient[c] + orientChange) % 3;
  }

  for (let i = 0; i < CORNER_COUNT; i++) {
    perm[i] = newPerm[i];
    orient[i] = newOrient[i];
  }
}

function applyEdgeMove(perm: number[], orient: number[], baseFace: string, count: number): void {
  const permTable = EDGE_MOVE_TABLE[baseFace];
  const orientTable = EDGE_ORIENT_TABLE[baseFace];
  const newPerm = [...perm];
  const newOrient = [...orient];

  for (let e = 0; e < EDGE_COUNT; e++) {
    let target = e;
    let orientChange = 0;
    for (let i = 0; i < count; i++) {
      orientChange = (orientChange + orientTable[target]) % 2;
      target = permTable[target];
    }
    newPerm[target] = perm[e];
    newOrient[target] = (orient[e] + orientChange) % 2;
  }

  for (let i = 0; i < EDGE_COUNT; i++) {
    perm[i] = newPerm[i];
    orient[i] = newOrient[i];
  }
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const result = cloneState(state);
  const baseFace = move[0];
  let count = 1;
  if (move[1] === "'") count = 3;
  else if (move[1] === "2") count = 2;

  applyCornerMove(result.cornerPermutation, result.cornerOrientation, baseFace, count);
  applyEdgeMove(result.edgePermutation, result.edgeOrientation, baseFace, count);

  if (count === 1 || count === 3) {
    result.parities.corner = !result.parities.corner;
    result.parities.edge = !result.parities.edge;
  }

  return result;
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  let result = state;
  for (const move of moves) {
    result = applyMove(result, move);
  }
  return result;
}

export function scrambleCube(moves: number = 20): { state: CubeState; moves: Move[] } {
  const result = createSolvedState();
  const scramble: Move[] = [];
  let lastFace = "";

  for (let i = 0; i < moves; i++) {
    let move: Move;
    do {
      move = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)];
    } while (move[0] === lastFace);
    lastFace = move[0];
    scramble.push(move);
  }

  return { state: applyMoves(result, scramble), moves: scramble };
}

export function isValidState(state: CubeState): { valid: boolean; errors: string[] } {
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
  if (cornerSet.size !== CORNER_COUNT) {
    errors.push("角块排列不合法");
  }

  const edgeSet = new Set(state.edgePermutation);
  if (edgeSet.size !== EDGE_COUNT) {
    errors.push("棱块排列不合法");
  }

  return { valid: errors.length === 0, errors };
}
