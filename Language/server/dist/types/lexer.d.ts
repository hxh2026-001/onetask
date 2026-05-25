export declare enum TokenType {
    NUMBER = "NUMBER",
    STRING = "STRING",
    IDENTIFIER = "IDENTIFIER",
    KEYWORD = "KEYWORD",
    OPERATOR = "OPERATOR",
    DELIMITER = "DELIMITER",
    BOOLEAN = "BOOLEAN",
    COMMENT = "COMMENT",
    WHITESPACE = "WHITESPACE",
    NEWLINE = "NEWLINE",
    EOF = "EOF",
    ILLEGAL = "ILLEGAL"
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
    start: number;
    end: number;
}
export interface LexerError {
    line: number;
    column: number;
    message: string;
    token: string;
}
export interface LexerResult {
    tokens: Token[];
    errors: LexerError[];
}
//# sourceMappingURL=lexer.d.ts.map