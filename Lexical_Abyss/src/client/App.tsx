import { useState, useEffect, useCallback } from 'react';
import RegexInput from './components/RegexInput';
import TestCaseList from './components/TestCaseList';
import NFAGraph from './components/NFAGraph';
import MatchAnimation from './components/MatchAnimation';
import ProgressBar from './components/ProgressBar';
import TrapAlert from './components/TrapAlert';
import PresetButtons from './components/PresetButtons';
import type { NFAResult, MatchResult } from '../server/nfa';

interface Preset {
  id: number;
  name: string;
  pattern: string;
  testInput: string;
  description: string;
}

interface TestCase {
  id: number;
  input: string;
  expectedMatch: boolean;
  result?: MatchResult;
}

const API_BASE = 'http://localhost:3005/api';

function App() {
  const [pattern, setPattern] = useState('');
  const [input, setInput] = useState('');
  const [nfa, setNfa] = useState<NFAResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trapAnalysis, setTrapAnalysis] = useState<{ detected: boolean; type: string; description: string } | null>(null);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/presets`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPresets(data.presets);
        }
      });
  }, []);

  const compileRegex = useCallback(async (regexPattern: string) => {
    try {
      const response = await fetch(`${API_BASE}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: regexPattern })
      });
      const data = await response.json();
      if (data.success) {
        setNfa(data.nfa);
      }
    } catch (error) {
      console.error('Compilation error:', error);
    }
  }, []);

  const analyzeTrap = useCallback(async (regexPattern: string) => {
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: regexPattern })
      });
      const data = await response.json();
      if (data.success) {
        setTrapAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }, []);

  const handlePatternChange = useCallback(async (newPattern: string) => {
    setPattern(newPattern);
    if (newPattern) {
      await compileRegex(newPattern);
      await analyzeTrap(newPattern);
    } else {
      setNfa(null);
      setTrapAnalysis(null);
    }
  }, [compileRegex, analyzeTrap]);

  const handleMatch = useCallback(async () => {
    if (!pattern || !input) return;
    
    setIsMatching(true);
    setProgress(0);
    setMatchResult(null);
    
    const controller = new AbortController();
    setAbortController(controller);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    try {
      const response = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, input }),
        signal: controller.signal
      });
      const data = await response.json();
      
      clearInterval(interval);
      setProgress(100);
      setIsMatching(false);
      setAbortController(null);
      
      if (data.success) {
        setMatchResult(data.result);
        
        if (data.result.backtrackCount > 1000) {
          setMemoryUsage(80 + Math.random() * 15);
        } else {
          setMemoryUsage(20 + Math.random() * 30);
        }
        
        setTimeout(() => setMemoryUsage(0), 2000);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Match error:', error);
      }
      clearInterval(interval);
      setIsMatching(false);
      setAbortController(null);
    }
  }, [pattern, input]);

  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsMatching(false);
      setProgress(0);
      setAbortController(null);
    }
  }, [abortController]);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setPattern(preset.pattern);
    setInput(preset.testInput);
    compileRegex(preset.pattern);
    analyzeTrap(preset.pattern);
  }, [compileRegex, analyzeTrap]);

  const handleAddTestCase = useCallback((inputText: string, expectedMatch: boolean) => {
    const newTestCase: TestCase = {
      id: Date.now(),
      input: inputText,
      expectedMatch
    };
    setTestCases(prev => [newTestCase, ...prev]);
  }, []);

  const handleRunTestCase = useCallback(async (testCase: TestCase) => {
    try {
      const response = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, input: testCase.input })
      });
      const data = await response.json();
      
      if (data.success) {
        setTestCases(prev =>
          prev.map(tc =>
            tc.id === testCase.id ? { ...tc, result: data.result } : tc
          )
        );
      }
    } catch (error) {
      console.error('Test case run error:', error);
    }
  }, [pattern]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
          正则表达式对抗性测试系统
        </h1>
        <p className="text-gray-400 text-center text-sm">
          可视化探索正则表达式的边界情况与安全陷阱
        </p>
      </header>

      <PresetButtons presets={presets} onSelect={handlePresetSelect} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <RegexInput
            pattern={pattern}
            input={input}
            onPatternChange={handlePatternChange}
            onInputChange={setInput}
            onMatch={handleMatch}
            onCancel={handleCancel}
            isMatching={isMatching}
          />

          {trapAnalysis && <TrapAlert analysis={trapAnalysis} />}

          {isMatching && <ProgressBar progress={progress} />}

          {matchResult && (
            <MatchAnimation
              input={input}
              result={matchResult}
              nfa={nfa}
            />
          )}

          <TestCaseList
            testCases={testCases}
            onAdd={handleAddTestCase}
            onRun={handleRunTestCase}
          />
        </div>

        <div className="lg:col-span-1">
          <NFAGraph nfa={nfa} matchResult={matchResult} />
        </div>
      </div>

      {memoryUsage > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md">
          <div className="bg-red-900/80 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-300 text-sm">内存使用</span>
              <span className="text-red-400 font-bold">{memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-red-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 memory-spike"
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
            <p className="text-red-400 text-xs mt-2">
              {memoryUsage > 70 ? '警告：检测到内存暴涨！' : '正常运行'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
