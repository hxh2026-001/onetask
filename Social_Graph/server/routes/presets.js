const { run } = require('../database')

function generateId() {
  return 'node_' + Math.random().toString(36).substring(2, 9)
}

async function clearGraph() {
  await run('DELETE FROM edges')
  await run('DELETE FROM nodes')
}

async function insertNodes(nodes) {
  for (const node of nodes) {
    await run('INSERT INTO nodes (id, name, x, y) VALUES (?, ?, ?, ?)', [node.id, node.name, node.x, node.y])
  }
}

async function insertEdges(edges) {
  for (const edge of edges) {
    await run('INSERT INTO edges (source, target, weight, probability) VALUES (?, ?, ?, ?)', [edge.source, edge.target, edge.weight, edge.probability])
  }
}

module.exports = async function (fastify, options) {
  fastify.post('/super-spreader', async (request, reply) => {
    await clearGraph()

    const nodes = []
    const edges = []

    const centerId = generateId()
    nodes.push({ id: centerId, name: '超级传播者', x: 400, y: 300 })

    for (let i = 0; i < 15; i++) {
      const id = generateId()
      const angle = (i / 15) * Math.PI * 2
      const radius = 150
      nodes.push({
        id,
        name: `节点${i + 1}`,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius
      })
      edges.push({ source: centerId, target: id, weight: 1, probability: 0.9 })
    }

    for (let i = 0; i < 15; i++) {
      const id = generateId()
      const angle = (i / 15) * Math.PI * 2
      const radius = 250
      nodes.push({
        id,
        name: `节点${i + 16}`,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius
      })
      const innerNode = nodes[1 + i].id
      edges.push({ source: innerNode, target: id, weight: 0.5, probability: 0.3 })
    }

    await insertNodes(nodes)
    await insertEdges(edges)

    return { success: true, preset: 'super-spreader' }
  })

  fastify.post('/echo-chamber', async (request, reply) => {
    await clearGraph()

    const communities = 4
    const nodesPerCommunity = 8
    const centerX = [200, 600, 200, 600]
    const centerY = [200, 200, 400, 400]

    const actualNodes = []
    const nodeMap = {}
    for (let c = 0; c < communities; c++) {
      for (let i = 0; i < nodesPerCommunity; i++) {
        const id = generateId()
        const angle = (i / nodesPerCommunity) * Math.PI * 2
        const radius = 60
        const node = {
          id,
          name: `社群${c + 1}-${i + 1}`,
          x: centerX[c] + Math.cos(angle) * radius,
          y: centerY[c] + Math.sin(angle) * radius
        }
        actualNodes.push(node)
        nodeMap[`${c}_${i}`] = id
      }
    }

    const actualEdges = []
    for (let c = 0; c < communities; c++) {
      for (let i = 0; i < nodesPerCommunity; i++) {
        for (let j = i + 1; j < nodesPerCommunity; j++) {
          actualEdges.push({
            source: nodeMap[`${c}_${i}`],
            target: nodeMap[`${c}_${j}`],
            weight: 0.8,
            probability: 0.95
          })
        }
      }
    }

    actualEdges.push({
      source: nodeMap['0_0'],
      target: nodeMap['1_0'],
      weight: 0.1,
      probability: 0.05
    })
    actualEdges.push({
      source: nodeMap['1_0'],
      target: nodeMap['2_0'],
      weight: 0.1,
      probability: 0.05
    })
    actualEdges.push({
      source: nodeMap['2_0'],
      target: nodeMap['3_0'],
      weight: 0.1,
      probability: 0.05
    })

    await insertNodes(actualNodes)
    await insertEdges(actualEdges)

    return { success: true, preset: 'echo-chamber' }
  })

  fastify.post('/rumor-deadlock', async (request, reply) => {
    await clearGraph()

    const nodes = []
    const edges = []

    const mainChain = []
    for (let i = 0; i < 10; i++) {
      const id = generateId()
      mainChain.push(id)
      nodes.push({
        id,
        name: `节点${i + 1}`,
        x: 100 + i * 80,
        y: 300
      })
    }

    for (let i = 0; i < mainChain.length - 1; i++) {
      edges.push({
        source: mainChain[i],
        target: mainChain[i + 1],
        weight: 1,
        probability: 0.1
      })
    }

    for (let i = 0; i < 5; i++) {
      const id = generateId()
      nodes.push({
        id,
        name: `阻断${i + 1}`,
        x: 200 + i * 150,
        y: 180
      })
      edges.push({
        source: mainChain[i + 1],
        target: id,
        weight: 0.5,
        probability: 0.9
      })
    }

    await insertNodes(nodes)
    await insertEdges(edges)

    return { success: true, preset: 'rumor-deadlock' }
  })

  fastify.post('/diameter-break', async (request, reply) => {
    await clearGraph()

    const nodes = []
    const edges = []

    const leftCluster = []
    const rightCluster = []
    const bridgeId = generateId()

    for (let i = 0; i < 12; i++) {
      const id = generateId()
      leftCluster.push(id)
      const angle = (i / 12) * Math.PI * 2
      nodes.push({
        id,
        name: `左群${i + 1}`,
        x: 200 + Math.cos(angle) * 80,
        y: 300 + Math.sin(angle) * 80
      })
    }

    for (let i = 0; i < 12; i++) {
      const id = generateId()
      rightCluster.push(id)
      const angle = (i / 12) * Math.PI * 2
      nodes.push({
        id,
        name: `右群${i + 1}`,
        x: 600 + Math.cos(angle) * 80,
        y: 300 + Math.sin(angle) * 80
      })
    }

    nodes.push({
      id: bridgeId,
      name: '桥接节点',
      x: 400,
      y: 300
    })

    for (let i = 0; i < leftCluster.length; i++) {
      for (let j = i + 1; j < leftCluster.length; j++) {
        if (Math.random() > 0.5) {
          edges.push({
            source: leftCluster[i],
            target: leftCluster[j],
            weight: 0.7,
            probability: 0.7
          })
        }
      }
    }

    for (let i = 0; i < rightCluster.length; i++) {
      for (let j = i + 1; j < rightCluster.length; j++) {
        if (Math.random() > 0.5) {
          edges.push({
            source: rightCluster[i],
            target: rightCluster[j],
            weight: 0.7,
            probability: 0.7
          })
        }
      }
    }

    edges.push({
      source: leftCluster[0],
      target: bridgeId,
      weight: 0.3,
      probability: 0.5
    })
    edges.push({
      source: bridgeId,
      target: rightCluster[0],
      weight: 0.3,
      probability: 0.5
    })

    await insertNodes(nodes)
    await insertEdges(edges)

    return { success: true, preset: 'diameter-break' }
  })
}