export interface NFAState {
  id: number;
  transitions: Array<{ symbol: string; targets: number[] }>;
  isAccept: boolean;
  label?: string;
}

export interface NFABuildStep {
  step: number;
  description: string;
  states: NFAState[];
  start: number;
  accept: number;
  newStateIds: number[];
  newTransitions: Array<{ from: number; symbol: string; to: number }>;
}

export interface NFAData {
  states: NFAState[];
  start: number;
  accept: number;
  alphabet: string[];
  buildSteps: NFABuildStep[];
}

export interface DFAState {
  id: number;
  nfaStates: number[];
  transitions: Array<[string, number]>;
  isAccept: boolean;
  isStart: boolean;
  label: string;
}

export interface DFABuildStep {
  step: number;
  description: string;
  dfaStates: DFAState[];
  epsilonClosureSteps: Array<{
    fromState: number;
    visitedStates: number[];
    newVisited: number[];
    wave: number;
  }>;
  newStateId: number;
  transitionDetails: Array<{ from: number; symbol: string; to: number }>;
}

export interface DFAData {
  states: DFAState[];
  start: number;
  acceptStates: number[];
  alphabet: string[];
  buildSteps: DFABuildStep[];
}

export interface MinimizedState {
  id: number;
  originalStates: number[];
  transitions: Array<[string, number]>;
  isAccept: boolean;
  isStart: boolean;
}

export interface MinimizationStep {
  step: number;
  description: string;
  partitions: number[][];
  mergedStateIds: number[];
  newStateId?: number;
}

export interface MinimizedDFAData {
  states: MinimizedState[];
  start: number;
  acceptStates: number[];
  alphabet: string[];
  equivalenceClasses: number[][];
  mergeSteps: MinimizationStep[];
}

export interface MatchStep {
  step: number;
  inputIndex: number;
  currentChar: string;
  currentState: number;
  activeStates: number[];
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

export interface BuildResponse {
  historyId: number;
  nfa: NFAData;
  dfa: DFAData;
  minimizedDfa: MinimizedDFAData;
  matchResult: MatchResult;
}

export interface RegexHistory {
  id: number;
  pattern: string;
  testText: string;
  createdAt: string;
  result: MatchResult | null;
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

export type VisualizationMode = 'nfa' | 'dfa' | 'minimized';
