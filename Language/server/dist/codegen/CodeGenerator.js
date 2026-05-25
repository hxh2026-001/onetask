"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = void 0;
const ast_1 = require("../types/ast");
class CodeGenerator {
    constructor() {
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
    }
    generate(ast, scopes) {
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
    buildResult() {
        return {
            lines: this.lines,
            errors: this.errors,
            closureOffsets: this.closureOffsets,
            addressErrors: this.addressErrors,
            lineEvents: this.lineEvents,
        };
    }
    addCode(assembly, comment) {
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
    addLabel(label) {
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
    addComment(comment) {
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
    addHeader(header) {
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
    generateNode(node, indent = '') {
        switch (node.type) {
            case ast_1.ASTNodeType.PROGRAM:
                this.generateProgram(node, indent);
                break;
            case ast_1.ASTNodeType.VARIABLE_DECLARATION:
                this.generateVariableDeclaration(node, indent);
                break;
            case ast_1.ASTNodeType.FUNCTION_DECLARATION:
                this.generateFunctionDeclaration(node, indent);
                break;
            case ast_1.ASTNodeType.BLOCK_STATEMENT:
                this.generateBlockStatement(node, indent);
                break;
            case ast_1.ASTNodeType.EXPRESSION_STATEMENT:
                this.generateExpressionStatement(node, indent);
                break;
            case ast_1.ASTNodeType.RETURN_STATEMENT:
                this.generateReturnStatement(node, indent);
                break;
            case ast_1.ASTNodeType.IF_STATEMENT:
                this.generateIfStatement(node, indent);
                break;
            case ast_1.ASTNodeType.WHILE_STATEMENT:
                this.generateWhileStatement(node, indent);
                break;
            case ast_1.ASTNodeType.BINARY_EXPRESSION:
                this.generateBinaryExpression(node, indent);
                break;
            case ast_1.ASTNodeType.UNARY_EXPRESSION:
                this.generateUnaryExpression(node, indent);
                break;
            case ast_1.ASTNodeType.CALL_EXPRESSION:
                this.generateCallExpression(node, indent);
                break;
            case ast_1.ASTNodeType.ASSIGNMENT_EXPRESSION:
                this.generateAssignmentExpression(node, indent);
                break;
            case ast_1.ASTNodeType.IDENTIFIER:
                this.generateIdentifier(node, indent);
                break;
            case ast_1.ASTNodeType.NUMBER_LITERAL:
                this.generateNumberLiteral(node, indent);
                break;
            case ast_1.ASTNodeType.STRING_LITERAL:
                this.generateStringLiteral(node, indent);
                break;
            case ast_1.ASTNodeType.BOOLEAN_LITERAL:
                this.generateBooleanLiteral(node, indent);
                break;
            case ast_1.ASTNodeType.CLOSURE_EXPRESSION:
                this.generateClosureExpression(node, indent);
                break;
        }
    }
    generateProgram(node, indent) {
        const body = node.body;
        if (Array.isArray(body)) {
            for (const child of body) {
                this.generateNode(child, indent);
            }
        }
        else if (body) {
            this.generateNode(body, indent);
        }
    }
    generateVariableDeclaration(node, indent) {
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
    generateFunctionDeclaration(node, indent) {
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
            }
            else {
                this.generateNode(node.body, indent + '  ');
            }
        }
        this.addCode(`${indent}RET`, 'Return from function');
        this.currentAddress = savedAddress;
    }
    generateBlockStatement(node, indent) {
        const body = node.body;
        if (Array.isArray(body)) {
            for (const child of body) {
                this.generateNode(child, indent);
            }
        }
        else if (body) {
            this.generateNode(body, indent);
        }
    }
    generateExpressionStatement(node, indent) {
        const body = node.body;
        if (Array.isArray(body) && body.length > 0) {
            this.generateNode(body[0], indent);
        }
        else if (!Array.isArray(body) && body) {
            this.generateNode(body, indent);
        }
    }
    generateReturnStatement(node, indent) {
        if (node.argument) {
            this.generateNode(node.argument, indent);
        }
        this.addCode(`${indent}RET`, 'Return statement');
    }
    generateIfStatement(node, indent) {
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
    generateWhileStatement(node, indent) {
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
            }
            else {
                this.generateNode(node.body, indent + '  ');
            }
        }
        this.addCode(`${indent}JMP ${startLabel}`, 'Loop back');
        this.addLabel(endLabel);
    }
    generateBinaryExpression(node, indent) {
        const opMap = {
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
        if (node.left)
            this.generateNode(node.left, indent);
        if (node.right)
            this.generateNode(node.right, indent);
        const opCode = opMap[node.operator || ''] || 'NOP';
        this.addCode(`${indent}${opCode}`, node.operator);
    }
    generateUnaryExpression(node, indent) {
        if (node.argument) {
            this.generateNode(node.argument, indent);
        }
        if (node.operator === '-') {
            this.addCode(`${indent}NEG`, 'Negate');
        }
        else if (node.operator === '!') {
            this.addCode(`${indent}NOT`, 'Logical NOT');
        }
    }
    generateCallExpression(node, indent) {
        this.addComment(`${indent}Function call`);
        for (const arg of node.arguments || []) {
            this.generateNode(arg, indent);
            this.addCode(`${indent}PUSH`, 'Push argument');
        }
        if (node.callee?.type === ast_1.ASTNodeType.IDENTIFIER) {
            this.addCode(`${indent}CALL ${node.callee.name?.toUpperCase()}`, `Call ${node.callee.name}`);
        }
        else if (node.callee) {
            this.generateNode(node.callee, indent);
            this.addCode(`${indent}CALL_REG`, 'Call via register');
        }
    }
    generateAssignmentExpression(node, indent) {
        if (node.right) {
            this.generateNode(node.right, indent);
        }
        if (node.left?.type === ast_1.ASTNodeType.IDENTIFIER) {
            const varName = node.left.name || 'unknown';
            let address = this.varAddresses[varName];
            if (address === undefined) {
                address = this.allocateVariable(varName);
            }
            this.addCode(`${indent}STORE [${address}]`, `Assign ${varName}`);
        }
    }
    generateIdentifier(node, indent) {
        const varName = node.name || 'unknown';
        const address = this.varAddresses[varName];
        if (address !== undefined) {
            this.addCode(`${indent}LOAD [${address}]`, `Load ${varName} from ${address}`);
        }
        else {
            this.addCode(`${indent}LOAD ${varName}`, `Load ${varName} (unresolved)`);
            const error = {
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
    generateNumberLiteral(node, indent) {
        this.addCode(`${indent}PUSH ${node.value}`, `Push number ${node.value}`);
    }
    generateStringLiteral(node, indent) {
        this.addCode(`${indent}PUSH_STR ${node.value}`, `Push string`);
    }
    generateBooleanLiteral(node, indent) {
        this.addCode(`${indent}PUSH ${node.value === 'true' ? 1 : 0}`, `Push boolean ${node.value}`);
    }
    generateClosureExpression(node, indent) {
        const closureLabel = `CLOSURE_${this.labelCounter++}`;
        this.addComment(`${indent}Closure expression`);
        this.addCode(`${indent}ALLOC_CLOSURE`, 'Allocate closure object');
        const capturedVars = [];
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
            }
            else {
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
            }
            else {
                this.generateNode(node.body, indent + '  ');
            }
        }
        this.addCode(`${indent}CLOSURE_RET`, 'Closure return');
    }
    allocateVariable(name) {
        const address = this.currentAddress++;
        this.varAddresses[name] = address;
        return address;
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=CodeGenerator.js.map