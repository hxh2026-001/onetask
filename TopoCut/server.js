import express from 'express'
import { createServer } from 'vite'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

let db = null

function initDb() {
  const dbPath = path.resolve(__dirname, 'data', 'heraldry.db')
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  db = new Database(dbPath)
  initTables(db)
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS arms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      family_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS layers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arms_id INTEGER NOT NULL,
      layer_type TEXT NOT NULL,
      shape TEXT,
      tincture TEXT,
      color_hex TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      width REAL DEFAULT 100,
      height REAL DEFAULT 100,
      z_index INTEGER DEFAULT 0,
      parent_layer_id INTEGER,
      path_data TEXT,
      FOREIGN KEY (arms_id) REFERENCES arms(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_layer_id) REFERENCES layers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS heraldry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arms_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT,
      generation INTEGER,
      ancestor_arms_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (arms_id) REFERENCES arms(id) ON DELETE CASCADE,
      FOREIGN KEY (ancestor_arms_id) REFERENCES arms(id)
    );

    CREATE TABLE IF NOT EXISTS validation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS family_tree (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arms_id INTEGER NOT NULL,
      person_name TEXT NOT NULL,
      generation INTEGER NOT NULL,
      parent_id INTEGER,
      FOREIGN KEY (arms_id) REFERENCES arms(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES family_tree(id)
    );
  `)

  const rules = db.prepare('SELECT COUNT(*) as count FROM validation_rules').get()
  if (rules.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO validation_rules (rule_code, rule_name, description) VALUES (?, ?, ?)
    `)
    insertRule.run('TINCTURE_RULE', '色彩对比律', '金属色不可叠加金属色，颜色色不可叠加颜色色')
    insertRule.run('INHERITANCE_RULE', '继承规则', '长子继承完整纹章，次子需加标识')
    insertRule.run('MARSHALING_RULE', '婚姻合并规则', '夫妻纹章并列或分区展示')
  }
}

const TINCTURES = {
  or: { name: '金', type: 'metal', hex: '#FFD700' },
  argent: { name: '银', type: 'metal', hex: '#E8E8E8' },
  gules: { name: '红', type: 'color', hex: '#C41E3A' },
  azure: { name: '蓝', type: 'color', hex: '#0033A0' },
  sable: { name: '黑', type: 'color', hex: '#1A1A1A' },
  vert: { name: '绿', type: 'color', hex: '#007A33' },
  purpure: { name: '紫', type: 'color', hex: '#66023C' },
  murrey: { name: '桑椹', type: 'color', hex: '#800020' }
}

function findTinctureByHex(hex) {
  return Object.keys(TINCTURES).find(key => 
    TINCTURES[key].hex.toLowerCase() === hex.toLowerCase()
  )
}

function validateTinctureRule(layers) {
  const errors = []
  const layerMap = new Map()
  
  layers.forEach(layer => {
    if (layer.id !== undefined) {
      layerMap.set(layer.id, layer)
    }
  })

  layers.forEach(layer => {
    if (!layer.tincture && layer.color_hex) {
      layer.tincture = findTinctureByHex(layer.color_hex)
    }
    
    if (layer.tincture) {
      const tinctureInfo = TINCTURES[layer.tincture]
      if (tinctureInfo) {
        const parentLayer = layer.parent_layer_id ? layerMap.get(layer.parent_layer_id) : null
        if (parentLayer && parentLayer.tincture) {
          const parentInfo = TINCTURES[parentLayer.tincture]
          if (parentInfo) {
            if (tinctureInfo.type === parentInfo.type && tinctureInfo.type !== 'fur') {
              errors.push({
                ruleCode: 'TINCTURE_RULE',
                ruleName: '色彩对比律',
                message: `违反色彩对比律：${tinctureInfo.type === 'metal' ? '金属色' : '颜色色'} 不能叠加在同类${tinctureInfo.type === 'metal' ? '金属色' : '颜色色'}上`,
                layerId: layer.id,
                severity: 'error'
              })
            }
          }
        }
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

const PRESET_SCENES = [
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

app.get('/api/presets', (req, res) => {
  res.json({ presets: PRESET_SCENES })
})

app.post('/api/validate', (req, res) => {
  const layers = req.body.layers || []
  const result = validateTinctureRule(layers)
  res.json(result)
})

app.get('/api/arms', (req, res) => {
  if (!db) initDb()
  const arms = db.prepare('SELECT * FROM arms ORDER BY created_at DESC').all()
  res.json({ arms })
})

app.post('/api/arms', (req, res) => {
  if (!db) initDb()
  const { name, family_name, layers } = req.body

  const insertArms = db.prepare(`
    INSERT INTO arms (name, family_name) VALUES (?, ?)
  `)
  const result = insertArms.run(name, family_name)
  const armsId = result.lastInsertRowid

  if (layers && layers.length > 0) {
    const insertLayer = db.prepare(`
      INSERT INTO layers (arms_id, layer_type, shape, tincture, color_hex, position_x, position_y, width, height, z_index, parent_layer_id, path_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    layers.forEach((layer) => {
      insertLayer.run(
        armsId,
        layer.layer_type,
        layer.shape,
        layer.tincture,
        layer.color_hex,
        layer.position_x,
        layer.position_y,
        layer.width,
        layer.height,
        layer.z_index,
        layer.parent_layer_id,
        layer.path_data
      )
    })
  }

  res.json({ id: armsId, success: true })
})

app.get('/api/arms/:id', (req, res) => {
  if (!db) initDb()
  const id = req.params.id
  const arms = db.prepare('SELECT * FROM arms WHERE id = ?').get(id)
  const layers = db.prepare('SELECT * FROM layers WHERE arms_id = ? ORDER BY z_index').all(id)
  res.json({ arms, layers })
})

async function startServer() {
  initDb()
  
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })
  
  app.use(vite.middlewares)
  
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl
    try {
      const template = await vite.transformIndexHtml(url, fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8'))
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      next(e)
    }
  })

  app.listen(PORT, () => {
    console.log(`⚜ 纹章学规则推演系统已启动: http://localhost:${PORT}`)
  })
}

startServer()
