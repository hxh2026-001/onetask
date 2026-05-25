"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const Lexer_1 = require("../lexer/Lexer");
const Parser_1 = require("../parser/Parser");
const TypeChecker_1 = require("../typechecker/TypeChecker");
const CodeGenerator_1 = require("../codegen/CodeGenerator");
const DatabaseManager_1 = require("../database/DatabaseManager");
class Compiler {
    constructor() {
        this.db = (0, DatabaseManager_1.getDatabase)();
    }
    compile(input) {
        const startTime = Date.now();
        const steps = [];
        let errorPhase;
        const lexerStep = {
            phase: 'lexer',
            status: 'running',
            timestamp: Date.now(),
        };
        steps.push(lexerStep);
        const lexer = new Lexer_1.Lexer(input.code);
        const lexerResult = lexer.tokenize();
        if (lexerResult.errors.length > 0) {
            lexerStep.status = 'error';
            errorPhase = 'lexer';
        }
        else {
            lexerStep.status = 'completed';
        }
        const parserStep = {
            phase: 'parser',
            status: 'running',
            timestamp: Date.now(),
        };
        steps.push(parserStep);
        let parserResult;
        try {
            const parser = new Parser_1.Parser(lexerResult.tokens);
            parserResult = parser.parse();
            if (parserResult.errors.length > 0 || parserResult.infiniteLoopDetected) {
                parserStep.status = 'error';
                if (!errorPhase)
                    errorPhase = 'parser';
            }
            else {
                parserStep.status = 'completed';
            }
        }
        catch (e) {
            parserResult = {
                ast: null,
                errors: [{
                        line: 0,
                        column: 0,
                        message: e.message || '解析错误',
                    }],
                infiniteLoopDetected: true,
                loopStackTrace: [],
            };
            parserStep.status = 'error';
            if (!errorPhase)
                errorPhase = 'parser';
        }
        const typeCheckerStep = {
            phase: 'typechecker',
            status: 'running',
            timestamp: Date.now(),
        };
        steps.push(typeCheckerStep);
        let typeCheckResult;
        try {
            const typeChecker = new TypeChecker_1.TypeChecker();
            typeCheckResult = typeChecker.check(parserResult.ast);
            if (typeCheckResult.errors.length > 0) {
                typeCheckerStep.status = 'error';
                if (!errorPhase)
                    errorPhase = 'typechecker';
            }
            else {
                typeCheckerStep.status = 'completed';
            }
        }
        catch (e) {
            typeCheckResult = {
                types: {},
                scopes: {},
                errors: [{
                        line: 0,
                        column: 0,
                        message: e.message || '类型检查错误',
                    }],
                propagationEvents: [],
                shadowingDetections: [],
                undeclaredAccesses: [],
            };
            typeCheckerStep.status = 'error';
            if (!errorPhase)
                errorPhase = 'typechecker';
        }
        const codeGenStep = {
            phase: 'codegen',
            status: 'running',
            timestamp: Date.now(),
        };
        steps.push(codeGenStep);
        let codeGenResult;
        try {
            const codeGenerator = new CodeGenerator_1.CodeGenerator();
            codeGenResult = codeGenerator.generate(parserResult.ast, typeCheckResult.scopes);
            if (codeGenResult.errors.length > 0) {
                codeGenStep.status = 'error';
                if (!errorPhase)
                    errorPhase = 'codegen';
            }
            else {
                codeGenStep.status = 'completed';
            }
        }
        catch (e) {
            codeGenResult = {
                lines: [],
                errors: [{
                        line: 0,
                        column: 0,
                        message: e.message || '代码生成错误',
                    }],
                closureOffsets: {},
                addressErrors: [],
                lineEvents: [],
            };
            codeGenStep.status = 'error';
            if (!errorPhase)
                errorPhase = 'codegen';
        }
        const totalTime = Date.now() - startTime;
        const result = {
            success: !errorPhase,
            lexerResult,
            parserResult,
            typeCheckResult,
            codeGenResult,
            steps,
            totalTime,
            errorPhase,
        };
        try {
            const savedSnippet = this.db.saveSnippet(input.code, input.scenario || 'custom', JSON.stringify({
                success: result.success,
                errorPhase: result.errorPhase,
                totalTime: result.totalTime,
            }));
            const saveErrors = (phase, errors) => {
                for (const err of errors) {
                    this.db.saveErrorLog(savedSnippet.id, phase, err.message || JSON.stringify(err), err.line || 0, err.column || 0);
                }
            };
            saveErrors('lexer', lexerResult.errors);
            saveErrors('parser', parserResult.errors);
            saveErrors('typechecker', typeCheckResult.errors);
            saveErrors('codegen', codeGenResult.errors);
        }
        catch (e) {
            // Database errors shouldn't affect compilation result
        }
        return result;
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=Compiler.js.map