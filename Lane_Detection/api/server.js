const express = require('express');
const cors = require('cors');
const { cannyEdge, grayscale } = require('./imageProcessor');
const { progressiveProbabilisticHough } = require('./houghTransform');
const { ransacFit } = require('./ransac');

const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

let historyStore = [];

const PRESET_DESCRIPTIONS = {
  'shadow-crack': '强烈阴影遮盖车道线 - 阴影边缘产生大量误检',
  'road-crack': '路面裂缝被误检为车道线 - 霍夫变换检测到虚假直线',
  'sharp-curve': '曲率半径小于50米的急弯 - 曲线在霍夫空间产生散点',
  'multi-lane': '多车道合并与分流区域 - 多个方向直线导致投票扩散'
};

app.post('/api/detect', (req, res) => {
  console.log('Received /api/detect request');
  const { pixels, width, height, params } = req.body;

  if (!pixels || !width || !height || !params) {
    return res.status(400).json({ error: 'Missing pixels, width, height, or params' });
  }

  const {
    cannyLow = 50,
    cannyHigh = 150,
    houghThreshold = 80,
    ransacIter = 100,
    ransacDist = 5
  } = params;

  try {
    const pixelArray = new Uint8Array(pixels);
    const gray = grayscale(pixelArray, width, height);
    const edges = cannyEdge(gray, width, height, cannyLow, cannyHigh);

    const edgeArray = Array.from(edges);

    const houghResult = progressiveProbabilisticHough(
      edges, width, height, houghThreshold, req.body.presetName
    );

    const ransacLines = ransacFit(edges, width, height, ransacIter, ransacDist);
    for (const rl of ransacLines) {
      if (rl.rho !== undefined && rl.theta !== undefined) {
        const exists = houghResult.lines.some(
          hl => Math.abs(hl.rho - rl.rho) < 5 && Math.abs(hl.theta - rl.theta) < 0.1
        );
        if (!exists) {
          houghResult.lines.push({
            rho: rl.rho,
            theta: rl.theta,
            startX: 0,
            startY: 0,
            endX: width,
            endY: height,
            votes: rl.inlierCount,
            isFalsePositive: false,
            falseReason: null,
            source: 'ransac'
          });
        }
      }
    }

    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      imageWidth: width,
      imageHeight: height,
      params: { cannyLow, cannyHigh, houghThreshold, ransacIter, ransacDist },
      lines: houghResult.lines.slice(0, 5).map(l => ({ rho: l.rho, theta: l.theta, votes: l.votes })),
      accumulatorSize: `${houghResult.rhoBins}x${houghResult.thetaBins}`
    };
    historyStore.unshift(record);
    if (historyStore.length > 20) historyStore.pop();

    const accArray = Array.from(houghResult.accumulator);

    res.json({
      edges: edgeArray,
      accumulator: accArray,
      rhoBins: houghResult.rhoBins,
      thetaBins: houghResult.thetaBins,
      lines: houghResult.lines,
      imageWidth: width,
      imageHeight: height
    });
  } catch (err) {
    console.error('Detection error:', err);
    res.status(500).json({ error: 'Detection failed: ' + err.message });
  }
});

app.get('/api/presets/:name', (req, res) => {
  const validNames = ['shadow-crack', 'road-crack', 'sharp-curve', 'multi-lane'];
  const name = req.params.name;

  if (!validNames.includes(name)) {
    return res.status(400).json({ error: `Invalid preset name. Valid: ${validNames.join(', ')}` });
  }

  res.json({
    preset: name,
    description: PRESET_DESCRIPTIONS[name]
  });
});

app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  res.json(historyStore.slice(0, limit));
});

app.listen(PORT, () => {
  console.log(`Hough Transform API server running on port ${PORT}`);
});
