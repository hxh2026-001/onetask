<script>
  import { onMount, onDestroy, afterUpdate, createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  
  export let districts = []
  export let boundary = []
  export let populationCenters = []
  export let selectedDistrict = null
  export let animating = false
  
  let canvas
  let ctx
  let scale = 1
  let offset = { x: 0, y: 0 }
  let isDragging = false
  let dragStart = { x: 0, y: 0 }
  let selectedPoint = null
  let selectedCenter = null
  let centerTrails = []
  let flashPhase = 0
  
  const MAGNET_THRESHOLD = 15
  const MAGNET_STRENGTH = 0.8
  
  const screenToWorld = (screenX, screenY) => ({
    x: (screenX - offset.x) / scale,
    y: (screenY - offset.y) / scale
  })
  
  const worldToScreen = (worldX, worldY) => ({
    x: worldX * scale + offset.x,
    y: worldY * scale + offset.y
  })
  
  const applyMagneticSnap = (worldX, worldY) => {
    let snapX = worldX
    let snapY = worldY
    let snapped = false
    
    districts.forEach(district => {
      district.polygon.forEach((point, index) => {
        const dist = Math.sqrt((worldX - point[0]) ** 2 + (worldY - point[1]) ** 2)
        if (dist < MAGNET_THRESHOLD * scale) {
          snapX = point[0] + (worldX - point[0]) * (1 - MAGNET_STRENGTH)
          snapY = point[1] + (worldY - point[1]) * (1 - MAGNET_STRENGTH)
          snapped = true
        }
      })
    })
    
    boundary.forEach(point => {
      const dist = Math.sqrt((worldX - point[0]) ** 2 + (worldY - point[1]) ** 2)
      if (dist < MAGNET_THRESHOLD * scale) {
        snapX = point[0] + (worldX - point[0]) * (1 - MAGNET_STRENGTH)
        snapY = point[1] + (worldY - point[1]) * (1 - MAGNET_STRENGTH)
        snapped = true
      }
    })
    
    return { x: snapX, y: snapY, snapped }
  }
  
  const drawGrid = () => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    
    const gridSize = 50 * scale
    const startX = (offset.x % gridSize) - gridSize
    const startY = (offset.y % gridSize) - gridSize
    
    for (let x = startX; x < canvas.width + gridSize; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = startY; y < canvas.height + gridSize; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }
  
  const drawBoundary = () => {
    if (boundary.length < 2) return
    
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])
    
    const first = worldToScreen(boundary[0][0], boundary[0][1])
    ctx.moveTo(first.x, first.y)
    
    boundary.forEach(point => {
      const screen = worldToScreen(point[0], point[1])
      ctx.lineTo(screen.x, screen.y)
    })
    
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
  }
  
  const drawDistricts = () => {
    districts.forEach(district => {
      if (district.polygon.length < 3) return
      
      const isSelected = district.id === selectedDistrict
      const isGerrymandered = checkSelfIntersection(district.polygon)
      
      ctx.beginPath()
      
      if (animating && isGerrymandered) {
        const flashColor = flashPhase > 0.5 ? '#ef4444' : '#3b82f6'
        ctx.fillStyle = flashColor
        ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 100) * 0.2
      } else {
        ctx.fillStyle = district.color
        ctx.globalAlpha = isSelected ? 0.9 : 0.6
      }
      
      const first = worldToScreen(district.polygon[0][0], district.polygon[0][1])
      ctx.moveTo(first.x, first.y)
      
      for (let i = 1; i < district.polygon.length; i++) {
        const point = district.polygon[i]
        const screen = worldToScreen(point[0], point[1])
        ctx.lineTo(screen.x, screen.y)
      }
      
      ctx.closePath()
      ctx.fill()
      
      ctx.globalAlpha = 1
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()
      
      if (isGerrymandered) {
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 16px Arial'
        const center = getPolygonCenter(district.polygon)
        const screenCenter = worldToScreen(center.x, center.y)
        ctx.fillText('!', screenCenter.x - 6, screenCenter.y + 6)
      }
    })
  }
  
  const checkSelfIntersection = (polygon) => {
    for (let i = 0; i < polygon.length; i++) {
      for (let j = i + 2; j < polygon.length; j++) {
        const p1 = polygon[i]
        const p2 = polygon[(i + 1) % polygon.length]
        const p3 = polygon[j]
        const p4 = polygon[(j + 1) % polygon.length]
        
        if (doIntersect(p1, p2, p3, p4)) {
          return true
        }
      }
    }
    return false
  }
  
  const doIntersect = (p1, q1, p2, q2) => {
    const ccw = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return ccw(p1, q1, p2) * ccw(p1, q1, q2) < 0 && ccw(p2, q2, p1) * ccw(p2, q2, q1) < 0
  }
  
  const getPolygonCenter = (polygon) => {
    let x = 0, y = 0
    polygon.forEach(point => {
      x += point[0]
      y += point[1]
    })
    return { x: x / polygon.length, y: y / polygon.length }
  }
  
  const drawPoints = () => {
    districts.forEach(district => {
      const isSelected = district.id === selectedDistrict
      
      district.polygon.forEach((point, index) => {
        const screen = worldToScreen(point[0], point[1])
        const isHovered = selectedPoint?.districtId === district.id && selectedPoint?.pointIndex === index
        
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, isHovered ? 10 : 7, 0, Math.PI * 2)
        ctx.fillStyle = isSelected ? '#ffffff' : '#06b6d4'
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, isHovered ? 13 : 10, 0, Math.PI * 2)
        ctx.strokeStyle = isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })
  }
  
  const drawPopulationCenters = () => {
    populationCenters.forEach((center, index) => {
      const screen = worldToScreen(center.x, center.y)
      const isSelected = selectedCenter === index
      
      if (centerTrails[index]) {
        ctx.beginPath()
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        
        centerTrails[index].forEach((trailPoint, i) => {
          const trailScreen = worldToScreen(trailPoint.x, trailPoint.y)
          if (i === 0) ctx.moveTo(trailScreen.x, trailScreen.y)
          else ctx.lineTo(trailScreen.x, trailScreen.y)
        })
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      const radius = 15 + center.weight / 5
      
      const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius)
      gradient.addColorStop(0, '#f59e0b')
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)')
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0)')
      
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, isSelected ? 12 : 8, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, isSelected ? 15 : 10, 0, Math.PI * 2)
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }
  
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    drawGrid()
    drawBoundary()
    drawDistricts()
    drawPopulationCenters()
    drawPoints()
    
    if (animating) {
      flashPhase = (flashPhase + 0.05) % 1
    }
    
    requestAnimationFrame(draw)
  }
  
  const handleMouseDown = (e) => {
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (e.button === 0) {
      const world = screenToWorld(x, y)
      
      for (let i = districts.length - 1; i >= 0; i--) {
        const district = districts[i]
        for (let j = 0; j < district.polygon.length; j++) {
          const point = district.polygon[j]
          const dist = Math.sqrt((world.x - point[0]) ** 2 + (world.y - point[1]) ** 2)
          if (dist < 15 / scale) {
            selectedPoint = { districtId: district.id, pointIndex: j }
            isDragging = true
            dragStart = { x, y }
            dispatch('startDrag', { type: 'point' })
            return
          }
        }
      }
      
      for (let i = 0; i < populationCenters.length; i++) {
        const center = populationCenters[i]
        const dist = Math.sqrt((world.x - center.x) ** 2 + (world.y - center.y) ** 2)
        if (dist < 20 / scale) {
          selectedCenter = i
          isDragging = true
          dragStart = { x, y }
          dispatch('startDrag', { type: 'center' })
          
          if (!centerTrails[i]) {
            centerTrails[i] = []
          }
          centerTrails[i].push({ x: center.x, y: center.y })
          if (centerTrails[i].length > 20) {
            centerTrails[i].shift()
          }
          return
        }
      }
      
      for (let i = districts.length - 1; i >= 0; i--) {
        if (isPointInPolygon(world.x, world.y, districts[i].polygon)) {
          dispatch('selectDistrict', { districtId: districts[i].id })
          return
        }
      }
      
      dispatch('selectDistrict', { districtId: null })
    } else if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isDragging = true
      dragStart = { x, y }
    }
  }
  
  const isPointInPolygon = (x, y, polygon) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1]
      const xj = polygon[j][0], yj = polygon[j][1]
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    return inside
  }
  
  const handleMouseMove = (e) => {
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (isDragging) {
      if (selectedPoint) {
        let world = screenToWorld(x, y)
        const snapped = applyMagneticSnap(world.x, world.y)
        world = { x: snapped.x, y: snapped.y }
        
        dispatch('pointDrag', {
          districtId: selectedPoint.districtId,
          pointIndex: selectedPoint.pointIndex,
          newPos: [world.x, world.y]
        })
      } else if (selectedCenter !== null) {
        const world = screenToWorld(x, y)
        
        if (!centerTrails[selectedCenter]) {
          centerTrails[selectedCenter] = []
        }
        centerTrails[selectedCenter].push({ x: world.x, y: world.y })
        if (centerTrails[selectedCenter].length > 20) {
          centerTrails[selectedCenter].shift()
        }
        
        dispatch('centerMove', {
          index: selectedCenter,
          newPos: { x: world.x, y: world.y }
        })
      } else {
        offset.x += x - dragStart.x
        offset.y += y - dragStart.y
        dragStart = { x, y }
      }
    } else {
      const world = screenToWorld(x, y)
      
      for (let i = districts.length - 1; i >= 0; i--) {
        for (let j = 0; j < districts[i].polygon.length; j++) {
          const point = districts[i].polygon[j]
          const dist = Math.sqrt((world.x - point[0]) ** 2 + (world.y - point[1]) ** 2)
          if (dist < 15 / scale) {
            canvas.style.cursor = 'move'
            return
          }
        }
      }
      
      for (let i = 0; i < populationCenters.length; i++) {
        const center = populationCenters[i]
        const dist = Math.sqrt((world.x - center.x) ** 2 + (world.y - center.y) ** 2)
        if (dist < 20 / scale) {
          canvas.style.cursor = 'move'
          return
        }
      }
      
      canvas.style.cursor = 'default'
    }
  }
  
  const handleMouseUp = () => {
    isDragging = false
    selectedPoint = null
    selectedCenter = null
  }
  
  const handleWheel = (e) => {
    if (!canvas) return
    
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(3, scale * factor))
    
    offset.x = x - (x - offset.x) * (newScale / scale)
    offset.y = y - (y - offset.y) * (newScale / scale)
    scale = newScale
  }
  
  onMount(() => {
    ctx = canvas.getContext('2d')
    resize()
    draw()
    
    window.addEventListener('resize', resize)
  })
  
  onDestroy(() => {
    window.removeEventListener('resize', resize)
  })
  
  const resize = () => {
    const container = canvas.parentElement
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    
    const worldWidth = 500
    const worldHeight = 400
    scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight) * 0.9
    offset.x = (canvas.width - worldWidth * scale) / 2
    offset.y = (canvas.height - worldHeight * scale) / 2
  }
  
  afterUpdate(() => {
    if (populationCenters.length !== centerTrails.length) {
      centerTrails = populationCenters.map((_, i) => centerTrails[i] || [])
    }
  })
</script>

<canvas
  bind:this={canvas}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  on:wheel={handleWheel}
  class="map-canvas"
/>

<style>
  .map-canvas {
    width: 100%;
    height: 100%;
    cursor: default;
  }
</style>
