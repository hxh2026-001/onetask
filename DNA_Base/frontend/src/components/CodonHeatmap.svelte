<script>
  import { onMount, onDestroy } from 'svelte';

  export let codons = [];
  export let isAnimating = false;
  
  let canvas;
  let ctx;
  let animationId;
  let animationProgress = 0;

  const codonColors = {
    'Phe': 2, 'Leu': 6, 'Ile': 3, 'Met': 1, 'Val': 4,
    'Ser': 6, 'Pro': 4, 'Thr': 4, 'Ala': 4, 'Tyr': 2,
    'His': 2, 'Gln': 2, 'Asn': 2, 'Lys': 2, 'Asp': 2,
    'Glu': 2, 'Cys': 2, 'Trp': 1, 'Arg': 6, 'Gly': 4,
    'Stop': 3
  };

  function getCodonFrequency() {
    const freq = {};
    for (const { aminoAcid } of codons) {
      freq[aminoAcid] = (freq[aminoAcid] || 0);
      freq[aminoAcid]++;
    }
    return freq;
  }

  function getColor(frequency, maxFreq) {
    const ratio = frequency / maxFreq;
    const r = Math.floor(255 * ratio);
    const g = Math.floor(100 * (1 - ratio));
    const b = Math.floor(100 * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function draw() {
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const aminoAcids = Object.keys(codonColors);
    const cols = 6;
    const rows = Math.ceil(aminoAcids.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const freq = getCodonFrequency();
    const maxFreq = Math.max(...Object.values(freq), 1);

    aminoAcids.forEach((aa, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellWidth + 5;
      const y = row * cellHeight + 5;
      const w = cellWidth - 10;
      const h = cellHeight - 10;

      const count = freq[aa] || 0;
      const animFactor = isAnimating ? animationProgress : 1;
      const displayCount = count * animFactor;
      
      const color = getColor(displayCount, maxFreq);
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(aa, x + w / 2, y + h / 2 - 5);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${count}`, x + w / 2, y + h / 2 + 15);
    });

    if (isAnimating) {
      animationProgress = Math.min(animationProgress + 0.02, 1);
    }

    animationId = requestAnimationFrame(draw);
  }

  $: if (codons.length > 0 && isAnimating) {
    animationProgress = 0;
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    draw();
  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
</script>

<div class="heatmap-container">
  <h3>密码子使用频率热力图</h3>
  <canvas bind:this={canvas} width={600} height={300} />
  <div class="legend">
    <span>低频</span>
    <div class="gradient"></div>
    <span>高频</span>
  </div>
</div>

<style>
  .heatmap-container {
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(231, 76, 60, 0.3);
  }

  h3 {
    color: #fff;
    margin: 0 0 15px 0;
    font-size: 18px;
  }

  canvas {
    border-radius: 8px;
    width: 100%;
  }

  .legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
    color: #8b949e;
    font-size: 12px;
  }

  .gradient {
    width: 150px;
    height: 10px;
    background: linear-gradient(90deg, rgb(0, 100, 100), rgb(255, 0, 0));
    border-radius: 5px;
  }
</style>
