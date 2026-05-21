<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import SylMatrix from './components/SylMatrix.svelte'
  import PropositionInput from './components/PropositionInput.svelte'
  import ValidationPanel from './components/ValidationPanel.svelte'
  import PresetButtons from './components/PresetButtons.svelte'
  import SVGAnimationLayer from './components/SVGAnimationLayer.svelte'
  import LogicTreeVisualizer from './components/LogicTreeVisualizer.svelte'
  import { validateSyllogism } from './logic/syllogismEngine.js'
  import templates from './data/argument-templates.json'

  const dispatch = createEventDispatcher()

  let figure = 1
  let major = { text: '', type: 'A' }
  let minor = { text: '', type: 'A' }
  let conclusion = { text: '', type: 'A' }
  let validationResult = null
  let showLogicTree = false
  let animationState = {
    showElasticRope: false,
    showGreenFlow: false,
    showRedArc: false,
    showRipple: false,
    showTypewriter: false,
    typewriterText: '',
    connections: []
  }

  function validate() {
    if (!major.text || !minor.text || !conclusion.text) return
    
    validationResult = validateSyllogism(major, minor, conclusion, figure)
    
    animationState = {
      showElasticRope: true,
      showGreenFlow: validationResult.valid,
      showRedArc: !validationResult.valid && validationResult.fallacies.length > 0,
      showRipple: true,
      showTypewriter: true,
      typewriterText: conclusion.text,
      connections: [
        { from: 'major', to: 'minor' },
        { from: 'minor', to: 'conclusion' }
      ]
    }
    
    setTimeout(() => {
      animationState.showElasticRope = false
      animationState.showRipple = false
    }, 3000)
    
    setTimeout(() => {
      animationState.showGreenFlow = false
      animationState.showRedArc = false
    }, 4000)
  }

  function loadPreset(preset) {
    const newMajorText = preset.example?.major || ''
    const newMinorText = preset.example?.minor || ''
    const newConclusionText = preset.example?.conclusion || ''
    
    major = { ...major, text: newMajorText }
    minor = { ...minor, text: newMinorText }
    conclusion = { ...conclusion, text: newConclusionText }
    figure = preset.figure || 1
    validationResult = null
    
    animationState = {
      ...animationState,
      showTypewriter: true,
      typewriterText: newConclusionText
    }
    
    setTimeout(() => validate(), 500)
  }

  function updateFigure(newFigure) {
    figure = newFigure
    validationResult = null
  }

  function clearAll() {
    major = { text: '', type: 'A' }
    minor = { text: '', type: 'A' }
    conclusion = { text: '', type: 'A' }
    validationResult = null
    animationState = {
      showElasticRope: false,
      showGreenFlow: false,
      showRedArc: false,
      showRipple: false,
      showTypewriter: false,
      typewriterText: '',
      connections: []
    }
  }
</script>

<div class="app-container">
  <header class="main-header">
    <div class="title-section">
      <h1 class="main-title">
        <span class="title-char">古</span>
        <span class="title-char">典</span>
        <span class="title-char">修</span>
        <span class="title-char">辞</span>
        <span class="title-char">三</span>
        <span class="title-char">段</span>
        <span class="title-char">论</span>
        <span class="title-char">可</span>
        <span class="title-char">视</span>
        <span class="title-char">化</span>
        <span class="title-char">构</span>
        <span class="title-char">建</span>
        <span class="title-char">工</span>
        <span class="title-char">具</span>
      </h1>
      <p class="subtitle">Syllogism Visualization Builder</p>
    </div>
  </header>

  <div class="main-content">
    <div class="left-panel">
      <PresetButtons on:load={loadPreset} />
      
      <div class="figure-selector">
        <h3>选择格 (Figure)</h3>
        <div class="figure-buttons">
          {#each [1, 2, 3, 4] as f}
            <button 
              class={`figure-btn ${figure === f ? 'active' : ''}`}
              on:click={() => updateFigure(f)}
            >
              第{f}格
            </button>
          {/each}
        </div>
        <p class="figure-desc">
          {figure === 1 ? '中项在大前提作主项，在小前提作谓项' : ''}
          {figure === 2 ? '中项在两个前提中都作谓项' : ''}
          {figure === 3 ? '中项在两个前提中都作主项' : ''}
          {figure === 4 ? '中项在大前提作谓项，在小前提作主项' : ''}
        </p>
      </div>

      <div class="propositions-section">
        <h3>命题输入</h3>
        <PropositionInput 
          label="大前提 (Major Premise)" 
          bind:proposition={major}
          placeholder="例如：所有人都是会死的"
          on:input={() => validationResult = null}
        />
        <PropositionInput 
          label="小前提 (Minor Premise)" 
          bind:proposition={minor}
          placeholder="例如：苏格拉底是人"
          on:input={() => validationResult = null}
        />
        <PropositionInput 
          label="结 论 (Conclusion)" 
          bind:proposition={conclusion}
          placeholder="例如：苏格拉底是会死的"
          on:input={() => validationResult = null}
        />
      </div>

      <div class="action-buttons">
        <button class="btn-primary" on:click={validate}>
          验证论证有效性
        </button>
        <button class="btn-secondary" on:click={clearAll}>
          清空
        </button>
        <button class="btn-tertiary" on:click={() => showLogicTree = !showLogicTree}>
          {showLogicTree ? '隐藏' : '显示'}逻辑树
        </button>
      </div>
    </div>

    <div class="center-panel">
      <SylMatrix 
        {figure}
        {major}
        {minor}
        {conclusion}
        {validationResult}
        {animationState}
      />
    </div>

    <div class="right-panel">
      <ValidationPanel {validationResult} />
      
      {#if showLogicTree}
        <LogicTreeVisualizer {major} {minor} {conclusion} />
      {/if}
    </div>
  </div>

  <SVGAnimationLayer {animationState} />
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-header {
    padding: 20px 40px;
    background: linear-gradient(135deg, rgba(44, 24, 16, 0.95) 0%, rgba(92, 64, 51, 0.9) 100%);
    border-bottom: 4px solid var(--ink-gold);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }

  .title-section {
    text-align: center;
  }

  .main-title {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 36px;
    color: var(--ink-gold);
    letter-spacing: 8px;
    margin-bottom: 8px;
  }

  .title-char {
    display: inline-block;
    animation: inkSpread 0.5s ease-out forwards;
    opacity: 0;
  }

  .title-char:nth-child(1) { animation-delay: 0.0s; }
  .title-char:nth-child(2) { animation-delay: 0.1s; }
  .title-char:nth-child(3) { animation-delay: 0.2s; }
  .title-char:nth-child(4) { animation-delay: 0.3s; }
  .title-char:nth-child(5) { animation-delay: 0.4s; }
  .title-char:nth-child(6) { animation-delay: 0.5s; }
  .title-char:nth-child(7) { animation-delay: 0.6s; }
  .title-char:nth-child(8) { animation-delay: 0.7s; }
  .title-char:nth-child(9) { animation-delay: 0.8s; }
  .title-char:nth-child(10) { animation-delay: 0.9s; }
  .title-char:nth-child(11) { animation-delay: 1.0s; }
  .title-char:nth-child(12) { animation-delay: 1.1s; }
  .title-char:nth-child(13) { animation-delay: 1.2s; }
  .title-char:nth-child(14) { animation-delay: 1.3s; }
  .title-char:nth-child(15) { animation-delay: 1.4s; }

  .subtitle {
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
    color: rgba(244, 233, 216, 0.7);
    letter-spacing: 4px;
  }

  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 380px 1fr 380px;
    gap: 20px;
    padding: 20px;
  }

  .left-panel, .right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .center-panel {
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .figure-selector {
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid var(--border-dark);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .figure-selector h3 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 18px;
    color: var(--ink-dark);
    margin-bottom: 15px;
  }

  .figure-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .figure-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid var(--border-dark);
    background: var(--parchment-bg);
    color: var(--ink-dark);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
  }

  .figure-btn:hover {
    background: var(--ink-gold);
    color: var(--parchment-bg);
    transform: translateY(-2px);
  }

  .figure-btn.active {
    background: var(--ink-dark);
    color: var(--ink-gold);
    border-color: var(--ink-gold);
  }

  .figure-desc {
    font-size: 12px;
    color: var(--ink-dark);
    opacity: 0.7;
    margin-top: 10px;
    font-style: italic;
  }

  .propositions-section {
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid var(--border-dark);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .propositions-section h3 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 18px;
    color: var(--ink-dark);
    margin-bottom: 15px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn-primary, .btn-secondary, .btn-tertiary {
    padding: 12px 24px;
    border: 2px solid var(--border-dark);
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: var(--ink-dark);
    color: var(--ink-gold);
    border-color: var(--ink-gold);
  }

  .btn-primary:hover {
    background: var(--ink-gold);
    color: var(--parchment-bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(184, 134, 11, 0.4);
  }

  .btn-secondary {
    background: var(--parchment-bg);
    color: var(--ink-dark);
  }

  .btn-secondary:hover {
    background: var(--ink-red);
    color: var(--parchment-bg);
    border-color: var(--ink-red);
    transform: translateY(-2px);
  }

  .btn-tertiary {
    background: transparent;
    color: var(--ink-dark);
    border-style: dashed;
  }

  .btn-tertiary:hover {
    background: var(--ink-blue);
    color: var(--parchment-bg);
    border-color: var(--ink-blue);
    transform: translateY(-2px);
  }

  @media (max-width: 1400px) {
    .main-content {
      grid-template-columns: 1fr;
    }
  }
</style>
