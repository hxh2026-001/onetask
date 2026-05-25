import { Lexer } from '../lexer/Lexer';
import { Parser } from '../parser/Parser';
import { TypeChecker } from '../typechecker/TypeChecker';
import { CodeGenerator } from '../codegen/CodeGenerator';
import { CompilerInput, CompilerOutput, CompileStep } from '../types/compiler';
import { getDatabase } from '../database/DatabaseManager';
import { ParserResult } from '../types/ast';
import { LexerResult } from '../types/lexer';
import { TypeCheckResult } from '../types/typechecker';
import { CodeGenResult } from '../types/codegen';

export class Compiler {
  private db = getDatabase();

  compile(input: CompilerInput): CompilerOutput {
    const startTime = Date.now();
    const steps: CompileStep[] = [];
    let errorPhase: string | undefined;

    const lexerStep: CompileStep = {
      phase: 'lexer',
      status: 'running',
      timestamp: Date.now(),
    };
    steps.push(lexerStep);

    const lexer = new Lexer(input.code);
    const lexerResult = lexer.tokenize();

    if (lexerResult.errors.length > 0) {
      lexerStep.status = 'error';
      errorPhase = 'lexer';
    } else {
      lexerStep.status = 'completed';
    }

    const parserStep: CompileStep = {
      phase: 'parser',
      status: 'running',
      timestamp: Date.now(),
    };
    steps.push(parserStep);

    let parserResult: ParserResult;
    try {
      const parser = new Parser(lexerResult.tokens);
      parserResult = parser.parse();

      if (parserResult.errors.length > 0 || parserResult.infiniteLoopDetected) {
        parserStep.status = 'error';
        if (!errorPhase) errorPhase = 'parser';
      } else {
        parserStep.status = 'completed';
      }
    } catch (e: any) {
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
      if (!errorPhase) errorPhase = 'parser';
    }

    const typeCheckerStep: CompileStep = {
      phase: 'typechecker',
      status: 'running',
      timestamp: Date.now(),
    };
    steps.push(typeCheckerStep);

    let typeCheckResult: TypeCheckResult;
    try {
      const typeChecker = new TypeChecker();
      typeCheckResult = typeChecker.check(parserResult.ast);

      if (typeCheckResult.errors.length > 0) {
        typeCheckerStep.status = 'error';
        if (!errorPhase) errorPhase = 'typechecker';
      } else {
        typeCheckerStep.status = 'completed';
      }
    } catch (e: any) {
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
      if (!errorPhase) errorPhase = 'typechecker';
    }

    const codeGenStep: CompileStep = {
      phase: 'codegen',
      status: 'running',
      timestamp: Date.now(),
    };
    steps.push(codeGenStep);

    let codeGenResult: CodeGenResult;
    try {
      const codeGenerator = new CodeGenerator();
      codeGenResult = codeGenerator.generate(parserResult.ast, typeCheckResult.scopes);

      if (codeGenResult.errors.length > 0) {
        codeGenStep.status = 'error';
        if (!errorPhase) errorPhase = 'codegen';
      } else {
        codeGenStep.status = 'completed';
      }
    } catch (e: any) {
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
      if (!errorPhase) errorPhase = 'codegen';
    }

    const totalTime = Date.now() - startTime;

    const result: CompilerOutput = {
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
      const savedSnippet = this.db.saveSnippet(
        input.code,
        input.scenario || 'custom',
        JSON.stringify({
          success: result.success,
          errorPhase: result.errorPhase,
          totalTime: result.totalTime,
        })
      );

      const saveErrors = (phase: string, errors: any[]) => {
        for (const err of errors) {
          this.db.saveErrorLog(
            savedSnippet.id,
            phase,
            err.message || JSON.stringify(err),
            err.line || 0,
            err.column || 0
          );
        }
      };

      saveErrors('lexer', lexerResult.errors);
      saveErrors('parser', parserResult.errors);
      saveErrors('typechecker', typeCheckResult.errors);
      saveErrors('codegen', codeGenResult.errors);
    } catch (e) {
      // Database errors shouldn't affect compilation result
    }

    return result;
  }
}
