export interface State {
  id: number;
  isAccept: boolean;
  transitions: Transition[];
}

export interface Transition {
  symbol: string | null;
  target: number;
}

export interface NFAResult {
  states: State[];
  startState: number;
  acceptStates: number[];
}

export interface MatchResult {
  match: boolean;
  path: { state: number; char: string; index: number }[];
  backtrackCount: number;
  time: number;
  trapDetected: boolean;
  trapType: string | null;
}

export class NFA {
  private states: State[] = [];
  private startState: number = 0;
  private stateIdCounter: number = 0;

  constructor() {
    this.createState(false);
  }

  private createState(isAccept: boolean): number {
    const id = this.stateIdCounter++;
    this.states.push({ id, isAccept, transitions: [] });
    return id;
  }

  private addTransition(from: number, symbol: string | null, to: number): void {
    this.states[from].transitions.push({ symbol, target: to });
  }

  private concat(nfa2: NFA): void {
    const offset = this.stateIdCounter;
    const acceptState = this.states.findIndex(s => s.isAccept);
    if (acceptState !== -1) {
      this.states[acceptState].isAccept = false;
      this.addTransition(acceptState, null, offset);
    }
    nfa2.states.forEach(state => {
      this.states.push({
        ...state,
        id: state.id + offset,
        transitions: state.transitions.map(t => ({ ...t, target: t.target + offset }))
      });
    });
    this.stateIdCounter += nfa2.stateIdCounter;
  }

  private union(nfa2: NFA): void {
    const newStart = this.createState(false);
    this.addTransition(newStart, null, this.startState);
    
    const offset = this.stateIdCounter;
    nfa2.states.forEach(state => {
      this.states.push({
        ...state,
        id: state.id + offset,
        transitions: state.transitions.map(t => ({ ...t, target: t.target + offset }))
      });
    });
    this.addTransition(newStart, null, offset);
    
    const accept1 = this.states.findIndex(s => s.isAccept);
    const accept2 = offset + nfa2.states.findIndex(s => s.isAccept);
    
    const newAccept = this.createState(true);
    if (accept1 !== -1) {
      this.states[accept1].isAccept = false;
      this.addTransition(accept1, null, newAccept);
    }
    if (accept2 !== -1) {
      this.states[accept2].isAccept = false;
      this.addTransition(accept2, null, newAccept);
    }
    
    this.startState = newStart;
    this.stateIdCounter += nfa2.stateIdCounter;
  }

  private star(): void {
    const newStart = this.createState(false);
    const acceptState = this.states.findIndex(s => s.isAccept);
    
    if (acceptState === -1) {
      this.states[newStart].isAccept = true;
      this.startState = newStart;
      return;
    }
    
    this.states[acceptState].isAccept = false;
    this.addTransition(acceptState, null, this.startState);
    
    const newAccept = this.createState(true);
    this.addTransition(acceptState, null, newAccept);
    this.addTransition(newStart, null, this.startState);
    this.addTransition(newStart, null, newAccept);
    
    this.startState = newStart;
  }

  private plus(): void {
    const acceptState = this.states.findIndex(s => s.isAccept);
    if (acceptState !== -1) {
      this.states[acceptState].isAccept = false;
      this.addTransition(acceptState, null, this.startState);
    }
    this.createState(true);
  }

  private optional(): void {
    const acceptState = this.states.findIndex(s => s.isAccept);
    const newStart = this.createState(false);
    this.addTransition(newStart, null, this.startState);
    if (acceptState === -1) {
      this.states[newStart].isAccept = true;
    } else {
      this.addTransition(newStart, null, acceptState);
    }
    this.startState = newStart;
  }

  private repeat(min: number, max: number | null): void {
    for (let i = 1; i < min; i++) {
      const copy = this.clone();
      this.concat(copy);
    }
    
    if (max === null || max > min) {
      const loopPart = this.clone();
      loopPart.star();
      this.concat(loopPart);
    }
  }

  private clone(): NFA {
    const clone = new NFA();
    clone.states = JSON.parse(JSON.stringify(this.states));
    clone.startState = this.startState;
    clone.stateIdCounter = this.stateIdCounter;
    return clone;
  }

  public static fromRegex(pattern: string): NFAResult {
    const nfa = new NFA();
    nfa.parseRegex(pattern);
    return {
      states: nfa.states,
      startState: nfa.startState,
      acceptStates: nfa.states
        .map((s, i) => s.isAccept ? i : -1)
        .filter(i => i !== -1)
    };
  }

  private parseRegex(pattern: string): void {
    let i = 0;
    const nfaStack: NFA[] = [this];
    
    while (i < pattern.length) {
      const char = pattern[i];
      
      if (char === '\\') {
        i++;
        if (i < pattern.length) {
          const escaped = pattern[i];
          const literalNfa = this.createLiteralNfa(escaped);
          this.concatToTop(nfaStack, literalNfa);
        }
        i++;
      } else if (char === '[') {
        let charClass = '';
        i++;
        const negated = pattern[i] === '^';
        if (negated) i++;
        
        while (i < pattern.length && pattern[i] !== ']') {
          if (pattern[i] === '\\') {
            i++;
            charClass += pattern[i];
          } else {
            charClass += pattern[i];
          }
          i++;
        }
        i++;
        
        const charClassNfa = this.createCharClassNfa(charClass, negated);
        this.concatToTop(nfaStack, charClassNfa);
      } else if (char === '(') {
        i++;
        const groupNfa = new NFA();
        nfaStack.push(groupNfa);
      } else if (char === ')') {
        if (nfaStack.length > 1) {
          const groupNfa = nfaStack.pop()!;
          this.concatToTop(nfaStack, groupNfa);
        }
        i++;
      } else if (char === '|') {
        if (nfaStack.length > 1) {
          const left = nfaStack.pop()!;
          const right = new NFA();
          nfaStack.push(right);
          nfaStack.push(left);
        }
        i++;
      } else if (char === '*') {
        this.applyOperator(nfaStack, n => n.star());
        i++;
      } else if (char === '+') {
        this.applyOperator(nfaStack, n => n.plus());
        i++;
      } else if (char === '?') {
        this.applyOperator(nfaStack, n => n.optional());
        i++;
      } else if (char === '{') {
        i++;
        let minStr = '';
        while (i < pattern.length && pattern[i] !== ',' && pattern[i] !== '}') {
          minStr += pattern[i];
          i++;
        }
        const min = parseInt(minStr, 10);
        
        let max: number | null = null;
        if (pattern[i] === ',') {
          i++;
          let maxStr = '';
          while (i < pattern.length && pattern[i] !== '}') {
            maxStr += pattern[i];
            i++;
          }
          if (maxStr !== '') {
            max = parseInt(maxStr, 10);
          }
        }
        i++;
        
        this.applyOperator(nfaStack, n => n.repeat(min, max));
      } else if (char === '.') {
        const dotNfa = this.createCharClassNfa('\u0000-\uFFFF', false);
        this.concatToTop(nfaStack, dotNfa);
        i++;
      } else if (char === '^' || char === '$') {
        i++;
      } else {
        const literalNfa = this.createLiteralNfa(char);
        this.concatToTop(nfaStack, literalNfa);
        i++;
      }
    }
    
    while (nfaStack.length > 1) {
      const top = nfaStack.pop()!;
      if (nfaStack.length > 0) {
        const next = nfaStack.pop()!;
        next.union(top);
        nfaStack.push(next);
      }
    }
  }

  private concatToTop(stack: NFA[], nfa: NFA): void {
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    
    if (top.states.length === 1 && !top.states[0].isAccept && top.states[0].transitions.length === 0) {
      const acceptState = nfa.states.findIndex(s => s.isAccept);
      top.states = nfa.states.map((s, i) => ({
        ...s,
        transitions: s.transitions.map(t => ({
          ...t,
          target: t.target + (acceptState === i ? 0 : 0)
        }))
      }));
      top.startState = nfa.startState;
      top.stateIdCounter = nfa.stateIdCounter;
    } else {
      top.concat(nfa);
    }
  }

  private applyOperator(stack: NFA[], op: (nfa: NFA) => void): void {
    if (stack.length > 0) {
      op(stack[stack.length - 1]);
    }
  }

  private createLiteralNfa(char: string): NFA {
    const nfa = new NFA();
    nfa.states[0].isAccept = false;
    const acceptState = nfa.createState(true);
    nfa.addTransition(0, char, acceptState);
    return nfa;
  }

  private createCharClassNfa(chars: string, negated: boolean): NFA {
    const nfa = new NFA();
    nfa.states[0].isAccept = false;
    const acceptState = nfa.createState(true);
    
    const expanded = this.expandCharClass(chars);
    
    if (negated) {
      nfa.addTransition(0, '\u0000', acceptState);
    } else {
      expanded.forEach(c => {
        nfa.addTransition(0, c, acceptState);
      });
    }
    
    return nfa;
  }

  private expandCharClass(chars: string): string[] {
    const result: string[] = [];
    let i = 0;
    
    while (i < chars.length) {
      if (i + 2 < chars.length && chars[i + 1] === '-') {
        const start = chars.charCodeAt(i);
        const end = chars.charCodeAt(i + 2);
        for (let c = start; c <= end; c++) {
          result.push(String.fromCharCode(c));
        }
        i += 3;
      } else {
        result.push(chars[i]);
        i++;
      }
    }
    
    return result;
  }

  public static simulate(nfa: NFAResult, input: string, timeout: number = 10000): MatchResult {
    const startTime = Date.now();
    const path: { state: number; char: string; index: number }[] = [];
    let backtrackCount = 0;
    let trapDetected = false;
    let trapType: string | null = null;
    
    const epsilonClosure = (stateId: number): Set<number> => {
      const closure = new Set<number>();
      const stack = [stateId];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (closure.has(current)) continue;
        closure.add(current);
        
        nfa.states[current].transitions.forEach(t => {
          if (t.symbol === null && !closure.has(t.target)) {
            stack.push(t.target);
          }
        });
      }
      
      return closure;
    };
    
    const dfs = (stateId: number, inputIndex: number, visited: Set<string>): boolean => {
      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        trapDetected = true;
        trapType = 'timeout';
        return false;
      }
      
      const key = `${stateId},${inputIndex}`;
      if (visited.has(key)) {
        backtrackCount++;
        if (backtrackCount > 100000) {
          trapDetected = true;
          trapType = 'exponential_backtracking';
          return false;
        }
        return false;
      }
      visited.add(key);
      
      const closure = epsilonClosure(stateId);
      
      for (const state of closure) {
        if (state >= nfa.states.length) continue;
        if (nfa.states[state].isAccept && inputIndex === input.length) {
          path.push({ state, char: '', index: inputIndex });
          return true;
        }
      }
      
      if (inputIndex < input.length) {
        const currentChar = input[inputIndex];
        
        for (const state of closure) {
          if (state >= nfa.states.length) continue;
          
          for (const transition of nfa.states[state].transitions) {
            if (transition.symbol !== null && transition.symbol === currentChar) {
              path.push({ state, char: currentChar, index: inputIndex });
              
              if (dfs(transition.target, inputIndex + 1, new Set(visited))) {
                return true;
              }
              
              path.pop();
              backtrackCount++;
              
              if (backtrackCount > 100000) {
                trapDetected = true;
                trapType = 'exponential_backtracking';
                return false;
              }
            }
          }
        }
      }
      
      return false;
    };
    
    const visited = new Set<string>();
    const result = dfs(nfa.startState, 0, visited);
    const elapsed = Date.now() - startTime;
    
    return {
      match: result,
      path,
      backtrackCount,
      time: elapsed,
      trapDetected,
      trapType
    };
  }

  public static analyzeTrap(pattern: string): { detected: boolean; type: string; description: string } {
    if (pattern.includes('(.*)+') || pattern.includes('(.*)*') || pattern.includes('(.+)+')) {
      return {
        detected: true,
        type: 'catastrophic_backtracking',
        description: '检测到嵌套量词模式，可能导致灾难性回溯'
      };
    }
    
    if (pattern.includes('(?=') && pattern.includes('(?<=') && pattern.includes(')*')) {
      return {
        detected: true,
        type: 'nested_lookahead',
        description: '检测到零宽断言嵌套，可能导致逻辑死锁'
      };
    }
    
    if (pattern.includes('[^') && pattern.includes('{') && pattern.includes('}')) {
      return {
        detected: true,
        type: 'charset_explosion',
        description: '检测到字符组补集与量词组合，可能导致状态爆炸'
      };
    }
    
    if (pattern.includes('\\b') && pattern.includes('\\B') && pattern.includes('{')) {
      return {
        detected: true,
        type: 'unicode_boundary',
        description: '检测到Unicode边界陷阱，可能导致匹配异常'
      };
    }
    
    return {
      detected: false,
      type: 'none',
      description: '未检测到已知陷阱模式'
    };
  }
}
