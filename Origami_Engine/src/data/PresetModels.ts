export interface PresetVertex {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface PresetCrease {
  start: number;
  end: number;
  type: 'mountain' | 'valley' | 'flat';
  foldAngle: number;
}

export interface PresetModel {
  id: string;
  name: string;
  description: string;
  vertices: PresetVertex[];
  creases: PresetCrease[];
  vertexAngles: Map<number, number[]>;
}

export const PresetModels: PresetModel[] = [
  {
    id: 'preset1',
    name: '平坦可展性破坏',
    description: 'Kawasaki 条件被破坏，角度和不等于 π',
    vertices: [
      { id: 0, x: -1, y: -1, z: 0 },
      { id: 1, x: 1, y: -1, z: 0 },
      { id: 2, x: 1, y: 1, z: 0 },
      { id: 3, x: -1, y: 1, z: 0 },
      { id: 4, x: 0, y: 0, z: 0 }
    ],
    creases: [
      { start: 0, end: 1, type: 'valley', foldAngle: Math.PI / 4 },
      { start: 1, end: 2, type: 'mountain', foldAngle: Math.PI / 3 },
      { start: 2, end: 3, type: 'valley', foldAngle: Math.PI / 5 },
      { start: 3, end: 0, type: 'mountain', foldAngle: Math.PI / 6 },
      { start: 4, end: 0, type: 'flat', foldAngle: 0 },
      { start: 4, end: 1, type: 'flat', foldAngle: 0 },
      { start: 4, end: 2, type: 'flat', foldAngle: 0 },
      { start: 4, end: 3, type: 'flat', foldAngle: 0 }
    ],
    vertexAngles: new Map([
      [0, [Math.PI / 3, Math.PI / 4, Math.PI / 3]],
      [1, [Math.PI / 4, Math.PI / 5, Math.PI / 3]],
      [2, [Math.PI / 5, Math.PI / 6, Math.PI / 3]],
      [3, [Math.PI / 6, Math.PI / 3, Math.PI / 3]],
      [4, [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]]
    ])
  },
  {
    id: 'preset2',
    name: '顶点重叠冲突',
    description: '折叠过程中顶点位置发生重叠',
    vertices: [
      { id: 0, x: 0, y: 0, z: 0 },
      { id: 1, x: 1, y: 0, z: 0 },
      { id: 2, x: 0.5, y: Math.sqrt(3) / 2, z: 0 },
      { id: 3, x: 0.5, y: Math.sqrt(3) / 6, z: 0 },
      { id: 4, x: 0.5, y: Math.sqrt(3) / 6, z: 0.5 },
      { id: 5, x: 0.5, y: Math.sqrt(3) / 6, z: -0.5 }
    ],
    creases: [
      { start: 0, end: 1, type: 'mountain', foldAngle: Math.PI / 2 },
      { start: 1, end: 2, type: 'valley', foldAngle: Math.PI / 2 },
      { start: 2, end: 0, type: 'mountain', foldAngle: Math.PI / 2 },
      { start: 0, end: 3, type: 'flat', foldAngle: 0 },
      { start: 1, end: 3, type: 'flat', foldAngle: 0 },
      { start: 2, end: 3, type: 'flat', foldAngle: 0 },
      { start: 3, end: 4, type: 'valley', foldAngle: Math.PI },
      { start: 3, end: 5, type: 'mountain', foldAngle: Math.PI }
    ],
    vertexAngles: new Map([
      [0, [Math.PI / 3, Math.PI / 3, Math.PI / 3]],
      [1, [Math.PI / 3, Math.PI / 3, Math.PI / 3]],
      [2, [Math.PI / 3, Math.PI / 3, Math.PI / 3]],
      [3, [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]],
      [4, [Math.PI]],
      [5, [Math.PI]]
    ])
  },
  {
    id: 'preset3',
    name: '自穿插折叠',
    description: '折纸过程中面与面发生交叉穿透',
    vertices: [
      { id: 0, x: -2, y: -1, z: 0 },
      { id: 1, x: 2, y: -1, z: 0 },
      { id: 2, x: 2, y: 1, z: 0 },
      { id: 3, x: -2, y: 1, z: 0 },
      { id: 4, x: 0, y: 0, z: 0 },
      { id: 5, x: 0, y: 0, z: 1 },
      { id: 6, x: 0, y: 0, z: -1 }
    ],
    creases: [
      { start: 0, end: 1, type: 'valley', foldAngle: Math.PI / 3 },
      { start: 1, end: 2, type: 'mountain', foldAngle: Math.PI / 4 },
      { start: 2, end: 3, type: 'valley', foldAngle: Math.PI / 3 },
      { start: 3, end: 0, type: 'mountain', foldAngle: Math.PI / 4 },
      { start: 4, end: 0, type: 'flat', foldAngle: 0 },
      { start: 4, end: 1, type: 'flat', foldAngle: 0 },
      { start: 4, end: 2, type: 'flat', foldAngle: 0 },
      { start: 4, end: 3, type: 'flat', foldAngle: 0 },
      { start: 4, end: 5, type: 'valley', foldAngle: Math.PI / 2 },
      { start: 4, end: 6, type: 'mountain', foldAngle: Math.PI / 2 }
    ],
    vertexAngles: new Map([
      [0, [Math.PI / 4, Math.PI / 4, Math.PI / 2]],
      [1, [Math.PI / 4, Math.PI / 3, Math.PI / 5]],
      [2, [Math.PI / 3, Math.PI / 4, Math.PI / 5]],
      [3, [Math.PI / 4, Math.PI / 4, Math.PI / 2]],
      [4, [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]],
      [5, [Math.PI]],
      [6, [Math.PI]]
    ])
  },
  {
    id: 'preset4',
    name: '刚性折叠锁死',
    description: '过度约束导致折叠无法继续',
    vertices: [
      { id: 0, x: -1, y: -1, z: 0 },
      { id: 1, x: 1, y: -1, z: 0 },
      { id: 2, x: 1, y: 1, z: 0 },
      { id: 3, x: -1, y: 1, z: 0 },
      { id: 4, x: 0, y: -1.5, z: 0 },
      { id: 5, x: 0, y: 1.5, z: 0 },
      { id: 6, x: -1.5, y: 0, z: 0 },
      { id: 7, x: 1.5, y: 0, z: 0 },
      { id: 8, x: 0, y: 0, z: 1 }
    ],
    creases: [
      { start: 0, end: 1, type: 'valley', foldAngle: Math.PI / 2 },
      { start: 1, end: 2, type: 'mountain', foldAngle: Math.PI / 2 },
      { start: 2, end: 3, type: 'valley', foldAngle: Math.PI / 2 },
      { start: 3, end: 0, type: 'mountain', foldAngle: Math.PI / 2 },
      { start: 0, end: 4, type: 'flat', foldAngle: 0 },
      { start: 1, end: 4, type: 'flat', foldAngle: 0 },
      { start: 2, end: 5, type: 'flat', foldAngle: 0 },
      { start: 3, end: 5, type: 'flat', foldAngle: 0 },
      { start: 0, end: 6, type: 'flat', foldAngle: 0 },
      { start: 3, end: 6, type: 'flat', foldAngle: 0 },
      { start: 1, end: 7, type: 'flat', foldAngle: 0 },
      { start: 2, end: 7, type: 'flat', foldAngle: 0 },
      { start: 8, end: 0, type: 'mountain', foldAngle: Math.PI / 3 },
      { start: 8, end: 1, type: 'valley', foldAngle: Math.PI / 3 },
      { start: 8, end: 2, type: 'mountain', foldAngle: Math.PI / 3 },
      { start: 8, end: 3, type: 'valley', foldAngle: Math.PI / 3 }
    ],
    vertexAngles: new Map([
      [0, [Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4]],
      [1, [Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4]],
      [2, [Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4]],
      [3, [Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4]],
      [4, [Math.PI / 2, Math.PI / 2]],
      [5, [Math.PI / 2, Math.PI / 2]],
      [6, [Math.PI / 2, Math.PI / 2]],
      [7, [Math.PI / 2, Math.PI / 2]],
      [8, [Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4]]
    ])
  }
];

export function getPresetById(id: string): PresetModel | undefined {
  return PresetModels.find(m => m.id === id);
}