<script>
  import { onMount, onDestroy } from 'svelte';

  export let dna = '';
  export let mrna = '';
  export let aminoAcids = [];
  export let currentStep = 0;
  export let isAnimating = false;
  
  let canvas;
  let ctx;
  let animationId;
  let transitionProgress = 0;
  let displayDna = '';
  let displayMrna = '';
  let displayAAs = [];

  const baseColors = {
    'A': '#3498db',
    'T': '#e74c3c',
    'U': '#e67e22',
    'G': '#2ecc71',
    'C': '#f39c12'
  };

  const aaColors = {
    'Phe': '#ff6b6b', 'Leu': '#4ecdc4', 'Ile': '#45b7d1', 'Met': '#96ceb4',
    'Val': '#ffeaa7', 'Ser': '#dfe6e9', 'Pro': '#fd79a8', 'Thr': '#00b894',
    'Ala': '#e17055', 'Tyr': '#6c5ce7', 'His': '#a29bfe', 'Gln': '#fdcb6e',
    'Asn': '#00cec9', 'Lys': '#e84393', 'Asp': '#74b9ff', 'Glu': '#636e72',
    'Cys': '#b2bec3', 'Trp': '#2d3436', 'Arg': '#0984e3', 'Gly': '#fab1a0',
    'Stop': '#d63031'
  };

  function draw() {
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const sections = [
      { title: 'DNA', y: 50, color: '#3498db', data: displayDna, type: 'dna' },
      { title: 'mRNA', y: 150, color: '#e67e22', data: displayMrna, type: 'mrna' },
      { title: '蛋白质', y: 250, color: '#2ecc71', data: displayAAs, type: 'protein' }
    ];

    sections.forEach((section, index) => {
      const alpha = index <= currentStep ? 1 : 0.3;
      const isActive = index === currentStep && isAnimating;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(section.title, 20, section.y - 20);

      if (section.type === 'protein') {
        const maxAAs = Math.min(section.data.length, 20);
        for (let i = 0; i < maxAAs; i++) {
          const aa = section.data[i];
          const x = 20 + i * 35;
          
          ctx.fillStyle = aaColors[aa] || '#666';
          ctx.globalAlpha = isActive && i >= maxAAs - 1 ? transitionProgress : alpha;
          ctx.fillRect(x, section.y - 15, 30, 30);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, section.y - 15, 30, 30);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(aa || '', x + 15, section.y + 5);
          ctx.globalAlpha = 1;
        }
      } else {
        const maxBases = Math.min(section.data.length, 60);
        for (let i = 0; i < maxBases; i++) {
          const base = section.data[i];
          const x = 20 + (i % 30) * 18;
          const yOffset = Math.floor(i / 30) * 25;
          
          ctx.fillStyle = baseColors[base] || '#666';
          ctx.globalAlpha = isActive && i >= maxBases - 1 ? transitionProgress : alpha;
          ctx.fillRect(x, section.y - 10 + yOffset, 14, 20);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, section.y - 10 + yOffset, 14, 20);
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(base || '', x + 7, section.y + 5 + yOffset);
          ctx.globalAlpha = 1;
        }
      }

      if (index < currentStep) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', width - 40, section.y);
      }
    });

    if (isAnimating) {
      transitionProgress = Math.min(transitionProgress + 0.02, 1);
    }

    animationId = requestAnimationFrame(draw);
  }

  $: if (currentStep >= 0 && dna) {
    const dnaChars = Math.floor(dna.length * (currentStep >= 0 ? 1 : transitionProgress));
    displayDna = dna.substring(0, dnaChars);
  }

  $: if (currentStep >= 1 && mrna) {
    const mrnaChars = Math.floor(mrna.length * (currentStep >= 1 ? 1 : transitionProgress));
    displayMrna = mrna.substring(0, mrnaChars);
  }

  $: if (currentStep >= 2 && aminoAcids) {
    const aaCount = Math.floor(aminoAcids.length * (currentStep >= 2 ? 1 : transitionProgress));
    displayAAs = aminoAcids.slice(0, aaCount);
  }

  $: if (isAnimating) {
    transitionProgress = 0;
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

<div class="transition-container">
  <h3>中心法则：DNA → mRNA → 蛋白质</h3>
  <canvas bind:this={canvas} width={600} height={320} />
  <div class="step-indicators">
    <button class:active={currentStep === 0} class:completed={currentStep > 0} on:click={() => currentStep = 0}>
      转录
    </button>
    <span class="arrow">→</span>
    <button class:active={currentStep === 1} class:completed={currentStep > 1} on:click={() => currentStep = 1}>
      翻译
    </button>
    <span class="arrow">→</span>
    <button class:active={currentStep === 2} class:completed={currentStep > 2} on:click={() => currentStep = 2}>
      合成
    </button>
  </div>
</div>

<style>
  .transition-container {
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(52, 152, 219, 0.3);
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

  .step-indicators {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    background: #21262d;
    color: #8b949e;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  button:hover {
    background: #30363d;
    color: #fff;
  }

  button.active {
    background: linear-gradient(90deg, #3498db, #9b59b6);
    color: #fff;
    box-shadow: 0 0 15px rgba(52, 152, 219, 0.5);
  }

  button.completed {
    background: #2ecc71;
    color: #fff;
  }

  .arrow {
    color: #8b949e;
    font-size: 20px;
  }
</style>
