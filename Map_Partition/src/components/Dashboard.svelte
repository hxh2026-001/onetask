<script>
  import { onMount, onDestroy } from 'svelte'
  
  export let metrics = {}
  export let districts = []
  export let populationCenters = []
  export let animating = false
  
  let gaugeRotation = 0
  let animFrame = null
  
  const updateGauge = () => {
    const targetRotation = (metrics.fairness || 0) * 180 - 90
    gaugeRotation += (targetRotation - gaugeRotation) * 0.05
    
    if (animating) {
      animFrame = requestAnimationFrame(updateGauge)
    }
  }
  
  onMount(() => {
    updateGauge()
  })
  
  onDestroy(() => {
    if (animFrame) cancelAnimationFrame(animFrame)
  })
  
  const getRiskLevel = (value) => {
    if (value > 0.7) return { text: '高风险', color: '#ef4444' }
    if (value > 0.4) return { text: '中风险', color: '#f59e0b' }
    return { text: '低风险', color: '#22c55e' }
  }
  
  const riskInfo = getRiskLevel(metrics.gerrymanderingRisk || 0)
</script>

<div class="dashboard">
  <h2 class="dashboard-title">公平性指标仪表盘</h2>
  
  <div class="gauge-container">
    <div class="gauge">
      <svg viewBox="0 0 200 120" class="gauge-svg">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#22c55e" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#ef4444" />
          </linearGradient>
        </defs>
        
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          stroke-width="12"
          stroke-linecap="round"
        />
        
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          stroke-width="12"
          stroke-linecap="round"
          stroke-dasharray="{(metrics.fairness || 0) * 251.2} 251.2"
          class="gauge-fill"
        />
        
        <g transform="rotate({gaugeRotation}, 100, 100)">
          <line
            x1="100" y1="100"
            x2="100" y2="35"
            stroke="#ffffff"
            stroke-width="3"
            stroke-linecap="round"
            class="gauge-needle"
          />
          <circle cx="100" cy="100" r="6" fill="#ffffff" />
        </g>
      </svg>
      
      <div class="gauge-labels">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      
      <div class="gauge-value">
        <span class="value-number">{Math.round((metrics.fairness || 0) * 100)}%</span>
        <span class="value-label">公平性指数</span>
      </div>
    </div>
  </div>
  
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-icon compactness">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">{Math.round((metrics.avgCompactness || 0) * 100)}%</div>
        <div class="metric-label">紧凑性</div>
      </div>
    </div>
    
    <div class="metric-card">
      <div class="metric-icon population">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">{(metrics.totalPopulation || 0).toLocaleString()}</div>
        <div class="metric-label">总人口</div>
      </div>
    </div>
    
    <div class="metric-card">
      <div class="metric-icon avg-pop">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">{(metrics.avgPopulation || 0).toLocaleString()}</div>
        <div class="metric-label">平均选区人口</div>
      </div>
    </div>
    
    <div class="metric-card risk-card" style="--risk-color: {riskInfo.color}">
      <div class="metric-icon risk" style="color: {riskInfo.color}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01" />
          <path d="M12 15h.01" />
          <path d="M12 20h.01" />
          <path d="M12 4h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value" style="color: {riskInfo.color}">{riskInfo.text}</div>
        <div class="metric-label">Gerrymandering风险</div>
      </div>
    </div>
  </div>
  
  <div class="charts-section">
    <div class="chart">
      <h3>人口分布</h3>
      <div class="bar-chart">
        {#each districts as district}
          <div class="bar-item">
            <span class="bar-label">选区 {district.id}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                style="width: {(district.population / metrics.avgPopulation) * 50}%; background: {district.color}"
              ></div>
            </div>
            <span class="bar-value">{district.population.toLocaleString()}</span>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="chart">
      <h3>人口重心权重</h3>
      <div class="pie-chart">
        <svg viewBox="0 0 100 100">
          {#each populationCenters as center, index}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f59e0b"
              stroke-width="20"
              stroke-dasharray="{center.weight * 2.51} 251"
              stroke-dashoffset="-{populationCenters.slice(0, index).reduce((sum, c) => sum + c.weight, 0) * 2.51}"
              opacity="{0.6 + index * 0.1}"
            />
          {/each}
        </svg>
        <div class="pie-legend">
          {#each populationCenters as center, index}
            <div class="legend-item">
              <span class="legend-color" style="background: #f59e0b; opacity: {0.6 + index * 0.1}"></span>
              <span class="legend-text">重心 {index + 1}: {center.weight}%</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .dashboard-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #ffffff;
    background: linear-gradient(90deg, #06b6d4, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .gauge-container {
    margin-bottom: 16px;
  }
  
  .gauge {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .gauge-svg {
    width: 100%;
    max-width: 200px;
    height: auto;
  }
  
  .gauge-fill {
    transition: stroke-dasharray 0.5s ease;
  }
  
  .gauge-needle {
    transition: transform 0.3s ease-out;
    transform-origin: center bottom;
  }
  
  .gauge-labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 200px;
    margin-top: -10px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .gauge-value {
    text-align: center;
    margin-top: 10px;
  }
  
  .value-number {
    display: block;
    font-size: 32px;
    font-weight: 700;
    color: #06b6d4;
  }
  
  .value-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  
  .metric-card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
  }
  
  .metric-card:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }
  
  .metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
  }
  
  .metric-icon.compactness { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
  .metric-icon.population { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
  .metric-icon.avg-pop { color: #a855f7; background: rgba(168, 85, 247, 0.1); }
  .metric-icon.risk { background: rgba(239, 68, 68, 0.1); }
  
  .risk-card {
    border: 1px solid var(--risk-color);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  .metric-content {
    flex: 1;
  }
  
  .metric-value {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
  }
  
  .metric-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .charts-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .chart {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 12px;
  }
  
  .chart h3 {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 10px;
  }
  
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .bar-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .bar-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    width: 50px;
  }
  
  .bar-track {
    flex: 1;
    height: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
  }
  
  .bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.5s ease;
  }
  
  .bar-value {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    width: 70px;
    text-align: right;
  }
  
  .pie-chart {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .pie-chart svg {
    width: 80px;
    height: 80px;
  }
  
  .pie-legend {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .legend-color {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .legend-text {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
