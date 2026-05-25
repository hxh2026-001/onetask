'use client';

import { useState, useEffect } from 'react';

interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
  start: number;
  end: number;
}

interface LexerVisualizerProps {
  tokens: Token[];
  isCompiling: boolean;
}

export default function LexerVisualizer({ tokens, isCompiling }: LexerVisualizerProps) {
  const [visibleTokens, setVisibleTokens] = useState<Token[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (tokens.length === 0) {
      setVisibleTokens([]);
      setCurrentIndex(-1);
      return;
    }

    setVisibleTokens([]);
    setCurrentIndex(-1);

    let index = 0;
    const interval = setInterval(() => {
      if (index < tokens.length) {
        setVisibleTokens(prev => [...prev, tokens[index]]);
        setCurrentIndex(index);
        index++;
      } else {
        clearInterval(interval);
        setCurrentIndex(-1);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [tokens]);

  const getTokenColor = (type: string): string => {
    switch (type) {
      case 'KEYWORD': return '#ff7b72';
      case 'STRING': return '#a5d6ff';
      case 'NUMBER': return '#79c0ff';
      case 'BOOLEAN': return '#79c0ff';
      case 'IDENTIFIER': return '#c9d1d9';
      case 'OPERATOR': return '#ff7b72';
      case 'DELIMITER': return '#8b949e';
      case 'COMMENT': return '#8b949e';
      case 'ILLEGAL': return '#f85149';
      case 'EOF': return '#6e7681';
      default: return '#c9d1d9';
    }
  };

  const getTokenTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      NUMBER: '数字',
      STRING: '字符串',
      IDENTIFIER: '标识符',
      KEYWORD: '关键字',
      OPERATOR: '运算符',
      DELIMITER: '分隔符',
      BOOLEAN: '布尔值',
      COMMENT: '注释',
      WHITESPACE: '空白',
      NEWLINE: '换行',
      EOF: '结束',
      ILLEGAL: '非法',
    };
    return labels[type] || type;
  };

  if (tokens.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
        {isCompiling ? (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔤</div>
            <div>正在进行词法分析...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔤</div>
            <div>点击"编译运行"开始词法分析</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', padding: '12px', background: '#161b22', borderRadius: '6px' }}>
        <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '8px' }}>
          词法分析进度: {visibleTokens.length} / {tokens.length} tokens
        </div>
        <div style={{
          height: '6px',
          background: '#21262d',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(visibleTokens.length / tokens.length) * 100}%`,
            background: 'linear-gradient(90deg, #58a6ff, #3fb950)',
            transition: 'width 0.1s',
          }} />
        </div>
      </div>

      <div className="token-list">
        {visibleTokens.map((token, index) => (
          <div
            key={index}
            className={`token-item ${token.type} ${currentIndex === index ? 'scanning' : ''}`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="token-type" style={{ color: getTokenColor(token.type) }}>
              {getTokenTypeLabel(token.type)}
            </span>
            <span className="token-value" style={{ color: getTokenColor(token.type) }}>
              {token.value === '\n' ? '\\n' : token.value || '(空)'}
            </span>
            <span className="token-position">
              L{token.line}:C{token.column}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
