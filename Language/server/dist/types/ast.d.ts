export declare enum ASTNodeType {
    PROGRAM = "Program",
    VARIABLE_DECLARATION = "VariableDeclaration",
    VARIABLE_DECLARATOR = "VariableDeclarator",
    FUNCTION_DECLARATION = "FunctionDeclaration",
    BLOCK_STATEMENT = "BlockStatement",
    EXPRESSION_STATEMENT = "ExpressionStatement",
    RETURN_STATEMENT = "ReturnStatement",
    IF_STATEMENT = "IfStatement",
    WHILE_STATEMENT = "WhileStatement",
    FOR_STATEMENT = "ForStatement",
    BINARY_EXPRESSION = "BinaryExpression",
    UNARY_EXPRESSION = "UnaryExpression",
    CALL_EXPRESSION = "CallExpression",
    MEMBER_EXPRESSION = "MemberExpression",
    ASSIGNMENT_EXPRESSION = "AssignmentExpression",
    IDENTIFIER = "Identifier",
    NUMBER_LITERAL = "NumberLiteral",
    STRING_LITERAL = "StringLiteral",
    BOOLEAN_LITERAL = "BooleanLiteral",
    CLOSURE_EXPRESSION = "ClosureExpression",
    ARGUMENT_LIST = "ArgumentList"
}
export interface ASTNode {
    type: ASTNodeType;
    value?: string;
    name?: string;
    operator?: string;
    left?: ASTNode;
    right?: ASTNode;
    body?: ASTNode | ASTNode[];
    params?: ASTNode[];
    arguments?: ASTNode[];
    declarations?: ASTNode[];
    init?: ASTNode;
    test?: ASTNode;
    update?: ASTNode;
    consequent?: ASTNode;
    alternate?: ASTNode;
    argument?: ASTNode;
    expression?: ASTNode;
    id?: ASTNode;
    callee?: ASTNode;
    object?: ASTNode;
    property?: ASTNode;
    capturedVars?: string[];
    line: number;
    column: number;
    children: ASTNode[];
}
export interface ParserError {
    line: number;
    column: number;
    message: string;
    expected?: string;
    found?: string;
}
export interface ParserResult {
    ast: ASTNode | null;
    errors: ParserError[];
    infiniteLoopDetected: boolean;
    loopStackTrace: string[];
}
//# sourceMappingURL=ast.d.ts.map