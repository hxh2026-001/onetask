function ransacFit(edges, w, h, iterations, distanceThreshold) {
  const edgePoints = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (edges[y * w + x] === 255) {
        edgePoints.push({ x, y });
      }
    }
  }

  if (edgePoints.length < 2) return [];

  const bestModels = [];
  const usedPoints = new Set();

  for (let modelIter = 0; modelIter < 5; modelIter++) {
    let bestInliers = [];
    let bestModel = null;

    for (let iter = 0; iter < iterations; iter++) {
      const i1 = Math.floor(Math.random() * edgePoints.length);
      let i2 = Math.floor(Math.random() * edgePoints.length);
      while (i2 === i1) i2 = Math.floor(Math.random() * edgePoints.length);

      const p1 = edgePoints[i1];
      const p2 = edgePoints[i2];

      const a = p2.y - p1.y;
      const b = p1.x - p2.x;
      const c = p2.x * p1.y - p1.x * p2.y;
      const norm = Math.sqrt(a * a + b * b);
      if (norm < 1e-10) continue;

      const inliers = [];
      for (let i = 0; i < edgePoints.length; i++) {
        if (usedPoints.has(i)) continue;
        const p = edgePoints[i];
        const dist = Math.abs(a * p.x + b * p.y + c) / norm;
        if (dist <= distanceThreshold) {
          inliers.push(i);
        }
      }

      if (inliers.length > bestInliers.length) {
        bestInliers = inliers;
        bestModel = { a, b, c, inlierCount: inliers.length };
      }
    }

    if (!bestModel || bestModel.inlierCount < 10) break;

    const rhoTheta = toRhoTheta(bestModel);
    bestModel.rho = rhoTheta.rho;
    bestModel.theta = rhoTheta.theta;
    bestModels.push(bestModel);

    for (const idx of bestInliers) {
      usedPoints.add(idx);
    }
  }

  return bestModels;
}

function toRhoTheta(model) {
  const { a, b, c } = model;
  const norm = Math.sqrt(a * a + b * b);
  const an = a / norm;
  const bn = b / norm;
  const cn = c / norm;

  let theta = Math.atan2(bn, an);
  if (theta < 0) theta += Math.PI;
  const rho = -cn;
  return { rho, theta };
}

module.exports = { ransacFit };
