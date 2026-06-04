<script lang="ts">
  import { activePreset } from './stores'

  export let onSelect: ((name: string) => void) | undefined = undefined
  export let drawingCanvas: { drawPreset: (name: string) => void } | undefined = undefined

  interface PresetDef {
    label: string
    name: string
  }

  const presets: PresetDef[] = [
    { label: '阴影遮盖', name: 'shadow-crack' },
    { label: '裂缝误检', name: 'road-crack' },
    { label: '急弯曲线', name: 'sharp-curve' },
    { label: '合流分流', name: 'multi-lane' }
  ]

  let current: string | null = null

  function selectPreset(name: string) {
    current = name
    activePreset.set(name)
    if (drawingCanvas) {
      drawingCanvas.drawPreset(name)
    }
    if (onSelect) onSelect(name)
  }
</script>

<div class="preset-bar">
  {#each presets as preset}
    <button
      class="preset-btn"
      class:active={current === preset.name}
      on:click={() => selectPreset(preset.name)}
    >
      {preset.label}
    </button>
  {/each}
</div>

<style>
  .preset-bar {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 10px 0;
  }
</style>
