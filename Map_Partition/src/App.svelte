<script>
  import { onMount, onDestroy } from 'svelte'
  import MapCanvas from './components/MapCanvas.svelte'
  import ControlPanel from './components/ControlPanel.svelte'
  import Dashboard from './components/Dashboard.svelte'
  import presets from '../data/presets.json'
  
  let districts = []
  let boundary = []
  let populationCenters = []
  let selectedDistrict = null
  let draggingPoint = null
  let history = []
  let animating = false
  
  const loadPreset = (event) => {
    const presetKey = event?.detail?.presetKey
    if (!presetKey) return
    
    const preset = presets[presetKey]
    if (!preset) return
    
    const newDistricts = JSON.parse(JSON.stringify(preset.districts))
    const newBoundary = JSON.parse(JSON.stringify(preset.boundary))
    const newPopulationCenters = JSON.parse(JSON.stringify(preset.populationCenters))
    
    if (districts.length > 0) {
      saveToHistory()
    }
    
    districts = newDistricts
    boundary = newBoundary
    populationCenters = newPopulationCenters
    selectedDistrict = null
    draggingPoint = null
  }
  
  const saveToHistory = () => {
    history.push({
      districts: JSON.parse(JSON.stringify(districts)),
      boundary: JSON.parse(JSON.stringify(boundary)),
      populationCenters: JSON.parse(JSON.stringify(populationCenters))
    })
    if (history.length > 50) history.shift()
  }
  
  const undo = () => {
    if (history.length > 0) {
      const prevState = history.pop()
      districts = prevState.districts
      boundary = prevState.boundary
      populationCenters = prevState.populationCenters
      selectedDistrict = null
      draggingPoint = null
    }
  }
  
  const selectDistrict = (event) => {
    selectedDistrict = event?.detail?.districtId
  }
  
  const handleStartDrag = (event) => {
    saveToHistory()
  }
  
  const handlePointDrag = (event) => {
    const { districtId, pointIndex, newPos } = event?.detail || {}
    if (!animating && districtId != null && pointIndex != null && newPos) {
      const districtIndex = districts.findIndex(d => d.id === districtId)
      if (districtIndex !== -1) {
        const newDistricts = [...districts]
        const district = { ...newDistricts[districtIndex] }
        const newPolygon = [...district.polygon]
        newPolygon[pointIndex] = newPos
        district.polygon = newPolygon
        newDistricts[districtIndex] = district
        districts = newDistricts
      }
    }
  }
  
  const handleCenterMove = (event) => {
    const { index, newPos } = event?.detail || {}
    if (index != null && newPos) {
      populationCenters = populationCenters.map((c, i) => {
        if (i === index) {
          return { ...c, ...newPos }
        }
        return c
      })
    }
  }
  
  const toggleAnimation = () => {
    animating = !animating
  }
  
  const calculateMetrics = () => {
    const totalPopulation = districts.reduce((sum, d) => sum + d.population, 0)
    const avgPopulation = totalPopulation / districts.length
    
    let compactnessSum = 0
    let fairnessSum = 0
    
    districts.forEach(district => {
      const area = polygonArea(district.polygon)
      const perimeter = polygonPerimeter(district.polygon)
      const compactness = (4 * Math.PI * area) / (perimeter * perimeter)
      compactnessSum += compactness
      
      const deviation = Math.abs(district.population - avgPopulation) / avgPopulation
      fairnessSum += deviation
    })
    
    const avgCompactness = compactnessSum / districts.length
    const fairness = 1 - (fairnessSum / districts.length)
    
    return {
      totalPopulation,
      avgPopulation,
      avgCompactness,
      fairness,
      gerrymanderingRisk: 1 - avgCompactness
    }
  }
  
  const polygonArea = (polygon) => {
    let area = 0
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length
      area += polygon[i][0] * polygon[j][1]
      area -= polygon[j][0] * polygon[i][1]
    }
    return Math.abs(area / 2)
  }
  
  const polygonPerimeter = (polygon) => {
    let perimeter = 0
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length
      const dx = polygon[i][0] - polygon[j][0]
      const dy = polygon[i][1] - polygon[j][1]
      perimeter += Math.sqrt(dx * dx + dy * dy)
    }
    return perimeter
  }
  
  onMount(() => {
    loadPreset('preset1')
  })
  
  onDestroy(() => {})
</script>

<div class="app-container">
  <header class="header">
    <h1>计算几何选区划分工具</h1>
    <p class="subtitle">交互式选区边界编辑与公平性分析</p>
  </header>
  
  <div class="main-content">
    <div class="map-container">
      <MapCanvas
        {districts}
        {boundary}
        {populationCenters}
        {selectedDistrict}
        {animating}
        on:selectDistrict={selectDistrict}
        on:startDrag={handleStartDrag}
        on:pointDrag={handlePointDrag}
        on:centerMove={handleCenterMove}
      />
    </div>
    
    <div class="sidebar">
      <ControlPanel
        {districts}
        {selectedDistrict}
        on:loadPreset={loadPreset}
        on:undo={undo}
        on:toggleAnimation={toggleAnimation}
      />
      
      <Dashboard
        metrics={calculateMetrics()}
        {districts}
        {populationCenters}
        {animating}
      />
    </div>
  </div>
</div>

<style>
  .app-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #ffffff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .header {
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .header h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 4px;
    background: linear-gradient(90deg, #06b6d4, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .main-content {
    flex: 1;
    display: flex;
    gap: 20px;
    padding: 20px;
    overflow: hidden;
  }
  
  .map-container {
    flex: 1;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .sidebar {
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }
</style>
