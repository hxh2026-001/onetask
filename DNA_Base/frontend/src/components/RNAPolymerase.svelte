<script>
  import { onMount, onDestroy } from 'svelte';

  export let dnaSequence = '';
  export let mrnaSequence = '';
  export let isTranscribing = false;
  
  let canvas;
  let ctx;
  let animationId;
  let polymeraseX = 0;
  let transcriptionProgress = 0;

  const baseColors = {
    'A': '#3498db',
    'T': '#e74c3c',
    'U': '#e67e22',
    'G': '#2ecc71',
    'C': '#f39c12'
  };

  function draw() {
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    const dnaY = height / 2 - 50;
    const mrnaY = height / 2 + 50;
    const baseWidth = 30;
    const startX = 50;
    const maxBases = Math.floor((width - 100) / baseWidth);
    
    const basesToShow = Math.min(dnaSequence.length, maxBases);
    
    for (let i = 0; i < basesToShow; i++) {
      const x = startX + i * baseWidth;
      const base = dnaSequence[i];
      
      ctx.fillStyle = i < transcriptionProgress ? 'rgba(100, 100, 100, 0.5)' : baseColors[base] || '#666';
      ctx.fillRect(x, dnaY, 25, 25);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(x, dnaY, 25, 25);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(base || '', x + 12, dnaY + 18);
    }
    
    if (isTranscribing || transcriptionProgress > 0) {
      const mrnaBases = Math.min(transcriptionProgress, mrnaSequence.length, maxBases);
      for (let i = 0; i < mrnaBases; i++) {
        const x = startX + i * baseWidth;
        const base = mrnaSequence[i];
        
        ctx.fillStyle = baseColors[base] || '#666';
        ctx.fillRect(x, mrnaY, 25, 25);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, mrnaY, 25, 25);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(base || '', x + 12, mrnaY + 18);
      }
    }

    const polymeraseDrawX = startX + Math.min(transcriptionProgress, basesToShow - 1) * baseWidth;
    
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.moveTo(polymeraseDrawX, dnaY - 20);
    ctx.lineTo(polymeraseDrawX + 40, dnaY - 20);
    ctx.lineTo(polymeraseDrawX + 45, dnaY - 10);
    ctx.lineTo(polymeraseDrawX + 45, dnaY + 45);
    ctx.lineTo(polymeraseDrawX + 40, dnaY + 55);
    ctx.lineTo(polymeraseDrawX, dnaY + 55);
    ctx.lineTo(polymeraseDrawX - 5, dnaY + 45);
    ctx.lineTo(polymeraseDrawX - 5, dnaY - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RNA Pol', polymeraseDrawX + 20, dnaY + 20);

    if (isTranscribing) {
      transcriptionProgress = Math.min(transcriptionProgress + 0.1, dnaSequence.length);
    }

    animationId = requestAnimationFrame(draw);
  }

  export function reset() {
    transcriptionProgress = 0;
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

<div class="polymerase-container">
  <canvas bind:this={canvas} width={800} height={250} />
  <div class="progress-bar">
    <div class="progress" style="width: {Math.min(transcriptionProgress / dnaSequence.length * 100, 100)}%"></div>
  </div>
  <p class="progress-text">转录进度: {Math.floor(Math.min(transcriptionProgress / dnaSequence.length * 100, 100))}%</p>
</div>

<style>
  .polymerase-container {
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(155, 89, 182, 0.3);
  }

  canvas {
    border-radius: 8px;
    width: 100%;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #21262d;
    border-radius: 4px;
    margin-top: 15px;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: linear-gradient(90deg, #9b59b6, #3498db);
    border-radius: 4px;
    transition: width 0.1s ease;
  }

  .progress-text {
    color: #8b949e;
    text-align: center;
    margin-top: 8px;
    font-size: 14px;
  }
</style>
