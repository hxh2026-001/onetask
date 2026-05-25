export interface ASTNode {
  type: 'literal' | 'concat' | 'alternate' | 'star' | 'plus' | 'question' | 'group' | 'charClass' | 'dot' | 'repeat';
  value?: string;
  children?: ASTNode[];
  min?: number;
  max?: number;
  negated?: boolean;
  ranges?: Array<{ start: string; end: string }>;
}

export interface NFAState {
  id: number;
  transitions: Map<string, Set<number>>;
  isAccept: boolean;
  label?: string;
}

export interface NFA {
  states: Map<number, NFAState>;
  start: number;
  accept: number;
  alphabet: Set<string>;
  buildSteps: NFABuildStep[];
}

export interface NFABuildStep {
  step: number;
  description: string;
  states: Map<number, NFAState>;
  start: number;
  accept: number;
  newStateIds: number[];
  newTransitions: Array<{ from: number; symbol: string; to: number }>;
}

export interface DFAState {
  id: number;
  nfaStates: Set<number>;
  transitions: Map<string, number>;
  isAccept: boolean;
  isStart: boolean;
  label: string;
}

export interface DFA {
  states: Map<number, DFAState>;
  start: number;
  acceptStates: Set<number>;
  alphabet: Set<string>;
  buildSteps: DFABuildStep[];
}

export interface DFABuildStep {
  step: number;
  description: string;
  dfaStates: Map<number, DFAState>;
  epsilonClosureSteps: EpsilonClosureStep[];
  newStateId: number;
  transitionDetails: Array<{ from: number; symbol: string; to: number }>;
}

export interface EpsilonClosureStep {
  fromState: number;
  visitedStates: Set<number>;
  newVisited: Set<number>;
  wave: number;
}

export interface MinimizedDFA {
  states: Map<number, MinimizedState>;
  start: number;
  acceptStates: Set<number>;
  alphabet: Set<string>;
  equivalenceClasses: number[][];
  mergeSteps: MinimizationStep[];
}

export interface MinimizedState {
  id: number;
  originalStates: Set<number>;
  transitions: Map<string, number>;
  isAccept: boolean;
  isStart: boolean;
}

export interface MinimizationStep {
  step: number;
  description: string;
  partitions: Set<number>[];
  mergedStateIds: number[];
  newStateId?: number;
}

export interface MatchStep {
  step: number;
  inputIndex: number;
  currentChar: string;
  currentState: number;
  activeStates: Set<number>;
  transition: { from: number; symbol: string; to: number } | null;
  isBacktrack: boolean;
  backtrackFrom?: number;
  matchStart?: number;
  matchEnd?: number;
}

export interface MatchResult {
  success: boolean;
  matchStart: number;
  matchEnd: number;
  matchedText: string;
  steps: MatchStep[];
  captureGroups: Array<{ start: number; end: number; text: string }>;
  executionTime: number;
  stateCount: number;
  backtrackCount: number;
}

export interface RegexHistory {
  id: number;
  pattern: string;
  testText: string;
  createdAt: string;
  result: MatchResult | null;
}

export interface AutomatonSnapshot {
  id: number;
  regexHistoryId: number;
  type: 'NFA' | 'DFA' | 'MINIMIZED_DFA';
  snapshot: string;
  createdAt: string;
}

export interface MatchLog {
  id: number;
  regexHistoryId: number;
  steps: string;
  createdAt: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  pattern: string;
  testText: string;
  expectedMatches: string[];
  highlight: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'simple-literal',
    name: '简单字面量匹配场景',
    description: '演示最基本的字面量匹配，NFA 状态数少，易于理解',
    pattern: 'hello',
    testText: 'say hello world',
    expectedMatches: ['hello'],
    highlight: '展示 Thompson 构造法如何为简单字面量构建线性 NFA'
  },
  {
    id: 'quantifier-backtrack',
    name: '量词回溯爆炸场景',
    description: '演示嵌套量词 (a*)* 在回溯型引擎中的指数级匹配时间',
    pattern: '(a*)*b',
    testText: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    expectedMatches: [],
    highlight: '展示嵌套量词导致的回溯爆炸，无 b 结尾时引擎需尝试所有可能的 a* 组合'
  },
  {
    id: 'nfa-explosion',
    name: 'NFA 状态爆炸场景',
    description: '演示交替量词 a|b 重复多次后 NFA 到 DFA 的状态数指数膨胀',
    pattern: '(a|b){5}',
    testText: 'ababababab',
    expectedMatches: ['ababa'],
    highlight: '展示子集构造法如何将 NFA 的 ε 闭包合并为 DFA 状态，2^5=32 个状态'
  },
  {
    id: 'epsilon-loop',
    name: '空转移循环场景',
    description: '演示 ε 转移环导致闭包计算时的无限递归风险',
    pattern: 'a*b*',
    testText: 'aaabbb',
    expectedMatches: ['aaabbb'],
    highlight: '展示 ε 闭包计算如何正确处理空转移环，避免无限递归'
  }
];
