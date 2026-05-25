import { CubeState, CORNER_COUNT, EDGE_COUNT } from "./cube";

export function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function permutationToIndex(perm: number[]): number {
  const n = perm.length;
  let index = 0;
  const used = new Array(n).fill(false);

  for (let i = 0; i < n; i++) {
    let count = 0;
    for (let j = 0; j < perm[i]; j++) {
      if (!used[j]) count++;
    }
    used[perm[i]] = true;
    index += count * factorial(n - 1 - i);
  }
  return index;
}

export function indexToPermutation(index: number, n: number): number[] {
  const perm = new Array(n).fill(0);
  const used = new Array(n).fill(false);

  for (let i = 0; i < n; i++) {
    const fact = factorial(n - 1 - i);
    let count = Math.floor(index / fact);
    index %= fact;

    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        if (count === 0) {
          perm[i] = j;
          used[j] = true;
          break;
        }
        count--;
      }
    }
  }
  return perm;
}

export function encodeOrientation(orient: number[], base: number): number {
  let result = 0;
  for (let i = 0; i < orient.length - 1; i++) {
    result = result * base + orient[i];
  }
  return result;
}

export function decodeOrientation(index: number, n: number, base: number): number[] {
  const orient = new Array(n).fill(0);
  let sum = 0;
  for (let i = n - 2; i >= 0; i--) {
    orient[i] = index % base;
    sum += orient[i];
    index = Math.floor(index / base);
  }
  orient[n - 1] = (base - sum % base) % base;
  return orient;
}

export function stateToIndex(state: CubeState): {
  cornerIndex: number;
  edgeIndex: number;
  fullIndex: string;
} {
  const cornerPermIdx = permutationToIndex(state.cornerPermutation);
  const cornerOrientIdx = encodeOrientation(state.cornerOrientation, 3);
  const edgePermIdx = permutationToIndex(state.edgePermutation);
  const edgeOrientIdx = encodeOrientation(state.edgeOrientation, 2);

  const cornerIndex = cornerPermIdx * 2187 + cornerOrientIdx;
  const edgeIndex = edgePermIdx * 2048 + edgeOrientIdx;

  const fullIndex = `${cornerIndex}-${edgeIndex}`;
  return { cornerIndex, edgeIndex, fullIndex };
}

export function indexToState(cornerIndex: number, edgeIndex: number): CubeState {
  const cornerPermIdx = Math.floor(cornerIndex / 2187);
  const cornerOrientIdx = cornerIndex % 2187;
  const edgePermIdx = Math.floor(edgeIndex / 2048);
  const edgeOrientIdx = edgeIndex % 2048;

  return {
    cornerPermutation: indexToPermutation(cornerPermIdx, CORNER_COUNT),
    cornerOrientation: decodeOrientation(cornerOrientIdx, CORNER_COUNT, 3),
    edgePermutation: indexToPermutation(edgePermIdx, EDGE_COUNT),
    edgeOrientation: decodeOrientation(edgeOrientIdx, EDGE_COUNT, 2),
    parities: { corner: false, edge: false },
  };
}

export function stateToBinary(state: CubeState): string {
  const { cornerIndex, edgeIndex } = stateToIndex(state);
  const cornerBinary = cornerIndex.toString(2).padStart(20, "0");
  const edgeBinary = edgeIndex.toString(2).padStart(22, "0");
  return cornerBinary + edgeBinary;
}

export function binaryToState(binary: string): CubeState {
  const cornerBinary = binary.slice(0, 20);
  const edgeBinary = binary.slice(20);
  const cornerIndex = parseInt(cornerBinary, 2);
  const edgeIndex = parseInt(edgeBinary, 2);
  return indexToState(cornerIndex, edgeIndex);
}

export function stateHash(state: CubeState): string {
  const { fullIndex } = stateToIndex(state);
  return fullIndex;
}

export function compressState(state: CubeState): Buffer {
  const { cornerIndex, edgeIndex } = stateToIndex(state);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(cornerIndex, 0);
  buffer.writeUInt32BE(edgeIndex, 4);
  return buffer;
}

export function decompressState(buffer: Buffer): CubeState {
  const cornerIndex = buffer.readUInt32BE(0);
  const edgeIndex = buffer.readUInt32BE(4);
  return indexToState(cornerIndex, edgeIndex);
}

export const CORNER_GROUP_SIZE = 40320 * 2187;
export const EDGE_GROUP_SIZE = 479001600 * 2048;
export const TOTAL_GROUP_SIZE = 43252003274489856000n;
