'use client';

interface HistoryPanelProps {
  history: Array<{
    id: string;
    code: string;
    scenario: string;
    createdAt: string;
  }>;
  onLoad: (snippet: any) => void;
  onClose: () => void;
}

export default function HistoryPanel({ history, onLoad, onClose }: HistoryPanelProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScenarioLabel = (scenario: string): string => {
    const labels: Record<string, string> = {
      normal: '正常编译',
      lexerError: '词法错误',
      typeError: '类型不匹配',
      infiniteRecursion: '无限递归',
      custom: '自定义',
    };
    return labels[scenario] || scenario;
  };

  const getScenarioColor = (scenario: string): string => {
    const colors: Record<string, string> = {
      normal: '#3fb950',
      lexerError: '#f85149',
      typeError: '#d29922',
      infiniteRecursion: '#bc8cff',
      custom: '#58a6ff',
    };
    return colors[scenario] || '#58a6ff';
  };

  return (
    <div className="history-panel">
      <div className="panel-header">
        <span className="panel-title">📜 历史记录</span>
        <button
          className="btn"
          style={{ padding: '4px 8px', fontSize: '12px', marginLeft: 'auto' }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8b949e',
            fontSize: '13px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div>暂无历史记录</div>
            <div style={{ fontSize: '11px', marginTop: '8px' }}>
              编译代码后会自动保存
            </div>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => onLoad(item)}
            >
              <div
                className="history-item-scenario"
                style={{ color: getScenarioColor(item.scenario) }}
              >
                {getScenarioLabel(item.scenario)}
              </div>
              <div className="history-item-code">
                {item.code.split('\n').slice(0, 2).join(' ').slice(0, 50)}
                {item.code.length > 50 ? '...' : ''}
              </div>
              <div className="history-item-time">
                {formatDate(item.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
