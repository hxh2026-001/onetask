<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  
  export let width = 640
  export let height = 400

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null = null
  let isDrawing = false
  let tool: 'pencil' | 'eraser' = 'pencil'
  let lineWidth = 3
  let lastX = 0
  let lastY = 0

  function initCanvas() {
    if (!canvas) return
    ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, width, height)
    }
  }

  function getPos(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height)
    }
  }

  function startDraw(e: MouseEvent) {
    isDrawing = true
    const pos = getPos(e)
    lastX = pos.x
    lastY = pos.y
  }

  function draw(e: MouseEvent) {
    if (!isDrawing || !ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#111' : '#ffffff'
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastX = pos.x
    lastY = pos.y
  }

  function stopDraw() {
    isDrawing = false
  }

  function clearCanvas() {
    if (!ctx) return
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, width, height)
  }

  onMount(() => {
    initCanvas()
    if (canvas) {
      canvas.addEventListener('mousedown', startDraw)
      canvas.addEventListener('mousemove', draw)
      canvas.addEventListener('mouseup', stopDraw)
      canvas.addEventListener('mouseleave', stopDraw)
    }
  })

  onDestroy(() => {
    if (canvas) {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDraw)
      canvas.removeEventListener('mouseleave', stopDraw)
    }
  })

  export function getPixels(): Uint8ClampedArray | null {
    if (!ctx) return null
    const imageData = ctx.getImageData(0, 0, width, height)
    return imageData.data
  }

  export function getImageData(): string {
    return canvas.toDataURL('image/png')
  }

  export function loadImage(base64: string) {
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx!.fillStyle = '#111'
      ctx!.fillRect(0, 0, width, height)
      ctx!.drawImage(img, 0, 0, width, height)
    }
    img.src = base64
  }

  export function drawPreset(name: string) {
    if (!ctx) return
    const cx = ctx
    cx.fillStyle = '#1a1a1a'
    cx.fillRect(0, 0, width, height)

    cx.strokeStyle = '#ffffff'
    cx.lineWidth = 4
    cx.lineCap = 'round'
    cx.lineJoin = 'round'

    switch (name) {
      case 'shadow-crack':
        drawShadowCrackPreset(cx)
        break
      case 'road-crack':
        drawRoadCrackPreset(cx)
        break
      case 'sharp-curve':
        drawSharpCurvePreset(cx)
        break
      case 'multi-lane':
        drawMultiLanePreset(cx)
        break
    }
  }

  function drawShadowCrackPreset(cx: CanvasRenderingContext2D) {
    cx.strokeStyle = '#ffffff'
    cx.lineWidth = 5

    cx.beginPath()
    cx.moveTo(200, 0)
    cx.lineTo(180, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(440, 0)
    cx.lineTo(460, height)
    cx.stroke()

    cx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    cx.beginPath()
    cx.moveTo(80, 50)
    cx.lineTo(260, 70)
    cx.lineTo(300, 200)
    cx.lineTo(280, 350)
    cx.lineTo(100, 380)
    cx.lineTo(60, 200)
    cx.closePath()
    cx.fill()

    cx.strokeStyle = 'rgba(50, 50, 50, 0.9)'
    cx.lineWidth = 3
    cx.beginPath()
    cx.moveTo(220, 60)
    cx.lineTo(200, 360)
    cx.stroke()
  }

  function drawRoadCrackPreset(cx: CanvasRenderingContext2D) {
    cx.strokeStyle = '#ffffff'
    cx.lineWidth = 5

    cx.beginPath()
    cx.moveTo(180, 0)
    cx.lineTo(180, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(460, 0)
    cx.lineTo(460, height)
    cx.stroke()

    cx.strokeStyle = '#dddddd'
    cx.lineWidth = 3
    cx.beginPath()
    cx.moveTo(220, 80)
    cx.lineTo(380, 120)
    cx.lineTo(350, 160)
    cx.lineTo(420, 180)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(200, 250)
    cx.lineTo(280, 270)
    cx.lineTo(320, 230)
    cx.lineTo(400, 290)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(260, 340)
    cx.lineTo(340, 360)
    cx.lineTo(380, 320)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(300, 100)
    cx.lineTo(310, 200)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(350, 300)
    cx.lineTo(360, 380)
    cx.stroke()
  }

  function drawSharpCurvePreset(cx: CanvasRenderingContext2D) {
    cx.strokeStyle = '#ffffff'
    cx.lineWidth = 5

    cx.beginPath()
    for (let t = 0; t <= 1; t += 0.01) {
      const x = 320 + 220 * Math.cos(Math.PI * 0.7 * t + Math.PI * 0.5)
      const y = 380 - 380 * t
      if (t === 0) cx.moveTo(x, y)
      else cx.lineTo(x, y)
    }
    cx.stroke()

    cx.beginPath()
    for (let t = 0; t <= 1; t += 0.01) {
      const x = 320 + 100 * Math.cos(Math.PI * 0.7 * t + Math.PI * 0.5)
      const y = 380 - 380 * t
      if (t === 0) cx.moveTo(x, y)
      else cx.lineTo(x, y)
    }
    cx.stroke()

    cx.setLineDash([15, 15])
    cx.beginPath()
    for (let t = 0; t <= 1; t += 0.01) {
      const x = 320 + 160 * Math.cos(Math.PI * 0.7 * t + Math.PI * 0.5)
      const y = 380 - 380 * t
      if (t === 0) cx.moveTo(x, y)
      else cx.lineTo(x, y)
    }
    cx.stroke()
    cx.setLineDash([])
  }

  function drawMultiLanePreset(cx: CanvasRenderingContext2D) {
    cx.strokeStyle = '#ffffff'
    cx.lineWidth = 4

    cx.beginPath()
    cx.moveTo(100, 0)
    cx.lineTo(100, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(200, 0)
    cx.lineTo(200, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(320, 0)
    cx.lineTo(320, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(440, 0)
    cx.lineTo(440, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(540, 0)
    cx.lineTo(540, height)
    cx.stroke()

    cx.setLineDash([12, 12])
    cx.beginPath()
    cx.moveTo(150, 0)
    cx.lineTo(150, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(260, 0)
    cx.lineTo(260, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(380, 0)
    cx.lineTo(380, height)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(490, 0)
    cx.lineTo(490, height)
    cx.stroke()
    cx.setLineDash([])

    cx.strokeStyle = '#cccccc'
    cx.lineWidth = 3
    cx.beginPath()
    cx.moveTo(540, height)
    cx.lineTo(640, height - 100)
    cx.stroke()

    cx.beginPath()
    cx.moveTo(100, height)
    cx.lineTo(0, height - 100)
    cx.stroke()
  }
</script>

<div class="drawing-container">
  <div class="toolbar">
    <button
      class="tool-btn"
      class:active={tool === 'pencil'}
      on:click={() => (tool = 'pencil')}
      title="Pencil"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    </button>
    <button
      class="tool-btn"
      class:active={tool === 'eraser'}
      on:click={() => (tool = 'eraser')}
      title="Eraser"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
        <path d="M22 21H7"/>
        <path d="m5 11 9 9"/>
      </svg>
    </button>
    <button class="tool-btn" on:click={clearCanvas} title="Clear">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
    </button>
    <div class="width-control">
      <input
        type="range"
        min="1"
        max="8"
        bind:value={lineWidth}
      />
      <span class="width-label">{lineWidth}px</span>
    </div>
  </div>
  <canvas
    id="drawCanvas"
    bind:this={canvas}
    {width}
    {height}
  ></canvas>
</div>

<style>
  .drawing-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-card);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tool-btn:hover {
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
  }

  .tool-btn.active {
    background: rgba(0, 229, 255, 0.15);
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
  }

  .width-control {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .width-control input[type='range'] {
    width: 80px;
    accent-color: var(--accent-cyan);
  }

  .width-label {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'JetBrains Mono', monospace;
    min-width: 32px;
  }

  canvas {
    border-radius: 8px;
    cursor: crosshair;
    display: block;
    position: relative;
    z-index: 0;
  }
</style>
