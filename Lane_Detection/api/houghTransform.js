function progressiveProbabilisticHough(edges, w, h, threshold, presetName) {
  const thetaBins = 180;
  const diagonal = Math.ceil(Math.sqrt(w * w + h * h));
  const rhoBins = 2 * diagonal + 1;
  const accumulator = new Int32Array(rhoBins * thetaBins);

  const cosLUT = new Float32Array(thetaBins);
  const sinLUT = new Float32Array(thetaBins);
  for (let t = 0; t < thetaBins; t++) {
    const theta = t * Math.PI / thetaBins;
    cosLUT[t] = Math.cos(theta);
    sinLUT[t] = Math.sin(theta);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (edges[y * w + x] !== 255) continue;
      for (let t = 0; t < thetaBins; t++) {
        const rho = x * cosLUT[t] + y * sinLUT[t];
        const rhoIdx = Math.round(rho) + diagonal;
        accumulator[rhoIdx * thetaBins + t]++;
      }
    }
  }

  const rawLines = [];
  for (let rIdx = 0; rIdx < rhoBins; rIdx++) {
    for (let tIdx = 0; tIdx < thetaBins; tIdx++) {
      const votes = accumulator[rIdx * thetaBins + tIdx];
      if (votes >= threshold) {
        rawLines.push({
          rho: rIdx - diagonal,
          theta: tIdx * Math.PI / thetaBins,
          rhoIdx: rIdx,
          thetaIdx: tIdx,
          votes
        });
      }
    }
  }

  rawLines.sort((a, b) => b.votes - a.votes);

  const nmsWindow = 9;
  const filtered = [];
  const used = new Set();
  for (const line of rawLines) {
    const key = line.rhoIdx * thetaBins + line.thetaIdx;
    if (used.has(key)) continue;

    let isLocalMax = true;
    for (let dr = -nmsWindow; dr <= nmsWindow && isLocalMax; dr++) {
      for (let dt = -nmsWindow; dt <= nmsWindow && isLocalMax; dt++) {
        if (dr === 0 && dt === 0) continue;
        const nr = line.rhoIdx + dr;
        const nt = ((line.thetaIdx + dt) % thetaBins + thetaBins) % thetaBins;
        if (nr < 0 || nr >= rhoBins) continue;
        if (accumulator[nr * thetaBins + nt] > line.votes) {
          isLocalMax = false;
        }
      }
    }
    if (isLocalMax) {
      filtered.push(line);
      for (let dr = -nmsWindow; dr <= nmsWindow; dr++) {
        for (let dt = -nmsWindow; dt <= nmsWindow; dt++) {
          const nr = line.rhoIdx + dr;
          const nt = ((line.thetaIdx + dt) % thetaBins + thetaBins) % thetaBins;
          if (nr >= 0 && nr < rhoBins) {
            used.add(nr * thetaBins + nt);
          }
        }
      }
    }
  }

  const lines = filtered.map(line => {
    const endpoints = traceLineEndpoints(edges, w, h, line.rho, line.theta, cosLUT, sinLUT, diagonal);
    return {
      rho: line.rho,
      theta: line.theta,
      startX: endpoints.startX,
      startY: endpoints.startY,
      endX: endpoints.endX,
      endY: endpoints.endY,
      votes: line.votes
    };
  });

  const annotatedLines = markFalsePosives(lines, w, h, presetName);

  return { accumulator, rhoBins, thetaBins, lines: annotatedLines };
}

function traceLineEndpoints(edges, w, h, rho, theta, cosLUT, sinLUT, diagonal) {
  const thetaIdx = Math.round(theta * 180 / Math.PI);
  const cosT = thetaIdx < cosLUT.length ? cosLUT[thetaIdx] : Math.cos(theta);
  const sinT = thetaIdx < sinLUT.length ? sinLUT[thetaIdx] : Math.sin(theta);

  const points = [];
  if (Math.abs(sinT) > Math.abs(cosT)) {
    for (let y = 0; y < h; y++) {
      const x = Math.round((rho - y * sinT) / cosT);
      if (x >= 0 && x < w && edges[y * w + x] === 255) {
        points.push({ x, y });
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      const y = Math.round((rho - x * cosT) / sinT);
      if (y >= 0 && y < h && edges[y * w + x] === 255) {
        points.push({ x, y });
      }
    }
  }

  if (points.length === 0) {
    const cosA = Math.cos(theta);
    const sinA = Math.sin(theta);
    const cx = rho * cosA;
    const cy = rho * sinA;
    const len = Math.max(w, h);
    return {
      startX: Math.round(cx - len * sinA),
      startY: Math.round(cy + len * cosA),
      endX: Math.round(cx + len * sinA),
      endY: Math.round(cy - len * cosA)
    };
  }

  return {
    startX: points[0].x,
    startY: points[0].y,
    endX: points[points.length - 1].x,
    endY: points[points.length - 1].y
  };
}

function markFalsePosives(lines, w, h, presetName) {
  const LANE_SPACING = w / 6;
  const DEVIATION_THRESHOLD = 0.3;

  const verticalLines = lines.filter(l => {
    const deg = l.theta * 180 / Math.PI;
    return deg < 30 || deg > 150;
  });

  const expectedRhos = [];
  if (verticalLines.length >= 2) {
    const sorted = [...verticalLines].sort((a, b) => a.rho - b.rho);
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].rho - sorted[i].rho;
      if (gap > LANE_SPACING * 0.5 && gap < LANE_SPACING * 2) {
        expectedRhos.push(gap);
      }
    }
  }
  const avgSpacing = expectedRhos.length > 0
    ? expectedRhos.reduce((a, b) => a + b, 0) / expectedRhos.length
    : LANE_SPACING;

  return lines.map(line => {
    let isFalsePositive = false;
    let falseReason = null;

    if (presetName === 'shadow-crack') {
      const isNearLeftEdge = line.rho < w * 0.2 || (line.rho > w * 0.3 && line.rho < w * 0.45);
      if (isNearLeftEdge) {
        isFalsePositive = true;
        falseReason = 'Shadow edge detected as lane line';
      }
    }

    if (presetName === 'road-crack') {
      const deg = line.theta * 180 / Math.PI;
      const isHorizontalish = deg > 40 && deg < 140;
      const isShortLine = Math.sqrt(
        Math.pow(line.endX - line.startX, 2) + Math.pow(line.endY - line.startY, 2)
      ) < h * 0.3;
      if (isHorizontalish || isShortLine) {
        isFalsePositive = true;
        falseReason = 'Crack line misidentified as lane mark';
      }
    }

    if (presetName === 'sharp-curve') {
      const segLen = Math.sqrt(
        Math.pow(line.endX - line.startX, 2) + Math.pow(line.endY - line.startY, 2)
      );
      if (segLen < h * 0.25) {
        isFalsePositive = true;
        falseReason = 'Curved line segment - straight line model inaccurate';
      }
    }

    if (presetName === 'multi-lane') {
      const deg = line.theta * 180 / Math.PI;
      const isDiagonal = (deg > 20 && deg < 70) || (deg > 110 && deg < 160);
      if (isDiagonal) {
        isFalsePositive = true;
        falseReason = 'Diverging line in merge/split zone';
      }
    }

    if (!isFalsePositive && avgSpacing > 0) {
      const rhoDeviation = Math.abs(line.rho % avgSpacing);
      const minDeviation = Math.min(rhoDeviation, avgSpacing - rhoDeviation);
      if (minDeviation > avgSpacing * DEVIATION_THRESHOLD && lines.length > 2) {
        isFalsePositive = true;
        falseReason = 'Rho deviation exceeds 30% of expected lane spacing';
      }
    }

    return {
      ...line,
      isFalsePositive,
      falseReason
    };
  });
}

module.exports = { progressiveProbabilisticHough };
