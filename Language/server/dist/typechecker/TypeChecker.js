"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeChecker = void 0;
const ast_1 = require("../types/ast");
const typechecker_1 = require("../types/typechecker");
const IMPLICIT_CONVERSIONS = {
    'number->string': ['number', 'string'],
    'string->number': ['string', 'number'],
    'boolean->number': ['boolean', 'number'],
    'number->boolean': ['number', 'boolean'],
};
class TypeChecker {
    constructor() {
        this.types = {};
        this.scopes = {};
        this.currentScopeId = 0;
        this.nextScopeId = 1;
        this.errors = [];
        this.propagationEvents = [];
        this.shadowingDetections = [];
        this.undeclaredAccesses = [];
        this.scopes[0] = {
            id: 0,
            parentId: null,
            entries: {},
            isFunction: false,
        };
    }
    check(ast) {
        if (!ast) {
            return this.buildResult();
        }
        try {
            this.checkNode(ast);
        }
        catch (e) {
            // Continue checking even after errors
        }
        return this.buildResult();
    }
    buildResult() {
        return {
            types: this.types,
            scopes: this.scopes,
            errors: this.errors,
            propagationEvents: this.propagationEvents,
            shadowingDetections: this.shadowingDetections,
            undeclaredAccesses: this.undeclaredAccesses,
        };
    }
    createScope(isFunction = false, functionName) {
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
    enterScope(scopeId) {
        this.currentScopeId = scopeId;
    }
    exitScope() {
        const scope = this.scopes[this.currentScopeId];
        if (scope && scope.parentId !== null) {
            this.currentScopeId = scope.parentId;
        }
    }
    lookupSymbol(name, checkParentScopes = true) {
        let scopeId = this.currentScopeId;
        while (scopeId !== null) {
            const scope = this.scopes[scopeId];
            if (!scope)
                break;
            const entry = scope.entries[name];
            if (entry) {
                return entry;
            }
            if (!checkParentScopes)
                break;
            scopeId = scope.parentId;
        }
        return null;
    }
    declareSymbol(name, type, line, column) {
        const scope = this.scopes[this.currentScopeId];
        const existingInScope = scope.entries[name];
        if (existingInScope) {
            this.shadowingDetections.push({
                name,
                outerLine: existingInScope.line,
                innerLine: line,
                scopeId: this.currentScopeId,
            });
        }
        let parentScopeId = scope.parentId;
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
        const entry = {
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
    checkNode(node) {
        const nodeId = this.getNodeId(node);
        switch (node.type) {
            case ast_1.ASTNodeType.PROGRAM:
                return this.checkProgram(node, nodeId);
            case ast_1.ASTNodeType.VARIABLE_DECLARATION:
                return this.checkVariableDeclaration(node, nodeId);
            case ast_1.ASTNodeType.FUNCTION_DECLARATION:
                return this.checkFunctionDeclaration(node, nodeId);
            case ast_1.ASTNodeType.BLOCK_STATEMENT:
                return this.checkBlockStatement(node, nodeId);
            case ast_1.ASTNodeType.EXPRESSION_STATEMENT:
                return this.checkExpressionStatement(node, nodeId);
            case ast_1.ASTNodeType.RETURN_STATEMENT:
                return this.checkReturnStatement(node, nodeId);
            case ast_1.ASTNodeType.IF_STATEMENT:
                return this.checkIfStatement(node, nodeId);
            case ast_1.ASTNodeType.WHILE_STATEMENT:
                return this.checkWhileStatement(node, nodeId);
            case ast_1.ASTNodeType.BINARY_EXPRESSION:
                return this.checkBinaryExpression(node, nodeId);
            case ast_1.ASTNodeType.UNARY_EXPRESSION:
                return this.checkUnaryExpression(node, nodeId);
            case ast_1.ASTNodeType.CALL_EXPRESSION:
                return this.checkCallExpression(node, nodeId);
            case ast_1.ASTNodeType.ASSIGNMENT_EXPRESSION:
                return this.checkAssignmentExpression(node, nodeId);
            case ast_1.ASTNodeType.IDENTIFIER:
                return this.checkIdentifier(node, nodeId);
            case ast_1.ASTNodeType.NUMBER_LITERAL:
                return this.checkNumberLiteral(node, nodeId);
            case ast_1.ASTNodeType.STRING_LITERAL:
                return this.checkStringLiteral(node, nodeId);
            case ast_1.ASTNodeType.BOOLEAN_LITERAL:
                return this.checkBooleanLiteral(node, nodeId);
            case ast_1.ASTNodeType.CLOSURE_EXPRESSION:
                return this.checkClosureExpression(node, nodeId);
            default:
                return { kind: typechecker_1.TypeKind.UNKNOWN };
        }
    }
    getNodeId(node) {
        return `${node.type}_${node.line}_${node.column}_${Math.random().toString(36).slice(2, 8)}`;
    }
    addPropagation(nodeId, type, line, column, fromNode) {
        this.propagationEvents.push({
            nodeId,
            type,
            fromNode,
            line,
            column,
        });
    }
    checkProgram(node, nodeId) {
        const body = node.body;
        if (Array.isArray(body)) {
            for (const child of body) {
                this.checkNode(child);
            }
        }
        else if (body) {
            this.checkNode(body);
        }
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        return type;
    }
    checkVariableDeclaration(node, nodeId) {
        for (const declarator of node.declarations || []) {
            if (declarator.id) {
                const initType = declarator.init
                    ? this.checkNode(declarator.init) || { kind: typechecker_1.TypeKind.ANY }
                    : { kind: typechecker_1.TypeKind.ANY };
                const name = declarator.id.name || '';
                this.declareSymbol(name, initType, declarator.id.line, declarator.id.column);
                this.addPropagation(`var_${name}`, initType, declarator.id.line, declarator.id.column);
            }
        }
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        return type;
    }
    checkFunctionDeclaration(node, nodeId) {
        const name = node.id?.name || '';
        const scopeId = this.createScope(true, name);
        const prevScope = this.currentScopeId;
        this.enterScope(scopeId);
        const paramTypes = [];
        for (const param of node.params || []) {
            const paramType = { kind: typechecker_1.TypeKind.ANY };
            this.declareSymbol(param.name || '', paramType, param.line, param.column);
            paramTypes.push(paramType);
        }
        const bodyType = node.body
            ? this.checkNode(Array.isArray(node.body) ? node.body[0] : node.body) || { kind: typechecker_1.TypeKind.VOID }
            : { kind: typechecker_1.TypeKind.VOID };
        const funcType = {
            kind: typechecker_1.TypeKind.FUNCTION,
            params: paramTypes,
            returnType: bodyType,
        };
        this.exitScope();
        this.declareSymbol(name, funcType, node.line, node.column);
        this.types[nodeId] = funcType;
        this.addPropagation(`func_${name}`, funcType, node.line, node.column);
        return funcType;
    }
    checkBlockStatement(node, nodeId) {
        const scopeId = this.createScope(false);
        const prevScope = this.currentScopeId;
        this.enterScope(scopeId);
        let lastType = { kind: typechecker_1.TypeKind.VOID };
        const body = node.body;
        if (Array.isArray(body)) {
            for (const child of body) {
                lastType = this.checkNode(child) || { kind: typechecker_1.TypeKind.VOID };
            }
        }
        else if (body) {
            lastType = this.checkNode(body) || { kind: typechecker_1.TypeKind.VOID };
        }
        this.exitScope();
        this.types[nodeId] = lastType;
        return lastType;
    }
    checkExpressionStatement(node, nodeId) {
        const body = node.body;
        if (Array.isArray(body) && body.length > 0) {
            return this.checkNode(body[0]) || { kind: typechecker_1.TypeKind.VOID };
        }
        else if (!Array.isArray(body) && body) {
            return this.checkNode(body) || { kind: typechecker_1.TypeKind.VOID };
        }
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        return type;
    }
    checkReturnStatement(node, nodeId) {
        if (node.argument) {
            return this.checkNode(node.argument) || { kind: typechecker_1.TypeKind.VOID };
        }
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        return type;
    }
    checkIfStatement(node, nodeId) {
        if (node.test) {
            this.checkNode(node.test);
        }
        const scopeId = this.createScope(false);
        this.enterScope(scopeId);
        if (node.consequent)
            this.checkNode(node.consequent);
        this.exitScope();
        if (node.alternate) {
            const altScopeId = this.createScope(false);
            this.enterScope(altScopeId);
            this.checkNode(node.alternate);
            this.exitScope();
        }
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        return type;
    }
    checkWhileStatement(node, nodeId) {
        if (node.test) {
            this.checkNode(node.test);
        }
        if (node.body) {
            const scopeId = this.createScope(false);
            this.enterScope(scopeId);
            if (Array.isArray(node.body)) {
                node.body.forEach(b => this.checkNode(b));
            }
            else {
                this.checkNode(node.body);
            }
            this.exitScope();
        }
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        return type;
    }
    checkBinaryExpression(node, nodeId) {
        const leftType = node.left
            ? this.checkNode(node.left) || { kind: typechecker_1.TypeKind.UNKNOWN }
            : { kind: typechecker_1.TypeKind.UNKNOWN };
        const rightType = node.right
            ? this.checkNode(node.right) || { kind: typechecker_1.TypeKind.UNKNOWN }
            : { kind: typechecker_1.TypeKind.UNKNOWN };
        let resultType;
        const conversionChain = [];
        if (node.operator === '+' || node.operator === '-' || node.operator === '*' ||
            node.operator === '/' || node.operator === '%') {
            if (leftType.kind === typechecker_1.TypeKind.NUMBER && rightType.kind === typechecker_1.TypeKind.NUMBER) {
                resultType = { kind: typechecker_1.TypeKind.NUMBER };
            }
            else if (leftType.kind === typechecker_1.TypeKind.STRING || rightType.kind === typechecker_1.TypeKind.STRING) {
                if (leftType.kind !== typechecker_1.TypeKind.STRING) {
                    conversionChain.push(`${leftType.kind}->string`);
                }
                if (rightType.kind !== typechecker_1.TypeKind.STRING) {
                    conversionChain.push(`${rightType.kind}->string`);
                }
                resultType = {
                    kind: typechecker_1.TypeKind.STRING,
                    implicitConversions: conversionChain,
                };
            }
            else if (leftType.kind === typechecker_1.TypeKind.BOOLEAN || rightType.kind === typechecker_1.TypeKind.BOOLEAN) {
                if (leftType.kind === typechecker_1.TypeKind.BOOLEAN)
                    conversionChain.push('boolean->number');
                if (rightType.kind === typechecker_1.TypeKind.BOOLEAN)
                    conversionChain.push('boolean->number');
                resultType = {
                    kind: typechecker_1.TypeKind.NUMBER,
                    implicitConversions: conversionChain,
                };
            }
            else {
                resultType = { kind: typechecker_1.TypeKind.NUMBER };
            }
            if (conversionChain.length > 0 && leftType.kind === typechecker_1.TypeKind.STRING && rightType.kind === typechecker_1.TypeKind.NUMBER) {
                this.errors.push({
                    line: node.line,
                    column: node.column,
                    message: `隐式类型转换链可能导致精度丢失: ${conversionChain.join(' -> ')}`,
                    expectedType: typechecker_1.TypeKind.STRING,
                    actualType: typechecker_1.TypeKind.NUMBER,
                    implicitConversionChain: conversionChain,
                    precisionLoss: true,
                });
            }
            if (conversionChain.length > 0 && leftType.kind === typechecker_1.TypeKind.NUMBER && rightType.kind === typechecker_1.TypeKind.BOOLEAN) {
                this.errors.push({
                    line: node.line,
                    column: node.column,
                    message: `隐式类型转换: ${conversionChain.join(' -> ')}`,
                    expectedType: typechecker_1.TypeKind.NUMBER,
                    actualType: typechecker_1.TypeKind.BOOLEAN,
                    implicitConversionChain: conversionChain,
                });
            }
        }
        else if (node.operator === '==' || node.operator === '!=' ||
            node.operator === '<' || node.operator === '>' ||
            node.operator === '<=' || node.operator === '>=') {
            resultType = { kind: typechecker_1.TypeKind.BOOLEAN };
        }
        else if (node.operator === '&&' || node.operator === '||') {
            resultType = { kind: typechecker_1.TypeKind.BOOLEAN };
        }
        else {
            resultType = { kind: typechecker_1.TypeKind.UNKNOWN };
        }
        this.types[nodeId] = resultType;
        this.addPropagation(nodeId, resultType, node.line, node.column);
        return resultType;
    }
    checkUnaryExpression(node, nodeId) {
        const operandType = node.argument
            ? this.checkNode(node.argument) || { kind: typechecker_1.TypeKind.UNKNOWN }
            : { kind: typechecker_1.TypeKind.UNKNOWN };
        let resultType;
        if (node.operator === '!') {
            resultType = { kind: typechecker_1.TypeKind.BOOLEAN };
        }
        else if (node.operator === '-') {
            resultType = { kind: typechecker_1.TypeKind.NUMBER };
        }
        else {
            resultType = operandType;
        }
        this.types[nodeId] = resultType;
        this.addPropagation(nodeId, resultType, node.line, node.column);
        return resultType;
    }
    checkCallExpression(node, nodeId) {
        const calleeType = node.callee ? this.checkNode(node.callee) : { kind: typechecker_1.TypeKind.UNKNOWN };
        for (const arg of node.arguments || []) {
            this.checkNode(arg);
        }
        const resultType = { kind: typechecker_1.TypeKind.ANY };
        this.types[nodeId] = resultType;
        this.addPropagation(nodeId, resultType, node.line, node.column);
        return resultType;
    }
    checkAssignmentExpression(node, nodeId) {
        const leftType = node.left
            ? this.checkNode(node.left) || { kind: typechecker_1.TypeKind.UNKNOWN }
            : { kind: typechecker_1.TypeKind.UNKNOWN };
        const rightType = node.right
            ? this.checkNode(node.right) || { kind: typechecker_1.TypeKind.UNKNOWN }
            : { kind: typechecker_1.TypeKind.UNKNOWN };
        if (leftType.kind !== typechecker_1.TypeKind.UNKNOWN && rightType.kind !== typechecker_1.TypeKind.UNKNOWN &&
            leftType.kind !== rightType.kind && leftType.kind !== typechecker_1.TypeKind.ANY && rightType.kind !== typechecker_1.TypeKind.ANY) {
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
                }
                else {
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
        const type = { kind: typechecker_1.TypeKind.VOID };
        this.types[nodeId] = type;
        this.addPropagation(nodeId, type, node.line, node.column);
        return type;
    }
    checkIdentifier(node, nodeId) {
        const name = node.name || '';
        let scopeId = this.currentScopeId;
        let resolvedScopeId = null;
        let foundEntry = null;
        while (scopeId !== null) {
            const scope = this.scopes[scopeId];
            if (!scope)
                break;
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
        }
        else {
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
            const type = { kind: typechecker_1.TypeKind.UNKNOWN };
            this.types[nodeId] = type;
            return type;
        }
    }
    checkNumberLiteral(node, nodeId) {
        const type = { kind: typechecker_1.TypeKind.NUMBER };
        this.types[nodeId] = type;
        this.addPropagation(nodeId, type, node.line, node.column);
        return type;
    }
    checkStringLiteral(node, nodeId) {
        const type = { kind: typechecker_1.TypeKind.STRING };
        this.types[nodeId] = type;
        this.addPropagation(nodeId, type, node.line, node.column);
        return type;
    }
    checkBooleanLiteral(node, nodeId) {
        const type = { kind: typechecker_1.TypeKind.BOOLEAN };
        this.types[nodeId] = type;
        this.addPropagation(nodeId, type, node.line, node.column);
        return type;
    }
    checkClosureExpression(node, nodeId) {
        const capturedVars = [];
        const scopeId = this.createScope(true, 'closure');
        const prevScope = this.currentScopeId;
        this.enterScope(scopeId);
        for (const param of node.params || []) {
            const paramType = { kind: typechecker_1.TypeKind.ANY };
            this.declareSymbol(param.name || '', paramType, param.line, param.column);
        }
        const parentScope = this.scopes[prevScope];
        for (const name of Object.keys(parentScope.entries)) {
            capturedVars.push(name);
        }
        if (node.body) {
            if (Array.isArray(node.body)) {
                for (const child of node.body) {
                    this.checkNode(child);
                }
            }
            else {
                this.checkNode(node.body);
            }
        }
        this.exitScope();
        const closureType = {
            kind: typechecker_1.TypeKind.CLOSURE,
            capturedVars,
        };
        this.types[nodeId] = closureType;
        this.addPropagation(nodeId, closureType, node.line, node.column);
        return closureType;
    }
}
exports.TypeChecker = TypeChecker;
//# sourceMappingURL=TypeChecker.js.map