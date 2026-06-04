function grayscale(pixels, w, h) {
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

function gaussianBlur(gray, w, h, sigma) {
  if (sigma === undefined) sigma = 1.4;
  const ksize = Math.ceil(sigma * 3) * 2 + 1;
  const half = Math.floor(ksize / 2);
  const kernel = new Float32Array(ksize * ksize);
  let sum = 0;
  for (let ky = -half; ky <= half; ky++) {
    for (let kx = -half; kx <= half; kx++) {
      const val = Math.exp(-(kx * kx + ky * ky) / (2 * sigma * sigma));
      kernel[(ky + half) * ksize + (kx + half)] = val;
      sum += val;
    }
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx));
          const py = Math.min(h - 1, Math.max(0, y + ky));
          acc += gray[py * w + px] * kernel[(ky + half) * ksize + (kx + half)];
        }
      }
      out[y * w + x] = Math.round(acc);
    }
  }
  return out;
}

function sobelGradient(gray, w, h) {
  const magnitude = new Float32Array(w * h);
  const direction = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y - 1) * w + (x - 1)];
      const tc = gray[(y - 1) * w + x];
      const tr = gray[(y - 1) * w + (x + 1)];
      const ml = gray[y * w + (x - 1)];
      const mr = gray[y * w + (x + 1)];
      const bl = gray[(y + 1) * w + (x - 1)];
      const bc = gray[(y + 1) * w + x];
      const br = gray[(y + 1) * w + (x + 1)];

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const idx = y * w + x;
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }
  return { magnitude, direction };
}

function nonMaxSuppression(magnitude, direction, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const mag = magnitude[idx];
      let angle = direction[idx] * 180 / Math.PI;
      if (angle < 0) angle += 180;

      let n1 = 0, n2 = 0;
      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
        n1 = magnitude[y * w + (x + 1)];
        n2 = magnitude[y * w + (x - 1)];
      } else if (angle >= 22.5 && angle < 67.5) {
        n1 = magnitude[(y - 1) * w + (x + 1)];
        n2 = magnitude[(y + 1) * w + (x - 1)];
      } else if (angle >= 67.5 && angle < 112.5) {
        n1 = magnitude[(y - 1) * w + x];
        n2 = magnitude[(y + 1) * w + x];
      } else {
        n1 = magnitude[(y - 1) * w + (x - 1)];
        n2 = magnitude[(y + 1) * w + (x + 1)];
      }

      if (mag >= n1 && mag >= n2) {
        out[idx] = mag;
      }
    }
  }
  return out;
}

function cannyEdge(gray, w, h, lowThresh, highThresh) {
  const blurred = gaussianBlur(gray, w, h);
  const { magnitude, direction } = sobelGradient(blurred, w, h);
  const suppressed = nonMaxSuppression(magnitude, direction, w, h);

  const strong = new Uint8Array(w * h);
  const weak = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (suppressed[i] >= highThresh) {
      strong[i] = 1;
    } else if (suppressed[i] >= lowThresh) {
      weak[i] = 1;
    }
  }

  const edges = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (strong[i]) edges[i] = 255;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (weak[idx] && !edges[idx]) {
          let hasStrongNeighbor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (strong[(y + dy) * w + (x + dx)]) {
                hasStrongNeighbor = true;
              }
            }
          }
          if (hasStrongNeighbor) {
            edges[idx] = 255;
            strong[idx] = 1;
            weak[idx] = 0;
            changed = true;
          }
        }
      }
    }
  }

  return edges;
}

module.exports = { grayscale, gaussianBlur, sobelGradient, nonMaxSuppression, cannyEdge };
