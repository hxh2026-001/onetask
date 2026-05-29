import { Delaunay } from 'd3-delaunay'

export function polygonClipping(subject, clip) {
  const subjectCopy = subject.map(p => [...p])
  const clipCopy = clip.map(p => [...p])
  
  const result = sutherlandHodgman(subjectCopy, clipCopy)
  return result
}

function sutherlandHodgman(subject, clip) {
  let outputList = subject
  
  for (let i = 0; i < clip.length; i++) {
    const currentPoint = clip[i]
    const nextPoint = clip[(i + 1) % clip.length]
    
    const inputList = outputList
    outputList = []
    
    if (inputList.length === 0) break
    
    let s = inputList[inputList.length - 1]
    
    for (let j = 0; j < inputList.length; j++) {
      const e = inputList[j]
      
      if (isInside(e, currentPoint, nextPoint)) {
        if (!isInside(s, currentPoint, nextPoint)) {
          const intersection = computeIntersection(s, e, currentPoint, nextPoint)
          if (intersection) outputList.push(intersection)
        }
        outputList.push(e)
      } else if (isInside(s, currentPoint, nextPoint)) {
        const intersection = computeIntersection(s, e, currentPoint, nextPoint)
        if (intersection) outputList.push(intersection)
      }
      s = e
    }
  }
  
  return outputList
}

function isInside(point, edgeStart, edgeEnd) {
  const cross = (edgeEnd[0] - edgeStart[0]) * (point[1] - edgeStart[1]) - 
                (edgeEnd[1] - edgeStart[1]) * (point[0] - edgeStart[0])
  return cross >= 0
}

function computeIntersection(s, e, a, b) {
  const denom = (b[1] - a[1]) * (e[0] - s[0]) - (b[0] - a[0]) * (e[1] - s[1])
  if (Math.abs(denom) < 1e-10) return null
  
  const ua = ((b[0] - a[0]) * (s[1] - a[1]) - (b[1] - a[1]) * (s[0] - a[0])) / denom
  const ub = ((e[0] - s[0]) * (s[1] - a[1]) - (e[1] - s[1]) * (s[0] - a[0])) / denom
  
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return [
      s[0] + ua * (e[0] - s[0]),
      s[1] + ua * (e[1] - s[1])
    ]
  }
  return null
}

export function voronoiGenerator(points, bounds) {
  if (points.length < 2) {
    throw new Error('至少需要2个点来生成Voronoi图')
  }
  
  const x = points.map(p => p[0])
  const y = points.map(p => p[1])
  
  const delaunay = Delaunay.from(x, y)
  const voronoi = delaunay.voronoi([bounds[0], bounds[1], bounds[2], bounds[3]])
  
  const cells = []
  
  for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i)
    if (cell) {
      cells.push({
        point: points[i],
        polygon: cell.map((_, j) => [cell[j][0], cell[j][1]])
      })
    }
  }
  
  return {
    cells,
    triangles: delaunay.triangles,
    links: voronoi.links().map(l => [
      [l.source[0], l.source[1]],
      [l.target[0], l.target[1]]
    ])
  }
}
