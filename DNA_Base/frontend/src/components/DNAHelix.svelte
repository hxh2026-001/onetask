<script>
  import { onMount, onDestroy } from 'svelte';

  export let sequence = '';
  export let isAnimating = false;
  
  let canvas;
  let ctx;
  let animationId;
  let angle = 0;
  let expansionProgress = 0;
  let basePairs = [];

  const baseColors = {
    'A': '#3498db',
    'T': '#e74c3c',
    'G': '#2ecc71',
    'C': '#f39c12'
  };

  const complementary = {
    'A': 'T',
    'T': 'A',
    'G': 'C',
    'C': 'G'
  };

  $: {
    basePairs = sequence.split('').map((base, i) => ({
      base1: base,
      base2: complementary[base] || 'N',
      index: i
    }));
  }

  function draw() {
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const helixRadius = 100;
    const baseSpacing = 20;
    const pairsToShow = Math.min(basePairs.length, Math.floor(height / baseSpacing));

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < pairsToShow; i++) {
      const pair = basePairs[i];
      if (!pair) continue;

      const y = centerY - (pairsToShow / 2 * baseSpacing) + i * baseSpacing;
      const helixAngle = angle + i * 0.3;
      
      const expanded = isAnimating ? expansionProgress : 0;
      const x1 = centerX - helixRadius - expanded * 150 + Math.cos(helixAngle) * helixRadius * (1 - expanded * 0.5);
      const x2 = centerX + helixRadius + expanded * 150 - Math.cos(helixAngle) * helixRadius * (1 - expanded * 0.5);
      
      const zScale = Math.sin(helixAngle);
      const zScale2 = Math.sin(helixAngle + Math.PI);
      
      ctx.beginPath();
      ctx.arc(x1, y, 8 + zScale * 3, 0, Math.PI * 2);
      ctx.fillStyle = baseColors[pair.base1] || '#888';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pair.base1, x1, y);
      
      ctx.beginPath();
      ctx.arc(x2, y, 8 + zScale2 * 3, 0, Math.PI * 2);
      ctx.fillStyle = baseColors[pair.base2] || '#888';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.fillText(pair.base2, x2, y);
      
      if (expanded > 0.3) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + expanded * 0.3})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    angle += 0.02;
    if (isAnimating) {
      expansionProgress = Math.min(expansionProgress + 0.01, 1);
    } else {
      expansionProgress = Math.max(expansionProgress - 0.01, 0);
    }

    animationId = requestAnimationFrame(draw);
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

<div class="helix-container">
  <canvas bind:this={canvas} width={600} height={400} />
</div>

<style>
  .helix-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 0 30px rgba(52, 152, 219, 0.3);
  }

  canvas {
    border-radius: 8px;
  }
</style>
