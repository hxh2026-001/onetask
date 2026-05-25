import { Token, TokenType, LexerResult, LexerError } from '../types/lexer';

const KEYWORDS = new Set([
  'var', 'let', 'const', 'fn', 'func', 'function', 'return', 'if', 'else',
  'while', 'for', 'do', 'break', 'continue', 'true', 'false', 'null',
  'int', 'float', 'string', 'bool', 'void', 'any', 'type', 'struct',
  'closure', 'lambda', 'in', 'of', 'new', 'delete', 'this', 'super',
]);

const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '^', '&', '|', '~', '!', '=', '<', '>',
  '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||',
  '++', '--', '->', '::', '..', '<<', '>>',
]);

const DELIMITERS = new Set([
  '(', ')', '{', '}', '[', ']', ',', ';', ':', '.', '?', '@', '#', '$',
]);

export class Lexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];
  private trackTokens: boolean = true;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): LexerResult {
    this.tokens = [];
    this.errors = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (this.pos < this.input.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.input.length) break;

      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
      start: this.pos,
      end: this.pos,
    });

    return {
      tokens: this.tokens,
      errors: this.errors,
    };
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else if (ch === '\n') {
        this.tokens.push({
          type: TokenType.NEWLINE,
          value: '\\n',
          line: this.line,
          column: this.column,
          start: this.pos,
          end: this.pos + 1,
        });
        this.advance();
      } else if (ch === '/' && this.input[this.pos + 1] === '/') {
        this.skipLineComment();
      } else if (ch === '/' && this.input[this.pos + 1] === '*') {
        this.skipBlockComment();
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;

    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      this.advance();
    }

    if (this.trackTokens) {
      this.tokens.push({
        type: TokenType.COMMENT,
        value: this.input.substring(startPos, this.pos),
        line: startLine,
        column: startCol,
        start: startPos,
        end: this.pos,
      });
    }
  }

  private skipBlockComment(): void {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;

    this.advance();
    this.advance();

    while (this.pos < this.input.length) {
      if (this.input[this.pos] === '*' && this.input[this.pos + 1] === '/') {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }

    if (this.trackTokens) {
      this.tokens.push({
        type: TokenType.COMMENT,
        value: this.input.substring(startPos, this.pos),
        line: startLine,
        column: startCol,
        start: startPos,
        end: this.pos,
      });
    }
  }

  private nextToken(): Token | null {
    const ch = this.input[this.pos];
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;

    if (/[0-9]/.test(ch)) {
      return this.readNumber(startLine, startCol, startPos);
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      return this.readString(ch, startLine, startCol, startPos);
    }

    if (/[a-zA-Z_]/.test(ch)) {
      return this.readIdentifier(startLine, startCol, startPos);
    }

    if (DELIMITERS.has(ch)) {
      this.advance();
      return {
        type: TokenType.DELIMITER,
        value: ch,
        line: startLine,
        column: startCol,
        start: startPos,
        end: this.pos,
      };
    }

    const opToken = this.tryReadOperator(startLine, startCol, startPos);
    if (opToken) return opToken;

    this.errors.push({
      line: startLine,
      column: startCol,
      message: `非法字符 '${ch}'`,
      token: ch,
    });

    this.advance();

    return {
      type: TokenType.ILLEGAL,
      value: ch,
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos,
    };
  }

  private readNumber(startLine: number, startCol: number, startPos: number): Token {
    let hasDot = false;
    let isHex = false;

    if (this.input[this.pos] === '0' && (this.input[this.pos + 1] === 'x' || this.input[this.pos + 1] === 'X')) {
      isHex = true;
      this.advance();
      this.advance();
      while (this.pos < this.input.length && /[0-9a-fA-F]/.test(this.input[this.pos])) {
        this.advance();
      }
    } else {
      while (this.pos < this.input.length) {
        const ch = this.input[this.pos];
        if (/[0-9]/.test(ch)) {
          this.advance();
        } else if (ch === '.' && !hasDot) {
          hasDot = true;
          this.advance();
        } else {
          break;
        }
      }
    }

    if (!isHex && /[a-zA-Z_]/.test(this.input[this.pos] || '')) {
      this.errors.push({
        line: this.line,
        column: this.column,
        message: '数字格式错误',
        token: this.input.substring(startPos, this.pos + 1),
      });
    }

    return {
      type: TokenType.NUMBER,
      value: this.input.substring(startPos, this.pos),
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos,
    };
  }

  private readString(quote: string, startLine: number, startCol: number, startPos: number): Token {
    this.advance();

    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === '\\') {
        this.advance();
        this.advance();
      } else if (this.input[this.pos] === '\n') {
        this.errors.push({
          line: startLine,
          column: startCol,
          message: '字符串未闭合',
          token: this.input.substring(startPos, this.pos),
        });
        break;
      } else {
        this.advance();
      }
    }

    if (this.pos < this.input.length && this.input[this.pos] === quote) {
      this.advance();
    } else {
      this.errors.push({
        line: startLine,
        column: startCol,
        message: '字符串未闭合',
        token: this.input.substring(startPos, this.pos),
      });
    }

    return {
      type: TokenType.STRING,
      value: this.input.substring(startPos, this.pos),
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos,
    };
  }

  private readIdentifier(startLine: number, startCol: number, startPos: number): Token {
    while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
      this.advance();
    }

    const value = this.input.substring(startPos, this.pos);
    let type: TokenType;

    if (KEYWORDS.has(value)) {
      type = TokenType.KEYWORD;
    } else if (value === 'true' || value === 'false') {
      type = TokenType.BOOLEAN;
    } else {
      type = TokenType.IDENTIFIER;
    }

    return {
      type,
      value,
      line: startLine,
      column: startCol,
      start: startPos,
      end: this.pos,
    };
  }

  private tryReadOperator(startLine: number, startCol: number, startPos: number): Token | null {
    for (let len = 3; len >= 1; len--) {
      if (this.pos + len <= this.input.length) {
        const op = this.input.substring(this.pos, this.pos + len);
        if (OPERATORS.has(op)) {
          for (let i = 0; i < len; i++) this.advance();
          return {
            type: TokenType.OPERATOR,
            value: op,
            line: startLine,
            column: startCol,
            start: startPos,
            end: this.pos,
          };
        }
      }
    }
    return null;
  }

  private advance(): void {
    if (this.input[this.pos] === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
  }
}
