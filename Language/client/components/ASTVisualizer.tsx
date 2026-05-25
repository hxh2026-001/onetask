'use client';

import { useState, useEffect } from 'react';

interface ASTNode {
  type: string;
  value?: string;
  name?: string;
  operator?: string;
  line: number;
  column: number;
  children: ASTNode[];
  body?: ASTNode[];
  declarations?: ASTNode[];
  params?: ASTNode[];
  arguments?: ASTNode[];
  id?: ASTNode;
  init?: ASTNode;
  test?: ASTNode;
  left?: ASTNode;
  right?: ASTNode;
  callee?: ASTNode;
}

interface ASTVisualizerProps {
  ast: ASTNode | null;
  infiniteLoopDetected: boolean;
  loopStackTrace: string[];
  isCompiling: boolean;
}

interface TreeNodeProps {
  node: ASTNode;
  depth: number;
  delay: number;
  hasError?: boolean;
}

function TreeNode({ node, depth, delay, hasError = false }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getNodeLabel = (): string => {
    switch (node.type) {
      case 'Program': return '📦 Program';
      case 'VariableDeclaration': return '📝 VariableDeclaration';
      case 'VariableDeclarator': return `📝 ${node.id?.name || 'var'}`;
      case 'FunctionDeclaration': return `🔧 fn ${node.id?.name || 'anonymous'}`;
      case 'BlockStatement': return '📄 Block';
      case 'ExpressionStatement': return '💫 Expression';
      case 'ReturnStatement': return '↩️ Return';
      case 'IfStatement': return '🔀 If';
      case 'WhileStatement': return '🔄 While';
      case 'BinaryExpression': return `➕ ${node.operator || 'op'}`;
      case 'UnaryExpression': return `➖ ${node.operator || 'op'}`;
      case 'CallExpression': return `📞 ${node.callee?.name || 'call'}()`;
      case 'AssignmentExpression': return `⚡ ${node.operator || '='}`;
      case 'Identifier': return `🏷️ ${node.name || 'id'}`;
      case 'NumberLiteral': return `🔢 ${node.value}`;
      case 'StringLiteral': return `📝 "${node.value?.slice(0, 20)}${node.value && node.value.length > 20 ? '...' : ''}"`;
      case 'BooleanLiteral': return `✅ ${node.value}`;
      case 'ClosureExpression': return '🔒 Closure';
      default: return node.type;
    }
  };

  const getChildren = (): ASTNode[] => {
    if (node.body) {
      if (Array.isArray(node.body)) return node.body;
      return [node.body];
    }
    if (node.declarations) return node.declarations;
    if (node.children) {
      return node.children.filter(c => c !== undefined && c !== node.init && c !== node.test);
    }
    if (node.params) return node.params;
    if (node.arguments) return node.arguments;
    return [];
  };

  const children = getChildren();
  const hasChildren = children.length > 0;

  if (!isVisible) {
    return (
      <div style={{
        opacity: 0,
        transform: 'scale(0.8)',
        transition: 'all 0.3s',
      }}>
        <div style={{ height: '40px', background: '#21262d', borderRadius: '6px' }} />
      </div>
    );
  }

  return (
    <div style={{
      marginLeft: depth > 0 ? '20px' : '0',
      marginBottom: '8px',
    }}>
      <div
        className={`ast-node ${node.type} ${hasError ? 'error' : ''}`}
        style={{
          opacity: 1,
          transform: 'scale(1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasChildren && (
            <span
              className="ast-children-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="ast-node-type">{getNodeLabel()}</span>
          <span style={{ fontSize: '11px', color: '#6e7681' }}>
            L{node.line}:C{node.column}
          </span>
        </div>

        {node.init && (
          <div style={{ marginLeft: '20px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e' }}>init: </span>
            <TreeNode node={node.init} depth={depth + 1} delay={delay + 100} hasError={hasError} />
          </div>
        )}

        {node.test && (
          <div style={{ marginLeft: '20px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e' }}>test: </span>
            <TreeNode node={node.test} depth={depth + 1} delay={delay + 100} hasError={hasError} />
          </div>
        )}

        {node.left && (
          <div style={{ marginLeft: '20px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e' }}>left: </span>
            <TreeNode node={node.left} depth={depth + 1} delay={delay + 150} hasError={hasError} />
          </div>
        )}

        {node.right && (
          <div style={{ marginLeft: '20px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e' }}>right: </span>
            <TreeNode node={node.right} depth={depth + 1} delay={delay + 200} hasError={hasError} />
          </div>
        )}

        {isExpanded && hasChildren && (
          <div className="ast-node-children">
            {children.map((child, idx) => (
              <TreeNode
                key={idx}
                node={child}
                depth={depth + 1}
                delay={delay + (idx + 1) * 150}
                hasError={hasError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ASTVisualizer({ ast, infiniteLoopDetected, loopStackTrace, isCompiling }: ASTVisualizerProps) {
  const [expanded, setExpanded] = useState(true);

  if (!ast && !isCompiling) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌳</div>
        <div>点击"编译运行"构建 AST</div>
      </div>
    );
  }

  if (isCompiling && !ast) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🌳</div>
        <div>正在构建抽象语法树...</div>
      </div>
    );
  }

  if (infiniteLoopDetected) {
    return (
      <div>
        <div className="infinite-loop-warning">
          <div className="infinite-loop-title">
            ⚠️ 左递归文法导致解析器死循环
          </div>
          <div style={{ fontSize: '13px', color: '#c9d1d9', marginBottom: '12px' }}>
            递归下降解析器检测到左递归模式，已自动终止以防止栈溢出。
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
              递归深度: {loopStackTrace.length} / 100
            </div>
            <div className="recursion-depth">
              <div className="recursion-depth-bar">
                <div
                  className="recursion-depth-fill"
                  style={{ width: `${Math.min((loopStackTrace.length / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="recursion-depth-label">
              {loopStackTrace.length}% 深度
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
            调用栈跟踪:
          </div>
          <div className="stack-trace">
            {loopStackTrace.slice(-30).map((trace, idx) => (
              <div
                key={idx}
                className={`stack-trace-line ${idx >= loopStackTrace.length - 10 ? 'depth' : ''}`}
              >
                #{idx + Math.max(0, loopStackTrace.length - 30)} {trace}
              </div>
            ))}
          </div>
        </div>

        {ast && (
          <div className="ast-container">
            <button
              className="btn"
              onClick={() => setExpanded(!expanded)}
              style={{ marginBottom: '12px' }}
            >
              {expanded ? '折叠全部' : '展开全部'}
            </button>
            <TreeNode node={ast} depth={0} delay={0} hasError={infiniteLoopDetected} />
          </div>
        )}
      </div>
    );
  }

  if (!ast) {
    return null;
  }

  return (
    <div className="ast-container">
      <button
        className="btn"
        onClick={() => setExpanded(!expanded)}
        style={{ marginBottom: '12px' }}
      >
        {expanded ? '折叠全部' : '展开全部'}
      </button>
      <TreeNode node={ast} depth={0} delay={0} hasError={infiniteLoopDetected} />
    </div>
  );
}
