"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTNodeType = void 0;
var ASTNodeType;
(function (ASTNodeType) {
    ASTNodeType["PROGRAM"] = "Program";
    ASTNodeType["VARIABLE_DECLARATION"] = "VariableDeclaration";
    ASTNodeType["VARIABLE_DECLARATOR"] = "VariableDeclarator";
    ASTNodeType["FUNCTION_DECLARATION"] = "FunctionDeclaration";
    ASTNodeType["BLOCK_STATEMENT"] = "BlockStatement";
    ASTNodeType["EXPRESSION_STATEMENT"] = "ExpressionStatement";
    ASTNodeType["RETURN_STATEMENT"] = "ReturnStatement";
    ASTNodeType["IF_STATEMENT"] = "IfStatement";
    ASTNodeType["WHILE_STATEMENT"] = "WhileStatement";
    ASTNodeType["FOR_STATEMENT"] = "ForStatement";
    ASTNodeType["BINARY_EXPRESSION"] = "BinaryExpression";
    ASTNodeType["UNARY_EXPRESSION"] = "UnaryExpression";
    ASTNodeType["CALL_EXPRESSION"] = "CallExpression";
    ASTNodeType["MEMBER_EXPRESSION"] = "MemberExpression";
    ASTNodeType["ASSIGNMENT_EXPRESSION"] = "AssignmentExpression";
    ASTNodeType["IDENTIFIER"] = "Identifier";
    ASTNodeType["NUMBER_LITERAL"] = "NumberLiteral";
    ASTNodeType["STRING_LITERAL"] = "StringLiteral";
    ASTNodeType["BOOLEAN_LITERAL"] = "BooleanLiteral";
    ASTNodeType["CLOSURE_EXPRESSION"] = "ClosureExpression";
    ASTNodeType["ARGUMENT_LIST"] = "ArgumentList";
})(ASTNodeType || (exports.ASTNodeType = ASTNodeType = {}));
//# sourceMappingURL=ast.js.map