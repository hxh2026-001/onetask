import type { Preset, HistoryEntry, DungeonMap } from '../types';

let presetsStore: Preset[] = [];
let historyStore: HistoryEntry[] = [];
let initialized = false;

function initDefaultPresets() {
  if (presetsStore.length > 0) return;
  
  const defaultPresets: Preset[] = [
    {
      id: 'standard-bsp',
      name: '标准 BSP 地牢场景',
      description: '标准参数生成的 BSP 地牢，适合大多数游戏场景',
      parameters: {
        seed: 42,
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
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ca-caves',
      name: '元胞自动机洞穴场景',
      description: '使用元胞自动机生成的天然洞穴系统',
      parameters: {
        seed: 123,
        roomCount: 4,
        corridorWidth: 1,
        monsterDensity: 20,
        bspMinLeafSize: 15,
        bspSplitRatio: 0.5,
        caIterations: 2,
        caBirthLimit: 5,
        caDeathLimit: 2,
        mapWidth: 80,
        mapHeight: 60,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'disconnected',
      name: '连通性断开场景',
      description: '演示连通性验证失败情况，存在孤立房间',
      parameters: {
        seed: 777,
        roomCount: 15,
        corridorWidth: 1,
        monsterDensity: 10,
        bspMinLeafSize: 5,
        bspSplitRatio: 0.8,
        caIterations: 3,
        caBirthLimit: 4,
        caDeathLimit: 3,
        mapWidth: 80,
        mapHeight: 60,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'overflow',
      name: '房间重叠溢出场景',
      description: '房间数量过多导致的溢出和畸形房间',
      parameters: {
        seed: 999,
        roomCount: 25,
        corridorWidth: 3,
        monsterDensity: 5,
        bspMinLeafSize: 3,
        bspSplitRatio: 0.3,
        caIterations: 5,
        caBirthLimit: 4,
        caDeathLimit: 3,
        mapWidth: 80,
        mapHeight: 60,
      },
      createdAt: new Date().toISOString(),
    },
  ];
  
  presetsStore = [...defaultPresets];
}

export async function initDatabase() {
  if (initialized) return;
  
  initDefaultPresets();
  initialized = true;
}

export function getPresets(): Preset[] {
  return [...presetsStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPresetById(id: string): Preset | null {
  return presetsStore.find(p => p.id === id) || null;
}

export function savePreset(preset: Omit<Preset, 'createdAt'>): void {
  const existingIndex = presetsStore.findIndex(p => p.id === preset.id);
  if (existingIndex >= 0) {
    presetsStore[existingIndex] = { ...preset, createdAt: presetsStore[existingIndex].createdAt };
  } else {
    presetsStore.push({ ...preset, createdAt: new Date().toISOString() });
  }
}

export function deletePreset(id: string): void {
  presetsStore = presetsStore.filter(p => p.id !== id);
}

export function getHistory(): HistoryEntry[] {
  return [...historyStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
}

export function getHistoryById(id: string): HistoryEntry | null {
  return historyStore.find(h => h.id === id) || null;
}

export function saveToHistory(name: string, seed: number, map: DungeonMap): void {
  const entry: HistoryEntry = {
    id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    seed,
    map,
    createdAt: new Date().toISOString(),
  };
  historyStore.unshift(entry);
  if (historyStore.length > 20) {
    historyStore = historyStore.slice(0, 20);
  }
}

export function deleteFromHistory(id: string): void {
  historyStore = historyStore.filter(h => h.id !== id);
}
