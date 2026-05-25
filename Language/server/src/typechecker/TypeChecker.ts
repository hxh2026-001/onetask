import { ASTNode, ASTNodeType } from '../types/ast';
import {
  TypeInfo,
  TypeKind,
  SymbolEntry,
  Scope,
  TypeCheckError,
  TypeCheckResult,
  TypePropagationEvent,
} from '../types/typechecker';

const IMPLICIT_CONVERSIONS: Record<string, string[]> = {
  'number->string': ['number', 'string'],
  'string->number': ['string', 'number'],
  'boolean->number': ['boolean', 'number'],
  'number->boolean': ['number', 'boolean'],
};

export class TypeChecker {
  private types: Record<string, TypeInfo> = {};
  private scopes: Record<number, Scope> = {};
  private currentScopeId: number = 0;
  private nextScopeId: number = 1;
  private errors: TypeCheckError[] = [];
  private propagationEvents: TypePropagationEvent[] = [];
  private shadowingDetections: TypeCheckResult['shadowingDetections'] = [];
  private undeclaredAccesses: TypeCheckResult['undeclaredAccesses'] = [];

  constructor() {
    this.scopes[0] = {
      id: 0,
      parentId: null,
      entries: {},
      isFunction: false,
    };
  }

  check(ast: ASTNode | null): TypeCheckResult {
    if (!ast) {
      return this.buildResult();
    }

    try {
      this.checkNode(ast);
    } catch (e) {
      // Continue checking even after errors
    }

    return this.buildResult();
  }

  private buildResult(): TypeCheckResult {
    return {
      types: this.types,
      scopes: this.scopes,
      errors: this.errors,
      propagationEvents: this.propagationEvents,
      shadowingDetections: this.shadowingDetections,
      undeclaredAccesses: this.undeclaredAccesses,
    };
  }

  private createScope(isFunction: boolean = false, functionName?: string): number {
    const scopeId = this.nextScopeId++;
    this.scopes[scopeId] = {
      id: scopeId,
      parentId: this.currentScopeId,
      entries: {},
      isFunction,
      functionName,
    };
    return scopeId;
  }

  private enterScope(scopeId: number): void {
    this.currentScopeId = scopeId;
  }

  private exitScope(): void {
    const scope = this.scopes[this.currentScopeId];
    if (scope && scope.parentId !== null) {
      this.currentScopeId = scope.parentId;
    }
  }

  private lookupSymbol(name: string, checkParentScopes: boolean = true): SymbolEntry | null {
    let scopeId: number | null = this.currentScopeId;

    while (scopeId !== null) {
      const scope: Scope | undefined = this.scopes[scopeId];
      if (!scope) break;

      const entry = scope.entries[name];
      if (entry) {
        return entry;
      }

      if (!checkParentScopes) break;
      scopeId = scope.parentId;
    }

    return null;
  }

  private declareSymbol(name: string, type: TypeInfo, line: number, column: number): SymbolEntry {
    const scope = this.scopes[this.currentScopeId]!;

    const existingInScope = scope.entries[name];
    if (existingInScope) {
      this.shadowingDetections.push({
        name,
        outerLine: existingInScope.line,
        innerLine: line,
        scopeId: this.currentScopeId,
      });
    }

    let parentScopeId: number | null = scope.parentId;
    while (parentScopeId !== null) {
      const parentScope = this.scopes[parentScopeId];
      const parentEntry = parentScope?.entries[name];
      if (parentEntry) {
        this.shadowingDetections.push({
          name,
          outerLine: parentEntry.line,
          innerLine: line,
          scopeId: parentScopeId,
        });
        break;
      }
      parentScopeId = parentScope?.parentId || null;
    }

    const entry: SymbolEntry = {
      name,
      type,
      scopeId: this.currentScopeId,
      line,
      column,
      isDeclared: true,
    };

    scope.entries[name] = entry;
    return entry;
  }

  private checkNode(node: ASTNode): TypeInfo | null {
    const nodeId = this.getNodeId(node);

    switch (node.type) {
      case ASTNodeType.PROGRAM:
        return this.checkProgram(node, nodeId);

      case ASTNodeType.VARIABLE_DECLARATION:
        return this.checkVariableDeclaration(node, nodeId);

      case ASTNodeType.FUNCTION_DECLARATION:
        return this.checkFunctionDeclaration(node, nodeId);

      case ASTNodeType.BLOCK_STATEMENT:
        return this.checkBlockStatement(node, nodeId);

      case ASTNodeType.EXPRESSION_STATEMENT:
        return this.checkExpressionStatement(node, nodeId);

      case ASTNodeType.RETURN_STATEMENT:
        return this.checkReturnStatement(node, nodeId);

      case ASTNodeType.IF_STATEMENT:
        return this.checkIfStatement(node, nodeId);

      case ASTNodeType.WHILE_STATEMENT:
        return this.checkWhileStatement(node, nodeId);

      case ASTNodeType.BINARY_EXPRESSION:
        return this.checkBinaryExpression(node, nodeId);

      case ASTNodeType.UNARY_EXPRESSION:
        return this.checkUnaryExpression(node, nodeId);

      case ASTNodeType.CALL_EXPRESSION:
        return this.checkCallExpression(node, nodeId);

      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        return this.checkAssignmentExpression(node, nodeId);

      case ASTNodeType.IDENTIFIER:
        return this.checkIdentifier(node, nodeId);

      case ASTNodeType.NUMBER_LITERAL:
        return this.checkNumberLiteral(node, nodeId);

      case ASTNodeType.STRING_LITERAL:
        return this.checkStringLiteral(node, nodeId);

      case ASTNodeType.BOOLEAN_LITERAL:
        return this.checkBooleanLiteral(node, nodeId);

      case ASTNodeType.CLOSURE_EXPRESSION:
        return this.checkClosureExpression(node, nodeId);

      default:
        return { kind: TypeKind.UNKNOWN };
    }
  }

  private getNodeId(node: ASTNode): string {
    return `${node.type}_${node.line}_${node.column}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private addPropagation(nodeId: string, type: TypeInfo, line: number, column: number, fromNode?: string): void {
    this.propagationEvents.push({
      nodeId,
      type,
      fromNode,
      line,
      column,
    });
  }

  private checkProgram(node: ASTNode, nodeId: string): TypeInfo {
    const body = node.body;
    if (Array.isArray(body)) {
      for (const child of body) {
        this.checkNode(child);
      }
    } else if (body) {
      this.checkNode(body);
    }
    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    return type;
  }

  private checkVariableDeclaration(node: ASTNode, nodeId: string): TypeInfo {
    for (const declarator of node.declarations || []) {
      if (declarator.id) {
        const initType: TypeInfo = declarator.init
          ? this.checkNode(declarator.init) || { kind: TypeKind.ANY }
          : { kind: TypeKind.ANY };
        const name = declarator.id.name || '';

        this.declareSymbol(name, initType, declarator.id.line, declarator.id.column);
        this.addPropagation(`var_${name}`, initType, declarator.id.line, declarator.id.column);
      }
    }

    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    return type;
  }

  private checkFunctionDeclaration(node: ASTNode, nodeId: string): TypeInfo {
    const name = node.id?.name || '';
    const scopeId = this.createScope(true, name);
    const prevScope = this.currentScopeId;

    this.enterScope(scopeId);

    const paramTypes: TypeInfo[] = [];
    for (const param of node.params || []) {
      const paramType: TypeInfo = { kind: TypeKind.ANY };
      this.declareSymbol(param.name || '', paramType, param.line, param.column);
      paramTypes.push(paramType);
    }

    const bodyType: TypeInfo = node.body
      ? this.checkNode(Array.isArray(node.body) ? node.body[0] : node.body) || { kind: TypeKind.VOID }
      : { kind: TypeKind.VOID };

    const funcType: TypeInfo = {
      kind: TypeKind.FUNCTION,
      params: paramTypes,
      returnType: bodyType,
    };

    this.exitScope();

    this.declareSymbol(name, funcType, node.line, node.column);
    this.types[nodeId] = funcType;
    this.addPropagation(`func_${name}`, funcType, node.line, node.column);

    return funcType;
  }

  private checkBlockStatement(node: ASTNode, nodeId: string): TypeInfo {
    const scopeId = this.createScope(false);
    const prevScope = this.currentScopeId;

    this.enterScope(scopeId);

    let lastType: TypeInfo = { kind: TypeKind.VOID };
    const body = node.body;
    if (Array.isArray(body)) {
      for (const child of body) {
        lastType = this.checkNode(child) || { kind: TypeKind.VOID };
      }
    } else if (body) {
      lastType = this.checkNode(body) || { kind: TypeKind.VOID };
    }

    this.exitScope();

    this.types[nodeId] = lastType;
    return lastType;
  }

  private checkExpressionStatement(node: ASTNode, nodeId: string): TypeInfo {
    const body = node.body;
    if (Array.isArray(body) && body.length > 0) {
      return this.checkNode(body[0]) || { kind: TypeKind.VOID };
    } else if (!Array.isArray(body) && body) {
      return this.checkNode(body) || { kind: TypeKind.VOID };
    }
    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    return type;
  }

  private checkReturnStatement(node: ASTNode, nodeId: string): TypeInfo {
    if (node.argument) {
      return this.checkNode(node.argument) || { kind: TypeKind.VOID };
    }
    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    return type;
  }

  private checkIfStatement(node: ASTNode, nodeId: string): TypeInfo {
    if (node.test) {
      this.checkNode(node.test);
    }

    const scopeId = this.createScope(false);
    this.enterScope(scopeId);
    if (node.consequent) this.checkNode(node.consequent);
    this.exitScope();

    if (node.alternate) {
      const altScopeId = this.createScope(false);
      this.enterScope(altScopeId);
      this.checkNode(node.alternate);
      this.exitScope();
    }

    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    return type;
  }

  private checkWhileStatement(node: ASTNode, nodeId: string): TypeInfo {
    if (node.test) {
      this.checkNode(node.test);
    }

    if (node.body) {
      const scopeId = this.createScope(false);
      this.enterScope(scopeId);
      if (Array.isArray(node.body)) {
        node.body.forEach(b => this.checkNode(b));
      } else {
        this.checkNode(node.body);
      }
      this.exitScope();
    }

    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    return type;
  }

  private checkBinaryExpression(node: ASTNode, nodeId: string): TypeInfo {
    const leftType: TypeInfo = node.left
      ? this.checkNode(node.left) || { kind: TypeKind.UNKNOWN }
      : { kind: TypeKind.UNKNOWN };
    const rightType: TypeInfo = node.right
      ? this.checkNode(node.right) || { kind: TypeKind.UNKNOWN }
      : { kind: TypeKind.UNKNOWN };

    let resultType: TypeInfo;
    const conversionChain: string[] = [];

    if (node.operator === '+' || node.operator === '-' || node.operator === '*' ||
      node.operator === '/' || node.operator === '%') {

      if (leftType.kind === TypeKind.NUMBER && rightType.kind === TypeKind.NUMBER) {
        resultType = { kind: TypeKind.NUMBER };
      } else if (leftType.kind === TypeKind.STRING || rightType.kind === TypeKind.STRING) {
        if (leftType.kind !== TypeKind.STRING) {
          conversionChain.push(`${leftType.kind}->string`);
        }
        if (rightType.kind !== TypeKind.STRING) {
          conversionChain.push(`${rightType.kind}->string`);
        }
        resultType = {
          kind: TypeKind.STRING,
          implicitConversions: conversionChain,
        };
      } else if (leftType.kind === TypeKind.BOOLEAN || rightType.kind === TypeKind.BOOLEAN) {
        if (leftType.kind === TypeKind.BOOLEAN) conversionChain.push('boolean->number');
        if (rightType.kind === TypeKind.BOOLEAN) conversionChain.push('boolean->number');
        resultType = {
          kind: TypeKind.NUMBER,
          implicitConversions: conversionChain,
        };
      } else {
        resultType = { kind: TypeKind.NUMBER };
      }

      if (conversionChain.length > 0 && leftType.kind === TypeKind.STRING && rightType.kind === TypeKind.NUMBER) {
        this.errors.push({
          line: node.line,
          column: node.column,
          message: `隐式类型转换链可能导致精度丢失: ${conversionChain.join(' -> ')}`,
          expectedType: TypeKind.STRING,
          actualType: TypeKind.NUMBER,
          implicitConversionChain: conversionChain,
          precisionLoss: true,
        });
      }

      if (conversionChain.length > 0 && leftType.kind === TypeKind.NUMBER && rightType.kind === TypeKind.BOOLEAN) {
        this.errors.push({
          line: node.line,
          column: node.column,
          message: `隐式类型转换: ${conversionChain.join(' -> ')}`,
          expectedType: TypeKind.NUMBER,
          actualType: TypeKind.BOOLEAN,
          implicitConversionChain: conversionChain,
        });
      }
    } else if (node.operator === '==' || node.operator === '!=' ||
      node.operator === '<' || node.operator === '>' ||
      node.operator === '<=' || node.operator === '>=') {
      resultType = { kind: TypeKind.BOOLEAN };
    } else if (node.operator === '&&' || node.operator === '||') {
      resultType = { kind: TypeKind.BOOLEAN };
    } else {
      resultType = { kind: TypeKind.UNKNOWN };
    }

    this.types[nodeId] = resultType;
    this.addPropagation(nodeId, resultType, node.line, node.column);

    return resultType;
  }

  private checkUnaryExpression(node: ASTNode, nodeId: string): TypeInfo {
    const operandType: TypeInfo = node.argument
      ? this.checkNode(node.argument) || { kind: TypeKind.UNKNOWN }
      : { kind: TypeKind.UNKNOWN };

    let resultType: TypeInfo;

    if (node.operator === '!') {
      resultType = { kind: TypeKind.BOOLEAN };
    } else if (node.operator === '-') {
      resultType = { kind: TypeKind.NUMBER };
    } else {
      resultType = operandType;
    }

    this.types[nodeId] = resultType;
    this.addPropagation(nodeId, resultType, node.line, node.column);

    return resultType;
  }

  private checkCallExpression(node: ASTNode, nodeId: string): TypeInfo {
    const calleeType = node.callee ? this.checkNode(node.callee) : { kind: TypeKind.UNKNOWN };

    for (const arg of node.arguments || []) {
      this.checkNode(arg);
    }

    const resultType: TypeInfo = { kind: TypeKind.ANY };
    this.types[nodeId] = resultType;
    this.addPropagation(nodeId, resultType, node.line, node.column);

    return resultType;
  }

  private checkAssignmentExpression(node: ASTNode, nodeId: string): TypeInfo {
    const leftType: TypeInfo = node.left
      ? this.checkNode(node.left) || { kind: TypeKind.UNKNOWN }
      : { kind: TypeKind.UNKNOWN };
    const rightType: TypeInfo = node.right
      ? this.checkNode(node.right) || { kind: TypeKind.UNKNOWN }
      : { kind: TypeKind.UNKNOWN };

    if (leftType.kind !== TypeKind.UNKNOWN && rightType.kind !== TypeKind.UNKNOWN &&
      leftType.kind !== rightType.kind && leftType.kind !== TypeKind.ANY && rightType.kind !== TypeKind.ANY) {

      const conversionKey = `${rightType.kind}->${leftType.kind}`;
      if (IMPLICIT_CONVERSIONS[conversionKey]) {
        const conversionChain = IMPLICIT_CONVERSIONS[conversionKey];

        if (conversionKey === 'string->number' || conversionKey === 'boolean->number') {
          this.errors.push({
            line: node.line,
            column: node.column,
            message: `类型不匹配: 期望 ${leftType.kind}, 实际 ${rightType.kind} (隐式转换可能导致精度丢失)`,
            expectedType: leftType.kind,
            actualType: rightType.kind,
            implicitConversionChain: conversionChain,
            precisionLoss: true,
          });
        } else {
          this.errors.push({
            line: node.line,
            column: node.column,
            message: `类型不匹配: 期望 ${leftType.kind}, 实际 ${rightType.kind}`,
            expectedType: leftType.kind,
            actualType: rightType.kind,
            implicitConversionChain: conversionChain,
          });
        }
      }
    }

    const type: TypeInfo = { kind: TypeKind.VOID };
    this.types[nodeId] = type;
    this.addPropagation(nodeId, type, node.line, node.column);

    return type;
  }

  private checkIdentifier(node: ASTNode, nodeId: string): TypeInfo {
    const name = node.name || '';

    let scopeId: number | null = this.currentScopeId;
    let resolvedScopeId: number | null = null;
    let foundEntry: SymbolEntry | null = null;

    while (scopeId !== null) {
      const scope: Scope | undefined = this.scopes[scopeId];
      if (!scope) break;

      const entry = scope.entries[name];
      if (entry) {
        foundEntry = entry;
        resolvedScopeId = scopeId;
        break;
      }

      scopeId = scope.parentId;
    }

    if (foundEntry) {
      if (resolvedScopeId !== this.currentScopeId) {
        this.undeclaredAccesses.push({
          name,
          line: node.line,
          scopeId: this.currentScopeId,
          resolvedScopeId,
        });
      }

      this.types[nodeId] = foundEntry.type;
      this.addPropagation(nodeId, foundEntry.type, node.line, node.column);
      return foundEntry.type;
    } else {
      this.undeclaredAccesses.push({
        name,
        line: node.line,
        scopeId: this.currentScopeId,
        resolvedScopeId: null,
      });

      this.errors.push({
        line: node.line,
        column: node.column,
        message: `未声明的变量 '${name}'`,
        undeclaredVariable: name,
      });

      const type: TypeInfo = { kind: TypeKind.UNKNOWN };
      this.types[nodeId] = type;
      return type;
    }
  }

  private checkNumberLiteral(node: ASTNode, nodeId: string): TypeInfo {
    const type: TypeInfo = { kind: TypeKind.NUMBER };
    this.types[nodeId] = type;
    this.addPropagation(nodeId, type, node.line, node.column);
    return type;
  }

  private checkStringLiteral(node: ASTNode, nodeId: string): TypeInfo {
    const type: TypeInfo = { kind: TypeKind.STRING };
    this.types[nodeId] = type;
    this.addPropagation(nodeId, type, node.line, node.column);
    return type;
  }

  private checkBooleanLiteral(node: ASTNode, nodeId: string): TypeInfo {
    const type: TypeInfo = { kind: TypeKind.BOOLEAN };
    this.types[nodeId] = type;
    this.addPropagation(nodeId, type, node.line, node.column);
    return type;
  }

  private checkClosureExpression(node: ASTNode, nodeId: string): TypeInfo {
    const capturedVars: string[] = [];
    const scopeId = this.createScope(true, 'closure');
    const prevScope = this.currentScopeId;

    this.enterScope(scopeId);

    for (const param of node.params || []) {
      const paramType: TypeInfo = { kind: TypeKind.ANY };
      this.declareSymbol(param.name || '', paramType, param.line, param.column);
    }

    const parentScope = this.scopes[prevScope]!;
    for (const name of Object.keys(parentScope.entries)) {
      capturedVars.push(name);
    }

    if (node.body) {
      if (Array.isArray(node.body)) {
        for (const child of node.body) {
          this.checkNode(child);
        }
      } else {
        this.checkNode(node.body);
      }
    }
    this.exitScope();

    const closureType: TypeInfo = {
      kind: TypeKind.CLOSURE,
      capturedVars,
    };

    this.types[nodeId] = closureType;
    this.addPropagation(nodeId, closureType, node.line, node.column);

    return closureType;
  }
}
