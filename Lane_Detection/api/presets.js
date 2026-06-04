const { createCanvas } = require('canvas');

const W = 640;
const H = 400;

function generatePreset(name) {
  const generators = {
    'shadow-crack': generateShadowCrack,
    'road-crack': generateRoadCrack,
    'sharp-curve': generateSharpCurve,
    'multi-lane': generateMultiLane
  };

  const gen = generators[name];
  if (!gen) throw new Error(`Unknown preset: ${name}`);
  return gen();
}

function roadBackground(ctx) {
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(W * 0.15, 0, W * 0.7, H);

  for (let y = 0; y < H; y += 40) {
    ctx.fillStyle = '#e0e020';
    ctx.fillRect(W / 2 - 2, y, 4, 20);
  }
}

function drawLaneLine(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color || '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function generateShadowCrack() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  roadBackground(ctx);

  drawLaneLine(ctx, W * 0.25, 0, W * 0.35, H, '#ffffff');
  drawLaneLine(ctx, W * 0.65, 0, W * 0.75, H, '#ffffff');

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.moveTo(W * 0.1, 0);
  ctx.lineTo(W * 0.45, 0);
  ctx.lineTo(W * 0.35, H);
  ctx.lineTo(W * 0.05, H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.45, 0);
  ctx.lineTo(W * 0.35, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.1, 0);
  ctx.lineTo(W * 0.05, H);
  ctx.stroke();

  return {
    imageData: canvas.toDataURL('image/png').split(',')[1],
    description: 'Road with two lane lines and a large dark shadow overlay covering the left lane line. Shadow edges are sharp, which can be misdetected as lane lines by the Hough Transform.'
  };
}

function generateRoadCrack() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  roadBackground(ctx);

  drawLaneLine(ctx, W * 0.3, 0, W * 0.35, H, '#ffffff');
  drawLaneLine(ctx, W * 0.65, 0, W * 0.7, H, '#ffffff');

  const crackSeeds = [
    { x: W * 0.2, y: H * 0.3, angle: 1.2, len: 80 },
    { x: W * 0.45, y: H * 0.5, angle: 0.8, len: 100 },
    { x: W * 0.55, y: H * 0.2, angle: 1.5, len: 60 },
    { x: W * 0.8, y: H * 0.6, angle: 0.4, len: 90 },
    { x: W * 0.35, y: H * 0.7, angle: 1.8, len: 70 }
  ];

  ctx.strokeStyle = '#909090';
  ctx.lineWidth = 2;
  for (const crack of crackSeeds) {
    ctx.beginPath();
    ctx.moveTo(crack.x, crack.y);
    let cx = crack.x, cy = crack.y;
    const steps = 8;
    const stepLen = crack.len / steps;
    for (let s = 0; s < steps; s++) {
      const jitter = (Math.random() - 0.5) * 0.4;
      cx += Math.cos(crack.angle + jitter) * stepLen;
      cy += Math.sin(crack.angle + jitter) * stepLen;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  return {
    imageData: canvas.toDataURL('image/png').split(',')[1],
    description: 'Road with lane lines and random crack lines that resemble lane marks. Cracks can be misidentified as lane boundaries by edge detection and Hough Transform.'
  };
}

function generateSharpCurve() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(W * 0.15, 0, W * 0.7, H);

  const cx = W * 0.1;
  const cy = H * 1.5;
  const radius = 200;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI * 0.35, -Math.PI * 0.05);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius + W * 0.35, -Math.PI * 0.35, -Math.PI * 0.05);
  ctx.stroke();

  const midR = radius + W * 0.175;
  for (let a = -Math.PI * 0.35; a < -Math.PI * 0.05; a += 0.15) {
    const dx = cx + midR * Math.cos(a);
    const dy = cy + midR * Math.sin(a);
    ctx.fillStyle = '#e0e020';
    ctx.fillRect(dx - 2, dy - 2, 4, 10);
  }

  return {
    imageData: canvas.toDataURL('image/png').split(',')[1],
    description: 'Road with tight curved lane lines (radius < 50m equivalent). The Hough Transform detects straight line segments on the curves, which are poor approximations of the actual curved lane boundaries.'
  };
}

function generateMultiLane() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(W * 0.1, 0, W * 0.8, H);

  const lanes = [
    { x1: W * 0.15, x2: W * 0.22 },
    { x1: W * 0.30, x2: W * 0.33 },
    { x1: W * 0.45, x2: W * 0.47 },
    { x1: W * 0.60, x2: W * 0.58 },
    { x1: W * 0.75, x2: W * 0.70 }
  ];

  for (const lane of lanes) {
    drawLaneLine(ctx, lane.x1, 0, lane.x2, H, '#ffffff');
  }

  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.35, H * 0.4);
  ctx.lineTo(W * 0.55, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W * 0.50, H * 0.4);
  ctx.lineTo(W * 0.60, 0);
  ctx.stroke();

  for (let y = 0; y < H; y += 40) {
    ctx.fillStyle = '#e0e020';
    ctx.fillRect(W * 0.375 - 1, y, 3, 18);
    ctx.fillRect(W * 0.525 - 1, y, 3, 18);
  }

  return {
    imageData: canvas.toDataURL('image/png').split(',')[1],
    description: 'Road with 4+ lanes merging and splitting. Multiple lane marks in different directions including diverging lines in merge/split zones, which can confuse lane detection algorithms.'
  };
}

module.exports = { generatePreset };
