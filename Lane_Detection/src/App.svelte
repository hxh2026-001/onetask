<script lang="ts">
  import { get } from 'svelte/store'
  import { detectionResult, currentStage, isDetecting, params, activePreset } from './lib/stores'
  import DrawingCanvas from './lib/DrawingCanvas.svelte'
  import PresetBar from './lib/PresetBar.svelte'
  import VisualizationPanel from './lib/VisualizationPanel.svelte'
  import ParticleCanvas from './lib/ParticleCanvas.svelte'
  import ScanLineCanvas from './lib/ScanLineCanvas.svelte'
  import ErrorHighlightCanvas from './lib/ErrorHighlightCanvas.svelte'
  import ParameterPanel from './lib/ParameterPanel.svelte'
  import DataPanel from './lib/DataPanel.svelte'

  const CANVAS_W = 640
  const CANVAS_H = 400

  let drawingCanvasRef: any = null
  let result: any = null
  let detecting = false
  let currentPreset: string | null = null

  detectionResult.subscribe((v) => { result = v })
  isDetecting.subscribe((v) => { detecting = v })
  activePreset.subscribe((v) => { currentPreset = v })

  async function handleDetect() {
    if (!drawingCanvasRef) return
    const pixels = drawingCanvasRef.getPixels()
    if (!pixels) return

    isDetecting.set(true)
    detectionResult.set(null)
    currentStage.set(0)

    const currentParams = get(params)

    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixels: Array.from(pixels),
          width: CANVAS_W,
          height: CANVAS_H,
          params: currentParams,
          presetName: currentPreset
        })
      })
      const data = await res.json()
      detectionResult.set(data)
    } catch (err) {
      console.error('Detection failed:', err)
    } finally {
      isDetecting.set(false)
    }
  }

  $: accData = result?.accumulator ?? []
  $: rhoBins = result?.rhoBins ?? 0
  $: thetaBins = result?.thetaBins ?? 0
  $: lines = result?.lines ?? []
  $: edges = result?.edges ?? []
</script>

<div class="app-layout">
  <header class="title-bar">
    <h1 class="title">
      <span class="accent">极坐标</span>霍夫变换参数空间可视化系统
    </h1>
  </header>

  <div class="main-content">
    <div class="left-panel">
      <div class="canvas-container" style="width: {CANVAS_W}px; height: {CANVAS_H}px;">
        <DrawingCanvas bind:this={drawingCanvasRef} width={CANVAS_W} height={CANVAS_H} />
        <div class="overlay-canvases">
          <VisualizationPanel
            canvasWidth={CANVAS_W}
            canvasHeight={CANVAS_H}
            {edges}
            accumulator={accData}
            {rhoBins}
            {thetaBins}
            {lines}
          />
          <ParticleCanvas
            width={CANVAS_W}
            height={CANVAS_H}
            accumulator={accData}
            {rhoBins}
            {thetaBins}
          />
          <ScanLineCanvas
            width={CANVAS_W}
            height={CANVAS_H}
            {lines}
          />
          <ErrorHighlightCanvas
            width={CANVAS_W}
            height={CANVAS_H}
            {lines}
          />
        </div>
      </div>
    </div>

    <div class="right-panel">
      <ParameterPanel onDetect={handleDetect} isDetecting={detecting} />
      <DataPanel />
    </div>
  </div>

  <footer class="bottom-bar">
    <PresetBar drawingCanvas={drawingCanvasRef} />
  </footer>
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 12px 20px;
    gap: 10px;
  }

  .title-bar {
    text-align: center;
    padding: 6px 0;
  }

  .title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 2px;
  }

  .accent {
    color: var(--accent-cyan);
  }

  .main-content {
    display: flex;
    gap: 16px;
    flex: 1;
    min-height: 0;
  }

  .left-panel {
    flex: 0 0 65%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .canvas-container {
    position: relative;
  }

  .overlay-canvases {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none !important;
    z-index: 10;
  }

  .right-panel {
    flex: 0 0 35%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  .bottom-bar {
    padding: 4px 0;
  }
</style>
