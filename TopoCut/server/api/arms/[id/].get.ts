import { useDb } from '../../plugins/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = useDb()

  const arms = db.prepare('SELECT * FROM arms WHERE id = ?').get(id)
  const layers = db.prepare('SELECT * FROM layers WHERE arms_id = ? ORDER BY z_index').all(id)

  return { arms, layers }
})
