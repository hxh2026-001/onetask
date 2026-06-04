import { For, createSignal, onMount } from 'solid-js';

const CONSTRAINT_TYPE_LABELS = {
  'equal_length': '等长',
  'perpendicular': '垂直',
  'tangent': '相切',
  'distance': '距离',
  'fixed': '固定',
  'coincident': '重合',
  'parallel': '平行',
  'horizontal': '水平',
  'vertical': '垂直',
  'radius': '半径',
  'angle': '角度',
  'concentric': '同心'
};

export default function InfoPanel(props) {
  const [time, setTime] = createSignal(0);

  onMount(() => {
    function animate() {
      setTime(t => t + 0.016);
      requestAnimationFrame(animate);
    }
    animate();
  });

  function getConstraintStatus(constraintId) {
    if (!props.solveResult?.constraintStates?.[constraintId]) return 'unsatisfied';
    const states = props.solveResult.constraintStates[constraintId];
    const idx = Math.min(props.currentIteration, states.length - 1);
    return states[idx]?.status || 'unsatisfied';
  }

  function isConflicting(constraintId) {
    return props.analysis?.conflicts?.some(
      c => c.constraintIds.includes(constraintId)
    );
  }

  function getResultCardType() {
    if (!props.solveResult) return '';
    if (props.solveResult.success) return 'success';
    if (props.solveResult.oscillating) return 'warning';
    if (props.solveResult.localMinimum) return 'warning';
    if (props.solveResult.singular) return 'error';
    if (props.solveResult.maxIterationsReached) return 'warning';
    return 'error';
  }

  function getResultMessage() {
    if (!props.solveResult) return null;
    if (props.solveResult.message) return props.solveResult.message;
    if (props.solveResult.error) return props.solveResult.error;
    return null;
  }

  return (
    <>
      {props.analysis && (
        <>
          <h2>系统分析</h2>
          <div class={`info-card ${
            props.analysis.hasConflict ? 'error' : 
            props.analysis.hasCycleDependency ? 'warning' :
            props.analysis.overallStatus === 'over-constrained' ? 'warning' :
            props.analysis.overallStatus === 'under-constrained' ? 'warning' : 'success'
          }`}>
            <h3>自由度分析</h3>
            <ul class="analysis-list">
              <For each={props.analysis.analysis}>
                {(line) => <li>{line}</li>}
              </For>
            </ul>
          </div>
        </>
      )}

      {props.solveResult && (
        <>
          <h2>求解结果</h2>
          <div class={`info-card ${getResultCardType()}`}>
            <h3>{props.solveResult.success ? '✅ 求解成功' : '❌ 求解失败'}</h3>
            <p>{getResultMessage()}</p>
            <ul class="analysis-list" style="margin-top: 8px">
              <li>迭代次数: <strong>{props.solveResult.iterations}</strong></li>
              <li>最终残差: <strong>{props.solveResult.finalResidual?.toExponential(4) || 'N/A'}</strong></li>
              {props.solveResult.conditionNumber && (
                <li>条件数: <strong>{props.solveResult.conditionNumber.toExponential(2)}</strong></li>
              )}
              {props.solveResult.oscillating && (
                <li style="color: #f59e0b">⚠️ 残差震荡 - 存在循环依赖</li>
              )}
              {props.solveResult.localMinimum && (
                <li style="color: #f59e0b">⚠️ 陷入局部最优</li>
              )}
              {props.solveResult.singular && (
                <li style="color: #ef4444">❌ 雅可比矩阵奇异</li>
              )}
            </ul>
          </div>

          {props.analysis?.overallStatus === 'over-constrained' && (
            <div class="info-card warning">
              <h3>💡 过约束系统说明</h3>
              <p>
                系统存在多余约束，无法精确满足所有约束条件。求解器使用最小二乘法寻找最优近似解，
                但解会偏离理论期望值。观察残差图可以看到最终残差不会收敛到零。
              </p>
            </div>
          )}

          {props.solveResult.oscillating && (
            <div class="info-card warning">
              <h3>💡 循环依赖说明</h3>
              <p>
                约束图中存在循环（如 A→B→C→A），导致 Newton-Raphson 迭代在多个解之间震荡，
                无法收敛。观察残差图可以看到残差值在一定范围内波动而不下降。
              </p>
            </div>
          )}

          {props.solveResult.singular && (
            <div class="info-card error">
              <h3>💡 数值奇异说明</h3>
              <p>
                雅可比矩阵接近奇异（条件数过大），可能是由于几何元素共线、重合或退化构型导致。
                求解器使用伪逆继续计算，但结果可能不稳定。
              </p>
            </div>
          )}

          {props.solveResult.localMinimum && (
            <div class="info-card warning">
              <h3>💡 局部最优说明</h3>
              <p>
                初始猜测不佳导致求解器陷入局部最优解而非全局最优。尝试调整初始点位置或添加更多约束引导求解。
              </p>
            </div>
          )}
        </>
      )}

      {props.constraints.length > 0 && (
        <>
          <h2>约束状态 <span class="text-muted" style="font-size: 0.75rem; font-weight: normal;">({props.constraints.length} 个约束)</span></h2>
          <For each={props.constraints}>
            {(constraint) => {
              const status = getConstraintStatus(constraint.id);
              const conflicting = isConflicting(constraint.id);
              const elementLabels = constraint.elementIds.map(id => {
                const elem = props.elements?.find(e => e.id === id);
                return elem?.label || id;
              }).join(', ');
              return (
                <div class={`constraint-item ${status} ${conflicting ? 'conflicting' : ''}`}>
                  <div class="constraint-info">
                    <span class="constraint-type">
                      {CONSTRAINT_TYPE_LABELS[constraint.type] || constraint.type}
                      {constraint.value !== undefined && constraint.value !== null && 
                        ` = ${constraint.value}`}
                    </span>
                    <span class="constraint-elements">
                      作用于: {elementLabels}
                    </span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-indicator"></span>
                    <button 
                      class="delete-constraint-btn"
                      onClick={() => props.onDeleteConstraint?.(constraint.id)}
                      title="删除约束"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </>
      )}
    </>
  );
}
