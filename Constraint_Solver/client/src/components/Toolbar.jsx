import { createSignal } from 'solid-js';

const CONSTRAINT_TYPES = [
  { type: 'distance', label: '距离', icon: '⟷', requires: 1, needsValue: true },
  { type: 'equal_length', label: '等长', icon: '═', requires: 2 },
  { type: 'perpendicular', label: '垂直', icon: '⊥', requires: 2 },
  { type: 'parallel', label: '平行', icon: '∥', requires: 2 },
  { type: 'tangent', label: '相切', icon: '○─', requires: 2 },
  { type: 'horizontal', label: '水平', icon: '⇌', requires: 1 },
  { type: 'vertical', label: '垂直', icon: '⇅', requires: 1 },
  { type: 'fixed', label: '固定', icon: '⚓', requires: 1 },
  { type: 'concentric', label: '同心', icon: '◎', requires: 2 },
  { type: 'radius', label: '半径', icon: '○', requires: 1, needsValue: true },
  { type: 'angle', label: '角度', icon: '∠', requires: 2, needsValue: true }
];

const CREATE_TYPES = [
  { type: 'point', label: '点', icon: '●' },
  { type: 'line', label: '线段', icon: '╱' },
  { type: 'circle', label: '圆', icon: '○' }
];

export default function Toolbar(props) {
  const [showCreateMenu, setShowCreateMenu] = createSignal(false);
  const [showConstraintMenu, setShowConstraintMenu] = createSignal(false);
  const [constraintValue, setConstraintValue] = createSignal(100);

  function handleCreate(type) {
    props.onCreate?.(type);
    setShowCreateMenu(false);
  }

  function handleAddConstraint(constraintType) {
    const selected = props.selectedElements || [];
    if (selected.length < constraintType.requires) {
      alert(`请选择 ${constraintType.requires} 个元素来添加"${constraintType.label}"约束`);
      return;
    }

    let value = null;
    if (constraintType.needsValue) {
      const input = prompt(`请输入${constraintType.label}值:`, constraintValue().toString());
      if (input === null) return;
      value = parseFloat(input);
      if (isNaN(value)) {
        alert('请输入有效的数值');
        return;
      }
      setConstraintValue(value);
    }

    const elementIds = selected.slice(0, constraintType.requires).map(e => e.id);
    props.onAddConstraint?.({
      type: constraintType.type,
      elementIds,
      value
    });
    setShowConstraintMenu(false);
  }

  return (
    <div class="toolbar">
      <div class="toolbar-group">
        <div class="dropdown" style="position: relative;">
          <button 
            class="tool-btn"
            onClick={() => {
              setShowCreateMenu(!showCreateMenu());
              setShowConstraintMenu(false);
            }}
          >
            ✚ 添加元素
          </button>
          {showCreateMenu() && (
            <div class="dropdown-menu">
              {CREATE_TYPES.map(ct => (
                <button
                  class="dropdown-item"
                  onClick={() => handleCreate(ct.type)}
                >
                  <span class="dropdown-icon">{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div class="dropdown" style="position: relative;">
          <button 
            class="tool-btn"
            onClick={() => {
              setShowConstraintMenu(!showConstraintMenu());
              setShowCreateMenu(false);
            }}
            disabled={(props.selectedElements || []).length === 0}
          >
            🔗 添加约束
            {(props.selectedElements || []).length > 0 && (
              <span class="badge">{(props.selectedElements || []).length}</span>
            )}
          </button>
          {showConstraintMenu() && (
            <div class="dropdown-menu constraint-menu">
              <div class="menu-header">
                已选择 {(props.selectedElements || []).length} 个元素
              </div>
              {CONSTRAINT_TYPES.map(ct => (
                <button
                  class={`dropdown-item ${(props.selectedElements || []).length < ct.requires ? 'disabled' : ''}`}
                  onClick={() => handleAddConstraint(ct)}
                  disabled={(props.selectedElements || []).length < ct.requires}
                >
                  <span class="dropdown-icon">{ct.icon}</span>
                  <span class="constraint-label">
                    {ct.label}
                    {ct.needsValue && <span class="hint"> (需输入值)</span>}
                  </span>
                  <span class="constraint-requires">需要 {ct.requires} 个</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          class="tool-btn danger"
          onClick={props.onDeleteSelected}
          disabled={(props.selectedElements || []).length === 0}
        >
          🗑 删除选中
        </button>
      </div>

      <div class="toolbar-group">
        <button 
          class="tool-btn primary" 
          onClick={props.onSolve}
          disabled={props.isSolving || (props.elements?.length === 0)}
        >
          {props.isSolving ? '求解中...' : '▶ 开始求解'}
        </button>
        <button 
          class="tool-btn" 
          onClick={props.onReset}
          disabled={(props.elements?.length === 0)}
        >
          ↻ 重置
        </button>
        <button 
          class="tool-btn danger" 
          onClick={props.onClear}
        >
          ✕ 清空
        </button>
      </div>

      <div class="toolbar-group">
        <div class="selected-info">
          {(props.selectedElements || []).length > 0 ? (
            <>
              选中: {(props.selectedElements || []).map(e => e.label || e.id).join(', ')}
            </>
          ) : (
            <span class="text-muted">未选中元素 (Shift+点击多选)</span>
          )}
        </div>
      </div>
    </div>
  );
}
