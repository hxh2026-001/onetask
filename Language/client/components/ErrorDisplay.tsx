'use client';

interface CompilerOutput {
  lexerResult?: {
    errors: Array<{ line: number; column: number; message: string; token?: string }>;
  };
  parserResult?: {
    errors: Array<{ line: number; column: number; message: string; expected?: string; found?: string }>;
    infiniteLoopDetected: boolean;
    loopStackTrace: string[];
  };
  typeCheckResult?: {
    errors: Array<{
      line: number;
      column: number;
      message: string;
      expectedType?: string;
      actualType?: string;
      implicitConversionChain?: string[];
      precisionLoss?: boolean;
    }>;
  };
  codeGenResult?: {
    errors: Array<{ line: number; column: number; message: string }>;
  };
}

interface ErrorDisplayProps {
  compilerOutput: CompilerOutput | null;
}

export default function ErrorDisplay({ compilerOutput }: ErrorDisplayProps) {
  if (!compilerOutput) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>✅</div>
        <div>暂无错误信息</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          编译后会显示所有阶段的错误
        </div>
      </div>
    );
  }

  const lexerErrors = compilerOutput.lexerResult?.errors || [];
  const parserErrors = compilerOutput.parserResult?.errors || [];
  const typeErrors = compilerOutput.typeCheckResult?.errors || [];
  const codeGenErrors = compilerOutput.codeGenResult?.errors || [];

  const allErrors = [
    ...lexerErrors.map(e => ({ ...e, phase: 'lexer' })),
    ...parserErrors.map(e => ({ ...e, phase: 'parser' })),
    ...typeErrors.map(e => ({ ...e, phase: 'typechecker' })),
    ...codeGenErrors.map(e => ({ ...e, phase: 'codegen' })),
  ];

  if (allErrors.length === 0 && !compilerOutput.parserResult?.infiniteLoopDetected) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#3fb950' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎉</div>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>编译成功!</div>
        <div style={{ fontSize: '13px', marginTop: '8px' }}>
          所有阶段均未发现错误
        </div>
      </div>
    );
  }

  const getPhaseLabel = (phase: string): string => {
    const labels: Record<string, string> = {
      lexer: '词法分析',
      parser: '语法分析',
      typechecker: '类型检查',
      codegen: '代码生成',
    };
    return labels[phase] || phase;
  };

  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      lexer: '#db6d28',
      parser: '#f85149',
      typechecker: '#d29922',
      codegen: '#bc8cff',
    };
    return colors[phase] || '#f85149';
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', padding: '12px', background: '#161b22', borderRadius: '6px' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
          错误统计: {allErrors.length} 个错误
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          {[
            { phase: 'lexer', count: lexerErrors.length },
            { phase: 'parser', count: parserErrors.length },
            { phase: 'typechecker', count: typeErrors.length },
            { phase: 'codegen', count: codeGenErrors.length },
          ].map(item => (
            <div key={item.phase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: item.count > 0 ? getPhaseColor(item.phase) : '#30363d',
              }} />
              <span>{getPhaseLabel(item.phase)}: {item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {compilerOutput.parserResult?.infiniteLoopDetected && (
        <div className="infinite-loop-warning" style={{ marginBottom: '16px' }}>
          <div className="infinite-loop-title">
            ⚠️ 左递归文法导致解析器死循环
          </div>
          <div style={{ fontSize: '13px', color: '#c9d1d9' }}>
            递归下降解析器检测到左递归模式，已自动终止
          </div>
        </div>
      )}

      <div className="error-list">
        {allErrors.map((error, idx) => (
          <div
            key={idx}
            className={`error-item ${error.precisionLoss ? 'type-warning' : ''}`}
          >
            <div className="error-header">
              <span
                className={`error-phase ${error.phase}`}
                style={{ background: getPhaseColor(error.phase) }}
              >
                {getPhaseLabel(error.phase)}
              </span>
              <span className="error-location">
                L{error.line}:C{error.column}
              </span>
            </div>
            <div className="error-message">{error.message}</div>
            {error.expected && (
              <div className="error-details">
                期望: {error.expected}, 找到: {error.found || '未知'}
              </div>
            )}
            {error.implicitConversionChain && (
              <div className="error-details">
                转换链: {error.implicitConversionChain.join(' → ')}
              </div>
            )}
            {error.precisionLoss && (
              <div className="error-details" style={{ color: '#d29922' }}>
                ⚠️ 可能导致精度丢失
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
