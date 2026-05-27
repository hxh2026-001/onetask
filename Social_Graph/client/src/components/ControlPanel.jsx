function ControlPanel({
 onAddNode,
 onAddEdge,
 onDeleteNode,
 onDeleteEdge,
 onClear,
 onLoadPreset,
 onRunSimulation,
 onCalculateMetrics,
 onStopAnimation,
 onAnimationTypeChange,
 nodes,
 edges,
 isAnimating,
 currentStep,
 totalSteps,
 animationType,
 selectedNode,
 hoveredNode
}) {
 const handleSelectAllNodes = () => {
 const allIds = nodes.map(n => n.id)
 onRunSimulation(allIds)
 }

 return (
 <div className="control-panel">
 <h2>影响力传播模拟器</h2>
 
 <div className="section">
 <h3>预设场景</h3>
 <div className="button-group">
 <button onClick={() => onLoadPreset('super-spreader')}>
 预设一：超级传播者
 </button>
 <button onClick={() => onLoadPreset('echo-chamber')}>
 预设二：回声室效应
 </button>
 <button onClick={() => onLoadPreset('rumor-deadlock')}>
 预设三：谣言死锁
 </button>
 <button onClick={() => onLoadPreset('diameter-break')}>
 预设四：图直径断裂
 </button>
 </div>
 </div>

 <div className="section">
 <h3>动画效果</h3>
 <div className="button-group">
 <button
 className={animationType === 'ripple' ? 'active' : ''}
 onClick={() => onAnimationTypeChange('ripple')}
 >
 波纹扩散
 </button>
 <button
 className={animationType === 'heatmap' ? 'active' : ''}
 onClick={() => onAnimationTypeChange('heatmap')}
 >
 热力图辐射
 </button>
 <button
 className={animationType === 'community' ? 'active' : ''}
 onClick={() => onAnimationTypeChange('community')}
 >
 社群聚类
 </button>
 <button
 className={animationType === 'pulse' ? 'active' : ''}
 onClick={() => onAnimationTypeChange('pulse')}
 >
 脉冲呼吸
 </button>
 </div>
 </div>

 <div className="section">
 <h3>模拟控制</h3>
 <div className="button-group">
 <button onClick={onCalculateMetrics}>
 计算中心性指标
 </button>
 <button onClick={handleSelectAllNodes} disabled={!nodes.length}>
 从全部节点传播
 </button>
 {isAnimating ? (
 <button onClick={onStopAnimation} className="danger">
 停止模拟
 </button>
 ) : (
 <button
 onClick={() => selectedNode && onRunSimulation([selectedNode])}
 disabled={!selectedNode}
 >
 从选中节点传播
 </button>
 )}
 <button onClick={onClear} className="danger">
 清空图谱
 </button>
 </div>
 </div>

 {isAnimating && (
 <div className="section">
 <h3>模拟进度</h3>
 <div className="progress-bar">
 <div
 className="progress-fill"
 style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
 />
 </div>
 <span className="progress-text">
 {currentStep + 1} / {totalSteps}
 </span>
 </div>
 )}

 <div className="section">
 <h3>节点列表 ({nodes.length})</h3>
 <div className="list-container">
 {nodes.map(node => (
 <div
 key={node.id}
 className={`list-item ${selectedNode === node.id ? 'selected' : ''}`}
 onClick={() => {}}
 >
 <span>{node.name}</span>
 <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}>
 删除
 </button>
 </div>
 ))}
 {nodes.length === 0 && (
 <p className="empty">暂无节点，点击画布添加</p>
 )}
 </div>
 </div>

 <div className="section">
 <h3>边列表 ({edges.length})</h3>
 <div className="list-container">
 {edges.map(edge => {
 const sourceName = nodes.find(n => n.id === edge.source)?.name || edge.source
 const targetName = nodes.find(n => n.id === edge.target)?.name || edge.target
 return (
 <div key={edge.id} className="list-item">
 <span>
 {sourceName} → {targetName}
 <span className="edge-meta">
 (权重:{edge.weight}, 概率:{edge.probability})
 </span>
 </span>
 <button onClick={() => onDeleteEdge(edge.id)}>删除</button>
 </div>
 )
 })}
 {edges.length === 0 && (
 <p className="empty">暂无边</p>
 )}
 </div>
 </div>

 {selectedNode && (
 <div className="section">
 <h3>添加边</h3>
 <div className="add-edge-form">
 <select id="target-node">
 {nodes.filter(n => n.id !== selectedNode).map(n => (
 <option key={n.id} value={n.id}>{n.name}</option>
 ))}
 </select>
 <input
 type="number"
 id="edge-weight"
 placeholder="权重 (0-1)"
 defaultValue="0.5"
 step="0.1"
 min="0"
 max="1"
 />
 <input
 type="number"
 id="edge-probability"
 placeholder="传播概率 (0-1)"
 defaultValue="0.5"
 step="0.1"
 min="0"
 max="1"
 />
 <button
 onClick={() => {
 const target = document.getElementById('target-node').value
 const weight = parseFloat(document.getElementById('edge-weight').value)
 const probability = parseFloat(document.getElementById('edge-probability').value)
 if (target && !isNaN(weight) && !isNaN(probability)) {
 onAddEdge(selectedNode, target, weight, probability)
 }
 }}
 >
 添加边
 </button>
 </div>
 </div>
 )}

 <div className="section info-section">
 <h3>图例说明</h3>
 <div className="legend">
 <div className="legend-item">
 <span className="legend-color" style={{ background: '#4ECDC4' }}></span>
 <span>普通节点</span>
 </div>
 <div className="legend-item">
 <span className="legend-color" style={{ background: '#FF6B6B' }}></span>
 <span>激活节点</span>
 </div>
 <div className="legend-item">
 <span className="legend-line" style={{ stroke: '#999', strokeWidth: 2 }}></span>
 <span>普通边</span>
 </div>
 <div className="legend-item">
 <span className="legend-line" style={{ stroke: '#FFB347', strokeWidth: 4 }}></span>
 <span>活跃边</span>
 </div>
 </div>
 </div>
 </div>
 )
}

export default ControlPanel