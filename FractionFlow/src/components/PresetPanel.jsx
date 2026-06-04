import { For } from 'solid-js';

export default function PresetPanel(props) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '简单': return '#10b981';
      case '中等': return '#f59e0b';
      case '困难': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div class="preset-buttons">
      <For each={props.presets}>
        {(preset) => (
          <button
            class={`preset-btn ${props.activePreset === preset.id ? 'active' : ''}`}
            onClick={() => props.onSelect(preset)}
          >
            <div class="preset-name">{preset.name}</div>
            <div class="preset-desc">{preset.description}</div>
            <span 
              class="difficulty"
              style={{
                background: props.activePreset === preset.id 
                  ? 'rgba(255,255,255,0.2)' 
                  : getDifficultyColor(preset.difficulty) + '20',
                color: props.activePreset === preset.id ? 'white' : getDifficultyColor(preset.difficulty)
              }}
            >
              {preset.difficulty}
            </span>
          </button>
        )}
      </For>
    </div>
  );
}
