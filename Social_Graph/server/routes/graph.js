const { run, all } = require('../database')

module.exports = async function (fastify, options) {
  fastify.get('/nodes', async (request, reply) => {
    return await all('SELECT * FROM nodes')
  })

  fastify.get('/edges', async (request, reply) => {
    return await all('SELECT * FROM edges')
  })

  fastify.post('/nodes', async (request, reply) => {
    const { id, name, x, y } = request.body
    await run('INSERT INTO nodes (id, name, x, y) VALUES (?, ?, ?, ?)', [id, name, x, y])
    return { id, name, x, y }
  })

  fastify.post('/edges', async (request, reply) => {
    const { source, target, weight, probability } = request.body
    const result = await run(
      'INSERT INTO edges (source, target, weight, probability) VALUES (?, ?, ?, ?)',
      [source, target, weight || 1.0, probability || 0.5]
    )
    return { id: result.lastID, source, target, weight, probability }
  })

  fastify.delete('/nodes/:id', async (request, reply) => {
    const { id } = request.params
    await run('DELETE FROM edges WHERE source = ? OR target = ?', [id, id])
    await run('DELETE FROM nodes WHERE id = ?', [id])
    return { success: true }
  })

  fastify.delete('/edges/:id', async (request, reply) => {
    const { id } = request.params
    await run('DELETE FROM edges WHERE id = ?', [id])
    return { success: true }
  })

  fastify.put('/nodes/:id', async (request, reply) => {
    const { id } = request.params
    const { name, x, y, influence, pagerank, betweenness, community } = request.body
    const updates = []
    const params = []
    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (x !== undefined) { updates.push('x = ?'); params.push(x) }
    if (y !== undefined) { updates.push('y = ?'); params.push(y) }
    if (influence !== undefined) { updates.push('influence = ?'); params.push(influence) }
    if (pagerank !== undefined) { updates.push('pagerank = ?'); params.push(pagerank) }
    if (betweenness !== undefined) { updates.push('betweenness = ?'); params.push(betweenness) }
    if (community !== undefined) { updates.push('community = ?'); params.push(community) }
    params.push(id)
    await run(`UPDATE nodes SET ${updates.join(', ')} WHERE id = ?`, params)
    return { success: true }
  })

  fastify.put('/edges/:id', async (request, reply) => {
    const { id } = request.params
    const { weight, probability } = request.body
    const updates = []
    const params = []
    if (weight !== undefined) { updates.push('weight = ?'); params.push(weight) }
    if (probability !== undefined) { updates.push('probability = ?'); params.push(probability) }
    params.push(id)
    await run(`UPDATE edges SET ${updates.join(', ')} WHERE id = ?`, params)
    return { success: true }
  })

  fastify.delete('/clear', async (request, reply) => {
    await run('DELETE FROM edges')
    await run('DELETE FROM nodes')
    return { success: true }
  })
}