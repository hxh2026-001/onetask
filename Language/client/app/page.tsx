'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import CodeEditor from '@/components/CodeEditor';
import LexerVisualizer from '@/components/LexerVisualizer';
import ASTVisualizer from '@/components/ASTVisualizer';
import TypeCheckerVisualizer from '@/components/TypeCheckerVisualizer';
import CodeGenVisualizer from '@/components/CodeGenVisualizer';
import HistoryPanel from '@/components/HistoryPanel';
import ErrorDisplay from '@/components/ErrorDisplay';

interface Scenario {
  id: string;
  name: string;
  description: string;
  code: string;
}

interface CompilerOutput {
  success: boolean;
  lexerResult: any;
  parserResult: any;
  typeCheckResult: any;
  codeGenResult: any;
  steps: any[];
  totalTime: number;
  errorPhase?: string;
}

const DEFAULT_CODE = `// 迷你编程语言示例
var x = 10;
var y = 20;
var result = x + y;

fn add(a, b) {
  return a + b;
}

var z = add(5, 15);
`;

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState('lexer');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState('');
  const [compilerOutput, setCompilerOutput] = useState<CompilerOutput | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchScenarios();
    fetchHistory();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch('/api/scenarios');
      const data = await res.json();
      setScenarios(data);
    } catch (e) {
      console.error('Failed to fetch scenarios:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/snippets?limit=20');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  };

  const handleCompile = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsCompiling(true);
    setActiveTab('lexer');
    setCompilerOutput(null);

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, scenario: activeScenario }),
      });

      const data = await res.json();
      setCompilerOutput(data);
      fetchHistory();

      if (data.errorPhase) {
        const errorPhase = data.errorPhase;
        timeoutRef.current = setTimeout(() => setActiveTab(errorPhase), 500);
      }
    } catch (e: any) {
      console.error('Compilation error:', e);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setActiveScenario(scenarioId);
      setCode(scenario.code);
      setCompilerOutput(null);
    }
  };

  const handleLoadHistory = (snippet: any) => {
    setCode(snippet.code);
    setActiveScenario(snippet.scenario || '');
    setCompilerOutput(null);
  };

  const getErrorCount = (phase: string): number => {
    if (!compilerOutput) return 0;

    switch (phase) {
      case 'lexer':
        return compilerOutput.lexerResult?.errors?.length || 0;
      case 'parser':
        return (compilerOutput.parserResult?.errors?.length || 0) +
          (compilerOutput.parserResult?.infiniteLoopDetected ? 1 : 0);
      case 'typechecker':
        return compilerOutput.typeCheckResult?.errors?.length || 0;
      case 'codegen':
        return compilerOutput.codeGenResult?.errors?.length || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-icon">⚙️</span>
          Compiler Sandbox - Mini Language IDE
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>
            {isCompiling ? '🔄 编译中...' : compilerOutput ? `✅ 完成 (${compilerOutput.totalTime}ms)` : '等待编译'}
          </span>
          <button className="btn" onClick={() => setShowHistory(!showHistory)}>
            📜 历史记录
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title">代码编辑器</span>
            <div className="scenario-buttons">
              {scenarios.map(scenario => (
                <button
                  key={scenario.id}
                  className={`scenario-btn ${scenario.id} ${activeScenario === scenario.id ? 'active' : ''}`}
                  onClick={() => handleScenarioSelect(scenario.id)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </div>

          <CodeEditor
            code={code}
            onChange={setCode}
            errors={compilerOutput?.errorPhase === 'lexer' ? compilerOutput?.lexerResult?.errors : []}
          />

          <div className="compile-actions">
            <button
              className="btn btn-primary"
              onClick={handleCompile}
              disabled={isCompiling}
            >
              {isCompiling ? '编译中...' : '▶ 编译运行'}
            </button>
            <button
              className="btn"
              onClick={() => {
                setCode(DEFAULT_CODE);
                setActiveScenario('');
                setCompilerOutput(null);
              }}
              disabled={isCompiling}
            >
              🗑 清空
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '12px', color: '#8b949e', alignSelf: 'center' }}>
              {code.length} 字符 | {code.split('\n').length} 行
            </span>
          </div>
        </div>

        <div className="visualization-panel">
          <div className="tabs">
            {[
              { id: 'lexer', name: '词法分析', icon: '🔤' },
              { id: 'parser', name: '语法分析', icon: '🌳' },
              { id: 'typechecker', name: '类型检查', icon: '🔍' },
              { id: 'codegen', name: '代码生成', icon: '⚡' },
              { id: 'errors', name: '错误日志', icon: '⚠️' },
            ].map(tab => {
              const errorCount = getErrorCount(tab.id);
              return (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  {errorCount > 0 && (
                    <span className="tab-badge error">{errorCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="tab-content">
            {activeTab === 'lexer' && (
              <LexerVisualizer
                tokens={compilerOutput?.lexerResult?.tokens || []}
                isCompiling={isCompiling}
              />
            )}
            {activeTab === 'parser' && (
              <ASTVisualizer
                ast={compilerOutput?.parserResult?.ast}
                infiniteLoopDetected={compilerOutput?.parserResult?.infiniteLoopDetected}
                loopStackTrace={compilerOutput?.parserResult?.loopStackTrace}
                isCompiling={isCompiling}
              />
            )}
            {activeTab === 'typechecker' && (
              <TypeCheckerVisualizer
                typeResult={compilerOutput?.typeCheckResult}
                isCompiling={isCompiling}
              />
            )}
            {activeTab === 'codegen' && (
              <CodeGenVisualizer
                codeResult={compilerOutput?.codeGenResult}
                isCompiling={isCompiling}
              />
            )}
            {activeTab === 'errors' && (
              <ErrorDisplay compilerOutput={compilerOutput} />
            )}
          </div>
        </div>

        {showHistory && (
          <HistoryPanel
            history={history}
            onLoad={handleLoadHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      <div className="status-bar">
        <div className="status-item">
          <span className={`status-indicator ${compilerOutput ? (compilerOutput.success ? 'success' : 'error') : ''}`}></span>
          <span>状态: {compilerOutput ? (compilerOutput.success ? '成功' : '失败') : '空闲'}</span>
        </div>
        {compilerOutput?.errorPhase && (
          <div className="status-item">
            <span>错误阶段: {compilerOutput.errorPhase}</span>
          </div>
        )}
        <div className="status-item">
          <span>耗时: {compilerOutput?.totalTime || 0}ms</span>
        </div>
        <div className="status-item">
          <span>Token数: {compilerOutput?.lexerResult?.tokens?.length || 0}</span>
        </div>
        <div className="status-item">
          <span>生成代码行数: {compilerOutput?.codeGenResult?.lines?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
