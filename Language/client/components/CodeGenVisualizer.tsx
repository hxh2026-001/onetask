'use client';

import { useState, useEffect } from 'react';

interface GeneratedLine {
  lineNumber: number;
  code: string;
  comment?: string;
  type: 'code' | 'label' | 'comment' | 'data' | 'header';
}

interface CodeGenError {
  line: number;
  column: number;
  message: string;
}

interface ClosureCaptureInfo {
  varName: string;
  offset: number;
  addressError?: boolean;
}

interface CodeGenResult {
  lines: GeneratedLine[];
  errors: CodeGenError[];
  addressErrors: ClosureCaptureInfo[];
}

interface CodeGenVisualizerProps {
  codeResult: CodeGenResult | null;
  isCompiling: boolean;
}

export default function CodeGenVisualizer({ codeResult, isCompiling }: CodeGenVisualizerProps) {
  const [visibleLines, setVisibleLines] = useState<GeneratedLine[]>([]);
  const [currentLine, setCurrentLine] = useState(-1);

  useEffect(() => {
    if (!codeResult?.lines) {
      setVisibleLines([]);
      setCurrentLine(-1);
      return;
    }

    setVisibleLines([]);
    setCurrentLine(-1);

    const lines = codeResult.lines;
    let index = 0;

    const interval = setInterval(() => {
      if (index < lines.length) {
        setVisibleLines(prev => [...prev, lines[index]]);
        setCurrentLine(index);
        index++;
      } else {
        clearInterval(interval);
        setCurrentLine(-1);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [codeResult?.lines]);

  if (!codeResult || isCompiling) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
        <div>{isCompiling ? '正在生成目标代码...' : '点击"编译运行"生成代码'}</div>
      </div>
    );
  }

  const errors = codeResult.errors || [];
  const addressErrors = codeResult.addressErrors || [];

  return (
    <div className="code-gen-container">
      {errors.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#f85149', marginBottom: '8px' }}>
            ⚠️ 代码生成错误 ({errors.length})
          </h3>
          <div className="error-list">
            {errors.map((error, idx) => (
              <div key={idx} className="error-item">
                <div className="error-header">
                  <span className="error-phase codegen">代码生成</span>
                  <span className="error-location">L{error.line}:C{error.column}</span>
                </div>
                <div className="error-message">{error.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {addressErrors.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#d29922', marginBottom: '8px' }}>
            🔒 闭包地址偏移错误 ({addressErrors.length})
          </h3>
          <div className="error-list">
            {addressErrors.map((err, idx) => (
              <div key={idx} className="error-item type-warning">
                <div className="error-header">
                  <span className="error-phase" style={{ background: '#d29922', color: '#0d1117' }}>
                    地址错误
                  </span>
                </div>
                <div className="error-message">
                  变量 '{err.varName}' 地址偏移错误 (偏移: {err.offset})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '16px',
        fontFamily: "'Fira Code', 'Consolas', monospace",
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>
            目标代码输出 ({visibleLines.length}/{codeResult.lines.length} 行)
          </span>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>
            ⏱ 逐行输出中
          </span>
        </div>

        <div className="code-gen-container">
          {visibleLines.map((line, idx) => {
            const hasAddressError = line.comment?.includes('OFFSET_ERROR') || line.comment?.includes('地址偏移错误');
            return (
              <div
                key={idx}
                className={`code-line ${line.type} ${hasAddressError ? 'code-line-address-error' : ''}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span className="code-line-number">{line.lineNumber}</span>
                <span className="code-line-content">{line.code}</span>
                {line.comment && (
                  <span className="code-line-comment">{line.comment}</span>
                )}
              </div>
            );
          })}

          {currentLine >= 0 && (
            <div style={{
              display: 'inline-block',
              width: '2px',
              height: '20px',
              background: '#58a6ff',
              animation: 'blink 1s infinite',
              marginLeft: '52px',
            }} />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
