import type { MazeState, Preset, TimeNode, MazeLayout, PresetId } from './types';

const createNodes = (): TimeNode[] => {
  const nodes: TimeNode[] = [];

  nodes.push({
    id: 'start',
    coordinates: {
      gregorian: { year: 2024, month: 1, day: 1 },
      lunar: { year: 2023, month: 12, day: 1 },
      mayan: { baktun: 13, katun: 1, tun: 1, uinal: 2, kin: 15 },
      persian: { year: 1402, month: 10, day: 11 }
    },
    position: { x: 0, y: 0, z: 0, w: 0 },
    unlocked: true,
    label: '起点',
    type: 'normal',
    timezone: 8
  });

  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 3 + (i % 3);
    nodes.push({
      id: `node_${i}`,
      coordinates: {
        gregorian: { year: 2024, month: Math.floor(i / 2) + 1, day: (i % 28) + 1 },
        lunar: { year: 2023, month: ((i + 6) % 12) + 1, day: (i % 28) + 1 },
        mayan: { baktun: 13, katun: i % 20, tun: i % 18, uinal: i % 20, kin: (i * 7) % 20 },
        persian: { year: 1402, month: ((i + 9) % 12) + 1, day: (i % 28) + 1 }
      },
      position: {
        x: Math.cos(angle) * radius,
        y: (i - 10) * 0.5,
        z: Math.sin(angle) * radius,
        w: i * 0.1
      },
      unlocked: i < 10,
      label: `节点 ${i + 1}`,
      type: i % 7 === 0 ? 'junction' : i % 11 === 0 ? 'trap' : 'normal',
      timezone: (i % 4) * 2 - 4
    });
  }

  nodes.push({
    id: 'target',
    coordinates: {
      gregorian: { year: 2025, month: 12, day: 31 },
      lunar: { year: 2025, month: 11, day: 12 },
      mayan: { baktun: 13, katun: 3, tun: 12, uinal: 5, kin: 18 },
      persian: { year: 1404, month: 10, day: 10 }
    },
    position: { x: 0, y: 5, z: 0, w: 5 },
    unlocked: false,
    label: '目标节点',
    type: 'target',
    timezone: 0
  });

  return nodes;
};

const createConnections = () => {
  const connections: { from: string; to: string; cost: number; calendar: any }[] = [];

  connections.push({ from: 'start', to: 'node_0', cost: 1, calendar: 'gregorian' });

  for (let i = 0; i < 19; i++) {
    connections.push({
      from: `node_${i}`,
      to: `node_${i + 1}`,
      cost: 1 + (i % 5) * 0.2,
      calendar: (['gregorian', 'lunar', 'mayan', 'persian'] as const)[i % 4]
    });
  }

  connections.push({ from: 'node_4', to: 'node_8', cost: 2.5, calendar: 'lunar' });
  connections.push({ from: 'node_6', to: 'node_12', cost: 3.0, calendar: 'mayan' });
  connections.push({ from: 'node_9', to: 'node_15', cost: 2.8, calendar: 'persian' });
  connections.push({ from: 'node_19', to: 'target', cost: 5, calendar: 'gregorian' });
  connections.push({ from: 'node_14', to: 'target', cost: 8, calendar: 'persian' });

  return connections;
};

const createDefaultLayout = (): MazeLayout => ({
  nodes: createNodes(),
  connections: createConnections()
});

export const DEFAULT_MAZE_STATE: MazeState = {
  currentNode: 'start',
  targetNode: 'target',
  unlockedNodes: ['start', 'node_0', 'node_1', 'node_2', 'node_3', 'node_4'],
  activeCalendar: 'gregorian',
  layout: createDefaultLayout(),
  discoveredRules: ['gregorian-basic', 'lunar-basic'],
  timezone: 8
};

const createLeapSecondLayout = (): MazeLayout => {
  const layout = createDefaultLayout();

  layout.nodes.push({
    id: 'leap_trap_1',
    coordinates: {
      gregorian: { year: 2024, month: 6, day: 30 },
      lunar: { year: 2024, month: 5, day: 4 },
      mayan: { baktun: 13, katun: 1, tun: 10, uinal: 15, kin: 19 },
      persian: { year: 1403, month: 4, day: 9 }
    },
    position: { x: 2, y: -3, z: 2, w: 1.5 },
    unlocked: false,
    label: '闰秒陷阱 I',
    type: 'trap',
    timezone: 0
  });

  layout.nodes.push({
    id: 'leap_trap_2',
    coordinates: {
      gregorian: { year: 2025, month: 12, day: 31 },
      lunar: { year: 2025, month: 11, day: 12 },
      mayan: { baktun: 13, katun: 3, tun: 11, uinal: 19, kin: 19 },
      persian: { year: 1404, month: 10, day: 10 }
    },
    position: { x: -2, y: -4, z: -2, w: 3 },
    unlocked: false,
    label: '闰秒陷阱 II',
    type: 'trap',
    timezone: 0
  });

  layout.connections.push({ from: 'node_5', to: 'leap_trap_1', cost: 0.5, calendar: 'gregorian' });
  layout.connections.push({ from: 'leap_trap_1', to: 'leap_trap_2', cost: 0.3, calendar: 'gregorian' });

  return layout;
};

const createCalendarGapLayout = (): MazeLayout => {
  const layout = createDefaultLayout();

  layout.nodes.push({
    id: 'gap_1',
    coordinates: {
      gregorian: { year: 1582, month: 10, day: 5 },
      lunar: { year: 1582, month: 9, day: 20 },
      mayan: { baktun: 11, katun: 16, tun: 18, uinal: 15, kin: 18 },
      persian: { year: 961, month: 7, day: 15 }
    },
    position: { x: -5, y: -2, z: 5, w: -2 },
    unlocked: false,
    label: '格里高利历断层',
    type: 'deadend',
    timezone: 1
  });

  layout.nodes.push({
    id: 'gap_2',
    coordinates: {
      gregorian: { year: 1582, month: 10, day: 15 },
      lunar: { year: 1582, month: 9, day: 30 },
      mayan: { baktun: 11, katun: 16, tun: 18, uinal: 16, kin: 8 },
      persian: { year: 961, month: 7, day: 25 }
    },
    position: { x: -3, y: -1, z: 5, w: -1 },
    unlocked: false,
    label: '历法跳跃点',
    type: 'junction',
    timezone: 1
  });

  layout.connections.push({ from: 'node_8', to: 'gap_1', cost: 100, calendar: 'gregorian' });
  layout.connections.push({ from: 'gap_1', to: 'gap_2', cost: 0.01, calendar: 'gregorian' });
  layout.connections.push({ from: 'gap_2', to: 'target', cost: 3, calendar: 'lunar' });

  return layout;
};

const createCyclicLoopLayout = (): MazeLayout => {
  const layout = createDefaultLayout();

  for (let i = 0; i < 8; i++) {
    layout.nodes.push({
      id: `loop_${i}`,
      coordinates: {
        gregorian: { year: 2024, month: ((i * 3) % 12) + 1, day: 15 },
        lunar: { year: 2024, month: ((i * 3 + 5) % 12) + 1, day: 16 },
        mayan: { baktun: 13, katun: i % 20, tun: (i * 5) % 18, uinal: 0, kin: 0 },
        persian: { year: 1403, month: ((i * 3 + 8) % 12) + 1, day: 24 }
      },
      position: {
        x: Math.cos((i / 8) * Math.PI * 2) * 4 + 5,
        y: Math.sin((i / 8) * Math.PI * 2) * 2,
        z: Math.sin((i / 8) * Math.PI * 2) * 4 + 5,
        w: i * 0.5
      },
      unlocked: i < 4,
      label: `循环节点 ${i + 1}`,
      type: i === 7 ? 'deadend' : 'normal',
      timezone: (i % 6) * 2
    });
  }

  for (let i = 0; i < 7; i++) {
    layout.connections.push({
      from: `loop_${i}`,
      to: `loop_${i + 1}`,
      cost: 1,
      calendar: (['lunar', 'mayan'] as const)[i % 2]
    });
  }
  layout.connections.push({ from: 'loop_7', to: 'loop_0', cost: 0.1, calendar: 'mayan' });
  layout.connections.push({ from: 'node_10', to: 'loop_0', cost: 2, calendar: 'lunar' });
  layout.connections.push({ from: 'loop_4', to: 'node_15', cost: 5, calendar: 'persian' });

  return layout;
};

const createCoordinateConflictLayout = (): MazeLayout => {
  const layout = createDefaultLayout();

  for (let i = 0; i < 6; i++) {
    layout.nodes.push({
      id: `conflict_${i}`,
      coordinates: {
        gregorian: { year: 2024, month: 3, day: 20 + i },
        lunar: { year: 2024, month: 2, day: 10 + i },
        mayan: { baktun: 13, katun: 1, tun: 5, uinal: 2, kin: 10 + i },
        persian: { year: 1403, month: 1, day: 1 + i }
      },
      position: { x: -4 + i, y: 3, z: -4 + i, w: 2 + i * 0.3 },
      unlocked: i < 3,
      label: `冲突节点 ${i + 1}`,
      type: i === 5 ? 'trap' : 'junction',
      timezone: (i * 3) % 12
    });
  }

  for (let i = 0; i < 5; i++) {
    layout.connections.push({
      from: `conflict_${i}`,
      to: `conflict_${i + 1}`,
      cost: 2 + i * 0.5,
      calendar: (['gregorian', 'lunar', 'mayan', 'persian'] as const)[i]
    });
  }

  layout.connections.push({ from: 'node_7', to: 'conflict_0', cost: 3, calendar: 'gregorian' });
  layout.connections.push({ from: 'conflict_2', to: 'node_12', cost: 4, calendar: 'lunar' });
  layout.connections.push({ from: 'conflict_5', to: 'target', cost: 10, calendar: 'persian' });

  return layout;
};

export const PRESETS: Record<PresetId, Preset> = {
  'leap-second': {
    id: 'leap-second',
    name: '预设一：闰秒堆积陷阱',
    description: '探索闰秒累积导致的时间偏移，发现隐藏的闰秒陷阱节点',
    state: {
      currentNode: 'start',
      targetNode: 'target',
      unlockedNodes: ['start', 'node_0', 'node_1', 'node_2', 'node_3', 'node_4', 'node_5'],
      activeCalendar: 'gregorian',
      layout: createLeapSecondLayout(),
      discoveredRules: ['gregorian-basic', 'leap-second-detection'],
      timezone: 0
    }
  },
  'calendar-gap': {
    id: 'calendar-gap',
    name: '预设二：历法断代跳跃',
    description: '穿越1582年格里高利历改革造成的10天断层',
    state: {
      currentNode: 'start',
      targetNode: 'target',
      unlockedNodes: ['start', 'node_0', 'node_1', 'node_5', 'node_6', 'node_7', 'node_8'],
      activeCalendar: 'lunar',
      layout: createCalendarGapLayout(),
      discoveredRules: ['gregorian-basic', 'lunar-basic', 'calendar-gap-jump'],
      timezone: 1
    }
  },
  'cyclic-loop': {
    id: 'cyclic-loop',
    name: '预设三：周期性循环死路',
    description: '玛雅历与农历的周期性共振形成的无限循环',
    state: {
      currentNode: 'start',
      targetNode: 'target',
      unlockedNodes: ['start', 'node_0', 'node_5', 'node_10', 'loop_0', 'loop_1', 'loop_2'],
      activeCalendar: 'mayan',
      layout: createCyclicLoopLayout(),
      discoveredRules: ['mayan-basic', 'lunar-basic', 'cycle-detection'],
      timezone: 6
    }
  },
  'coordinate-conflict': {
    id: 'coordinate-conflict',
    name: '预设四：多历法坐标冲突',
    description: '四种历法在春分点附近的坐标冲突与转换精度丢失',
    state: {
      currentNode: 'start',
      targetNode: 'target',
      unlockedNodes: ['start', 'node_0', 'node_3', 'node_5', 'node_7', 'conflict_0', 'conflict_1'],
      activeCalendar: 'persian',
      layout: createCoordinateConflictLayout(),
      discoveredRules: ['gregorian-basic', 'persian-basic', 'conflict-resolution'],
      timezone: 4
    }
  }
};

export const CALENDAR_COLORS: Record<string, string> = {
  gregorian: '#4a9eff',
  lunar: '#ff6b35',
  mayan: '#9b59b6',
  persian: '#2ecc71'
};

export const CALENDAR_NAMES: Record<string, string> = {
  gregorian: '公历',
  lunar: '农历',
  mayan: '玛雅历',
  persian: '波斯历'
};
