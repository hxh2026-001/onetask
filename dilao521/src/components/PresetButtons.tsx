import { useDungeonStore } from '../store/dungeonStore';
import type { Preset } from '../types';
import { BookOpen, Mountain, AlertTriangle, Zap } from 'lucide-react';

const presetIcons: Record<string, typeof BookOpen> = {
  'standard-bsp': BookOpen,
  'ca-caves': Mountain,
  'disconnected': AlertTriangle,
  'overflow': Zap,
};

const presetColors: Record<string, string> = {
  'standard-bsp': 'from-blue-500 to-cyan-500',
  'ca-caves': 'from-green-500 to-emerald-500',
  'disconnected': 'from-red-500 to-orange-500',
  'overflow': 'from-purple-500 to-pink-500',
};

export function PresetButtons() {
  const { presets, loadPreset, generateMap } = useDungeonStore();

  const handlePresetClick = (preset: Preset) => {
    loadPreset(preset);
    setTimeout(() => {
      generateMap();
    }, 100);
  };

  return (
    <div className="bg-dungeon-darker/80 backdrop-blur-sm rounded-xl p-6 border border-dungeon-blue/30 shadow-lg">
      <h2 className="text-xl font-bold text-dungeon-accent mb-4 flex items-center gap-2">
        <span>📚</span> 预设场景
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => {
          const Icon = presetIcons[preset.id] || BookOpen;
          const colorClass = presetColors[preset.id] || 'from-gray-500 to-gray-600';
          
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`relative overflow-hidden group rounded-lg p-4 bg-gradient-to-br ${colorClass} hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-lg/50`}
            >
              <div className="relative z-10">
                <Icon className="w-8 h-8 text-white mb-2" />
                <h3 className="text-white font-semibold text-sm">{preset.name}</h3>
                <p className="text-white/70 text-xs mt-1 line-clamp-2">{preset.description}</p>
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-all duration-300" />
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-dungeon-dark/50 rounded-lg">
        <p className="text-gray-400 text-xs">
          <span className="text-dungeon-accent">💡</span> 
          点击预设按钮可直接加载对应的参数并生成地牢，便于观察不同算法参数下的生成效果。
        </p>
      </div>
    </div>
  );
}
