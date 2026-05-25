export declare enum TypeKind {
    NUMBER = "number",
    STRING = "string",
    BOOLEAN = "boolean",
    VOID = "void",
    FUNCTION = "function",
    CLOSURE = "closure",
    ANY = "any",
    UNKNOWN = "unknown",
    NEVER = "never"
}
export interface TypeInfo {
    kind: TypeKind;
    name?: string;
    params?: TypeInfo[];
    returnType?: TypeInfo;
    implicitConversions?: string[];
    capturedVars?: string[];
}
export interface SymbolEntry {
    name: string;
    type: TypeInfo;
    scopeId: number;
    line: number;
    column: number;
    isDeclared: boolean;
    isCaptured?: boolean;
    captureDepth?: number;
}
export interface Scope {
    id: number;
    parentId: number | null;
    entries: Record<string, SymbolEntry>;
    isFunction: boolean;
    functionName?: string;
}
export interface TypeCheckError {
    line: number;
    column: number;
    message: string;
    expectedType?: string;
    actualType?: string;
    implicitConversionChain?: string[];
    precisionLoss?: boolean;
    shadowingWarning?: boolean;
    undeclaredVariable?: string;
}
export interface TypePropagationEvent {
    nodeId: string;
    type: TypeInfo;
    fromNode?: string;
    line: number;
    column: number;
}
export interface TypeCheckResult {
    types: Record<string, TypeInfo>;
    scopes: Record<number, Scope>;
    errors: TypeCheckError[];
    propagationEvents: TypePropagationEvent[];
    shadowingDetections: {
        name: string;
        outerLine: number;
        innerLine: number;
        scopeId: number;
    }[];
    undeclaredAccesses: {
        name: string;
        line: number;
        scopeId: number;
        resolvedScopeId: number | null;
    }[];
}
//# sourceMappingURL=typechecker.d.ts.map