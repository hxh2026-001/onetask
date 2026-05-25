import { LexerResult } from './lexer';
import { ParserResult } from './ast';
import { TypeCheckResult } from './typechecker';
import { CodeGenResult } from './codegen';
export interface CompilerInput {
    code: string;
    scenario?: string;
}
export interface CompileStep {
    phase: 'lexer' | 'parser' | 'typechecker' | 'codegen';
    status: 'pending' | 'running' | 'completed' | 'error';
    timestamp: number;
}
export interface CompilerOutput {
    success: boolean;
    lexerResult: LexerResult;
    parserResult: ParserResult;
    typeCheckResult: TypeCheckResult;
    codeGenResult: CodeGenResult;
    steps: CompileStep[];
    totalTime: number;
    errorPhase?: string;
}
export interface CodeSnippet {
    id: string;
    code: string;
    scenario: string;
    createdAt: string;
    result?: CompilerOutput;
}
export interface ErrorLog {
    id: string;
    snippetId: string;
    phase: string;
    message: string;
    line: number;
    column: number;
    createdAt: string;
}
//# sourceMappingURL=compiler.d.ts.map