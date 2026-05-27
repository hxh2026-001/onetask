interface Preset {
  id: number;
  name: string;
  pattern: string;
  testInput: string;
  description: string;
}

interface PresetButtonsProps {
  presets: Preset[];
  onSelect: (preset: Preset) => void;
}

const presetColors = [
  'from-red-600 to-red-500',
  'from-yellow-600 to-orange-500',
  'from-green-600 to-green-500',
  'from-purple-600 to-purple-500'
];

function PresetButtons({ presets, onSelect }: PresetButtonsProps) {
  return (
    <div className="max-w-7xl mx-auto mb-6">
      <h2 className="text-white text-sm font-medium mb-3 text-center">预设场景</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {presets.map((preset, index) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={`p-3 bg-gradient-to-r ${presetColors[index % 4]} rounded-xl text-white hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg`}
          >
            <div className="font-semibold text-sm mb-1">{preset.name}</div>
            <div className="text-xs opacity-90 truncate font-mono">{preset.pattern}</div>
            <div className="text-xs opacity-70 mt-1">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PresetButtons;
