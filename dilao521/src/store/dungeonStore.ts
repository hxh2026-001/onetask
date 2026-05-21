import { create } from 'zustand';
import type { DungeonMap, GenerationParameters, Preset, AnimationState } from '../types';
import { generateDungeon } from '../utils/algorithms';
import { initDatabase, getPresets, saveToHistory } from '../utils/database';

interface DungeonStore {
  map: DungeonMap | null;
  parameters: GenerationParameters;
  presets: Preset[];
  animationState: AnimationState;
  fogOfWar: boolean;
  showConnectivity: boolean;
  
  setParameters: (params: Partial<GenerationParameters>) => void;
  loadPreset: (preset: Preset) => void;
  generateMap: () => void;
  saveCurrentMap: () => void;
  toggleFogOfWar: () => void;
  toggleConnectivity: () => void;
  refreshPresets: () => void;
  initialize: () => Promise<void>;
}

const defaultParameters: GenerationParameters = {
  seed: Math.floor(Math.random() * 10000),
  roomCount: 8,
  corridorWidth: 2,
  monsterDensity: 15,
  bspMinLeafSize: 8,
  bspSplitRatio: 0.5,
  caIterations: 4,
  caBirthLimit: 4,
  caDeathLimit: 3,
  mapWidth: 80,
  mapHeight: 60,
};

export const useDungeonStore = create<DungeonStore>((set, get) => ({
  map: null,
  parameters: defaultParameters,
  presets: [],
  animationState: 'idle',
  fogOfWar: true,
  showConnectivity: false,
  
  setParameters: (params) => {
    set((state) => ({
      parameters: { ...state.parameters, ...params },
    }));
  },
  
  loadPreset: (preset) => {
    set({ parameters: preset.parameters });
  },
  
  generateMap: () => {
    const { parameters } = get();
    set({ animationState: 'generating', map: null });
    
    setTimeout(() => {
      const newMap = generateDungeon(parameters);
      set({ map: newMap, animationState: 'carving' });
      
      setTimeout(() => {
        set({ animationState: 'connecting' });
        
        setTimeout(() => {
          set({ animationState: 'placing' });
          
          setTimeout(() => {
            set({ animationState: 'revealing' });
            
            setTimeout(() => {
              set({ animationState: 'idle' });
            }, 800);
          }, 600);
        }, 800);
      }, 1000);
    }, 100);
  },
  
  saveCurrentMap: () => {
    const { map, parameters } = get();
    if (map) {
      saveToHistory(`Dungeon_${Date.now()}`, parameters.seed, map);
    }
  },
  
  toggleFogOfWar: () => {
    set((state) => ({ fogOfWar: !state.fogOfWar }));
  },
  
  toggleConnectivity: () => {
    set((state) => ({ showConnectivity: !state.showConnectivity }));
  },
  
  refreshPresets: () => {
    const presets = getPresets();
    set({ presets });
  },
  
  initialize: async () => {
    await initDatabase();
    const presets = getPresets();
    set({ presets });
  },
}));
