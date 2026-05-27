import { useState } from 'react';
import type { MatchResult } from '../../server/nfa';

interface TestCase {
  id: number;
  input: string;
  expectedMatch: boolean;
  result?: MatchResult;
}

interface TestCaseListProps {
  testCases: TestCase[];
  onAdd: (input: string, expectedMatch: boolean) => void;
  onRun: (testCase: TestCase) => void;
}

function TestCaseList({ testCases, onAdd, onRun }: TestCaseListProps) {
  const [newInput, setNewInput] = useState('');
  const [expectedMatch, setExpectedMatch] = useState(true);

  const handleAdd = () => {
    if (!newInput.trim()) return;
    onAdd(newInput.trim(), expectedMatch);
    setNewInput('');
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold mb-4">测试用例</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="输入测试字符串..."
          className="flex-1 min-w-[150px] bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setExpectedMatch(true)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              expectedMatch
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            匹配
          </button>
          <button
            onClick={() => setExpectedMatch(false)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !expectedMatch
                ? 'bg-red-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            不匹配
          </button>
        </div>
        <button
          onClick={handleAdd}
          disabled={!newInput.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          添加
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {testCases.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>暂无测试用例</p>
          </div>
        ) : (
          testCases.map(testCase => (
            <div
              key={testCase.id}
              className="bg-black/30 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  testCase.expectedMatch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {testCase.expectedMatch ? '期望匹配' : '期望不匹配'}
                </span>
                <span className="text-white font-mono text-sm truncate max-w-[200px]">
                  {testCase.input}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {testCase.result && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    testCase.result.match === testCase.expectedMatch
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {testCase.result.match ? '匹配' : '不匹配'}
                  </span>
                )}
                <button
                  onClick={() => onRun(testCase)}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-500"
                >
                  运行
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TestCaseList;
