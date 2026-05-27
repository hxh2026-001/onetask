import { useState, useEffect } from 'react';
import type { MatchResult, NFAResult } from '../../server/nfa';

interface MatchAnimationProps {
  input: string;
  result: MatchResult;
  nfa: NFAResult | null;
}

function MatchAnimation({ input, result, nfa }: MatchAnimationProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    if (result.trapDetected) {
      setTimeout(() => setShowExplosion(true), 500);
      setTimeout(() => setShowExplosion(false), 1500);
    }
  }, [result.trapDetected]);

  useEffect(() => {
    if (!result.match) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      setHighlightedIndex(currentIndex);
      currentIndex++;
      if (currentIndex > input.length) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [input, result.match]);

  const stats = [
    { label: '匹配结果', value: result.match ? '成功' : '失败', color: result.match ? 'text-green-400' : 'text-red-400' },
    { label: '回溯次数', value: result.backtrackCount.toLocaleString(), color: result.backtrackCount > 1000 ? 'text-red-400' : 'text-yellow-400' },
    { label: '耗时', value: `${result.time}ms`, color: result.time > 1000 ? 'text-red-400' : 'text-blue-400' },
    { label: '陷阱检测', value: result.trapDetected ? '触发' : '未触发', color: result.trapDetected ? 'text-red-400' : 'text-green-400' }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6">
      <h3 className="text-white font-semibold mb-4">匹配动画</h3>
      
      <div className="relative">
        <div className={`bg-black/30 rounded-lg p-4 font-mono text-lg tracking-wider ${showExplosion ? 'explosion' : ''}`}>
          {input.split('').map((char, index) => (
            <span
              key={index}
              className={`inline-block w-6 h-8 flex items-center justify-center rounded ${
                highlightedIndex === index
                  ? 'bg-blue-500/60 text-white highlight-char'
                  : highlightedIndex > index && result.match
                  ? 'bg-green-500/30 text-green-300'
                  : 'text-gray-400'
              }`}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
        
        {showExplosion && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-500/50 rounded-full animate-ping" />
            <div className="absolute w-16 h-16 bg-orange-500/50 rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
            <div className="absolute w-12 h-12 bg-yellow-500/50 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-gray-400 text-xs">{stat.label}</div>
            <div className={`font-semibold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {nfa && result.path.length > 0 && (
        <div className="mt-4">
          <h4 className="text-white text-sm font-medium mb-2">状态转移路径</h4>
          <div className="bg-black/30 rounded-lg p-3 max-h-32 overflow-y-auto scrollbar-thin">
            <div className="flex flex-wrap gap-1">
              {result.path.map((step, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    index === result.path.length - 1
                      ? 'bg-green-500/30 text-green-300'
                      : 'bg-blue-500/30 text-blue-300'
                  }`}
                >
                  S{step.state}
                  {step.char && (
                    <span className="ml-1 text-gray-300">
                      --{step.char}--&gt;
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {result.trapDetected && result.trapType && (
        <div className="mt-4 bg-red-900/30 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">陷阱类型: {result.trapType}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchAnimation;
