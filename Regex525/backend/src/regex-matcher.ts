import { NFA, DFA, MinimizedDFA, MatchStep, MatchResult } from './types.js';

export class RegexMatcher {
  private steps: MatchStep[];
  private stepCounter: number;
  private backtrackCount: number;

  constructor() {
    this.steps = [];
    this.stepCounter = 0;
    this.backtrackCount = 0;
  }

  matchWithNFA(nfa: NFA, input: string): MatchResult {
    this.steps = [];
    this.stepCounter = 0;
    this.backtrackCount = 0;

    const startTime = performance.now();
    const result = this.nfaMatch(nfa, input);
    const executionTime = performance.now() - startTime;

    return {
      ...result,
      executionTime,
      stateCount: nfa.states.size,
      backtrackCount: this.backtrackCount
    };
  }

  matchWithDFA(dfa: DFA, input: string): MatchResult {
    this.steps = [];
    this.stepCounter = 0;
    this.backtrackCount = 0;

    const startTime = performance.now();
    const result = this.dfaMatch(dfa, input);
    const executionTime = performance.now() - startTime;

    return {
      ...result,
      executionTime,
      stateCount: dfa.states.size,
      backtrackCount: 0
    };
  }

  matchWithMinimizedDFA(minimizedDfa: MinimizedDFA, input: string): MatchResult {
    this.steps = [];
    this.stepCounter = 0;
    this.backtrackCount = 0;

    const startTime = performance.now();
    const result = this.minimizedDfaMatch(minimizedDfa, input);
    const executionTime = performance.now() - startTime;

    return {
      ...result,
      executionTime,
      stateCount: minimizedDfa.states.size,
      backtrackCount: 0
    };
  }

  private nfaMatch(nfa: NFA, input: string): Omit<MatchResult, 'executionTime' | 'stateCount' | 'backtrackCount'> {
    let matchStart = -1;
    let matchEnd = -1;
    let matchedText = '';

    for (let startPos = 0; startPos <= input.length; startPos++) {
      const result = this.nfaMatchFromPosition(nfa, input, startPos);
      if (result.success) {
        matchStart = startPos;
        matchEnd = result.matchEnd;
        matchedText = input.substring(startPos, result.matchEnd);
        break;
      }
    }

    const success = matchStart !== -1;
    return {
      success,
      matchStart,
      matchEnd: matchEnd === -1 ? 0 : matchEnd,
      matchedText,
      steps: this.steps,
      captureGroups: []
    };
  }

  private nfaMatchFromPosition(nfa: NFA, input: string, startPos: number): { success: boolean; matchEnd: number } {
    const initialClosure = this.epsilonClosure(nfa, new Set([nfa.start]));

    this.addStep({
      inputIndex: startPos,
      currentChar: startPos < input.length ? input[startPos] : '',
      currentState: nfa.start,
      activeStates: initialClosure,
      transition: null,
      isBacktrack: false,
      matchStart: startPos
    });

    let currentStates = initialClosure;
    let pos = startPos;
    let lastAcceptPos = -1;

    if (currentStates.has(nfa.accept)) {
      lastAcceptPos = pos;
    }

    while (pos < input.length) {
      const char = input[pos];
      const nextStates = new Set<number>();

      for (const stateId of currentStates) {
        const state = nfa.states.get(stateId);
        if (!state) continue;

        const targets = state.transitions.get(char);
        if (targets) {
          for (const target of targets) {
            const closure = this.epsilonClosure(nfa, new Set([target]));
            for (const s of closure) {
              nextStates.add(s);
            }
          }
        }
      }

      if (nextStates.size === 0) {
        if (lastAcceptPos !== -1) {
          this.addStep({
            inputIndex: lastAcceptPos,
            currentChar: '',
            currentState: nfa.accept,
            activeStates: new Set([nfa.accept]),
            transition: null,
            isBacktrack: false,
            matchStart: startPos,
            matchEnd: lastAcceptPos
          });
          return { success: true, matchEnd: lastAcceptPos };
        }
        this.addStep({
          inputIndex: pos,
          currentChar: char,
          currentState: -1,
          activeStates: new Set(),
          transition: null,
          isBacktrack: true,
          backtrackFrom: [...currentStates][0] || -1
        });
        this.backtrackCount++;
        return { success: false, matchEnd: -1 };
      }

      const firstActive = [...nextStates][0];
      const prevActive = [...currentStates][0];

      this.addStep({
        inputIndex: pos,
        currentChar: char,
        currentState: firstActive,
        activeStates: nextStates,
        transition: { from: prevActive, symbol: char, to: firstActive },
        isBacktrack: false
      });

      currentStates = nextStates;
      pos++;

      if (currentStates.has(nfa.accept)) {
        lastAcceptPos = pos;
      }
    }

    if (currentStates.has(nfa.accept)) {
      this.addStep({
        inputIndex: pos,
        currentChar: '',
        currentState: nfa.accept,
        activeStates: currentStates,
        transition: null,
        isBacktrack: false,
        matchStart: startPos,
        matchEnd: pos
      });
      return { success: true, matchEnd: pos };
    }

    if (lastAcceptPos !== -1) {
      this.addStep({
        inputIndex: lastAcceptPos,
        currentChar: '',
        currentState: nfa.accept,
        activeStates: new Set([nfa.accept]),
        transition: null,
        isBacktrack: false,
        matchStart: startPos,
        matchEnd: lastAcceptPos
      });
      return { success: true, matchEnd: lastAcceptPos };
    }

    return { success: false, matchEnd: -1 };
  }

  private dfaMatch(dfa: DFA, input: string): Omit<MatchResult, 'executionTime' | 'stateCount' | 'backtrackCount'> {
    let matchStart = -1;
    let matchEnd = -1;
    let matchedText = '';

    for (let startPos = 0; startPos <= input.length; startPos++) {
      const result = this.dfaMatchFromPosition(dfa, input, startPos);
      if (result.success) {
        matchStart = startPos;
        matchEnd = result.matchEnd;
        matchedText = input.substring(startPos, result.matchEnd);
        break;
      }
    }

    const success = matchStart !== -1;
    return {
      success,
      matchStart,
      matchEnd: matchEnd === -1 ? 0 : matchEnd,
      matchedText,
      steps: this.steps,
      captureGroups: []
    };
  }

  private dfaMatchFromPosition(dfa: DFA, input: string, startPos: number): { success: boolean; matchEnd: number } {
    let currentState = dfa.start;
    let pos = startPos;

    this.addStep({
      inputIndex: startPos,
      currentChar: startPos < input.length ? input[startPos] : '',
      currentState,
      activeStates: new Set([currentState]),
      transition: null,
      isBacktrack: false,
      matchStart: startPos
    });

    while (pos < input.length) {
      const char = input[pos];
      const state = dfa.states.get(currentState);

      if (!state) {
        return { success: false, matchEnd: -1 };
      }

      const nextState = state.transitions.get(char);

      if (nextState === undefined) {
        this.addStep({
          inputIndex: pos,
          currentChar: char,
          currentState: -1,
          activeStates: new Set(),
          transition: null,
          isBacktrack: true,
          backtrackFrom: currentState
        });
        return { success: false, matchEnd: -1 };
      }

      this.addStep({
        inputIndex: pos,
        currentChar: char,
        currentState: nextState,
        activeStates: new Set([nextState]),
        transition: { from: currentState, symbol: char, to: nextState },
        isBacktrack: false
      });

      currentState = nextState;
      pos++;
    }

    if (dfa.acceptStates.has(currentState)) {
      this.addStep({
        inputIndex: pos,
        currentChar: '',
        currentState,
        activeStates: new Set([currentState]),
        transition: null,
        isBacktrack: false,
        matchStart: startPos,
        matchEnd: pos
      });
      return { success: true, matchEnd: pos };
    }

    return { success: false, matchEnd: -1 };
  }

  private minimizedDfaMatch(minimizedDfa: MinimizedDFA, input: string): Omit<MatchResult, 'executionTime' | 'stateCount' | 'backtrackCount'> {
    let matchStart = -1;
    let matchEnd = -1;
    let matchedText = '';

    for (let startPos = 0; startPos <= input.length; startPos++) {
      const result = this.minimizedDfaMatchFromPosition(minimizedDfa, input, startPos);
      if (result.success) {
        matchStart = startPos;
        matchEnd = result.matchEnd;
        matchedText = input.substring(startPos, result.matchEnd);
        break;
      }
    }

    const success = matchStart !== -1;
    return {
      success,
      matchStart,
      matchEnd: matchEnd === -1 ? 0 : matchEnd,
      matchedText,
      steps: this.steps,
      captureGroups: []
    };
  }

  private minimizedDfaMatchFromPosition(minimizedDfa: MinimizedDFA, input: string, startPos: number): { success: boolean; matchEnd: number } {
    let currentState = minimizedDfa.start;
    let pos = startPos;

    this.addStep({
      inputIndex: startPos,
      currentChar: startPos < input.length ? input[startPos] : '',
      currentState,
      activeStates: new Set([currentState]),
      transition: null,
      isBacktrack: false,
      matchStart: startPos
    });

    while (pos < input.length) {
      const char = input[pos];
      const state = minimizedDfa.states.get(currentState);

      if (!state) {
        return { success: false, matchEnd: -1 };
      }

      const nextState = state.transitions.get(char);

      if (nextState === undefined) {
        this.addStep({
          inputIndex: pos,
          currentChar: char,
          currentState: -1,
          activeStates: new Set(),
          transition: null,
          isBacktrack: true,
          backtrackFrom: currentState
        });
        return { success: false, matchEnd: -1 };
      }

      this.addStep({
        inputIndex: pos,
        currentChar: char,
        currentState: nextState,
        activeStates: new Set([nextState]),
        transition: { from: currentState, symbol: char, to: nextState },
        isBacktrack: false
      });

      currentState = nextState;
      pos++;
    }

    if (minimizedDfa.acceptStates.has(currentState)) {
      this.addStep({
        inputIndex: pos,
        currentChar: '',
        currentState,
        activeStates: new Set([currentState]),
        transition: null,
        isBacktrack: false,
        matchStart: startPos,
        matchEnd: pos
      });
      return { success: true, matchEnd: pos };
    }

    return { success: false, matchEnd: -1 };
  }

  private epsilonClosure(nfa: NFA, states: Set<number>): Set<number> {
    const closure = new Set(states);
    const stack: number[] = [...states];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const state = nfa.states.get(current);
      if (!state) continue;

      const epsilonTargets = state.transitions.get('ε');
      if (epsilonTargets) {
        for (const target of epsilonTargets) {
          if (!closure.has(target)) {
            closure.add(target);
            stack.push(target);
          }
        }
      }
    }

    return closure;
  }

  private addStep(step: Omit<MatchStep, 'step'>): void {
    this.steps.push({
      step: this.stepCounter++,
      ...step
    });
  }
}
