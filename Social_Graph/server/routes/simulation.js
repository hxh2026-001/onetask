const { run, all } = require('../database')
const { calculatePageRank, calculateBetweenness, simulateIC, findCommunities } = require('../utils/algorithms')

module.exports = async function (fastify, options) {
  fastify.get('/pagerank', async (request, reply) => {
    const nodes = await all('SELECT * FROM nodes')
    const edges = await all('SELECT * FROM edges')
    const pageRank = calculatePageRank(nodes, edges)

    for (const [id, pagerank] of Object.entries(pageRank)) {
      await run('UPDATE nodes SET pagerank = ? WHERE id = ?', [pagerank, id])
    }

    return pageRank
  })

  fastify.get('/betweenness', async (request, reply) => {
    const nodes = await all('SELECT * FROM nodes')
    const edges = await all('SELECT * FROM edges')
    const betweenness = calculateBetweenness(nodes, edges)

    for (const [id, bc] of Object.entries(betweenness)) {
      await run('UPDATE nodes SET betweenness = ? WHERE id = ?', [bc, id])
    }

    return betweenness
  })

  fastify.post('/ic', async (request, reply) => {
    const { initialNodes, steps } = request.body
    const nodes = await all('SELECT * FROM nodes')
    const edges = await all('SELECT * FROM edges')
    const history = simulateIC(nodes, edges, initialNodes, steps)
    return history
  })

  fastify.get('/communities', async (request, reply) => {
    const nodes = await all('SELECT * FROM nodes')
    const edges = await all('SELECT * FROM edges')
    const communities = findCommunities(nodes, edges)

    for (const [id, community] of Object.entries(communities)) {
      await run('UPDATE nodes SET community = ? WHERE id = ?', [community, id])
    }

    return communities
  })
}