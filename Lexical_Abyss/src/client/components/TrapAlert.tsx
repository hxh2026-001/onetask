interface TrapAlertProps {
  analysis: {
    detected: boolean;
    type: string;
    description: string;
  };
}

function TrapAlert({ analysis }: TrapAlertProps) {
  if (!analysis.detected) {
    return (
      <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-green-400 font-semibold">安全</div>
            <div className="text-green-300/80 text-sm">{analysis.description}</div>
          </div>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, { title: string; color: string }> = {
    catastrophic_backtracking: { title: '灾难性回溯', color: 'red' },
    nested_lookahead: { title: '零宽断言嵌套', color: 'yellow' },
    charset_explosion: { title: '字符组补集爆炸', color: 'orange' },
    unicode_boundary: { title: 'Unicode边界陷阱', color: 'purple' },
    timeout: { title: '超时', color: 'red' },
    exponential_backtracking: { title: '指数级回溯', color: 'red' }
  };

  const typeInfo = typeLabels[analysis.type] || { title: '未知陷阱', color: 'gray' };
  
  const colorClasses = {
    red: 'bg-red-900/30 border-red-500/30',
    yellow: 'bg-yellow-900/30 border-yellow-500/30',
    orange: 'bg-orange-900/30 border-orange-500/30',
    purple: 'bg-purple-900/30 border-purple-500/30',
    gray: 'bg-gray-900/30 border-gray-500/30'
  };

  return (
    <div className={`${colorClasses[typeInfo.color]} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-semibold">{typeInfo.title}</span>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">危险</span>
          </div>
          <div className="text-gray-300/90 text-sm mt-1">{analysis.description}</div>
        </div>
      </div>
    </div>
  );
}

export default TrapAlert;
