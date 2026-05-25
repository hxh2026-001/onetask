import {
  CubeState,
  Move,
  createSolvedState,
  applyMoves,
  scrambleCube,
} from "./cube";

export interface PresetState {
  name: string;
  description: string;
  state: CubeState;
  moves: Move[];
  isInvalid?: boolean;
}

export function getRandomScramble(): PresetState {
  const { state, moves } = scrambleCube(20);
  return {
    name: "预设一：三阶随机打乱",
    description: "20步随机打乱的三阶魔方",
    state,
    moves,
  };
}

export function getParityCheck(): PresetState {
  const state = createSolvedState();
  const moves: Move[] = [
    "U", "D", "R", "L", "F", "B",
    "U2", "D2",
  ];
  const result = applyMoves(state, moves);

  result.cornerOrientation[0] = 1;

  return {
    name: "预设二：四阶奇偶校验",
    description: "模拟四阶魔方偶置换奇偶校验",
    state: result,
    moves,
    isInvalid: true,
  };
}

export function getBlindfoldState(): PresetState {
  const state = createSolvedState();
  const moves: Move[] = [
    "R", "U", "R'", "U'",
    "U", "R", "U'", "R'",
    "F'", "U'", "F",
  ];
  const result = applyMoves(state, moves);

  return {
    name: "预设三：盲拧记忆编码",
    description: "适合盲拧练习的状态",
    state: result,
    moves,
  };
}

export function getHashCollisionState(): PresetState {
  const state = createSolvedState();
  const moves: Move[] = [
    "R", "U", "R", "U",
    "R'", "U'", "R'", "U'",
    "R", "U", "R", "U",
    "R'", "U'", "R'", "U'",
  ];
  const result = applyMoves(state, moves);

  return {
    name: "预设四：状态哈希冲突",
    description: "可能导致哈希碰撞的特殊状态",
    state: result,
    moves,
  };
}

export const ALL_PRESETS: (() => PresetState)[] = [
  getRandomScramble,
  getParityCheck,
  getBlindfoldState,
  getHashCollisionState,
];

export function getInvalidState(): PresetState {
  const state = createSolvedState();
  state.cornerPermutation[0] = 1;
  state.cornerPermutation[1] = 0;
  state.cornerOrientation[0] = 1;
  state.cornerOrientation[1] = 2;

  return {
    name: "非法状态演示",
    description: "破坏群结构的非法状态",
    state,
    moves: [],
    isInvalid: true,
  };
}

export function getMemoryOverflowState(): PresetState {
  const state = createSolvedState();
  const moves: Move[] = [];
  for (let i = 0; i < 30; i++) {
    const faces = ["U", "D", "F", "B", "L", "R"];
    const face = faces[Math.floor(Math.random() * 6)];
    const variants = ["", "'", "2"];
    const variant = variants[Math.floor(Math.random() * 3)];
    moves.push((face + variant) as Move);
  }
  const result = applyMoves(state, moves);

  return {
    name: "内存溢出演示",
    description: "大量移动导致搜索深度过大",
    state: result,
    moves,
  };
}
