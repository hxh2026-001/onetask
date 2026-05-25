export type CalendarType = 'gregorian' | 'lunar' | 'mayan' | 'persian';

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
  calendar: CalendarType;
}

export interface MayanDate {
  baktun: number;
  katun: number;
  tun: number;
  uinal: number;
  kin: number;
}

export interface TimeNode {
  id: string;
  coordinates: {
    gregorian: { year: number; month: number; day: number };
    lunar: { year: number; month: number; day: number };
    mayan: MayanDate;
    persian: { year: number; month: number; day: number };
  };
  position: { x: number; y: number; z: number; w: number };
  unlocked: boolean;
  label: string;
  type: 'normal' | 'junction' | 'trap' | 'deadend' | 'target';
  timezone: number;
}

export interface ConversionRule {
  id: string;
  sourceCalendar: CalendarType;
  targetCalendar: CalendarType;
  formula: string;
  precisionLoss: number;
  conflicts: string[];
}

export interface MazeLayout {
  nodes: TimeNode[];
  connections: { from: string; to: string; cost: number; calendar: CalendarType }[];
}

export interface MazeState {
  currentNode: string;
  targetNode: string;
  unlockedNodes: string[];
  activeCalendar: CalendarType;
  layout: MazeLayout;
  discoveredRules: string[];
  timezone: number;
}

export interface PathResult {
  path: string[];
  cost: number;
  warnings: string[];
}

export type PresetId = 'leap-second' | 'calendar-gap' | 'cyclic-loop' | 'coordinate-conflict';

export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  state: MazeState;
}

export interface AnimationState {
  sweepActive: boolean;
  dissolveActive: boolean;
  trailActive: boolean;
  heartbeatActive: boolean;
  mosaicActive: boolean;
}
