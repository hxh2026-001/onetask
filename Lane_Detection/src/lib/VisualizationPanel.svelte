<script lang="ts">
  import { currentStage } from './stores'
  import { onDestroy } from 'svelte'

  export let canvasWidth = 640
  export let canvasHeight = 400
  export let edges: number[] = []
  export let accumulator: number[] = []
  export let rhoBins = 0
  export let thetaBins = 0
  export let lines: Array<{
    rho: number
    theta: number
    startX: number
    startY: number
    endX: number
    endY: number
    isFalsePositive?: boolean
  }> = []

  let layer0Canvas: HTMLCanvasElement
  let layer1Canvas: HTMLCanvasElement
  let layer2Canvas: HTMLCanvasElement
  let layer3Canvas: HTMLCanvasElement

  let stage: 0 | 1 | 2 | 3 = 0
  let autoAdvanceTimer: ReturnType<typeof setInterval> | null = null

  currentStage.subscribe((v) => { stage = v })

  $: if (layer0Canvas) {
    const ctx = layer0Canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.fillStyle = 'rgba(26, 26, 30, 0.2)'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }
  }

  $: if (layer1Canvas && edges.length > 0) {
    const ctx = layer1Canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      const imageData = ctx.createImageData(canvasWidth, canvasHeight)
      for (let i = 0; i < edges.length; i++) {
        const idx = i * 4
        const v = edges[i] > 0 ? 255 : 0
        imageData.data[idx] = v
        imageData.data[idx + 1] = v
        imageData.data[idx + 2] = v
        imageData.data[idx + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
  }

  $: if (layer2Canvas && accumulator.length > 0 && rhoBins > 0 && thetaBins > 0) {
    const ctx = layer2Canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      
      let maxVal = 0
      for (let i = 0; i < accumulator.length; i++) {
        if (accumulator[i] > maxVal) maxVal = accumulator[i]
      }
      
      const cellW = canvasWidth / thetaBins
      const cellH = canvasHeight / rhoBins
      
      for (let r = 0; r < rhoBins; r++) {
        for (let t = 0; t < thetaBins; t++) {
          const idx = r * thetaBins + t
          const val = maxVal > 0 ? accumulator[idx] / maxVal : 0
          
          const hot = val
          const red = Math.floor(255 * Math.min(1, hot * 2))
          const green = Math.floor(255 * Math.min(1, Math.max(0, hot * 2 - 0.6)))
          const blue = Math.floor(255 * Math.max(0, hot * 3 - 2.2))
          
          ctx.fillStyle = `rgb(${red},${green},${blue})`
          ctx.fillRect(t * cellW, r * cellH, cellW + 1, cellH + 1)
        }
      }
    }
  }

  $: if (layer3Canvas && lines.length > 0) {
    const ctx = layer3Canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      for (const line of lines) {
        const color = line.isFalsePositive ? '#ff3d00' : '#00e5ff'
        ctx.beginPath()
        ctx.moveTo(line.startX, line.startY)
        ctx.lineTo(line.endX, line.endY)
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }
  }

  $: if (accumulator.length > 0) {
    stage = 0
    currentStage.set(0)
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer)
    let nextStage: 0 | 1 | 2 | 3 = 0
    autoAdvanceTimer = setInterval(() => {
      nextStage = (nextStage + 1) as 0 | 1 | 2 | 3
      if (nextStage > 3) {
        clearInterval(autoAdvanceTimer!)
        return
      }
      currentStage.set(nextStage)
    }, 1200)
  }

  onDestroy(() => {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer)
  })

  function layerOpacity(layerIndex: number): number {
    return stage >= layerIndex ? 1 : 0
  }
</script>

<div class="viz-container" style="width: {canvasWidth}px; height: {canvasHeight}px;">
  <canvas
    bind:this={layer0Canvas}
    class="viz-layer layer0"
    style="opacity: {layerOpacity(0)}"
    width={canvasWidth}
    height={canvasHeight}
  ></canvas>
  <canvas
    bind:this={layer1Canvas}
    class="viz-layer layer1"
    style="opacity: {layerOpacity(1)}"
    width={canvasWidth}
    height={canvasHeight}
  ></canvas>
  <canvas
    bind:this={layer2Canvas}
    class="viz-layer layer2"
    style="opacity: {layerOpacity(2)}"
    width={canvasWidth}
    height={canvasHeight}
  ></canvas>
  <canvas
    bind:this={layer3Canvas}
    class="viz-layer layer3"
    style="opacity: {layerOpacity(3)}"
    width={canvasWidth}
    height={canvasHeight}
  ></canvas>
</div>

<style>
  .viz-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .viz-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.6s ease-in-out;
    pointer-events: none;
  }

  .layer0 { z-index: 1; }
  .layer1 { z-index: 2; }
  .layer2 { z-index: 3; }
  .layer3 { z-index: 4; }
</style>
