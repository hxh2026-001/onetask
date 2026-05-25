import { Token, TokenType } from '../types/lexer';
import { ASTNode, ASTNodeType, ParserResult, ParserError } from '../types/ast';

const MAX_RECURSION_DEPTH = 50;
const LEFT_RECURSION_THRESHOLD = 30;
const MAX_STACK_TRACE_SIZE = 50;

export class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private errors: ParserError[] = [];
  private recursionDepth: number = 0;
  private recursionStack: string[] = [];
  private infiniteLoopDetected: boolean = false;
  private loopStackTrace: string[] = [];
  private callCounts: Map<string, number> = new Map();

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t =>
      t.type !== TokenType.NEWLINE &&
      t.type !== TokenType.COMMENT &&
      t.type !== TokenType.WHITESPACE
    );
  }

  parse(): ParserResult {
    this.errors = [];
    this.pos = 0;
    this.recursionDepth = 0;
    this.recursionStack = [];
    this.infiniteLoopDetected = false;
    this.loopStackTrace = [];
    this.callCounts.clear();

    const ast = this.parseProgram();

    return {
      ast,
      errors: this.errors,
      infiniteLoopDetected: this.infiniteLoopDetected,
      loopStackTrace: this.loopStackTrace,
    };
  }

  private trackRecursion(name: string): void {
    this.recursionDepth++;
    this.recursionStack.push(`${name}@${this.currentToken()?.line}:${this.currentToken()?.column}`);

    if (this.recursionStack.length > MAX_STACK_TRACE_SIZE) {
      this.recursionStack = this.recursionStack.slice(-MAX_STACK_TRACE_SIZE);
    }

    const count = (this.callCounts.get(name) || 0) + 1;
    this.callCounts.set(name, count);

    if (this.recursionDepth > MAX_RECURSION_DEPTH) {
      this.infiniteLoopDetected = true;
      this.loopStackTrace = [...this.recursionStack];
      throw new Error(`左递归死循环: ${name} 递归深度超过限制 ${MAX_RECURSION_DEPTH}`);
    }

    if (count > LEFT_RECURSION_THRESHOLD && this.recursionDepth > 10) {
      this.infiniteLoopDetected = true;
      this.loopStackTrace = [...this.recursionStack];
      throw new Error(`左递归文法导致解析器死循环: ${name} 调用次数过多`);
    }
  }

  private untrackRecursion(): void {
    this.recursionDepth--;
    this.recursionStack.pop();
  }

  private createNode(type: ASTNodeType, token: Token | null, extra: Partial<ASTNode> = {}): ASTNode {
    return {
      type,
      line: token?.line || 0,
      column: token?.column || 0,
      children: [],
      ...extra,
    };
  }

  private currentToken(): Token | null {
    if (this.pos >= this.tokens.length) return null;
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: TokenType, value?: string): Token | null {
    const token = this.currentToken();
    if (!token || token.type !== type || (value && token.value !== value)) {
      this.errors.push({
        line: token?.line || 0,
        column: token?.column || 0,
        message: `期望 ${value || type}, 得到 ${token?.value || 'EOF'}`,
        expected: value || type,
        found: token?.value || 'EOF',
      });
      return null;
    }
    return this.consume();
  }

  private match(type: TokenType, value?: string): boolean {
    const token = this.currentToken();
    if (!token) return false;
    return token.type === type && (!value || token.value === value);
  }

  private skipNewlines(): void {
    while (this.currentToken()?.type === TokenType.NEWLINE) {
      this.consume();
    }
  }

  private parseProgram(): ASTNode | null {
    this.trackRecursion('Program');
    try {
      const token = this.currentToken();
      const program = this.createNode(ASTNodeType.PROGRAM, token, {
        body: [],
        children: [],
      });

      this.skipNewlines();

      while (this.currentToken() && this.currentToken()!.type !== TokenType.EOF) {
        this.skipNewlines();
        const stmt = this.parseStatement();
        if (stmt && program.body && Array.isArray(program.body)) {
          (program.body as ASTNode[]).push(stmt);
          program.children!.push(stmt);
        }
        this.skipNewlines();
      }

      this.untrackRecursion();
      return program;
    } catch (e) {
      this.untrackRecursion();
      if (this.infiniteLoopDetected) return null;
      throw e;
    }
  }

  private parseStatement(): ASTNode | null {
    this.skipNewlines();
    const token = this.currentToken();
    if (!token || token.type === TokenType.EOF) return null;

    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        case 'var':
        case 'let':
        case 'const':
          return this.parseVariableDeclaration();
        case 'fn':
        case 'func':
        case 'function':
          return this.parseFunctionDeclaration();
        case 'return':
          return this.parseReturnStatement();
        case 'if':
          return this.parseIfStatement();
        case 'while':
          return this.parseWhileStatement();
        case 'for':
          return this.parseForStatement();
        case 'closure':
        case 'lambda':
          return this.parseClosureExpression();
        default:
          return this.parseExpressionStatement();
      }
    }

    return this.parseExpressionStatement();
  }

  private parseVariableDeclaration(): ASTNode {
    this.trackRecursion('VariableDeclaration');
    try {
      const kindToken = this.consume();
      const declarations: ASTNode[] = [];

      const parseDeclarator = (): ASTNode => {
        const idToken = this.expect(TokenType.IDENTIFIER);
        const id = this.createNode(ASTNodeType.IDENTIFIER, idToken, {
          name: idToken?.value || '',
        });

        let init: ASTNode | undefined;
        if (this.match(TokenType.OPERATOR, '=')) {
          this.consume();
          const initExpr = this.parseExpression();
          if (initExpr) init = initExpr;
        }

        const declarator = this.createNode(ASTNodeType.VARIABLE_DECLARATOR, idToken, {
          id,
          init,
        });

        if (init) declarator.children!.push(init);
        return declarator;
      };

      declarations.push(parseDeclarator());

      while (this.match(TokenType.DELIMITER, ',')) {
        this.consume();
        declarations.push(parseDeclarator());
      }

      if (this.match(TokenType.DELIMITER, ';')) {
        this.consume();
      }

      const node = this.createNode(ASTNodeType.VARIABLE_DECLARATION, kindToken, {
        declarations,
      });
      node.children = declarations;

      this.untrackRecursion();
      return node;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseFunctionDeclaration(): ASTNode {
    this.trackRecursion('FunctionDeclaration');
    try {
      const fnToken = this.consume();
      const idToken = this.expect(TokenType.IDENTIFIER);
      const id = this.createNode(ASTNodeType.IDENTIFIER, idToken, {
        name: idToken?.value || '',
      });

      this.expect(TokenType.DELIMITER, '(');
      const params: ASTNode[] = [];

      if (!this.match(TokenType.DELIMITER, ')')) {
        const paramToken = this.expect(TokenType.IDENTIFIER);
        if (paramToken) {
          params.push(this.createNode(ASTNodeType.IDENTIFIER, paramToken, {
            name: paramToken.value || '',
          }));
        }

        while (this.match(TokenType.DELIMITER, ',')) {
          this.consume();
          const pToken = this.expect(TokenType.IDENTIFIER);
          if (pToken) {
            params.push(this.createNode(ASTNodeType.IDENTIFIER, pToken, {
              name: pToken.value || '',
            }));
          }
        }
      }

      this.expect(TokenType.DELIMITER, ')');
      this.expect(TokenType.DELIMITER, '{');

      const body = this.parseBlockStatement();

      const node = this.createNode(ASTNodeType.FUNCTION_DECLARATION, fnToken, {
        id,
        params,
        body,
      });
      if (body) node.children!.push(body);

      this.untrackRecursion();
      return node;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseBlockStatement(): ASTNode {
    const token = this.currentToken();
    const body: ASTNode[] = [];

    while (this.currentToken() && !this.match(TokenType.DELIMITER, '}')) {
      this.skipNewlines();
      if (this.match(TokenType.DELIMITER, '}')) break;
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }

    if (this.match(TokenType.DELIMITER, '}')) {
      this.consume();
    }

    return this.createNode(ASTNodeType.BLOCK_STATEMENT, token, {
      body,
      children: body,
    });
  }

  private parseReturnStatement(): ASTNode {
    const returnToken = this.consume();
    let argument: ASTNode | undefined;

    if (!this.match(TokenType.DELIMITER, ';') && !this.match(TokenType.DELIMITER, '}')) {
      const argExpr = this.parseExpression();
      if (argExpr) argument = argExpr;
    }

    if (this.match(TokenType.DELIMITER, ';')) {
      this.consume();
    }

    return this.createNode(ASTNodeType.RETURN_STATEMENT, returnToken, {
      argument,
      children: argument ? [argument] : [],
    });
  }

  private parseIfStatement(): ASTNode {
    this.trackRecursion('IfStatement');
    try {
      const ifToken = this.consume();
      this.expect(TokenType.DELIMITER, '(');
      const test = this.parseExpression();
      this.expect(TokenType.DELIMITER, ')');
      this.expect(TokenType.DELIMITER, '{');

      const consequent = this.parseBlockStatement();
      let alternate: ASTNode | undefined;

      this.skipNewlines();
      if (this.match(TokenType.KEYWORD, 'else')) {
        this.consume();
        this.expect(TokenType.DELIMITER, '{');
        alternate = this.parseBlockStatement();
      }

      const node = this.createNode(ASTNodeType.IF_STATEMENT, ifToken, {
        test: test || undefined,
        consequent,
        alternate,
      });

      if (test) node.children!.push(test);
      if (consequent) node.children!.push(consequent);
      if (alternate) node.children!.push(alternate);

      this.untrackRecursion();
      return node;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseWhileStatement(): ASTNode {
    this.trackRecursion('WhileStatement');
    try {
      const whileToken = this.consume();
      this.expect(TokenType.DELIMITER, '(');
      const test = this.parseExpression();
      this.expect(TokenType.DELIMITER, ')');
      this.expect(TokenType.DELIMITER, '{');

      const body = this.parseBlockStatement();

      const node = this.createNode(ASTNodeType.WHILE_STATEMENT, whileToken, {
        test: test || undefined,
        body,
      });

      if (test) node.children!.push(test);
      if (body) node.children!.push(body);

      this.untrackRecursion();
      return node;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseForStatement(): ASTNode {
    this.trackRecursion('ForStatement');
    try {
      const forToken = this.consume();
      this.expect(TokenType.DELIMITER, '(');

      const init = this.parseExpression();
      this.expect(TokenType.DELIMITER, ';');
      const test = this.parseExpression();
      this.expect(TokenType.DELIMITER, ';');
      const update = this.parseExpression();

      this.expect(TokenType.DELIMITER, ')');
      this.expect(TokenType.DELIMITER, '{');

      const body = this.parseBlockStatement();

      const node = this.createNode(ASTNodeType.FOR_STATEMENT, forToken, {
        init: init || undefined,
        test: test || undefined,
        update: update || undefined,
        body,
      });

      this.untrackRecursion();
      return node;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseExpressionStatement(): ASTNode {
    const token = this.currentToken();
    const expr = this.parseExpression();

    if (this.match(TokenType.DELIMITER, ';')) {
      this.consume();
    }

    return this.createNode(ASTNodeType.EXPRESSION_STATEMENT, token, {
      expression: expr || undefined,
      children: expr ? [expr] : [],
    });
  }

  private parseExpression(): ASTNode | null {
    this.trackRecursion('Expression');
    try {
      const expr = this.parseAssignment();
      this.untrackRecursion();
      return expr;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseAssignment(): ASTNode | null {
    this.trackRecursion('Assignment');
    try {
      const left = this.parseLogicalOr();
      if (!left) return null;

      if (this.match(TokenType.OPERATOR, '=') ||
        this.match(TokenType.OPERATOR, '+=') ||
        this.match(TokenType.OPERATOR, '-=') ||
        this.match(TokenType.OPERATOR, '*=') ||
        this.match(TokenType.OPERATOR, '/=')) {
        const opToken = this.consume();
        const right = this.parseAssignment();

        const node = this.createNode(ASTNodeType.ASSIGNMENT_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
        });

        if (right) node.children = [left, right];
        this.untrackRecursion();
        return node;
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseLogicalOr(): ASTNode | null {
    this.trackRecursion('LogicalOr');
    try {
      let left = this.parseLogicalAnd();
      if (!left) return null;

      while (this.match(TokenType.OPERATOR, '||')) {
        const opToken = this.consume();
        const right = this.parseLogicalAnd();

        left = this.createNode(ASTNodeType.BINARY_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
          children: right ? [left, right] : [left],
        });
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseLogicalAnd(): ASTNode | null {
    this.trackRecursion('LogicalAnd');
    try {
      let left = this.parseEquality();
      if (!left) return null;

      while (this.match(TokenType.OPERATOR, '&&')) {
        const opToken = this.consume();
        const right = this.parseEquality();

        left = this.createNode(ASTNodeType.BINARY_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
          children: right ? [left, right] : [left],
        });
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseEquality(): ASTNode | null {
    this.trackRecursion('Equality');
    try {
      let left = this.parseRelational();
      if (!left) return null;

      while (this.match(TokenType.OPERATOR, '==') || this.match(TokenType.OPERATOR, '!=')) {
        const opToken = this.consume();
        const right = this.parseRelational();

        left = this.createNode(ASTNodeType.BINARY_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
          children: right ? [left, right] : [left],
        });
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseRelational(): ASTNode | null {
    this.trackRecursion('Relational');
    try {
      let left = this.parseAdditive();
      if (!left) return null;

      while (this.match(TokenType.OPERATOR, '<') || this.match(TokenType.OPERATOR, '>') ||
        this.match(TokenType.OPERATOR, '<=') || this.match(TokenType.OPERATOR, '>=')) {
        const opToken = this.consume();
        const right = this.parseAdditive();

        left = this.createNode(ASTNodeType.BINARY_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
          children: right ? [left, right] : [left],
        });
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseAdditive(): ASTNode | null {
    this.trackRecursion('Additive');
    try {
      let left = this.parseMultiplicative();
      if (!left) return null;

      while (this.match(TokenType.OPERATOR, '+') || this.match(TokenType.OPERATOR, '-')) {
        const opToken = this.consume();
        const right = this.parseMultiplicative();

        left = this.createNode(ASTNodeType.BINARY_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
          children: right ? [left, right] : [left],
        });
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseMultiplicative(): ASTNode | null {
    this.trackRecursion('Multiplicative');
    try {
      let left = this.parseUnary();
      if (!left) return null;

      while (this.match(TokenType.OPERATOR, '*') || this.match(TokenType.OPERATOR, '/') ||
        this.match(TokenType.OPERATOR, '%')) {
        const opToken = this.consume();
        const right = this.parseUnary();

        left = this.createNode(ASTNodeType.BINARY_EXPRESSION, opToken, {
          operator: opToken.value,
          left,
          right: right || undefined,
          children: right ? [left, right] : [left],
        });
      }

      this.untrackRecursion();
      return left;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parseUnary(): ASTNode | null {
    if (this.match(TokenType.OPERATOR, '-') || this.match(TokenType.OPERATOR, '!') ||
      this.match(TokenType.OPERATOR, '++') || this.match(TokenType.OPERATOR, '--')) {
      const opToken = this.consume();
      const operand = this.parseUnary();

      return this.createNode(ASTNodeType.UNARY_EXPRESSION, opToken, {
        operator: opToken.value,
        argument: operand || undefined,
        children: operand ? [operand] : [],
      });
    }

    return this.parseCallMember();
  }

  private parseCallMember(): ASTNode | null {
    let expr = this.parsePrimary();
    if (!expr) return null;

    while (true) {
      if (this.match(TokenType.DELIMITER, '(')) {
        this.consume();
        const args: ASTNode[] = [];

        if (!this.match(TokenType.DELIMITER, ')')) {
          const firstArg = this.parseExpression();
          if (firstArg) args.push(firstArg);

          while (this.match(TokenType.DELIMITER, ',')) {
            this.consume();
            const arg = this.parseExpression();
            if (arg) args.push(arg);
          }
        }

        this.expect(TokenType.DELIMITER, ')');

        expr = this.createNode(ASTNodeType.CALL_EXPRESSION, this.currentToken(), {
          callee: expr,
          arguments: args,
        });
      } else if (this.match(TokenType.DELIMITER, '.')) {
        this.consume();
        const propToken = this.expect(TokenType.IDENTIFIER);

        expr = this.createNode(ASTNodeType.MEMBER_EXPRESSION, propToken, {
          object: expr,
          property: this.createNode(ASTNodeType.IDENTIFIER, propToken, { name: propToken?.value || '' }),
        });
      } else {
        break;
      }
    }

    return expr;
  }

  private parseClosureExpression(): ASTNode {
    this.trackRecursion('ClosureExpression');
    try {
      const closureToken = this.consume();
      this.expect(TokenType.DELIMITER, '|');

      const params: ASTNode[] = [];
      if (!this.match(TokenType.DELIMITER, '|')) {
        const paramToken = this.expect(TokenType.IDENTIFIER);
        if (paramToken) {
          params.push(this.createNode(ASTNodeType.IDENTIFIER, paramToken, {
            name: paramToken.value || '',
          }));
        }

        while (this.match(TokenType.DELIMITER, ',')) {
          this.consume();
          const pToken = this.expect(TokenType.IDENTIFIER);
          if (pToken) {
            params.push(this.createNode(ASTNodeType.IDENTIFIER, pToken, {
              name: pToken.value || '',
            }));
          }
        }
      }

      this.expect(TokenType.DELIMITER, '|');
      this.expect(TokenType.DELIMITER, '{');

      const body = this.parseBlockStatement();

      const node = this.createNode(ASTNodeType.CLOSURE_EXPRESSION, closureToken, {
        params,
        body,
      });

      this.untrackRecursion();
      return node;
    } catch (e) {
      this.untrackRecursion();
      throw e;
    }
  }

  private parsePrimary(): ASTNode | null {
    const token = this.currentToken();
    if (!token) return null;

    switch (token.type) {
      case TokenType.NUMBER:
        this.consume();
        return this.createNode(ASTNodeType.NUMBER_LITERAL, token, {
          value: token.value,
        });

      case TokenType.STRING:
        this.consume();
        return this.createNode(ASTNodeType.STRING_LITERAL, token, {
          value: token.value,
        });

      case TokenType.BOOLEAN:
        this.consume();
        return this.createNode(ASTNodeType.BOOLEAN_LITERAL, token, {
          value: token.value,
        });

      case TokenType.IDENTIFIER:
        this.consume();
        return this.createNode(ASTNodeType.IDENTIFIER, token, {
          name: token.value,
        });

      case TokenType.DELIMITER:
        if (token.value === '(') {
          this.consume();
          const expr = this.parseExpression();
          this.expect(TokenType.DELIMITER, ')');
          return expr;
        }
        if (token.value === '{') {
          return this.parseBlockStatement();
        }
        break;

      case TokenType.KEYWORD:
        if (token.value === 'closure' || token.value === 'lambda') {
          return this.parseClosureExpression();
        }
        if (token.value === 'true' || token.value === 'false') {
          this.consume();
          return this.createNode(ASTNodeType.BOOLEAN_LITERAL, token, {
            value: token.value,
          });
        }
        break;
    }

    this.errors.push({
      line: token.line,
      column: token.column,
      message: `意外的 token: ${token.value}`,
      found: token.value,
    });

    this.consume();
    return null;
  }
}
