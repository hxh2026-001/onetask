import { NFA, DFA, DFAState, DFABuildStep, EpsilonClosureStep } from './types.js';
import { NFABuilder } from './nfa-builder.js';

export class DFABuilder {
  private nfaBuilder: NFABuilder;
  private dfaStateIdCounter: number;
  private buildSteps: DFABuildStep[];
  private stepCounter: number;

  constructor() {
    this.nfaBuilder = new NFABuilder();
    this.dfaStateIdCounter = 0;
    this.buildSteps = [];
    this.stepCounter = 0;
  }

  convertToDFA(nfa: NFA): DFA {
    this.dfaStateIdCounter = 0;
    this.buildSteps = [];
    this.stepCounter = 0;

    const dfaStates = new Map<number, DFAState>();
    const nfaStatesToDFA = new Map<string, number>();

    const startClosureResult = this.nfaBuilder.epsilonClosure(nfa, new Set([nfa.start]));
    const startClosure = startClosureResult.closure;

    const startKey = this.stateSetKey(startClosure);
    const startDFAState: DFAState = {
      id: this.dfaStateIdCounter++,
      nfaStates: new Set(startClosure),
      transitions: new Map(),
      isAccept: startClosure.has(nfa.accept),
      isStart: true,
      label: `DFA-状态0`
    };
    dfaStates.set(startDFAState.id, startDFAState);
    nfaStatesToDFA.set(startKey, startDFAState.id);

    this.addBuildStep(
      `创建起始 DFA 状态 (ε-闭包: {${[...startClosure].join(', ')}})`,
      dfaStates,
      startClosureResult.steps,
      startDFAState.id,
      []
    );

    const queue: number[] = [startDFAState.id];

    while (queue.length > 0) {
      const currentDFAId = queue.shift()!;
      const currentDFAState = dfaStates.get(currentDFAId)!;

      for (const symbol of nfa.alphabet) {
        if (symbol === 'ε') continue;

        const moveResult = new Set<number>();
        for (const nfaStateId of currentDFAState.nfaStates) {
          const nfaState = nfa.states.get(nfaStateId);
          if (nfaState && nfaState.transitions.has(symbol)) {
            for (const target of nfaState.transitions.get(symbol)!) {
              moveResult.add(target);
            }
          }
        }

        if (moveResult.size === 0) continue;

        const closureResult = this.nfaBuilder.epsilonClosure(nfa, moveResult);
        const closure = closureResult.closure;

        const closureKey = this.stateSetKey(closure);
        let targetDFAId: number;

        if (nfaStatesToDFA.has(closureKey)) {
          targetDFAId = nfaStatesToDFA.get(closureKey)!;
        } else {
          const newDFAState: DFAState = {
            id: this.dfaStateIdCounter++,
            nfaStates: new Set(closure),
            transitions: new Map(),
            isAccept: closure.has(nfa.accept),
            isStart: false,
            label: `DFA-状态${this.dfaStateIdCounter - 1}`
          };
          dfaStates.set(newDFAState.id, newDFAState);
          nfaStatesToDFA.set(closureKey, newDFAState.id);
          queue.push(newDFAState.id);

          this.addBuildStep(
            `创建新 DFA 状态 ${newDFAState.id} (NFA 状态: {${[...closure].join(', ')}})`,
            dfaStates,
            closureResult.steps,
            newDFAState.id,
            [{ from: currentDFAId, symbol, to: newDFAState.id }]
          );
        }

        currentDFAState.transitions.set(symbol, targetDFAId);
      }
    }

    const acceptStates = new Set<number>();
    for (const [, state] of dfaStates) {
      if (state.isAccept) {
        acceptStates.add(state.id);
      }
    }

    const dfa: DFA = {
      states: dfaStates,
      start: startDFAState.id,
      acceptStates,
      alphabet: new Set(nfa.alphabet),
      buildSteps: this.buildSteps
    };

    return dfa;
  }

  private stateSetKey(states: Set<number>): string {
    return [...states].sort((a, b) => a - b).join(',');
  }

  private addBuildStep(
    description: string,
    dfaStates: Map<number, DFAState>,
    epsilonClosureSteps: EpsilonClosureStep[],
    newStateId: number,
    transitionDetails: Array<{ from: number; symbol: string; to: number }>
  ): void {
    const statesCopy = new Map<number, DFAState>();
    for (const [id, state] of dfaStates) {
      const transitionsCopy = new Map<string, number>();
      for (const [symbol, target] of state.transitions) {
        transitionsCopy.set(symbol, target);
      }
      statesCopy.set(id, {
        ...state,
        nfaStates: new Set(state.nfaStates),
        transitions: transitionsCopy
      });
    }

    this.buildSteps.push({
      step: this.stepCounter++,
      description,
      dfaStates: statesCopy,
      epsilonClosureSteps: epsilonClosureSteps.map(s => ({
        ...s,
        visitedStates: new Set(s.visitedStates),
        newVisited: new Set(s.newVisited)
      })),
      newStateId,
      transitionDetails: [...transitionDetails]
    });
  }
}
