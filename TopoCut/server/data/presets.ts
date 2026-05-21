import type { Layer } from '../utils/heraldryRules'

export interface PresetScene {
  id: string
  name: string
  description: string
  arms: {
    name: string
    family_name: string
  }
  layers: Layer[]
  history?: any[]
  familyTree?: any[]
}

export const PRESET_SCENES: PresetScene[] = [
  {
    id: 'preset-1',
    name: '预设一：违规色彩叠压',
    description: '展示金属色叠加金属色的违规案例，金色背景上叠加银色狮子',
    arms: {
      name: '违规纹章',
      family_name: '违规家族'
    },
    layers: [
      {
        layer_type: 'field',
        shape: 'shield',
        tincture: 'or',
        color_hex: '#FFD700',
        position_x: 0,
        position_y: 0,
        width: 400,
        height: 500,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'charge',
        shape: 'lion',
        tincture: 'argent',
        color_hex: '#E8E8E8',
        position_x: 100,
        position_y: 100,
        width: 200,
        height: 300,
        z_index: 1,
        parent_layer_id: 1
      }
    ]
  },
  {
    id: 'preset-2',
    name: '预设二：异族通婚合并',
    description: '展示两个不同家族纹章通过婚姻合并的场景',
    arms: {
      name: '联姻纹章',
      family_name: '联合家族'
    },
    layers: [
      {
        layer_type: 'field',
        shape: 'shield-per-pale',
        tincture: 'gules',
        color_hex: '#C41E3A',
        position_x: 0,
        position_y: 0,
        width: 200,
        height: 500,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'field',
        shape: 'shield-per-pale-right',
        tincture: 'azure',
        color_hex: '#0033A0',
        position_x: 200,
        position_y: 0,
        width: 200,
        height: 500,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'charge',
        shape: 'eagle',
        tincture: 'or',
        color_hex: '#FFD700',
        position_x: 50,
        position_y: 100,
        width: 100,
        height: 150,
        z_index: 1,
        parent_layer_id: 1
      },
      {
        layer_type: 'charge',
        shape: 'lion',
        tincture: 'argent',
        color_hex: '#E8E8E8',
        position_x: 250,
        position_y: 100,
        width: 100,
        height: 150,
        z_index: 1,
        parent_layer_id: 2
      }
    ],
    history: [
      {
        event_type: 'marriage',
        description: '红鹰家族与蓝狮家族联姻',
        generation: 5
      }
    ],
    familyTree: [
      { person_name: '红鹰公爵', generation: 1, parent_id: null },
      { person_name: '蓝狮女爵', generation: 1, parent_id: null },
      { person_name: '联合伯爵', generation: 2, parent_id: 1 }
    ]
  },
  {
    id: 'preset-3',
    name: '预设三：继承权断代',
    description: '展示直系继承人断绝，旁系继承时的纹章变更',
    arms: {
      name: '旁系继承纹章',
      family_name: '复兴家族'
    },
    layers: [
      {
        layer_type: 'field',
        shape: 'shield',
        tincture: 'vert',
        color_hex: '#007A33',
        position_x: 0,
        position_y: 0,
        width: 400,
        height: 500,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'charge',
        shape: 'stag',
        tincture: 'or',
        color_hex: '#FFD700',
        position_x: 100,
        position_y: 100,
        width: 200,
        height: 250,
        z_index: 1,
        parent_layer_id: 1
      },
      {
        layer_type: 'cadency',
        shape: 'crescent',
        tincture: 'sable',
        color_hex: '#1A1A1A',
        position_x: 50,
        position_y: 50,
        width: 40,
        height: 40,
        z_index: 2,
        parent_layer_id: 1
      }
    ],
    history: [
      {
        event_type: 'extinction',
        description: '直系血脉断绝',
        generation: 3
      },
      {
        event_type: 'cadet_inheritance',
        description: '旁系分支继承，添加新月标识',
        generation: 4
      }
    ]
  },
  {
    id: 'preset-4',
    name: '预设四：复杂分区破碎',
    description: '展示多重分区导致的纹章复杂结构',
    arms: {
      name: '复杂纹章',
      family_name: '分封家族'
    },
    layers: [
      {
        layer_type: 'field',
        shape: 'quarter-1',
        tincture: 'gules',
        color_hex: '#C41E3A',
        position_x: 0,
        position_y: 0,
        width: 200,
        height: 250,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'field',
        shape: 'quarter-2',
        tincture: 'or',
        color_hex: '#FFD700',
        position_x: 200,
        position_y: 0,
        width: 200,
        height: 250,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'field',
        shape: 'quarter-3',
        tincture: 'azure',
        color_hex: '#0033A0',
        position_x: 0,
        position_y: 250,
        width: 200,
        height: 250,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'field',
        shape: 'quarter-4',
        tincture: 'argent',
        color_hex: '#E8E8E8',
        position_x: 200,
        position_y: 250,
        width: 200,
        height: 250,
        z_index: 0,
        parent_layer_id: null
      },
      {
        layer_type: 'charge',
        shape: 'lion',
        tincture: 'sable',
        color_hex: '#1A1A1A',
        position_x: 50,
        position_y: 50,
        width: 100,
        height: 150,
        z_index: 1,
        parent_layer_id: 1
      },
      {
        layer_type: 'charge',
        shape: 'eagle',
        tincture: 'sable',
        color_hex: '#1A1A1A',
        position_x: 250,
        position_y: 50,
        width: 100,
        height: 150,
        z_index: 1,
        parent_layer_id: 2
      },
      {
        layer_type: 'charge',
        shape: 'mullet',
        tincture: 'gules',
        color_hex: '#C41E3A',
        position_x: 50,
        position_y: 300,
        width: 100,
        height: 150,
        z_index: 1,
        parent_layer_id: 3
      },
      {
        layer_type: 'charge',
        shape: 'cross',
        tincture: 'gules',
        color_hex: '#C41E3A',
        position_x: 250,
        position_y: 300,
        width: 100,
        height: 150,
        z_index: 1,
        parent_layer_id: 4
      },
      {
        layer_type: 'bordure',
        shape: 'bordure',
        tincture: 'vert',
        color_hex: '#007A33',
        position_x: 0,
        position_y: 0,
        width: 400,
        height: 500,
        z_index: 2,
        parent_layer_id: null
      }
    ]
  }
]
