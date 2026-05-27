let nodes = []
let edges = []
let edgeIdCounter = 1

const init = () => {
  nodes = []
  edges = []
  edgeIdCounter = 1
}

const run = (sql, params = []) => {
  if (sql.startsWith('INSERT INTO nodes')) {
    const id = params[0]
    const name = params[1]
    const x = params[2]
    const y = params[3]
    nodes.push({ id, name, x, y, influence: 0, pagerank: 0, betweenness: 0, community: 0 })
    return { lastID: id, changes: 1 }
  }
  
  if (sql.startsWith('INSERT INTO edges')) {
    const source = params[0]
    const target = params[1]
    const weight = params[2]
    const probability = params[3]
    const id = edgeIdCounter++
    edges.push({ id, source, target, weight, probability })
    return { lastID: id, changes: 1 }
  }
  
  if (sql.startsWith('DELETE FROM edges')) {
    if (sql.includes('WHERE source = ? OR target = ?')) {
      const id = params[0]
      edges = edges.filter(e => e.source !== id && e.target !== id)
    } else if (sql.includes('WHERE id = ?')) {
      const id = params[0]
      edges = edges.filter(e => e.id !== id)
    } else {
      edges = []
    }
    return { changes: edges.length }
  }
  
  if (sql.startsWith('DELETE FROM nodes')) {
    if (sql.includes('WHERE id = ?')) {
      const id = params[0]
      nodes = nodes.filter(n => n.id !== id)
    } else {
      nodes = []
    }
    return { changes: nodes.length }
  }
  
  if (sql.startsWith('UPDATE nodes')) {
    const id = params[params.length - 1]
    const node = nodes.find(n => n.id === id)
    if (node) {
      const updates = sql.match(/SET (.*?) WHERE/)[1].split(', ')
      updates.forEach((update, idx) => {
        const key = update.split(' = ')[0]
        node[key] = params[idx]
      })
    }
    return { changes: 1 }
  }
  
  if (sql.startsWith('UPDATE edges')) {
    const id = params[params.length - 1]
    const edge = edges.find(e => e.id === id)
    if (edge) {
      const updates = sql.match(/SET (.*?) WHERE/)[1].split(', ')
      updates.forEach((update, idx) => {
        const key = update.split(' = ')[0]
        edge[key] = params[idx]
      })
    }
    return { changes: 1 }
  }
  
  return { changes: 0 }
}

const all = (sql, params = []) => {
  if (sql === 'SELECT * FROM nodes') {
    return [...nodes]
  }
  if (sql === 'SELECT * FROM edges') {
    return [...edges]
  }
  return []
}

const get = (sql, params = []) => {
  return null
}

module.exports = { run, all, get, init }