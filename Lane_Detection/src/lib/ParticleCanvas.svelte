<script lang="ts">
  import { onDestroy } from 'svelte'

  export let width = 640
  export let height = 400
  export let accumulator: number[] = []
  export let rhoBins = 0
  export let thetaBins = 0

  let canvas: HTMLCanvasElement
  let animFrameId: number | null = null

  $: if (canvas && accumulator.length && rhoBins > 0 && thetaBins > 0) {
    runAnimation()
  }

  function runAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId)

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, width, height)

    let maxVal = 0
    for (let i = 0; i < accumulator.length; i++) {
      if (accumulator[i] > maxVal) maxVal = accumulator[i]
    }

    if (maxVal > 0) {
      const cellW = width / thetaBins
      const cellH = height / rhoBins

      type Particle = {
        x: number
        y: number
        size: number
        brightness: number
        glow: boolean
        delay: number
      }

      const particles: Particle[] = []
      for (let r = 0; r < rhoBins; r++) {
        for (let t = 0; t < thetaBins; t++) {
          const idx = r * thetaBins + t
          const val = accumulator[idx]
          if (val === 0) continue
          const norm = val / maxVal
          particles.push({
            x: t * cellW + cellW / 2,
            y: r * cellH + cellH / 2,
            size: Math.max(1, norm * 5),
            brightness: norm,
            glow: norm > 0.6,
            delay: (r * thetaBins + t) * 0.3
          })
        }
      }

      particles.sort((a, b) => a.delay - b.delay)

      let startTime: number | null = null
      const totalDuration = 3000

      function animate(timestamp: number) {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        ctx.clearRect(0, 0, width, height)

        for (const p of particles) {
          if (elapsed < p.delay) continue
          const progress = Math.min(1, (elapsed - p.delay) / 300)
          const alpha = p.brightness * progress

          if (p.glow) {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
            grad.addColorStop(0.3, `rgba(0, 229, 255, ${alpha * 0.8})`)
            grad.addColorStop(1, `rgba(0, 229, 255, 0)`)
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }

        if (elapsed < totalDuration + 500) {
          animFrameId = requestAnimationFrame(animate)
        }
      }

      animFrameId = requestAnimationFrame(animate)
    }
  }

  onDestroy(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
  })
</script>

<canvas bind:this={canvas} {width} {height} class="particle-canvas"></canvas>

<style>
  .particle-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
</style>
