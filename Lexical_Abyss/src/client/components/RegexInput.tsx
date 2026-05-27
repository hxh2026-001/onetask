interface RegexInputProps {
  pattern: string;
  input: string;
  onPatternChange: (pattern: string) => void;
  onInputChange: (input: string) => void;
  onMatch: () => void;
  onCancel: () => void;
  isMatching: boolean;
}

function RegexInput({ pattern, input, onPatternChange, onInputChange, onMatch, onCancel, isMatching }: RegexInputProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">正则表达式</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => onPatternChange(e.target.value)}
              placeholder="输入正则表达式..."
              className="w-full bg-black/30 border border-white/20 rounded-lg px-6 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isMatching}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">/g</span>
          </div>
        </div>
        
        <div>
          <label className="block text-white text-sm font-medium mb-2">测试字符串</label>
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="输入测试字符串..."
            className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isMatching}
          />
        </div>
      </div>
      
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={onMatch}
          disabled={!pattern || !input || isMatching}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
        >
          <span className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full ${isMatching ? 'animate-spin' : ''}`} />
          {isMatching ? '匹配中...' : '执行匹配'}
        </button>
        {isMatching && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-all flex items-center gap-2 shadow-lg hover:shadow-red-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            取消
          </button>
        )}
      </div>
    </div>
  );
}

export default RegexInput;
