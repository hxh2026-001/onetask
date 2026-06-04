import { For } from 'solid-js';

export default function HistoryPanel(props) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getOperationLabel = (type) => {
    const labels = {
      'calculation': '✅ 计算',
      'error_calculation': '❌ 错误计算',
      'simplify': '🔄 化简',
      'drag_validation': '👆 拖拽验证',
      'drag': '🎯 拖拽'
    };
    return labels[type] || type;
  };

  return (
    <div class="history-panel">
      {props.history?.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#94a3b8', 
          padding: '40px 20px' 
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📝</div>
          <p>暂无操作记录</p>
          <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
            开始计算后，你的操作会被记录在这里
          </p>
        </div>
      )}

      <For each={props.history}>
        {(item, index) => (
          <div 
            class={`history-item ${!item.is_valid ? 'error' : ''}`}
            style={{ 'animation-delay': `${index() * 0.05}s` }}
          >
            <div class="timestamp">
              🕐 {formatTime(item.timestamp)}
            </div>
            <div class="operation">
              {getOperationLabel(item.operation_type)}
            </div>
            {item.operator && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                {item.numerator1}/{item.denominator1} {item.operator} {item.numerator2}/{item.denominator2}
              </div>
            )}
            {item.result_num !== null && item.is_valid && (
              <div class="result">
                = {item.result_num}/{item.result_den}
              </div>
            )}
            {item.shape_type && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                形状: {item.shape_type === 'circle' ? '⭕ 圆形' : '⬜ 矩形'}
              </div>
            )}
            {item.error_message && (
              <div class="error-msg">
                ⚠️ {item.error_message}
              </div>
            )}
          </div>
        )}
      </For>

      {props.history?.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#0369a1',
          textAlign: 'center'
        }}>
          💾 所有操作都已保存到 SQLite 数据库中
        </div>
      )}
    </div>
  );
}
