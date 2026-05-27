interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm">匹配进度</span>
        <span className="text-white font-mono text-sm">{progress.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-black/30 rounded-full overflow-hidden relative">
        <div
          className="h-full progress-burn transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-flow" />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>状态机执行中...</span>
        <span>检测回溯路径</span>
      </div>
    </div>
  );
}

export default ProgressBar;
