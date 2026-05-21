<script>
  import { onMount, onDestroy } from 'svelte'

  export let animationState

  let particles = []
  let canvas

  function createParticle(x, y, type) {
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      type,
      size: Math.random() * 4 + 2
    }
  }

  function animate() {
    const canvas = document.querySelector('.animation-layer')
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (animationState.showRipple) {
      const time = Date.now() / 1000
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = 0; i < 3; i++) {
        const radius = ((time * 100 + i * 80) % 300)
        const opacity = 1 - radius / 300
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(184, 134, 11, ${opacity * 0.5})`
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    if (animationState.showGreenFlow) {
      for (let i = 0; i < 20; i++) {
        const angle = (Date.now() / 50 + i * 0.3)
        const x = canvas.width / 2 + Math.cos(angle) * 100
        const y = canvas.height / 2 + Math.sin(angle) * 100
        
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 255, 136, 0.6)'
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 255, 136, 0.2)'
        ctx.fill()
      }
    }

    if (animationState.showRedArc) {
      const time = Date.now() / 100
      for (let i = 0; i < 10; i++) {
        if (Math.random() > 0.5) {
          const startX = Math.random() * canvas.width
          const startY = Math.random() * canvas.height
          const endX = startX + (Math.random() - 0.5) * 100
          const endY = startY + (Math.random() - 0.5) * 100
          
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          
          const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 50
          const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 50
          ctx.quadraticCurveTo(midX, midY, endX, endY)
          
          ctx.strokeStyle = `rgba(255, 68, 68, ${0.5 + Math.random() * 0.5})`
          ctx.lineWidth = 1 + Math.random() * 2
          ctx.stroke()
        }
      }
    }

    requestAnimationFrame(animate)
  }

  let animationId

  onMount(() => {
    canvas = document.querySelector('.animation-layer')
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    animationId = requestAnimationFrame(animate)
  })

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })
</script>

<canvas class="animation-layer"></canvas>

<style>
  .animation-layer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1000;
    opacity: 0.6;
  }
</style>
