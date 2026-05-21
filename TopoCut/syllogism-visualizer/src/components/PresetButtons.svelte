<script>
  import { createEventDispatcher } from 'svelte'
  import templates from '../data/argument-templates.json'

  const dispatch = createEventDispatcher()

  const presets = templates.templates.filter(t => t.id.startsWith('preset'))

  function loadPreset(preset) {
    dispatch('load', preset)
  }
</script>

<div class="preset-panel">
  <h3>经典谬误预设</h3>
  <p class="panel-desc">点击加载预设的谬误论证结构</p>
  
  <div class="preset-buttons">
    {#each presets as preset}
      <button 
        class="preset-btn"
        on:click={() => loadPreset(preset)}
        data-fallacy={preset.fallacyType}
      >
        <span class="preset-icon">
          {preset.fallacyType === 'affirming_the_consequent' ? '⇒' : ''}
          {preset.fallacyType === 'four_terms' ? '✦' : ''}
          {preset.fallacyType === 'existential_import' ? '◯' : ''}
          {preset.fallacyType === 'sorites_paradox' ? '⟳' : ''}
        </span>
        <span class="preset-name">{preset.name}</span>
        <span class="preset-desc">{preset.description}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .preset-panel {
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid var(--border-dark);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  h3 {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 18px;
    color: var(--ink-dark);
    margin-bottom: 8px;
  }

  .panel-desc {
    font-size: 12px;
    color: var(--ink-dark);
    opacity: 0.6;
    margin-bottom: 15px;
  }

  .preset-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .preset-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    border: 2px solid var(--border-dark);
    background: linear-gradient(135deg, rgba(244, 233, 216, 0.9) 0%, rgba(232, 220, 200, 0.9) 100%);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    position: relative;
    overflow: hidden;
  }

  .preset-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(184, 134, 11, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .preset-btn:hover {
    transform: translateX(8px) translateY(-2px);
    box-shadow: -4px 4px 20px rgba(44, 24, 16, 0.3);
    border-color: var(--ink-gold);
  }

  .preset-btn:hover::before {
    left: 100%;
  }

  .preset-icon {
    font-size: 24px;
    color: var(--ink-gold);
    margin-bottom: 8px;
  }

  .preset-name {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-dark);
    margin-bottom: 4px;
  }

  .preset-desc {
    font-size: 11px;
    color: var(--ink-dark);
    opacity: 0.7;
    line-height: 1.4;
  }
</style>
