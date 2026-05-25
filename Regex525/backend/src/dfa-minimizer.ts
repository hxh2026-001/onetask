import { DFA, MinimizedDFA, MinimizedState, MinimizationStep } from './types.js';

export class DFAMinimizer {
  private mergeSteps: MinimizationStep[];
  private stepCounter: number;

  constructor() {
    this.mergeSteps = [];
    this.stepCounter = 0;
  }

  minimize(dfa: DFA): MinimizedDFA {
    this.mergeSteps = [];
    this.stepCounter = 0;

    const deadStateId = this.ensureDeadState(dfa);

    const partitions = this.hopcroftMinimize(dfa, deadStateId);

    const stateToPartition = new Map<number, number>();
    partitions.forEach((partition, index) => {
      for (const stateId of partition) {
        stateToPartition.set(stateId, index);
      }
    });

    const minimizedStates = new Map<number, MinimizedState>();
    const equivalenceClasses: number[][] = [];

    partitions.forEach((partition, index) => {
      const sortedStates = [...partition].sort((a, b) => a - b);
      equivalenceClasses.push(sortedStates);

      const representativeState = dfa.states.get(sortedStates[0]);
      const isAccept = sortedStates.some(s => dfa.states.get(s)?.isAccept);
      const isStart = sortedStates.some(s => dfa.states.get(s)?.isStart);

      const newState: MinimizedState = {
        id: index,
        originalStates: new Set(sortedStates),
        transitions: new Map(),
        isAccept,
        isStart
      };

      if (representativeState) {
        for (const [symbol, target] of representativeState.transitions) {
          const targetPartition = stateToPartition.get(target);
          if (targetPartition !== undefined) {
            newState.transitions.set(symbol, targetPartition);
          }
        }
      }

      for (let i = 1; i < sortedStates.length; i++) {
        const state = dfa.states.get(sortedStates[i]);
        if (state) {
          for (const [symbol, target] of state.transitions) {
            const targetPartition = stateToPartition.get(target);
            if (targetPartition !== undefined && !newState.transitions.has(symbol)) {
              newState.transitions.set(symbol, targetPartition);
            }
          }
        }
      }

      minimizedStates.set(index, newState);
    });

    let startState = 0;
    for (const [id, state] of minimizedStates) {
      if (state.isStart) {
        startState = id;
        break;
      }
    }

    const acceptStates = new Set<number>();
    for (const [id, state] of minimizedStates) {
      if (state.isAccept) {
        acceptStates.add(id);
      }
    }

    return {
      states: minimizedStates,
      start: startState,
      acceptStates,
      alphabet: new Set(dfa.alphabet),
      equivalenceClasses,
      mergeSteps: this.mergeSteps
    };
  }

  private ensureDeadState(dfa: DFA): number {
    let hasDeadState = false;
    let deadStateId = -1;

    for (const [id, state] of dfa.states) {
      if (!state.isAccept && state.isStart === false) {
        let allSelfLoop = true;
        for (const [, target] of state.transitions) {
          if (target !== id) {
            allSelfLoop = false;
            break;
          }
        }
        if (allSelfLoop && state.transitions.size === dfa.alphabet.size) {
          hasDeadState = true;
          deadStateId = id;
          break;
        }
      }
    }

    if (!hasDeadState) {
      deadStateId = dfa.states.size;
      const deadState = {
        id: deadStateId,
        nfaStates: new Set<number>(),
        transitions: new Map<string, number>(),
        isAccept: false,
        isStart: false,
        label: '死状态'
      };

      for (const symbol of dfa.alphabet) {
        deadState.transitions.set(symbol, deadStateId);
      }

      dfa.states.set(deadStateId, deadState);

      for (const [, state] of dfa.states) {
        if (state.id !== deadStateId) {
          for (const symbol of dfa.alphabet) {
            if (!state.transitions.has(symbol)) {
              state.transitions.set(symbol, deadStateId);
            }
          }
        }
      }
    }

    return deadStateId;
  }

  private hopcroftMinimize(dfa: DFA, deadStateId: number): Set<number>[] {
    const acceptStates = new Set<number>();
    const nonAcceptStates = new Set<number>();

    for (const [id, state] of dfa.states) {
      if (state.isAccept) {
        acceptStates.add(id);
      } else {
        nonAcceptStates.add(id);
      }
    }

    let partitions: Set<number>[] = [];
    if (acceptStates.size > 0) {
      partitions.push(new Set(acceptStates));
      this.addMergeStep('初始分区: 接受状态', partitions, [...acceptStates]);
    }
    if (nonAcceptStates.size > 0) {
      partitions.push(new Set(nonAcceptStates));
      this.addMergeStep('初始分区: 非接受状态', partitions, [...nonAcceptStates]);
    }

    const worklist: Array<{ partition: Set<number>; symbol: string }> = [];
    for (const symbol of dfa.alphabet) {
      if (acceptStates.size > 0) {
        worklist.push({ partition: new Set(acceptStates), symbol });
      }
    }

    let iteration = 0;
    while (worklist.length > 0 && iteration < 100) {
      const { partition, symbol } = worklist.shift()!;
      iteration++;

      const newPartitions: Set<number>[] = [];

      for (let i = 0; i < partitions.length; i++) {
        const currentPartition = partitions[i];
        const inGroup = new Set<number>();
        const outGroup = new Set<number>();

        for (const stateId of currentPartition) {
          const state = dfa.states.get(stateId);
          if (state) {
            const target = state.transitions.get(symbol);
            if (target !== undefined && partition.has(target)) {
              inGroup.add(stateId);
            } else {
              outGroup.add(stateId);
            }
          }
        }

        if (inGroup.size > 0 && outGroup.size > 0) {
          newPartitions.push(inGroup);
          newPartitions.push(outGroup);

          this.addMergeStep(
            `按符号 "${symbol}" 分裂分区: {${[...inGroup].join(', ')}} | {${[...outGroup].join(', ')}}`,
            [...partitions.slice(0, i), inGroup, outGroup, ...partitions.slice(i + 1)],
            [...inGroup, ...outGroup]
          );

          for (const s of dfa.alphabet) {
            if (s !== symbol) {
              worklist.push({ partition: new Set(inGroup), symbol: s });
            }
          }
        } else {
          newPartitions.push(currentPartition);
        }
      }

      partitions = newPartitions;
    }

    const nonTrivialPartitions = partitions.filter(p => p.size > 1);
    if (nonTrivialPartitions.length > 0) {
      for (const partition of nonTrivialPartitions) {
        this.addMergeStep(
          `合并等价状态: {${[...partition].sort((a, b) => a - b).join(', ')}}`,
          partitions,
          [...partition],
          this.getNewStateIdFromPartition(dfa, partition)
        );
      }
    }

    return partitions;
  }

  private getNewStateIdFromPartition(dfa: DFA, partition: Set<number>): number {
    return Math.min(...partition);
  }

  private addMergeStep(
    description: string,
    partitions: Set<number>[],
    mergedStateIds: number[],
    newStateId?: number
  ): void {
    this.mergeSteps.push({
      step: this.stepCounter++,
      description,
      partitions: partitions.map(p => new Set(p)),
      mergedStateIds: [...mergedStateIds],
      newStateId
    });
  }
}
