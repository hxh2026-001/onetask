function calculatePageRank(nodes, edges, damping = 0.85, iterations = 100) {
  const nodeIds = nodes.map(n => n.id)
  const pageRank = {}
  const outLinks = {}
  const inLinks = {}

  nodeIds.forEach(id => {
    pageRank[id] = 1 / nodeIds.length
    outLinks[id] = []
    inLinks[id] = []
  })

  edges.forEach(edge => {
    outLinks[edge.source].push(edge.target)
    inLinks[edge.target].push(edge.source)
  })

  for (let i = 0; i < iterations; i++) {
    const newPageRank = {}
    nodeIds.forEach(id => {
      let sum = 0
      inLinks[id].forEach(source => {
        sum += pageRank[source] / outLinks[source].length
      })
      newPageRank[id] = (1 - damping) / nodeIds.length + damping * sum
    })
    Object.assign(pageRank, newPageRank)
  }

  const maxPR = Math.max(...Object.values(pageRank))
  Object.keys(pageRank).forEach(id => {
    pageRank[id] = pageRank[id] / maxPR
  })

  return pageRank
}

function calculateBetweenness(nodes, edges) {
  const nodeIds = nodes.map(n => n.id)
  const betweenness = {}
  const graph = {}

  nodeIds.forEach(id => {
    betweenness[id] = 0
    graph[id] = []
  })

  edges.forEach(edge => {
    graph[edge.source].push(edge.target)
    graph[edge.target].push(edge.source)
  })

  nodeIds.forEach(s => {
    const stack = []
    const pred = {}
    const dist = {}
    const sigma = {}

    nodeIds.forEach(v => {
      pred[v] = []
      dist[v] = -1
      sigma[v] = 0
    })

    dist[s] = 0
    sigma[s] = 1

    const queue = [s]
    while (queue.length > 0) {
      const v = queue.shift()
      stack.push(v)
      graph[v].forEach(w => {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1
          queue.push(w)
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v]
          pred[w].push(v)
        }
      })
    }

    const delta = {}
    nodeIds.forEach(v => { delta[v] = 0 })

    while (stack.length > 0) {
      const w = stack.pop()
      pred[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
      })
      if (w !== s) {
        betweenness[w] += delta[w]
      }
    }
  })

  const maxBc = Math.max(...Object.values(betweenness))
  if (maxBc > 0) {
    Object.keys(betweenness).forEach(id => {
      betweenness[id] = betweenness[id] / maxBc
    })
  }

  return betweenness
}

function simulateIC(nodes, edges, initialNodes, steps = 50) {
  const activated = new Set(initialNodes)
  const history = [{ activated: new Set(activated) }]
  const nodeIds = new Set(nodes.map(n => n.id))

  const graph = {}
  nodeIds.forEach(id => {
    graph[id] = []
  })
  edges.forEach(edge => {
    graph[edge.source].push({ target: edge.target, probability: edge.probability })
  })

  for (let step = 0; step < steps; step++) {
    const newlyActivated = new Set()
    activated.forEach(node => {
      graph[node].forEach(link => {
        if (!activated.has(link.target) && Math.random() < link.probability) {
          newlyActivated.add(link.target)
        }
      })
    })
    newlyActivated.forEach(node => activated.add(node))
    history.push({ activated: new Set(activated) })
    if (newlyActivated.size === 0) break
  }

  return history
}

function findCommunities(nodes, edges) {
  const nodeIds = nodes.map(n => n.id)
  const community = {}
  let communityId = 0

  const graph = {}
  nodeIds.forEach(id => {
    graph[id] = new Set()
    community[id] = -1
  })

  edges.forEach(edge => {
    graph[edge.source].add(edge.target)
    graph[edge.target].add(edge.source)
  })

  const visited = new Set()
  nodeIds.forEach(start => {
    if (!visited.has(start)) {
      const queue = [start]
      visited.add(start)
      community[start] = communityId

      while (queue.length > 0) {
        const v = queue.shift()
        graph[v].forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            community[neighbor] = communityId
            queue.push(neighbor)
          }
        })
      }
      communityId++
    }
  })

  return community
}

module.exports = {
  calculatePageRank,
  calculateBetweenness,
  simulateIC,
  findCommunities
}