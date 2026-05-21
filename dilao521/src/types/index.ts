export type TileType = 'wall' | 'floor' | 'corridor' | 'door';

export interface Point {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface Corridor {
  points: Point[];
}

export interface Monster {
  id: string;
  x: number;
  y: number;
  type: 'goblin' | 'skeleton' | 'orc' | 'dragon';
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[];
  corridors: Corridor[];
  monsters: Monster[];
  seed: number;
}

export interface GenerationParameters {
  seed: number;
  roomCount: number;
  corridorWidth: number;
  monsterDensity: number;
  bspMinLeafSize: number;
  bspSplitRatio: number;
  caIterations: number;
  caBirthLimit: number;
  caDeathLimit: number;
  mapWidth: number;
  mapHeight: number;
}

export interface GenerationStats {
  roomsGenerated: number;
  corridorsCreated: number;
  monstersPlaced: number;
  generationTime: number;
  isConnected: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  parameters: GenerationParameters;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  name: string;
  seed: number;
  map: DungeonMap;
  createdAt: string;
}

export interface BSPNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: Room;
  isLeaf: boolean;
}

export interface AnimationFrame {
  type: 'room' | 'corridor' | 'monster' | 'fog' | 'connectivity';
  data: unknown;
  progress: number;
}

export type AnimationState = 'idle' | 'generating' | 'carving' | 'connecting' | 'placing' | 'revealing';
