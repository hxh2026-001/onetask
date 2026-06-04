<script lang="ts">
  import { onDestroy } from 'svelte'

  export let width = 640
  export let height = 400
  export let lines: Array<{ rho: number; theta: number; votes: number; isFalsePositive?: boolean; falseReason?: string }> = []

  let canvas: HTMLCanvasElement
  let animFrameId: number | null = null

  $: if (canvas && lines.length > 0) {
    runAnimation()
  }

  function runAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    const ctx = canvas.getContext('2d')!

    let lineIdx = 0
    let lineStart: number | null = null
    const lineDuration = 1500

    function drawLineBand(
      ctx: CanvasRenderingContext2D,
      rho: number,
      theta: number,
      progress: number
    ) {
      const a = Math.cos(theta)
      const b = Math.sin(theta)
      const x0 = a * rho
      const y0 = b * rho
      const len = Math.max(width, height) * 2
      const dx = -b
      const dy = a

      const startX = x0 + len * dx
      const startY = y0 + len * dy
      const endX = x0 - len * dx
      const endY = y0 - len * dy

      const bandCenterX = startX + (endX - startX) * progress
      const bandCenterY = startY + (endY - startY) * progress

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'

      const grad = ctx.createLinearGradient(
        bandCenterX - dx * 20,
        bandCenterY - dy * 20,
        bandCenterX + dx * 20,
        bandCenterY + dy * 20
      )
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.strokeStyle = grad
      ctx.stroke()
      ctx.restore()
    }

    function animate(timestamp: number) {
      if (!lineStart) lineStart = timestamp
      const elapsed = timestamp - lineStart
      const progress = Math.min(1, elapsed / lineDuration)

      ctx.clearRect(0, 0, width, height)

      if (lineIdx < lines.length) {
        drawLineBand(ctx, lines[lineIdx].rho, lines[lineIdx].theta, progress)
      }

      if (progress >= 1) {
        lineIdx++
        lineStart = timestamp
        if (lineIdx >= lines.length) {
          ctx.clearRect(0, 0, width, height)
          return
        }
      }

      animFrameId = requestAnimationFrame(animate)
    }

    animFrameId = requestAnimationFrame(animate)
  }

  onDestroy(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
  })
</script>

<canvas bind:this={canvas} {width} {height} class="scan-canvas"></canvas>

<style>
  .scan-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
</style>
