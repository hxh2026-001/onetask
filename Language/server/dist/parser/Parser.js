"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const lexer_1 = require("../types/lexer");
const ast_1 = require("../types/ast");
const MAX_RECURSION_DEPTH = 50;
const LEFT_RECURSION_THRESHOLD = 30;
const MAX_STACK_TRACE_SIZE = 50;
class Parser {
    constructor(tokens) {
        this.pos = 0;
        this.errors = [];
        this.recursionDepth = 0;
        this.recursionStack = [];
        this.infiniteLoopDetected = false;
        this.loopStackTrace = [];
        this.callCounts = new Map();
        this.tokens = tokens.filter(t => t.type !== lexer_1.TokenType.NEWLINE &&
            t.type !== lexer_1.TokenType.COMMENT &&
            t.type !== lexer_1.TokenType.WHITESPACE);
    }
    parse() {
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
    trackRecursion(name) {
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
    untrackRecursion() {
        this.recursionDepth--;
        this.recursionStack.pop();
    }
    createNode(type, token, extra = {}) {
        return {
            type,
            line: token?.line || 0,
            column: token?.column || 0,
            children: [],
            ...extra,
        };
    }
    currentToken() {
        if (this.pos >= this.tokens.length)
            return null;
        return this.tokens[this.pos];
    }
    consume() {
        const token = this.tokens[this.pos];
        this.pos++;
        return token;
    }
    expect(type, value) {
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
    match(type, value) {
        const token = this.currentToken();
        if (!token)
            return false;
        return token.type === type && (!value || token.value === value);
    }
    skipNewlines() {
        while (this.currentToken()?.type === lexer_1.TokenType.NEWLINE) {
            this.consume();
        }
    }
    parseProgram() {
        this.trackRecursion('Program');
        try {
            const token = this.currentToken();
            const program = this.createNode(ast_1.ASTNodeType.PROGRAM, token, {
                body: [],
                children: [],
            });
            this.skipNewlines();
            while (this.currentToken() && this.currentToken().type !== lexer_1.TokenType.EOF) {
                this.skipNewlines();
                const stmt = this.parseStatement();
                if (stmt && program.body && Array.isArray(program.body)) {
                    program.body.push(stmt);
                    program.children.push(stmt);
                }
                this.skipNewlines();
            }
            this.untrackRecursion();
            return program;
        }
        catch (e) {
            this.untrackRecursion();
            if (this.infiniteLoopDetected)
                return null;
            throw e;
        }
    }
    parseStatement() {
        this.skipNewlines();
        const token = this.currentToken();
        if (!token || token.type === lexer_1.TokenType.EOF)
            return null;
        if (token.type === lexer_1.TokenType.KEYWORD) {
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
    parseVariableDeclaration() {
        this.trackRecursion('VariableDeclaration');
        try {
            const kindToken = this.consume();
            const declarations = [];
            const parseDeclarator = () => {
                const idToken = this.expect(lexer_1.TokenType.IDENTIFIER);
                const id = this.createNode(ast_1.ASTNodeType.IDENTIFIER, idToken, {
                    name: idToken?.value || '',
                });
                let init;
                if (this.match(lexer_1.TokenType.OPERATOR, '=')) {
                    this.consume();
                    const initExpr = this.parseExpression();
                    if (initExpr)
                        init = initExpr;
                }
                const declarator = this.createNode(ast_1.ASTNodeType.VARIABLE_DECLARATOR, idToken, {
                    id,
                    init,
                });
                if (init)
                    declarator.children.push(init);
                return declarator;
            };
            declarations.push(parseDeclarator());
            while (this.match(lexer_1.TokenType.DELIMITER, ',')) {
                this.consume();
                declarations.push(parseDeclarator());
            }
            if (this.match(lexer_1.TokenType.DELIMITER, ';')) {
                this.consume();
            }
            const node = this.createNode(ast_1.ASTNodeType.VARIABLE_DECLARATION, kindToken, {
                declarations,
            });
            node.children = declarations;
            this.untrackRecursion();
            return node;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseFunctionDeclaration() {
        this.trackRecursion('FunctionDeclaration');
        try {
            const fnToken = this.consume();
            const idToken = this.expect(lexer_1.TokenType.IDENTIFIER);
            const id = this.createNode(ast_1.ASTNodeType.IDENTIFIER, idToken, {
                name: idToken?.value || '',
            });
            this.expect(lexer_1.TokenType.DELIMITER, '(');
            const params = [];
            if (!this.match(lexer_1.TokenType.DELIMITER, ')')) {
                const paramToken = this.expect(lexer_1.TokenType.IDENTIFIER);
                if (paramToken) {
                    params.push(this.createNode(ast_1.ASTNodeType.IDENTIFIER, paramToken, {
                        name: paramToken.value || '',
                    }));
                }
                while (this.match(lexer_1.TokenType.DELIMITER, ',')) {
                    this.consume();
                    const pToken = this.expect(lexer_1.TokenType.IDENTIFIER);
                    if (pToken) {
                        params.push(this.createNode(ast_1.ASTNodeType.IDENTIFIER, pToken, {
                            name: pToken.value || '',
                        }));
                    }
                }
            }
            this.expect(lexer_1.TokenType.DELIMITER, ')');
            this.expect(lexer_1.TokenType.DELIMITER, '{');
            const body = this.parseBlockStatement();
            const node = this.createNode(ast_1.ASTNodeType.FUNCTION_DECLARATION, fnToken, {
                id,
                params,
                body,
            });
            if (body)
                node.children.push(body);
            this.untrackRecursion();
            return node;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseBlockStatement() {
        const token = this.currentToken();
        const body = [];
        while (this.currentToken() && !this.match(lexer_1.TokenType.DELIMITER, '}')) {
            this.skipNewlines();
            if (this.match(lexer_1.TokenType.DELIMITER, '}'))
                break;
            const stmt = this.parseStatement();
            if (stmt)
                body.push(stmt);
            this.skipNewlines();
        }
        if (this.match(lexer_1.TokenType.DELIMITER, '}')) {
            this.consume();
        }
        return this.createNode(ast_1.ASTNodeType.BLOCK_STATEMENT, token, {
            body,
            children: body,
        });
    }
    parseReturnStatement() {
        const returnToken = this.consume();
        let argument;
        if (!this.match(lexer_1.TokenType.DELIMITER, ';') && !this.match(lexer_1.TokenType.DELIMITER, '}')) {
            const argExpr = this.parseExpression();
            if (argExpr)
                argument = argExpr;
        }
        if (this.match(lexer_1.TokenType.DELIMITER, ';')) {
            this.consume();
        }
        return this.createNode(ast_1.ASTNodeType.RETURN_STATEMENT, returnToken, {
            argument,
            children: argument ? [argument] : [],
        });
    }
    parseIfStatement() {
        this.trackRecursion('IfStatement');
        try {
            const ifToken = this.consume();
            this.expect(lexer_1.TokenType.DELIMITER, '(');
            const test = this.parseExpression();
            this.expect(lexer_1.TokenType.DELIMITER, ')');
            this.expect(lexer_1.TokenType.DELIMITER, '{');
            const consequent = this.parseBlockStatement();
            let alternate;
            this.skipNewlines();
            if (this.match(lexer_1.TokenType.KEYWORD, 'else')) {
                this.consume();
                this.expect(lexer_1.TokenType.DELIMITER, '{');
                alternate = this.parseBlockStatement();
            }
            const node = this.createNode(ast_1.ASTNodeType.IF_STATEMENT, ifToken, {
                test: test || undefined,
                consequent,
                alternate,
            });
            if (test)
                node.children.push(test);
            if (consequent)
                node.children.push(consequent);
            if (alternate)
                node.children.push(alternate);
            this.untrackRecursion();
            return node;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseWhileStatement() {
        this.trackRecursion('WhileStatement');
        try {
            const whileToken = this.consume();
            this.expect(lexer_1.TokenType.DELIMITER, '(');
            const test = this.parseExpression();
            this.expect(lexer_1.TokenType.DELIMITER, ')');
            this.expect(lexer_1.TokenType.DELIMITER, '{');
            const body = this.parseBlockStatement();
            const node = this.createNode(ast_1.ASTNodeType.WHILE_STATEMENT, whileToken, {
                test: test || undefined,
                body,
            });
            if (test)
                node.children.push(test);
            if (body)
                node.children.push(body);
            this.untrackRecursion();
            return node;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseForStatement() {
        this.trackRecursion('ForStatement');
        try {
            const forToken = this.consume();
            this.expect(lexer_1.TokenType.DELIMITER, '(');
            const init = this.parseExpression();
            this.expect(lexer_1.TokenType.DELIMITER, ';');
            const test = this.parseExpression();
            this.expect(lexer_1.TokenType.DELIMITER, ';');
            const update = this.parseExpression();
            this.expect(lexer_1.TokenType.DELIMITER, ')');
            this.expect(lexer_1.TokenType.DELIMITER, '{');
            const body = this.parseBlockStatement();
            const node = this.createNode(ast_1.ASTNodeType.FOR_STATEMENT, forToken, {
                init: init || undefined,
                test: test || undefined,
                update: update || undefined,
                body,
            });
            this.untrackRecursion();
            return node;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseExpressionStatement() {
        const token = this.currentToken();
        const expr = this.parseExpression();
        if (this.match(lexer_1.TokenType.DELIMITER, ';')) {
            this.consume();
        }
        return this.createNode(ast_1.ASTNodeType.EXPRESSION_STATEMENT, token, {
            expression: expr || undefined,
            children: expr ? [expr] : [],
        });
    }
    parseExpression() {
        this.trackRecursion('Expression');
        try {
            const expr = this.parseAssignment();
            this.untrackRecursion();
            return expr;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseAssignment() {
        this.trackRecursion('Assignment');
        try {
            const left = this.parseLogicalOr();
            if (!left)
                return null;
            if (this.match(lexer_1.TokenType.OPERATOR, '=') ||
                this.match(lexer_1.TokenType.OPERATOR, '+=') ||
                this.match(lexer_1.TokenType.OPERATOR, '-=') ||
                this.match(lexer_1.TokenType.OPERATOR, '*=') ||
                this.match(lexer_1.TokenType.OPERATOR, '/=')) {
                const opToken = this.consume();
                const right = this.parseAssignment();
                const node = this.createNode(ast_1.ASTNodeType.ASSIGNMENT_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                });
                if (right)
                    node.children = [left, right];
                this.untrackRecursion();
                return node;
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseLogicalOr() {
        this.trackRecursion('LogicalOr');
        try {
            let left = this.parseLogicalAnd();
            if (!left)
                return null;
            while (this.match(lexer_1.TokenType.OPERATOR, '||')) {
                const opToken = this.consume();
                const right = this.parseLogicalAnd();
                left = this.createNode(ast_1.ASTNodeType.BINARY_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                    children: right ? [left, right] : [left],
                });
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseLogicalAnd() {
        this.trackRecursion('LogicalAnd');
        try {
            let left = this.parseEquality();
            if (!left)
                return null;
            while (this.match(lexer_1.TokenType.OPERATOR, '&&')) {
                const opToken = this.consume();
                const right = this.parseEquality();
                left = this.createNode(ast_1.ASTNodeType.BINARY_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                    children: right ? [left, right] : [left],
                });
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseEquality() {
        this.trackRecursion('Equality');
        try {
            let left = this.parseRelational();
            if (!left)
                return null;
            while (this.match(lexer_1.TokenType.OPERATOR, '==') || this.match(lexer_1.TokenType.OPERATOR, '!=')) {
                const opToken = this.consume();
                const right = this.parseRelational();
                left = this.createNode(ast_1.ASTNodeType.BINARY_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                    children: right ? [left, right] : [left],
                });
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseRelational() {
        this.trackRecursion('Relational');
        try {
            let left = this.parseAdditive();
            if (!left)
                return null;
            while (this.match(lexer_1.TokenType.OPERATOR, '<') || this.match(lexer_1.TokenType.OPERATOR, '>') ||
                this.match(lexer_1.TokenType.OPERATOR, '<=') || this.match(lexer_1.TokenType.OPERATOR, '>=')) {
                const opToken = this.consume();
                const right = this.parseAdditive();
                left = this.createNode(ast_1.ASTNodeType.BINARY_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                    children: right ? [left, right] : [left],
                });
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseAdditive() {
        this.trackRecursion('Additive');
        try {
            let left = this.parseMultiplicative();
            if (!left)
                return null;
            while (this.match(lexer_1.TokenType.OPERATOR, '+') || this.match(lexer_1.TokenType.OPERATOR, '-')) {
                const opToken = this.consume();
                const right = this.parseMultiplicative();
                left = this.createNode(ast_1.ASTNodeType.BINARY_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                    children: right ? [left, right] : [left],
                });
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseMultiplicative() {
        this.trackRecursion('Multiplicative');
        try {
            let left = this.parseUnary();
            if (!left)
                return null;
            while (this.match(lexer_1.TokenType.OPERATOR, '*') || this.match(lexer_1.TokenType.OPERATOR, '/') ||
                this.match(lexer_1.TokenType.OPERATOR, '%')) {
                const opToken = this.consume();
                const right = this.parseUnary();
                left = this.createNode(ast_1.ASTNodeType.BINARY_EXPRESSION, opToken, {
                    operator: opToken.value,
                    left,
                    right: right || undefined,
                    children: right ? [left, right] : [left],
                });
            }
            this.untrackRecursion();
            return left;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parseUnary() {
        if (this.match(lexer_1.TokenType.OPERATOR, '-') || this.match(lexer_1.TokenType.OPERATOR, '!') ||
            this.match(lexer_1.TokenType.OPERATOR, '++') || this.match(lexer_1.TokenType.OPERATOR, '--')) {
            const opToken = this.consume();
            const operand = this.parseUnary();
            return this.createNode(ast_1.ASTNodeType.UNARY_EXPRESSION, opToken, {
                operator: opToken.value,
                argument: operand || undefined,
                children: operand ? [operand] : [],
            });
        }
        return this.parseCallMember();
    }
    parseCallMember() {
        let expr = this.parsePrimary();
        if (!expr)
            return null;
        while (true) {
            if (this.match(lexer_1.TokenType.DELIMITER, '(')) {
                this.consume();
                const args = [];
                if (!this.match(lexer_1.TokenType.DELIMITER, ')')) {
                    const firstArg = this.parseExpression();
                    if (firstArg)
                        args.push(firstArg);
                    while (this.match(lexer_1.TokenType.DELIMITER, ',')) {
                        this.consume();
                        const arg = this.parseExpression();
                        if (arg)
                            args.push(arg);
                    }
                }
                this.expect(lexer_1.TokenType.DELIMITER, ')');
                expr = this.createNode(ast_1.ASTNodeType.CALL_EXPRESSION, this.currentToken(), {
                    callee: expr,
                    arguments: args,
                });
            }
            else if (this.match(lexer_1.TokenType.DELIMITER, '.')) {
                this.consume();
                const propToken = this.expect(lexer_1.TokenType.IDENTIFIER);
                expr = this.createNode(ast_1.ASTNodeType.MEMBER_EXPRESSION, propToken, {
                    object: expr,
                    property: this.createNode(ast_1.ASTNodeType.IDENTIFIER, propToken, { name: propToken?.value || '' }),
                });
            }
            else {
                break;
            }
        }
        return expr;
    }
    parseClosureExpression() {
        this.trackRecursion('ClosureExpression');
        try {
            const closureToken = this.consume();
            this.expect(lexer_1.TokenType.DELIMITER, '|');
            const params = [];
            if (!this.match(lexer_1.TokenType.DELIMITER, '|')) {
                const paramToken = this.expect(lexer_1.TokenType.IDENTIFIER);
                if (paramToken) {
                    params.push(this.createNode(ast_1.ASTNodeType.IDENTIFIER, paramToken, {
                        name: paramToken.value || '',
                    }));
                }
                while (this.match(lexer_1.TokenType.DELIMITER, ',')) {
                    this.consume();
                    const pToken = this.expect(lexer_1.TokenType.IDENTIFIER);
                    if (pToken) {
                        params.push(this.createNode(ast_1.ASTNodeType.IDENTIFIER, pToken, {
                            name: pToken.value || '',
                        }));
                    }
                }
            }
            this.expect(lexer_1.TokenType.DELIMITER, '|');
            this.expect(lexer_1.TokenType.DELIMITER, '{');
            const body = this.parseBlockStatement();
            const node = this.createNode(ast_1.ASTNodeType.CLOSURE_EXPRESSION, closureToken, {
                params,
                body,
            });
            this.untrackRecursion();
            return node;
        }
        catch (e) {
            this.untrackRecursion();
            throw e;
        }
    }
    parsePrimary() {
        const token = this.currentToken();
        if (!token)
            return null;
        switch (token.type) {
            case lexer_1.TokenType.NUMBER:
                this.consume();
                return this.createNode(ast_1.ASTNodeType.NUMBER_LITERAL, token, {
                    value: token.value,
                });
            case lexer_1.TokenType.STRING:
                this.consume();
                return this.createNode(ast_1.ASTNodeType.STRING_LITERAL, token, {
                    value: token.value,
                });
            case lexer_1.TokenType.BOOLEAN:
                this.consume();
                return this.createNode(ast_1.ASTNodeType.BOOLEAN_LITERAL, token, {
                    value: token.value,
                });
            case lexer_1.TokenType.IDENTIFIER:
                this.consume();
                return this.createNode(ast_1.ASTNodeType.IDENTIFIER, token, {
                    name: token.value,
                });
            case lexer_1.TokenType.DELIMITER:
                if (token.value === '(') {
                    this.consume();
                    const expr = this.parseExpression();
                    this.expect(lexer_1.TokenType.DELIMITER, ')');
                    return expr;
                }
                if (token.value === '{') {
                    return this.parseBlockStatement();
                }
                break;
            case lexer_1.TokenType.KEYWORD:
                if (token.value === 'closure' || token.value === 'lambda') {
                    return this.parseClosureExpression();
                }
                if (token.value === 'true' || token.value === 'false') {
                    this.consume();
                    return this.createNode(ast_1.ASTNodeType.BOOLEAN_LITERAL, token, {
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
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map