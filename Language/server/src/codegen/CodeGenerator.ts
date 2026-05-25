import { ASTNode, ASTNodeType } from '../types/ast';
import {
  GeneratedLine,
  CodeGenResult,
  CodeGenError,
  ClosureCaptureInfo,
} from '../types/codegen';
import { Scope } from '../types/typechecker';

export class CodeGenerator {
  private lines: GeneratedLine[] = [];
  private errors: CodeGenError[] = [];
  private closureOffsets: Record<string, number> = {};
  private addressErrors: ClosureCaptureInfo[] = [];
  private lineEvents: { lineNumber: number; timestamp: number }[] = [];
  private currentLine: number = 0;
  private labelCounter: number = 0;
  private varAddresses: Record<string, number> = {};
  private currentAddress: number = 0;
  private capturedVarOffsets: Record<string, number> = {};

  generate(ast: ASTNode | null, scopes?: Record<number, Scope>): CodeGenResult {
    this.lines = [];
    this.errors = [];
    this.closureOffsets = {};
    this.addressErrors = [];
    this.lineEvents = [];
    this.currentLine = 0;
    this.labelCounter = 0;
    this.varAddresses = {};
    this.currentAddress = 0;
    this.capturedVarOffsets = {};

    if (!ast) {
      this.addHeader('PROGRAM START');
      this.addComment('No AST to generate code from');
      return this.buildResult();
    }

    this.addHeader('PROGRAM START');
    this.generateNode(ast);
    this.addHeader('PROGRAM END');

    return this.buildResult();
  }

  private buildResult(): CodeGenResult {
    return {
      lines: this.lines,
      errors: this.errors,
      closureOffsets: this.closureOffsets,
      addressErrors: this.addressErrors,
      lineEvents: this.lineEvents,
    };
  }

  private addCode(assembly: string, comment?: string): void {
    this.lines.push({
      lineNumber: this.currentLine++,
      code: assembly,
      comment,
      type: 'code',
    });
    this.lineEvents.push({
      lineNumber: this.currentLine - 1,
      timestamp: Date.now(),
    });
  }

  private addLabel(label: string): void {
    this.lines.push({
      lineNumber: this.currentLine++,
      code: `${label}:`,
      type: 'label',
    });
    this.lineEvents.push({
      lineNumber: this.currentLine - 1,
      timestamp: Date.now(),
    });
  }

  private addComment(comment: string): void {
    this.lines.push({
      lineNumber: this.currentLine++,
      code: `; ${comment}`,
      type: 'comment',
    });
    this.lineEvents.push({
      lineNumber: this.currentLine - 1,
      timestamp: Date.now(),
    });
  }

  private addHeader(header: string): void {
    this.lines.push({
      lineNumber: this.currentLine++,
      code: `; === ${header} ===`,
      type: 'header',
    });
    this.lineEvents.push({
      lineNumber: this.currentLine - 1,
      timestamp: Date.now(),
    });
  }

  private generateNode(node: ASTNode, indent: string = ''): void {
    switch (node.type) {
      case ASTNodeType.PROGRAM:
        this.generateProgram(node, indent);
        break;
      case ASTNodeType.VARIABLE_DECLARATION:
        this.generateVariableDeclaration(node, indent);
        break;
      case ASTNodeType.FUNCTION_DECLARATION:
        this.generateFunctionDeclaration(node, indent);
        break;
      case ASTNodeType.BLOCK_STATEMENT:
        this.generateBlockStatement(node, indent);
        break;
      case ASTNodeType.EXPRESSION_STATEMENT:
        this.generateExpressionStatement(node, indent);
        break;
      case ASTNodeType.RETURN_STATEMENT:
        this.generateReturnStatement(node, indent);
        break;
      case ASTNodeType.IF_STATEMENT:
        this.generateIfStatement(node, indent);
        break;
      case ASTNodeType.WHILE_STATEMENT:
        this.generateWhileStatement(node, indent);
        break;
      case ASTNodeType.BINARY_EXPRESSION:
        this.generateBinaryExpression(node, indent);
        break;
      case ASTNodeType.UNARY_EXPRESSION:
        this.generateUnaryExpression(node, indent);
        break;
      case ASTNodeType.CALL_EXPRESSION:
        this.generateCallExpression(node, indent);
        break;
      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        this.generateAssignmentExpression(node, indent);
        break;
      case ASTNodeType.IDENTIFIER:
        this.generateIdentifier(node, indent);
        break;
      case ASTNodeType.NUMBER_LITERAL:
        this.generateNumberLiteral(node, indent);
        break;
      case ASTNodeType.STRING_LITERAL:
        this.generateStringLiteral(node, indent);
        break;
      case ASTNodeType.BOOLEAN_LITERAL:
        this.generateBooleanLiteral(node, indent);
        break;
      case ASTNodeType.CLOSURE_EXPRESSION:
        this.generateClosureExpression(node, indent);
        break;
    }
  }

  private generateProgram(node: ASTNode, indent: string): void {
    const body = node.body;
    if (Array.isArray(body)) {
      for (const child of body) {
        this.generateNode(child, indent);
      }
    } else if (body) {
      this.generateNode(body, indent);
    }
  }

  private generateVariableDeclaration(node: ASTNode, indent: string): void {
    this.addComment(`${indent}Variable declaration`);

    for (const declarator of node.declarations || []) {
      const varName = declarator.id?.name || 'unknown';
      const address = this.allocateVariable(varName);

      if (declarator.init) {
        this.generateNode(declarator.init, indent);
        this.addCode(`${indent}STORE [${address}]`, `Store ${varName} at address ${address}`);
      }
    }
  }

  private generateFunctionDeclaration(node: ASTNode, indent: string): void {
    const funcName = node.id?.name || 'anonymous';
    const funcLabel = `FUNC_${funcName.toUpperCase()}_${this.labelCounter++}`;

    this.addComment(`${indent}Function: ${funcName}`);
    this.addLabel(funcLabel);

    const savedAddress = this.currentAddress;
    this.varAddresses = {};
    this.currentAddress = 0;

    for (const param of node.params || []) {
      const paramName = param.name || 'p';
      const addr = this.allocateVariable(paramName);
      this.addCode(`${indent}PARAM [${addr}]`, `Parameter ${paramName}`);
    }

    if (node.body) {
      if (Array.isArray(node.body)) {
        for (const child of node.body) {
          this.generateNode(child, indent + '  ');
        }
      } else {
        this.generateNode(node.body, indent + '  ');
      }
    }

    this.addCode(`${indent}RET`, 'Return from function');

    this.currentAddress = savedAddress;
  }

  private generateBlockStatement(node: ASTNode, indent: string): void {
    const body = node.body;
    if (Array.isArray(body)) {
      for (const child of body) {
        this.generateNode(child, indent);
      }
    } else if (body) {
      this.generateNode(body, indent);
    }
  }

  private generateExpressionStatement(node: ASTNode, indent: string): void {
    const body = node.body;
    if (Array.isArray(body) && body.length > 0) {
      this.generateNode(body[0], indent);
    } else if (!Array.isArray(body) && body) {
      this.generateNode(body, indent);
    }
  }

  private generateReturnStatement(node: ASTNode, indent: string): void {
    if (node.argument) {
      this.generateNode(node.argument, indent);
    }
    this.addCode(`${indent}RET`, 'Return statement');
  }

  private generateIfStatement(node: ASTNode, indent: string): void {
    const elseLabel = `ELSE_${this.labelCounter++}`;
    const endLabel = `ENDIF_${this.labelCounter++}`;

    this.addComment(`${indent}If statement`);

    if (node.test) {
      this.generateNode(node.test, indent);
    }

    this.addCode(`${indent}JZ ${elseLabel}`, 'Jump to else if false');

    if (node.consequent) {
      this.generateNode(node.consequent, indent + '  ');
    }

    this.addCode(`${indent}JMP ${endLabel}`, 'Skip else branch');
    this.addLabel(elseLabel);

    if (node.alternate) {
      this.generateNode(node.alternate, indent + '  ');
    }

    this.addLabel(endLabel);
  }

  private generateWhileStatement(node: ASTNode, indent: string): void {
    const startLabel = `WHILE_START_${this.labelCounter++}`;
    const endLabel = `WHILE_END_${this.labelCounter++}`;

    this.addComment(`${indent}While loop`);
    this.addLabel(startLabel);

    if (node.test) {
      this.generateNode(node.test, indent);
    }

    this.addCode(`${indent}JZ ${endLabel}`, 'Exit loop if false');

    if (node.body) {
      if (Array.isArray(node.body)) {
        for (const child of node.body) {
          this.generateNode(child, indent + '  ');
        }
      } else {
        this.generateNode(node.body, indent + '  ');
      }
    }

    this.addCode(`${indent}JMP ${startLabel}`, 'Loop back');
    this.addLabel(endLabel);
  }

  private generateBinaryExpression(node: ASTNode, indent: string): void {
    const opMap: Record<string, string> = {
      '+': 'ADD',
      '-': 'SUB',
      '*': 'MUL',
      '/': 'DIV',
      '%': 'MOD',
      '==': 'EQ',
      '!=': 'NEQ',
      '<': 'LT',
      '>': 'GT',
      '<=': 'LTE',
      '>=': 'GTE',
      '&&': 'AND',
      '||': 'OR',
    };

    if (node.left) this.generateNode(node.left, indent);
    if (node.right) this.generateNode(node.right, indent);

    const opCode = opMap[node.operator || ''] || 'NOP';
    this.addCode(`${indent}${opCode}`, node.operator);
  }

  private generateUnaryExpression(node: ASTNode, indent: string): void {
    if (node.argument) {
      this.generateNode(node.argument, indent);
    }

    if (node.operator === '-') {
      this.addCode(`${indent}NEG`, 'Negate');
    } else if (node.operator === '!') {
      this.addCode(`${indent}NOT`, 'Logical NOT');
    }
  }

  private generateCallExpression(node: ASTNode, indent: string): void {
    this.addComment(`${indent}Function call`);

    for (const arg of node.arguments || []) {
      this.generateNode(arg, indent);
      this.addCode(`${indent}PUSH`, 'Push argument');
    }

    if (node.callee?.type === ASTNodeType.IDENTIFIER) {
      this.addCode(`${indent}CALL ${node.callee.name?.toUpperCase()}`, `Call ${node.callee.name}`);
    } else if (node.callee) {
      this.generateNode(node.callee, indent);
      this.addCode(`${indent}CALL_REG`, 'Call via register');
    }
  }

  private generateAssignmentExpression(node: ASTNode, indent: string): void {
    if (node.right) {
      this.generateNode(node.right, indent);
    }

    if (node.left?.type === ASTNodeType.IDENTIFIER) {
      const varName = node.left.name || 'unknown';
      let address = this.varAddresses[varName];

      if (address === undefined) {
        address = this.allocateVariable(varName);
      }

      this.addCode(`${indent}STORE [${address}]`, `Assign ${varName}`);
    }
  }

  private generateIdentifier(node: ASTNode, indent: string): void {
    const varName = node.name || 'unknown';
    const address = this.varAddresses[varName];

    if (address !== undefined) {
      this.addCode(`${indent}LOAD [${address}]`, `Load ${varName} from ${address}`);
    } else {
      this.addCode(`${indent}LOAD ${varName}`, `Load ${varName} (unresolved)`);

      const error: ClosureCaptureInfo = {
        varName,
        originalScopeId: -1,
        captureDepth: -1,
        offset: -1,
        addressError: true,
      };
      this.addressErrors.push(error);

      this.errors.push({
        line: node.line,
        column: node.column,
        message: `变量 '${varName}' 地址未解析, 可能是闭包捕获的变量`,
        closureInfo: error,
      });
    }
  }

  private generateNumberLiteral(node: ASTNode, indent: string): void {
    this.addCode(`${indent}PUSH ${node.value}`, `Push number ${node.value}`);
  }

  private generateStringLiteral(node: ASTNode, indent: string): void {
    this.addCode(`${indent}PUSH_STR ${node.value}`, `Push string`);
  }

  private generateBooleanLiteral(node: ASTNode, indent: string): void {
    this.addCode(`${indent}PUSH ${node.value === 'true' ? 1 : 0}`, `Push boolean ${node.value}`);
  }

  private generateClosureExpression(node: ASTNode, indent: string): void {
    const closureLabel = `CLOSURE_${this.labelCounter++}`;

    this.addComment(`${indent}Closure expression`);
    this.addCode(`${indent}ALLOC_CLOSURE`, 'Allocate closure object');

    const capturedVars: string[] = [];
    for (const varName of Object.keys(this.varAddresses)) {
      const addr = this.varAddresses[varName];
      const offset = this.capturedVarOffsets[varName];

      if (offset === undefined) {
        const errorOffset = -1;
        this.addressErrors.push({
          varName,
          originalScopeId: this.currentAddress,
          captureDepth: 1,
          offset: errorOffset,
          addressError: true,
        });

        this.addCode(`${indent}CAPTURE ${varName} [OFFSET_ERROR]`, `捕获变量 ${varName} 地址偏移错误!`);

        this.errors.push({
          line: node.line,
          column: node.column,
          message: `闭包捕获变量 '${varName}' 地址偏移错误: 正确偏移为 ${addr}, 但生成了偏移 ${errorOffset}`,
          closureInfo: {
            varName,
            originalScopeId: this.currentAddress,
            captureDepth: 1,
            offset: errorOffset,
            addressError: true,
          },
        });
      } else {
        this.addCode(`${indent}CAPTURE ${varName} [${offset}]`, `捕获变量 ${varName} 偏移: ${offset}`);
      }

      capturedVars.push(varName);
      this.closureOffsets[varName] = offset || -1;
    }

    this.addLabel(closureLabel);
    this.addCode(`${indent}CLOSURE_BODY`, 'Closure body starts');

    if (node.body) {
      if (Array.isArray(node.body)) {
        for (const child of node.body) {
          this.generateNode(child, indent + '  ');
        }
      } else {
        this.generateNode(node.body, indent + '  ');
      }
    }

    this.addCode(`${indent}CLOSURE_RET`, 'Closure return');
  }

  private allocateVariable(name: string): number {
    const address = this.currentAddress++;
    this.varAddresses[name] = address;
    return address;
  }
}
