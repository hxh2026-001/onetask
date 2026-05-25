"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["KEYWORD"] = "KEYWORD";
    TokenType["OPERATOR"] = "OPERATOR";
    TokenType["DELIMITER"] = "DELIMITER";
    TokenType["BOOLEAN"] = "BOOLEAN";
    TokenType["COMMENT"] = "COMMENT";
    TokenType["WHITESPACE"] = "WHITESPACE";
    TokenType["NEWLINE"] = "NEWLINE";
    TokenType["EOF"] = "EOF";
    TokenType["ILLEGAL"] = "ILLEGAL";
})(TokenType || (exports.TokenType = TokenType = {}));
//# sourceMappingURL=lexer.js.map