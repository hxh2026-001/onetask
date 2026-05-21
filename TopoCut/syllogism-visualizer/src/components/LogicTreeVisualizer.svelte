<script>
  import { onMount, afterUpdate } from 'svelte'
  import { buildPredicateLogicTree } from '../logic/propositionParser.js'

  export let major
  export let minor
  export let conclusion

  let treeData = null
  let svgRef
  let showTermDetails = false
  let selectedTerm = null

  $: propositions = [major, minor, conclusion]
  
  $: if (major.text || minor.text || conclusion.text) {
    try {
      treeData = buildPredicateLogicTree(
        [major, minor, conclusion].filter(p => p.text)
      )
    } catch (e) {
      treeData = { error: e.message, nodes: [] }
    }
  }

  function getNodePosition(index, total) {
    const startX = 100
    const startY = 50
    const gapX = 180
    const gapY = 120
    
    return {
      x: startX + (index % 2) * gapX,
      y: startY + Math.floor(index / 2) * gapY
    }
  }

  function getTermColor(term, termRefs) {
    const count = termRefs[term]?.length || 0
    if (count >= 3) return '#b8860b'
    if (count >= 2) return '#8b6914'
    return '#5c4033'
  }

  function toggleTermDetails(term) {
    selectedTerm = selectedTerm === term ? null : term
    showTermDetails = !!selectedTerm
  }
</script>

<div class="logic-tree-panel">
  <h3>谓词逻辑树分析</h3>
  
  {#if !treeData || treeData.nodes.length === 0}
    <div class="empty-state">
      <p>输入命题以查看逻辑树结构</p>
    </div>
  {:else if treeData.error}
    <div class="error-state">
      <p class="error-text">⚠ {treeData.error}</p>
    </div>
  {:else}
    <div class="tree-analysis">
      <div class="analysis-stats">
        <div class="stat-item">
          <span class="stat-value">{treeData.nodes.length}</span>
          <span class="stat-label">命题数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{treeData.analysis.totalPredicates}</span>
          <span class="stat-label">谓词数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{treeData.analysis.chainLength}</span>
          <span class="stat-label">链长度</span>
        </div>
        <div class="stat-item" class:has-cycle={treeData.hasCycle}>
          <span class="stat-value">{treeData.hasCycle ? '有' : '无'}</span>
          <span class="stat-label">循环</span>
        </div>
      </div>

      <div class={`complexity-badge ${treeData.analysis.complexityLevel}`}>
        复杂度: {treeData.analysis.complexityLevel === 'simple' ? '简单' : 
                  treeData.analysis.complexityLevel === 'moderate' ? '中等' :
                  treeData.analysis.complexityLevel === 'complex' ? '复杂' : '高度复杂'}
      </div>
    </div>

    <svg width="100%" height="280" viewBox="0 0 400 280" class="tree-svg" bind:this={svgRef}>
      <defs>
        <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <marker id="tree-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#5c4033"/>
        </marker>
      </defs>

      {#each treeData.nodes as node, i}
        {#each node.children as child}
          <line 
            x1={getNodePosition(i, treeData.nodes.length).x + 60}
            y1={getNodePosition(i, treeData.nodes.length).y + 25}
            x2={getNodePosition(child.node.index, treeData.nodes.length).x}
            y2={getNodePosition(child.node.index, treeData.nodes.length).y + 25}
            stroke="#5c4033"
            stroke-width="2"
            stroke-dasharray="5,3"
            marker-end="url(#tree-arrow)"
          />
        {/each}
      {/each}

      {#each treeData.nodes as node, i}
        <g class="logic-node" transform={`translate(${getNodePosition(i, treeData.nodes.length).x}, ${getNodePosition(i, treeData.nodes.length).y})`}>
          <rect x="0" y="0" width="120" height="50" rx="8" 
                fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="60" y="20" text-anchor="middle" class="node-type">
            {node.original.type || '?'}
          </text>
          <text x="60" y="38" text-anchor="middle" class="node-text">
            {node.parsed.terms?.subject || '...'}
          </text>
        </g>
      {/each}
    </svg>

    <div class="term-references">
      <h4>词项分布</h4>
      <div class="term-cloud">
        {#each Object.entries(treeData.termReferences) as [term, refs]}
          <button 
            class="term-tag"
            style="background: {getTermColor(term, treeData.termReferences)}; opacity: {0.3 + refs.length * 0.2}"
            on:click={() => toggleTermDetails(term)}
          >
            {term} ({refs.length})
          </button>
        {/each}
      </div>

      {#if showTermDetails && selectedTerm}
        <div class="term-details">
          <h5>词项 "{selectedTerm}" 分析</h5>
          <p>出现次数: {treeData.termReferences[selectedTerm]?.length || 0}</p>
          <p>出现位置:</p>
          <ul>
            {#each treeData.termReferences[selectedTerm] || [] as ref}
              <li>{ref.index === 0 ? '大前提' : ref.index === 1 ? '小前提' : '结论'}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    {#if treeData.hasCycle}
      <div class="cycle-warning">
        <span class="warning-icon">⚠</span>
        <p>检测到循环依赖！这可能导致循环论证谬误。</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .logic-tree-panel {
    background: rgba(255, 255, 255, 0.85);
    border: 2px solid var(--border-dark);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-top: 20px;
  }

  h3 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 16px;
    color: var(--ink-dark);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--ink-gold);
  }

  h4 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 13px;
    color: var(--ink-dark);
    margin: 12px 0 8px 0;
  }

  h5 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 12px;
    color: var(--ink-dark);
    margin: 8px 0;
  }

  .empty-state p {
    text-align: center;
    padding: 20px;
    color: var(--ink-dark);
    opacity: 0.5;
  }

  .error-state {
    background: rgba(139, 0, 0, 0.1);
    border: 1px solid var(--ink-red);
    border-radius: 6px;
    padding: 12px;
  }

  .error-text {
    color: var(--ink-red);
    font-size: 12px;
    margin: 0;
  }

  .tree-analysis {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .analysis-stats {
    display: flex;
    gap: 16px;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--ink-dark);
  }

  .has-cycle .stat-value {
    color: var(--ink-red);
  }

  .stat-label {
    font-size: 10px;
    color: var(--ink-dark);
    opacity: 0.6;
  }

  .complexity-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }

  .complexity-badge.simple {
    background: rgba(46, 139, 87, 0.2);
    color: var(--ink-green);
  }

  .complexity-badge.moderate {
    background: rgba(204, 153, 0, 0.2);
    color: #cc9900;
  }

  .complexity-badge.complex {
    background: rgba(204, 85, 0, 0.2);
    color: #cc5500;
  }

  .complexity-badge.high {
    background: rgba(139, 0, 0, 0.2);
    color: var(--ink-red);
  }

  .tree-svg {
    background: rgba(44, 24, 16, 0.03);
    border-radius: 8px;
    margin: 12px 0;
  }

  .node-type {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 12px;
    font-weight: 700;
    fill: var(--ink-gold);
  }

  .node-text {
    font-size: 10px;
    fill: var(--ink-dark);
  }

  .term-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .term-tag {
    padding: 4px 10px;
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .term-tag:hover {
    transform: scale(1.05);
    filter: brightness(1.2);
  }

  .term-details {
    background: rgba(44, 24, 16, 0.05);
    border-radius: 6px;
    padding: 10px;
    margin-top: 10px;
  }

  .term-details p {
    font-size: 11px;
    color: var(--ink-dark);
    margin: 4px 0;
  }

  .term-details ul {
    margin: 4px 0 0 0;
    padding-left: 20px;
  }

  .term-details li {
    font-size: 11px;
    color: var(--ink-dark);
  }

  .cycle-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(139, 0, 0, 0.1);
    border: 1px solid var(--ink-red);
    border-radius: 6px;
    padding: 10px;
    margin-top: 12px;
  }

  .warning-icon {
    color: var(--ink-red);
    font-size: 18px;
  }

  .cycle-warning p {
    font-size: 12px;
    color: var(--ink-red);
    margin: 0;
  }
</style>
