import { useDb } from '../plugins/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()

  const insertArms = db.prepare(`
    INSERT INTO arms (name, family_name) VALUES (?, ?)
  `)
  const result = insertArms.run(body.name, body.family_name)
  const armsId = result.lastInsertRowid as number

  if (body.layers && body.layers.length > 0) {
    const insertLayer = db.prepare(`
      INSERT INTO layers (arms_id, layer_type, shape, tincture, color_hex, position_x, position_y, width, height, z_index, parent_layer_id, path_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    body.layers.forEach((layer: any) => {
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

  return { id: armsId, success: true }
})
