import { useDb } from '../plugins/db'

export default defineEventHandler(() => {
  const db = useDb()
  const arms = db.prepare('SELECT * FROM arms ORDER BY created_at DESC').all()
  return { arms }
})
