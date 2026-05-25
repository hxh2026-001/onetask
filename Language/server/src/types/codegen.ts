export interface GeneratedLine {
  lineNumber: number;
  code: string;
  comment?: string;
  type: 'code' | 'label' | 'comment' | 'data' | 'header';
}

export interface ClosureCaptureInfo {
  varName: string;
  originalScopeId: number;
  captureDepth: number;
  offset: number;
  addressError?: boolean;
}

export interface CodeGenError {
  line: number;
  column: number;
  message: string;
  closureInfo?: ClosureCaptureInfo;
}

export interface CodeGenResult {
  lines: GeneratedLine[];
  errors: CodeGenError[];
  closureOffsets: Record<string, number>;
  addressErrors: ClosureCaptureInfo[];
  lineEvents: {
    lineNumber: number;
    timestamp: number;
  }[];
}
