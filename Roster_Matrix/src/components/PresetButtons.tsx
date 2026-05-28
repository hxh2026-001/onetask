import { component$ } from '@builder.io/qwik'

interface Preset {
  key: string
  name: string
  description: string
}

interface PresetButtonsProps {
  presets: Preset[]
  selectedPreset: string | null
  onSelect: (key: string) => void
}

export default component$<PresetButtonsProps>(({ presets, selectedPreset, onSelect }) => {
  return (
    <div class="presets">
      {presets.map((preset) => (
        <button
          key={preset.key}
          class={`preset-btn ${selectedPreset === preset.key ? 'active' : ''}`}
          onClick$={() => onSelect(preset.key)}
        >
          <div style="font-size: 18px; margin-bottom: 5px;">{preset.name}</div>
          <div style="font-size: 12px; opacity: 0.8;">{preset.description}</div>
        </button>
      ))}
    </div>
  )
})