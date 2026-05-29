<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  
  export let districts = []
  export let selectedDistrict = null
  
  const presets = [
    { key: 'preset1', name: '预设一：杰利蝾螈形状', color: '#ef4444' },
    { key: 'preset2', name: '预设二：人口极度不均', color: '#f59e0b' },
    { key: 'preset3', name: '预设三：孤岛选区', color: '#22c55e' },
    { key: 'preset4', name: '预设四：边界碎裂', color: '#a855f7' }
  ]
  
  const loadPreset = (key) => {
    dispatch('loadPreset', { presetKey: key })
  }
  
  const undo = () => {
    dispatch('undo')
  }
  
  const toggleAnimation = () => {
    dispatch('toggleAnimation')
  }
</script>

<div class="control-panel">
  <h2 class="panel-title">控制面板</h2>
  
  <div class="section">
    <h3>预设场景</h3>
    <div class="preset-buttons">
      {#each presets as preset}
        <button
          class="preset-btn"
          style="--preset-color: {preset.color}"
          on:click={() => loadPreset(preset.key)}
        >
          <span class="preset-color" style="background: {preset.color}"></span>
          <span class="preset-name">{preset.name}</span>
        </button>
      {/each}
    </div>
  </div>
  
  <div class="section">
    <h3>选区列表</h3>
    <div class="district-list">
      {#each districts as district}
        <div
          class="district-item"
          class:selected={district.id === selectedDistrict}
          style="--district-color: {district.color}"
        >
          <span class="district-color" style="background: {district.color}"></span>
          <span class="district-info">
            <span class="district-name">选区 {district.id}</span>
            <span class="district-population">{district.population.toLocaleString()} 人</span>
          </span>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="section">
    <h3>操作</h3>
    <div class="action-buttons">
      <button class="action-btn" on:click={undo}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        撤销
      </button>
      <button class="action-btn" on:click={toggleAnimation}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        动画开关
      </button>
    </div>
  </div>
  
  <div class="section tips">
    <h3>操作提示</h3>
    <ul>
      <li>🖱️ 点击选区查看详情</li>
      <li>🔴 拖拽顶点调整边界</li>
      <li>🟡 拖拽人口重心</li>
      <li>🔄 滚轮缩放/平移</li>
    </ul>
  </div>
</div>

<style>
  .control-panel {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .panel-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #ffffff;
    background: linear-gradient(90deg, #06b6d4, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .section {
    margin-bottom: 16px;
  }
  
  .section h3 {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }
  
  .preset-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .preset-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    text-align: left;
  }
  
  .preset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--preset-color);
    transform: translateX(4px);
  }
  
  .preset-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .preset-name {
    flex: 1;
  }
  
  .district-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .district-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .district-item:hover,
  .district-item.selected {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--district-color);
  }
  
  .district-color {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .district-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .district-name {
    font-size: 13px;
    color: #ffffff;
  }
  
  .district-population {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 8px;
    color: #3b82f6;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
  }
  
  .action-btn:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: #3b82f6;
  }
  
  .tips {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 8px;
    padding: 12px;
  }
  
  .tips ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .tips li {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 4px;
  }
  
  .tips li:last-child {
    margin-bottom: 0;
  }
</style>
