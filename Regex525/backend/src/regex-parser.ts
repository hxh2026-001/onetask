import { ASTNode } from './types.js';

export class RegexParser {
  private input: string;
  private pos: number;
  private stateIdCounter: number;

  constructor() {
    this.input = '';
    this.pos = 0;
    this.stateIdCounter = 0;
  }

  parse(pattern: string): ASTNode {
    this.input = pattern;
    this.pos = 0;
    const ast = this.parseAlternation();
    if (this.pos < this.input.length) {
      throw new Error(`Unexpected character at position ${this.pos}: ${this.input[this.pos]}`);
    }
    return ast;
  }

  private peek(): string | null {
    return this.pos < this.input.length ? this.input[this.pos] : null;
  }

  private advance(): string {
    return this.input[this.pos++];
  }

  private parseAlternation(): ASTNode {
    const left = this.parseConcat();
    if (this.peek() === '|') {
      this.advance();
      const right = this.parseAlternation();
      return {
        type: 'alternate',
        children: [left, right]
      };
    }
    return left;
  }

  private parseConcat(): ASTNode {
    const parts: ASTNode[] = [];
    parts.push(this.parseQuantifier());
    
    while (this.pos < this.input.length) {
      const c = this.peek();
      if (c === '|' || c === ')') {
        break;
      }
      parts.push(this.parseQuantifier());
    }
    
    if (parts.length === 1) {
      return parts[0];
    }
    return {
      type: 'concat',
      children: parts
    };
  }

  private parseQuantifier(): ASTNode {
    const atom = this.parseAtom();
    
    if (this.pos < this.input.length) {
      const c = this.peek();
      if (c === '*') {
        this.advance();
        return { type: 'star', children: [atom] };
      } else if (c === '+') {
        this.advance();
        return { type: 'plus', children: [atom] };
      } else if (c === '?') {
        this.advance();
        return { type: 'question', children: [atom] };
      } else if (c === '{') {
        return this.parseRepeat(atom);
      }
    }
    return atom;
  }

  private parseRepeat(atom: ASTNode): ASTNode {
    this.advance();
    let min = 0;
    let max: number | undefined;
    let numStr = '';
    
    while (this.pos < this.input.length && this.peek() !== ',' && this.peek() !== '}') {
      numStr += this.advance();
    }
    min = parseInt(numStr) || 0;
    
    if (this.peek() === ',') {
      this.advance();
      if (this.peek() === '}') {
        max = Infinity;
      } else {
        numStr = '';
        while (this.pos < this.input.length && this.peek() !== '}') {
          numStr += this.advance();
        }
        max = parseInt(numStr) || Infinity;
      }
    } else {
      max = min;
    }
    
    if (this.peek() === '}') {
      this.advance();
    }
    
    return {
      type: 'repeat',
      min,
      max,
      children: [atom]
    };
  }

  private parseAtom(): ASTNode {
    const c = this.peek();
    
    if (c === null) {
      throw new Error('Unexpected end of pattern');
    }
    
    if (c === '(') {
      this.advance();
      const inner = this.parseAlternation();
      if (this.peek() === ')') {
        this.advance();
      }
      return { type: 'group', children: [inner] };
    }
    
    if (c === '[') {
      return this.parseCharClass();
    }
    
    if (c === '.') {
      this.advance();
      return { type: 'dot' };
    }
    
    if (c === '\\') {
      this.advance();
      const escaped = this.advance();
      return { type: 'literal', value: escaped };
    }
    
    this.advance();
    return { type: 'literal', value: c };
  }

  private parseCharClass(): ASTNode {
    this.advance();
    let negated = false;
    const ranges: Array<{ start: string; end: string }> = [];
    
    if (this.peek() === '^') {
      negated = true;
      this.advance();
    }
    
    while (this.pos < this.input.length && this.peek() !== ']') {
      const start = this.advance();
      if (this.peek() === '-' && this.input[this.pos + 1] !== ']') {
        this.advance();
        const end = this.advance();
        ranges.push({ start, end });
      } else {
        ranges.push({ start, end: start });
      }
    }
    
    if (this.peek() === ']') {
      this.advance();
    }
    
    return {
      type: 'charClass',
      negated,
      ranges
    };
  }

  getNextStateId(): number {
    return this.stateIdCounter++;
  }

  resetStateCounter(): void {
    this.stateIdCounter = 0;
  }
}
