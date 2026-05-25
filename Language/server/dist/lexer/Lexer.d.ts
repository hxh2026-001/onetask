import { LexerResult } from '../types/lexer';
export declare class Lexer {
    private input;
    private pos;
    private line;
    private column;
    private tokens;
    private errors;
    private trackTokens;
    constructor(input: string);
    tokenize(): LexerResult;
    private skipWhitespaceAndComments;
    private skipLineComment;
    private skipBlockComment;
    private nextToken;
    private readNumber;
    private readString;
    private readIdentifier;
    private tryReadOperator;
    private advance;
}
//# sourceMappingURL=Lexer.d.ts.map