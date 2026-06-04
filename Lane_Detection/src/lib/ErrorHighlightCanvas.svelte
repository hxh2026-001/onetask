<script lang="ts">
  import { onDestroy } from 'svelte'

  export let width = 640
  export let height = 400
  export let lines: Array<{ rho: number; theta: number; votes: number; isFalsePositive?: boolean; falseReason?: string }> = []

  let canvas: HTMLCanvasElement
  let animFrameId: number | null = null

  $: if (canvas) {
    runAnimation()
  }

  function runAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    const ctx = canvas.getContext('2d')!

    const falseLines = lines.filter((l) => l.isFalsePositive)
    
    if (falseLines.length === 0) {
      ctx.clearRect(0, 0, width, height)
    } else {
      let startTime: number | null = null

      function drawHoughLine(
        ctx: CanvasRenderingContext2D,
        rho: number,
        theta: number,
        alpha: number
      ) {
        const a = Math.cos(theta)
        const b = Math.sin(theta)
        const x0 = a * rho
        const y0 = b * rho
        const len = Math.max(width, height) * 2

        ctx.beginPath()
        ctx.moveTo(x0 + len * (-b), y0 + len * a)
        ctx.lineTo(x0 - len * (-b), y0 - len * a)
        ctx.strokeStyle = `rgba(255, 61, 0, ${alpha})`
        ctx.lineWidth = 2.5
        ctx.stroke()

        const midX = x0
        const midY = y0
        ctx.fillStyle = `rgba(255, 61, 0, ${alpha})`
        ctx.font = '12px "Noto Sans SC", sans-serif'
      }

      function animate(timestamp: number) {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const cyclePos = (elapsed % 1000) / 1000
        const alpha = cyclePos < 0.5 ? 1.0 : 0.2

        ctx.clearRect(0, 0, width, height)

        for (const line of falseLines) {
          drawHoughLine(ctx, line.rho, line.theta, alpha)

          if (line.falseReason) {
            const a = Math.cos(line.theta)
            const b = Math.sin(line.theta)
            const x0 = a * line.rho
            const y0 = b * line.rho
            const labelX = Math.max(10, Math.min(width - 80, x0))
            const labelY = Math.max(15, Math.min(height - 5, y0))

            ctx.fillStyle = `rgba(255, 61, 0, ${alpha})`
            ctx.font = '11px "Noto Sans SC", sans-serif'
            ctx.fillText(line.falseReason, labelX + 5, labelY - 5)
          }
        }

        animFrameId = requestAnimationFrame(animate)
      }

      animFrameId = requestAnimationFrame(animate)
    }
  }

  onDestroy(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
  })
</script>

<canvas bind:this={canvas} {width} {height} class="error-canvas"></canvas>

<style>
  .error-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
</style>
