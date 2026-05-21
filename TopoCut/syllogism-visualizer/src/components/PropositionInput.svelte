<script>
  import { createEventDispatcher } from 'svelte'

  export let label
  export let proposition
  export let placeholder = ''

  const dispatch = createEventDispatcher()

  const typeOptions = [
    { value: 'A', label: 'A 全称肯定', desc: '所有S是P' },
    { value: 'E', label: 'E 全称否定', desc: '所有S不是P' },
    { value: 'I', label: 'I 特称肯定', desc: '有些S是P' },
    { value: 'O', label: 'O 特称否定', desc: '有些S不是P' }
  ]

  function updateText(e) {
    proposition = { ...proposition, text: e.target.value }
    dispatch('input')
  }

  function updateType(e) {
    proposition = { ...proposition, type: e.target.value }
    dispatch('input')
  }
</script>

<div class="proposition-input">
  <label class="input-label" for={`input-${label.replace(/\s/g, '-')}`}>{label}</label>
  
  <div class="input-row">
    <select 
      class="type-select"
      value={proposition.type}
      on:change={updateType}
    >
      {#each typeOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    
    <input
      id={`input-${label.replace(/\s/g, '-')}`}
      type="text"
      class="text-input"
      value={proposition.text}
      on:input={updateText}
      placeholder={placeholder}
    />
  </div>
  
  <div class="type-hint">
    {typeOptions.find(o => o.value === proposition.type)?.desc}
  </div>
</div>

<style>
  .proposition-input {
    margin-bottom: 16px;
  }

  .input-label {
    display: block;
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 13px;
    color: var(--ink-dark);
    margin-bottom: 6px;
    font-weight: 600;
  }

  .input-row {
    display: flex;
    gap: 8px;
  }

  .type-select {
    width: 120px;
    padding: 10px;
    border: 2px solid var(--border-dark);
    background: var(--parchment-bg);
    color: var(--ink-dark);
    border-radius: 6px;
    font-family: 'Noto Serif SC', serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-select:hover {
    border-color: var(--ink-gold);
  }

  .type-select:focus {
    outline: none;
    border-color: var(--ink-gold);
    box-shadow: 0 0 0 3px rgba(184, 134, 11, 0.2);
  }

  .text-input {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid var(--border-dark);
    background: rgba(255, 255, 255, 0.9);
    color: var(--ink-dark);
    border-radius: 6px;
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .text-input::placeholder {
    color: rgba(44, 24, 16, 0.4);
    font-style: italic;
  }

  .text-input:hover {
    border-color: var(--ink-gold);
  }

  .text-input:focus {
    outline: none;
    border-color: var(--ink-gold);
    box-shadow: 0 0 0 3px rgba(184, 134, 11, 0.2);
    background: white;
  }

  .type-hint {
    font-size: 11px;
    color: var(--ink-dark);
    opacity: 0.5;
    margin-top: 4px;
    font-style: italic;
  }
</style>
