import { ASTNode, NFA, NFAState, NFABuildStep } from './types.js';
import { RegexParser } from './regex-parser.js';

export class NFABuilder {
  private parser: RegexParser;
  private stateIdCounter: number;
  private buildSteps: NFABuildStep[];
  private stepCounter: number;

  constructor() {
    this.parser = new RegexParser();
    this.stateIdCounter = 0;
    this.buildSteps = [];
    this.stepCounter = 0;
  }

  build(pattern: string): NFA {
    this.stateIdCounter = 0;
    this.buildSteps = [];
    this.stepCounter = 0;

    const ast = this.parser.parse(pattern);
    const { start, accept, states, alphabet } = this.buildFromAST(ast);

    const nfa: NFA = {
      states,
      start,
      accept,
      alphabet,
      buildSteps: this.buildSteps
    };

    this.addBuildStep('NFA 构建完成', states, start, accept, [], []);

    return nfa;
  }

  private createState(isAccept: boolean = false, label?: string): NFAState {
    const id = this.stateIdCounter++;
    const state: NFAState = {
      id,
      transitions: new Map(),
      isAccept,
      label
    };
    return state;
  }

  private addTransition(states: Map<number, NFAState>, from: number, symbol: string, to: number): void {
    if (!states.has(from)) {
      states.set(from, this.createState());
    }
    const fromState = states.get(from)!;
    if (!fromState.transitions.has(symbol)) {
      fromState.transitions.set(symbol, new Set());
    }
    fromState.transitions.get(symbol)!.add(to);
  }

  private addBuildStep(
    description: string,
    states: Map<number, NFAState>,
    start: number,
    accept: number,
    newStateIds: number[],
    newTransitions: Array<{ from: number; symbol: string; to: number }>
  ): void {
    const statesCopy = new Map<number, NFAState>();
    for (const [id, state] of states) {
      const transitionsCopy = new Map<string, Set<number>>();
      for (const [symbol, targets] of state.transitions) {
        transitionsCopy.set(symbol, new Set(targets));
      }
      statesCopy.set(id, { ...state, transitions: transitionsCopy });
    }

    this.buildSteps.push({
      step: this.stepCounter++,
      description,
      states: statesCopy,
      start,
      accept,
      newStateIds: [...newStateIds],
      newTransitions: [...newTransitions]
    });
  }

  private buildFromAST(node: ASTNode): {
    start: number;
    accept: number;
    states: Map<number, NFAState>;
    alphabet: Set<string>;
  } {
    const states = new Map<number, NFAState>();
    const alphabet = new Set<string>();

    const createState = (isAccept: boolean = false, label?: string): number => {
      const state = this.createState(isAccept, label);
      states.set(state.id, state);
      return state.id;
    };

    const addTransition = (from: number, symbol: string, to: number): void => {
      this.addTransition(states, from, symbol, to);
      if (symbol !== 'ε') {
        alphabet.add(symbol);
      }
    };

    const build = (node: ASTNode): { start: number; accept: number; newStates: number[]; newTransitions: Array<{ from: number; symbol: string; to: number }> } => {
      const newStates: number[] = [];
      const newTransitions: Array<{ from: number; symbol: string; to: number }> = [];

      const recordState = (id: number) => {
        newStates.push(id);
      };

      const recordTransition = (from: number, symbol: string, to: number) => {
        newTransitions.push({ from, symbol, to });
      };

      switch (node.type) {
        case 'literal': {
          const start = createState(false, `读取 ${node.value}`);
          const accept = createState(false, '完成');
          recordState(start);
          recordState(accept);
          addTransition(start, node.value!, accept);
          recordTransition(start, node.value!, accept);

          this.addBuildStep(`创建字面量 "${node.value}" 的 NFA`, states, start, accept, newStates, newTransitions);
          return { start, accept, newStates, newTransitions };
        }

        case 'dot': {
          const start = createState(false, '读取任意字符');
          const accept = createState(false, '完成');
          recordState(start);
          recordState(accept);
          addTransition(start, '.', accept);
          recordTransition(start, '.', accept);

          this.addBuildStep('创建通配符 "." 的 NFA', states, start, accept, newStates, newTransitions);
          return { start, accept, newStates, newTransitions };
        }

        case 'charClass': {
          const start = createState(false, `字符类 ${node.negated ? '[^...]' : '[...]'}`);
          const accept = createState(false, '完成');
          recordState(start);
          recordState(accept);

          for (const range of node.ranges!) {
            if (range.start === range.end) {
              addTransition(start, range.start, accept);
              recordTransition(start, range.start, accept);
              alphabet.add(range.start);
            } else {
              const startCode = range.start.charCodeAt(0);
              const endCode = range.end.charCodeAt(0);
              for (let code = startCode; code <= endCode; code++) {
                const ch = String.fromCharCode(code);
                addTransition(start, ch, accept);
                recordTransition(start, ch, accept);
                alphabet.add(ch);
              }
            }
          }

          this.addBuildStep(`创建字符类的 NFA`, states, start, accept, newStates, newTransitions);
          return { start, accept, newStates, newTransitions };
        }

        case 'concat': {
          if (!node.children || node.children.length === 0) {
            const start = createState();
            const accept = createState(true);
            recordState(start);
            recordState(accept);
            return { start, accept, newStates, newTransitions };
          }

          let result = build(node.children[0]);
          let overallStart = result.start;
          let overallAccept = result.accept;

          for (let i = 1; i < node.children!.length; i++) {
            const next = build(node.children![i]);
            addTransition(overallAccept, 'ε', next.start);
            recordTransition(overallAccept, 'ε', next.start);
            overallAccept = next.accept;
            result.newStates.push(...next.newStates);
            result.newTransitions.push(...next.newTransitions, { from: result.accept, symbol: 'ε', to: next.start });
          }

          this.addBuildStep('连接 NFA 片段', states, overallStart, overallAccept, result.newStates, result.newTransitions);
          return { start: overallStart, accept: overallAccept, newStates: result.newStates, newTransitions: result.newTransitions };
        }

        case 'alternate': {
          const left = build(node.children![0]);
          const right = build(node.children![1]);

          const start = createState(false, '分支开始');
          const accept = createState(false, '分支结束');
          recordState(start);
          recordState(accept);

          addTransition(start, 'ε', left.start);
          addTransition(start, 'ε', right.start);
          addTransition(left.accept, 'ε', accept);
          addTransition(right.accept, 'ε', accept);

          recordTransition(start, 'ε', left.start);
          recordTransition(start, 'ε', right.start);
          recordTransition(left.accept, 'ε', accept);
          recordTransition(right.accept, 'ε', accept);

          const allNewStates = [start, accept, ...left.newStates, ...right.newStates];
          const allNewTransitions = [
            ...left.newTransitions,
            ...right.newTransitions,
            { from: start, symbol: 'ε', to: left.start },
            { from: start, symbol: 'ε', to: right.start },
            { from: left.accept, symbol: 'ε', to: accept },
            { from: right.accept, symbol: 'ε', to: accept }
          ];

          this.addBuildStep('创建分支 (|) 的 NFA', states, start, accept, allNewStates, allNewTransitions);
          return { start, accept, newStates: allNewStates, newTransitions: allNewTransitions };
        }

        case 'star': {
          const inner = build(node.children![0]);

          const start = createState(false, '* 开始');
          const accept = createState(false, '* 结束');
          recordState(start);
          recordState(accept);

          addTransition(start, 'ε', inner.start);
          addTransition(start, 'ε', accept);
          addTransition(inner.accept, 'ε', inner.start);
          addTransition(inner.accept, 'ε', accept);

          recordTransition(start, 'ε', inner.start);
          recordTransition(start, 'ε', accept);
          recordTransition(inner.accept, 'ε', inner.start);
          recordTransition(inner.accept, 'ε', accept);

          const allNewStates = [start, accept, ...inner.newStates];
          const allNewTransitions = [
            ...inner.newTransitions,
            { from: start, symbol: 'ε', to: inner.start },
            { from: start, symbol: 'ε', to: accept },
            { from: inner.accept, symbol: 'ε', to: inner.start },
            { from: inner.accept, symbol: 'ε', to: accept }
          ];

          this.addBuildStep('创建 Kleene 星 (*) 的 NFA', states, start, accept, allNewStates, allNewTransitions);
          return { start, accept, newStates: allNewStates, newTransitions: allNewTransitions };
        }

        case 'plus': {
          const inner = build(node.children![0]);

          const accept = createState(false, '+ 结束');
          recordState(accept);

          addTransition(inner.accept, 'ε', inner.start);
          addTransition(inner.accept, 'ε', accept);

          recordTransition(inner.accept, 'ε', inner.start);
          recordTransition(inner.accept, 'ε', accept);

          const allNewStates = [...inner.newStates, accept];
          const allNewTransitions = [
            ...inner.newTransitions,
            { from: inner.accept, symbol: 'ε', to: inner.start },
            { from: inner.accept, symbol: 'ε', to: accept }
          ];

          this.addBuildStep('创建正闭包 (+) 的 NFA', states, inner.start, accept, allNewStates, allNewTransitions);
          return { start: inner.start, accept, newStates: allNewStates, newTransitions: allNewTransitions };
        }

        case 'question': {
          const inner = build(node.children![0]);

          const start = createState(false, '? 开始');
          const accept = createState(false, '? 结束');
          recordState(start);
          recordState(accept);

          addTransition(start, 'ε', inner.start);
          addTransition(start, 'ε', accept);
          addTransition(inner.accept, 'ε', accept);

          recordTransition(start, 'ε', inner.start);
          recordTransition(start, 'ε', accept);
          recordTransition(inner.accept, 'ε', accept);

          const allNewStates = [start, accept, ...inner.newStates];
          const allNewTransitions = [
            ...inner.newTransitions,
            { from: start, symbol: 'ε', to: inner.start },
            { from: start, symbol: 'ε', to: accept },
            { from: inner.accept, symbol: 'ε', to: accept }
          ];

          this.addBuildStep('创建可选 (?) 的 NFA', states, start, accept, allNewStates, allNewTransitions);
          return { start, accept, newStates: allNewStates, newTransitions: allNewTransitions };
        }

        case 'repeat': {
          const min = node.min || 0;
          const max = node.max || min;

          if (max === Infinity) {
            const inner = build(node.children![0]);
            const startStates: number[] = [];
            const acceptStates: number[] = [];

            for (let i = 0; i < min; i++) {
              const part = build(node.children![0]);
              if (i === 0) {
                startStates.push(part.start);
              }
              acceptStates.push(part.accept);
            }

            const starStart = createState(false, '重复开始');
            const starAccept = createState(false, '重复结束');
            recordState(starStart);
            recordState(starAccept);

            addTransition(starStart, 'ε', inner.start);
            addTransition(starStart, 'ε', starAccept);
            addTransition(inner.accept, 'ε', inner.start);
            addTransition(inner.accept, 'ε', starAccept);

            const allNewStates = [...startStates, ...acceptStates, starStart, starAccept, ...inner.newStates];
            const allNewTransitions = [...inner.newTransitions];

            this.addBuildStep(`创建重复 {${min},} 的 NFA`, states, min > 0 ? startStates[0] : starStart, starAccept, allNewStates, allNewTransitions);
            return { start: min > 0 ? startStates[0] : starStart, accept: starAccept, newStates: allNewStates, newTransitions: allNewTransitions };
          }

          const parts: Array<{ start: number; accept: number; newStates: number[]; newTransitions: Array<{ from: number; symbol: string; to: number }> }> = [];
          for (let i = 0; i < max; i++) {
            parts.push(build(node.children![0]));
          }

          let overallStart = parts[0].start;
          let overallAccept = parts[0].accept;
          const allNewStates: number[] = [...parts[0].newStates];
          const allNewTransitions: Array<{ from: number; symbol: string; to: number }> = [...parts[0].newTransitions];

          for (let i = 1; i < max; i++) {
            const optStart = createState(false, `可选 ${i}`);
            const optAccept = createState(false, `可选结束 ${i}`);
            recordState(optStart);
            recordState(optAccept);

            addTransition(overallAccept, 'ε', parts[i].start);
            addTransition(overallAccept, 'ε', optAccept);
            addTransition(parts[i].accept, 'ε', optAccept);

            recordTransition(overallAccept, 'ε', parts[i].start);
            recordTransition(overallAccept, 'ε', optAccept);
            recordTransition(parts[i].accept, 'ε', optAccept);

            overallAccept = optAccept;
            allNewStates.push(optStart, optAccept, ...parts[i].newStates);
            allNewTransitions.push(
              { from: parts[i - 1].accept, symbol: 'ε', to: parts[i].start },
              { from: parts[i - 1].accept, symbol: 'ε', to: optAccept },
              { from: parts[i].accept, symbol: 'ε', to: optAccept },
              ...parts[i].newTransitions
            );
          }

          this.addBuildStep(`创建重复 {${min},${max}} 的 NFA`, states, overallStart, overallAccept, allNewStates, allNewTransitions);
          return { start: overallStart, accept: overallAccept, newStates: allNewStates, newTransitions: allNewTransitions };
        }

        case 'group': {
          const inner = build(node.children![0]);
          this.addBuildStep('创建分组 (...) 的 NFA', states, inner.start, inner.accept, inner.newStates, inner.newTransitions);
          return inner;
        }

        default:
          throw new Error(`Unknown AST node type: ${node.type}`);
      }
    };

    const result = build(node);

    for (const [, state] of states) {
      if (state.id === result.accept) {
        state.isAccept = true;
      }
    }

    return {
      start: result.start,
      accept: result.accept,
      states,
      alphabet
    };
  }

  epsilonClosure(nfa: NFA, stateIds: Set<number>): { closure: Set<number>; steps: Array<{ fromState: number; visitedStates: Set<number>; newVisited: Set<number>; wave: number }> } {
    const closure = new Set(stateIds);
    const steps: Array<{ fromState: number; visitedStates: Set<number>; newVisited: Set<number>; wave: number }> = [];
    const stack: number[] = [...stateIds];
    let wave = 0;

    while (stack.length > 0) {
      const current = stack.pop()!;
      const state = nfa.states.get(current);
      if (!state) continue;

      const epsilonTargets = state.transitions.get('ε');
      if (epsilonTargets) {
        const newVisited = new Set<number>();
        for (const target of epsilonTargets) {
          if (!closure.has(target)) {
            closure.add(target);
            stack.push(target);
            newVisited.add(target);
          }
        }
        if (newVisited.size > 0) {
          steps.push({
            fromState: current,
            visitedStates: new Set(closure),
            newVisited,
            wave: wave++
          });
        }
      }
    }

    return { closure, steps };
  }
}
