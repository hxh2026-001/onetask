'use client';

import { useState, useEffect } from 'react';

interface TypeInfo {
  kind: string;
  name?: string;
  implicitConversions?: string[];
}

interface TypePropagationEvent {
  nodeId: string;
  type: TypeInfo;
  fromNode?: string;
  line: number;
  column: number;
}

interface Scope {
  id: number;
  parentId: number | null;
  isFunction: boolean;
  functionName?: string;
}

interface SymbolEntry {
  name: string;
  type: TypeInfo;
  line: number;
  column: number;
}

interface TypeCheckResult {
  propagationEvents: TypePropagationEvent[];
  errors: Array<{
    line: number;
    column: number;
    message: string;
    expectedType?: string;
    actualType?: string;
    implicitConversionChain?: string[];
    precisionLoss?: boolean;
  }>;
  shadowingDetections: Array<{
    name: string;
    outerLine: number;
    innerLine: number;
    scopeId: number;
  }>;
  undeclaredAccesses: Array<{
    name: string;
    line: number;
    scopeId: number;
    resolvedScopeId: number | null;
  }>;
  scopes: Record<number, Scope & { entries: Record<string, SymbolEntry> }>;
}

interface TypeCheckerVisualizerProps {
  typeResult: TypeCheckResult | null;
  isCompiling: boolean;
}

function getTypeColor(kind: string): string {
  switch (kind) {
    case 'number': return '#79c0ff';
    case 'string': return '#a5d6ff';
    case 'boolean': return '#3fb950';
    case 'void': return '#8b949e';
    case 'any': return '#bc8cff';
    case 'function': return '#39c5cf';
    case 'closure': return '#db6d28';
    case 'unknown': return '#f85149';
    default: return '#c9d1d9';
  }
}

function getTypeLabel(kind: string): string {
  const labels: Record<string, string> = {
    number: '数字',
    string: '字符串',
    boolean: '布尔值',
    void: '空',
    any: '任意',
    function: '函数',
    closure: '闭包',
    unknown: '未知',
  };
  return labels[kind] || kind;
}

export default function TypeCheckerVisualizer({ typeResult, isCompiling }: TypeCheckerVisualizerProps) {
  const [visibleEvents, setVisibleEvents] = useState<TypePropagationEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);

  useEffect(() => {
    if (!typeResult?.propagationEvents) {
      setVisibleEvents([]);
      setCurrentEventIndex(-1);
      return;
    }

    setVisibleEvents([]);
    setCurrentEventIndex(-1);

    const events = typeResult.propagationEvents;
    let index = 0;

    const interval = setInterval(() => {
      if (index < events.length) {
        setVisibleEvents(prev => [...prev, events[index]]);
        setCurrentEventIndex(index);
        index++;
      } else {
        clearInterval(interval);
        setCurrentEventIndex(-1);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [typeResult?.propagationEvents]);

  if (!typeResult || isCompiling) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
        <div>{isCompiling ? '正在进行类型检查...' : '点击"编译运行"开始类型检查'}</div>
      </div>
    );
  }

  const errors = typeResult.errors || [];
  const shadowing = typeResult.shadowingDetections || [];
  const undeclared = typeResult.undeclaredAccesses || [];

  return (
    <div className="type-check-container">
      {errors.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#f85149', marginBottom: '8px' }}>
            ⚠️ 类型错误 ({errors.length})
          </h3>
          <div className="error-list">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className={`error-item ${error.precisionLoss ? 'type-warning' : ''}`}
              >
                <div className="error-header">
                  <span className="error-phase typechecker">类型错误</span>
                  <span className="error-location">L{error.line}:C{error.column}</span>
                </div>
                <div className="error-message">{error.message}</div>
                {error.implicitConversionChain && (
                  <div className="error-details">
                    转换链: {error.implicitConversionChain.join(' → ')}
                  </div>
                )}
                {error.precisionLoss && (
                  <div className="error-details" style={{ color: '#d29922' }}>
                    ⚠️ 精度丢失警告
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {shadowing.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#d29922', marginBottom: '8px' }}>
            🔒 变量遮蔽检测 ({shadowing.length})
          </h3>
          <div className="error-list">
            {shadowing.map((s, idx) => (
              <div key={idx} className="error-item type-warning">
                <div className="error-header">
                  <span className="error-phase" style={{ background: '#d29922', color: '#0d1117' }}>
                    遮蔽
                  </span>
                </div>
                <div className="error-message">
                  变量 '{s.name}' 在 L{s.innerLine} 遮蔽了 L{s.outerLine} 的声明
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {undeclared.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#db6d28', marginBottom: '8px' }}>
            🔓 作用域穿透检测 ({undeclared.length})
          </h3>
          <div className="error-list">
            {undeclared.map((u, idx) => (
              <div key={idx} className="error-item type-info">
                <div className="error-header">
                  <span className="error-phase" style={{ background: '#58a6ff' }}>
                    穿透
                  </span>
                  <span className="error-location">L{u.line}</span>
                </div>
                <div className="error-message">
                  变量 '{u.name}' 在作用域 {u.scopeId} 未声明
                  {u.resolvedScopeId !== null && `, 穿透到作用域 ${u.resolvedScopeId} 找到`}
                  {u.resolvedScopeId === null && ', 未找到声明'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '14px', color: '#58a6ff', marginBottom: '8px' }}>
        🌊 类型推断传播 ({visibleEvents.length}/{typeResult.propagationEvents?.length || 0})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visibleEvents.map((event, idx) => (
          <div
            key={idx}
            className={`type-event type-event-${event.type.kind} ${currentEventIndex === idx ? 'expanding' : ''}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="type-info">
              <span className="type-name">
                {event.nodeId.split('_')[0]}
              </span>
              <span className={`type-kind ${event.type.kind}`}>
                {getTypeLabel(event.type.kind)}
              </span>
            </div>
            <div className="type-location">
              L{event.line}:C{event.column}
            </div>
            {event.type.implicitConversions && event.type.implicitConversions.length > 0 && (
              <div style={{ fontSize: '11px', color: '#d29922', marginTop: '4px' }}>
                隐式转换: {event.type.implicitConversions.join(' → ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
