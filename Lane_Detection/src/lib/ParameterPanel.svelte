<script lang="ts">
  import { params } from './stores'

  export let onDetect: (() => void) | undefined = undefined
  export let isDetecting = false

  let localParams = {
    cannyLow: 50,
    cannyHigh: 150,
    houghThreshold: 80,
    ransacIter: 100,
    ransacDist: 5,
    nmsWindow: 5
  }

  params.subscribe((v) => {
    localParams = { ...v }
  })

  interface SliderDef {
    key: keyof typeof localParams
    label: string
    min: number
    max: number
  }

  const sliders: SliderDef[] = [
    { key: 'cannyLow', label: 'Canny 低阈值', min: 10, max: 200 },
    { key: 'cannyHigh', label: 'Canny 高阈值', min: 50, max: 300 },
    { key: 'houghThreshold', label: '霍夫阈值', min: 20, max: 200 },
    { key: 'ransacIter', label: 'RANSAC 迭代', min: 10, max: 500 },
    { key: 'ransacDist', label: 'RANSAC 距离', min: 1, max: 20 },
    { key: 'nmsWindow', label: 'NMS 窗口', min: 1, max: 15 }
  ]

  function updateParam(key: keyof typeof localParams, value: number) {
    localParams[key] = value
    params.update((p) => ({ ...p, [key]: value }))
  }

  function onSliderInput(key: keyof typeof localParams, event: Event) {
    const target = event.target as HTMLInputElement
    updateParam(key, Number(target.value))
  }

  function handleDetect() {
    if (onDetect) onDetect()
  }
</script>

<div class="param-panel">
  <h3 class="panel-title">参数控制</h3>
  <div class="sliders">
    {#each sliders as s}
      <div class="slider-row">
        <label class="slider-label" for="param-{s.key}">{s.label}</label>
        <input
          id="param-{s.key}"
          type="range"
          min={s.min}
          max={s.max}
          value={localParams[s.key]}
          oninput={(e) => onSliderInput(s.key, e)}
        />
        <span class="slider-value">{localParams[s.key]}</span>
      </div>
    {/each}
  </div>
  <button class="detect-btn" on:click={handleDetect} disabled={isDetecting}>{isDetecting ? '检测中...' : '检测'}</button>
</div>

<style>
  .param-panel {
    background: var(--bg-card);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    padding: 18px;
    transition: all 0.3s ease;
  }

  .param-panel:hover {
    border-color: var(--accent-cyan);
    box-shadow: var(--glow-cyan);
  }

  .panel-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--accent-cyan);
    margin-bottom: 14px;
    letter-spacing: 0.5px;
  }

  .sliders {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .slider-label {
    font-size: 12px;
    color: var(--text-secondary);
    min-width: 90px;
    white-space: nowrap;
  }

  .slider-row input[type='range'] {
    flex: 1;
    accent-color: var(--accent-cyan);
    height: 4px;
  }

  .slider-value {
    font-size: 12px;
    color: var(--accent-cyan);
    font-family: 'JetBrains Mono', monospace;
    min-width: 30px;
    text-align: right;
  }

  .detect-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 229, 255, 0.05));
    border: 1px solid var(--accent-cyan);
    border-radius: 8px;
    color: var(--accent-cyan);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Noto Sans SC', sans-serif;
  }

  .detect-btn:hover {
    background: rgba(0, 229, 255, 0.3);
    box-shadow: var(--glow-cyan);
  }
</style>
