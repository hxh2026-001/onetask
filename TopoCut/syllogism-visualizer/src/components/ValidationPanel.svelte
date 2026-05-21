<script>
  import fallaciesData from '../data/fallacies.json'

  export let validationResult

  function getFallacyInfo(type) {
    return fallaciesData.formalFallacies[type] || 
           fallaciesData.informalFallacies[type] || 
           { name: type, description: '未知谬误类型' }
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'critical': return '#8b0000'
      case 'high': return '#cc5500'
      case 'medium': return '#cc9900'
      case 'low': return '#666666'
      default: return '#333333'
    }
  }

  function getSeverityLabel(severity) {
    switch (severity) {
      case 'critical': return '严重'
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '未知'
    }
  }
</script>

<div class="validation-panel">
  <h3>论证验证结果</h3>

  {#if !validationResult}
    <div class="empty-state">
      <div class="empty-icon">⚖</div>
      <p>请输入命题并点击"验证论证有效性"</p>
    </div>
  {:else}
    <div class="result-summary" class:valid={validationResult.valid} class:invalid={!validationResult.valid}>
      <div class="result-icon">
        {#if validationResult.valid}
          <svg viewBox="0 0 24 24" width="48" height="48" fill="#2e8b57">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" width="48" height="48" fill="#8b0000">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        {/if}
      </div>
      <div class="result-text">
        <h4>{validationResult.valid ? '论证有效' : '论证无效'}</h4>
        <p class="mood-info">
          第{validationResult.figure}格 · {validationResult.mood}式
        </p>
      </div>
    </div>

    {#if validationResult.mood}
      <div class="mood-analysis">
        <h4>式分析</h4>
        <div class="mood-codes">
          <div class="mood-code">
            <span class="code-label">大前提</span>
            <span class="code-value">{validationResult.mood[0]}</span>
          </div>
          <div class="mood-code">
            <span class="code-label">小前提</span>
            <span class="code-value">{validationResult.mood[1]}</span>
          </div>
          <div class="mood-code">
            <span class="code-label">结论</span>
            <span class="code-value">{validationResult.mood[2]}</span>
          </div>
        </div>
      </div>
    {/if}

    {#if validationResult.distributionAnalysis}
      <div class="distribution-section">
        <h4>周延性分析</h4>
        <div class="distribution-grid">
          {#each Object.entries(validationResult.distributionAnalysis) as [role, analysis]}
            <div class="dist-item">
              <div class="dist-label">{role === 'major' ? '大前提' : role === 'minor' ? '小前提' : '结论'}</div>
              <div class="dist-type">{analysis.type}</div>
              <div class="dist-details">
                <span class="dist-badge" class:distributed={analysis.subjectDistributed}>
                  主项 {analysis.subjectDistributed ? '周延' : '不周延'}
                </span>
                <span class="dist-badge" class:distributed={analysis.predicateDistributed}>
                  谓项 {analysis.predicateDistributed ? '周延' : '不周延'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if validationResult.fallacies && validationResult.fallacies.length > 0}
      <div class="fallacies-section">
        <h4>检测到的谬误</h4>
        <div class="fallacy-list">
          {#each validationResult.fallacies as fallacy, i}
            <div class="fallacy-item" style="animation-delay: {i * 0.1}s">
              <div class="fallacy-header">
                <span class="fallacy-name">{getFallacyInfo(fallacy.type).name}</span>
                <span class="severity-badge" style="background: {getSeverityColor(fallacy.severity)}">
                  {getSeverityLabel(fallacy.severity)}
                </span>
              </div>
              <p class="fallacy-message">{fallacy.message}</p>
              {#if getFallacyInfo(fallacy.type).description}
                <p class="fallacy-desc">{getFallacyInfo(fallacy.type).description}</p>
              {/if}
              {#if fallacy.terms}
                <div class="fallacy-terms">
                  <span class="terms-label">涉及词项：</span>
                  {#each fallacy.terms as term}
                    <span class="term-tag">{term}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if validationResult.warnings && validationResult.warnings.length > 0}
      <div class="warnings-section">
        <h4>注意事项</h4>
        {#each validationResult.warnings as warning}
          <div class="warning-item">
            <span class="warning-icon">⚠</span>
            <p>{warning.message}</p>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .validation-panel {
    background: rgba(255, 255, 255, 0.85);
    border: 2px solid var(--border-dark);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    max-height: 80vh;
    overflow-y: auto;
  }

  h3 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 18px;
    color: var(--ink-dark);
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--ink-gold);
  }

  h4 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 14px;
    color: var(--ink-dark);
    margin: 16px 0 12px 0;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--ink-dark);
    opacity: 0.5;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .result-summary {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .result-summary.valid {
    background: linear-gradient(135deg, rgba(46, 139, 87, 0.1) 0%, rgba(46, 139, 87, 0.05) 100%);
    border: 2px solid var(--ink-green);
  }

  .result-summary.invalid {
    background: linear-gradient(135deg, rgba(139, 0, 0, 0.1) 0%, rgba(139, 0, 0, 0.05) 100%);
    border: 2px solid var(--ink-red);
  }

  .result-text h4 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 20px;
    margin: 0 0 4px 0;
  }

  .valid .result-text h4 {
    color: var(--ink-green);
  }

  .invalid .result-text h4 {
    color: var(--ink-red);
  }

  .mood-info {
    font-size: 12px;
    color: var(--ink-dark);
    opacity: 0.7;
    margin: 0;
  }

  .mood-analysis {
    background: rgba(44, 24, 16, 0.03);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .mood-codes {
    display: flex;
    justify-content: space-around;
  }

  .mood-code {
    text-align: center;
  }

  .code-label {
    display: block;
    font-size: 11px;
    color: var(--ink-dark);
    opacity: 0.6;
    margin-bottom: 4px;
  }

  .code-value {
    display: inline-block;
    width: 40px;
    height: 40px;
    line-height: 40px;
    background: var(--ink-dark);
    color: var(--ink-gold);
    border-radius: 50%;
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 18px;
    font-weight: 700;
  }

  .distribution-section {
    margin-bottom: 12px;
  }

  .distribution-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dist-item {
    background: rgba(44, 24, 16, 0.03);
    border-radius: 8px;
    padding: 10px;
  }

  .dist-label {
    font-size: 11px;
    color: var(--ink-dark);
    opacity: 0.6;
    margin-bottom: 2px;
  }

  .dist-type {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-dark);
    margin-bottom: 6px;
  }

  .dist-details {
    display: flex;
    gap: 6px;
  }

  .dist-badge {
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 10px;
    background: rgba(44, 24, 16, 0.1);
    color: var(--ink-dark);
  }

  .dist-badge.distributed {
    background: var(--ink-green);
    color: white;
  }

  .fallacies-section {
    margin-bottom: 12px;
  }

  .fallacy-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .fallacy-item {
    background: linear-gradient(135deg, rgba(139, 0, 0, 0.08) 0%, rgba(139, 0, 0, 0.02) 100%);
    border: 1px solid rgba(139, 0, 0, 0.3);
    border-left: 4px solid var(--ink-red);
    border-radius: 6px;
    padding: 12px;
    animation: slideIn 0.3s ease-out forwards;
    opacity: 0;
    transform: translateX(20px);
  }

  @keyframes slideIn {
    to { opacity: 1; transform: translateX(0); }
  }

  .fallacy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .fallacy-name {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-red);
  }

  .severity-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
  }

  .fallacy-message {
    font-size: 12px;
    color: var(--ink-dark);
    margin: 4px 0;
  }

  .fallacy-desc {
    font-size: 11px;
    color: var(--ink-dark);
    opacity: 0.6;
    font-style: italic;
    margin: 4px 0 0 0;
  }

  .fallacy-terms {
    margin-top: 8px;
  }

  .terms-label {
    font-size: 11px;
    color: var(--ink-dark);
    opacity: 0.6;
    margin-right: 6px;
  }

  .term-tag {
    display: inline-block;
    font-size: 10px;
    padding: 2px 8px;
    background: rgba(44, 24, 16, 0.1);
    border-radius: 10px;
    margin-right: 4px;
  }

  .warnings-section {
    margin-bottom: 12px;
  }

  .warning-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(204, 153, 0, 0.1);
    border-left: 3px solid #cc9900;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 6px;
  }

  .warning-icon {
    color: #cc9900;
    font-size: 16px;
  }

  .warning-item p {
    font-size: 12px;
    color: var(--ink-dark);
    margin: 0;
  }
</style>
