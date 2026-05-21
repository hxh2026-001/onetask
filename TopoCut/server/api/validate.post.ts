import { validateAll } from '../utils/heraldryRules'
import type { Layer } from '../utils/heraldryRules'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const layers: Layer[] = body.layers || []
  
  const result = validateAll(layers, {
    ancestorArms: body.ancestorArms,
    spouseLayers: body.spouseLayers
  })

  return result
})
