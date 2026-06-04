<script>
  import { onMount, onDestroy } from 'svelte';

  export let aminoAcids = [];
  export let isRaining = false;
  
  let canvas;
  let ctx;
  let animationId;
  let drops = [];
  let initialized = false;

  const aminoAcidChars = [
    'A', 'R', 'N', 'D', 'C', 'Q', 'E', 'G', 'H', 'I',
    'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'
  ];

  function initDrops() {
    const columns = Math.floor(canvas.width / 20);
    drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
    initialized = true;
  }

  function getRandomAA() {
    if (aminoAcids.length > 0) {
      const aa = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
      return aa.charAt(0);
    }
    return aminoAcidChars[Math.floor(Math.random() * aminoAcidChars.length)];
  }

  function draw() {
    if (!ctx || !initialized) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '16px monospace';
    
    for (let i = 0; i < drops.length; i++) {
      const text = getRandomAA();
      const x = i * 20;
      const y = drops[i] * 20;
      
      const gradient = ctx.createLinearGradient(x, y - 100, x, y);
      gradient.addColorStop(0, 'rgba(46, 204, 113, 0)');
      gradient.addColorStop(1, 'rgba(46, 204, 113, 1)');
      
      ctx.fillStyle = gradient;
      ctx.fillText(text, x, y);
      
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 10;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;

      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    if (isRaining) {
      animationId = requestAnimationFrame(draw);
    }
  }

  $: if (isRaining && canvas && !initialized) {
    initDrops();
    draw();
  }

  $: if (isRaining && canvas) {
    if (!animationId) {
      draw();
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
</script>

<div class="matrix-container">
  <h3>氨基酸序列矩阵雨</h3>
  <canvas bind:this={canvas} width={600} height={300} />
  <p class="status">{isRaining ? '正在生成...' : '已暂停'}</p>
</div>

<style>
  .matrix-container {
    background: linear-gradient(135deg, #0a0a1a 0%, #0d1f0d 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(46, 204, 113, 0.3);
  }

  h3 {
    color: #2ecc71;
    margin: 0 0 15px 0;
    font-size: 18px;
  }

  canvas {
    border-radius: 8px;
    width: 100%;
  }

  .status {
    color: #8b949e;
    text-align: center;
    margin-top: 10px;
    font-size: 14px;
  }
</style>
