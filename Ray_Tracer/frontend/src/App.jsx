import { createSignal, createEffect, onCleanup } from 'solid-js';
import { Scene, Renderer } from './core/renderer';
import './App.css';

function App() {
  const [sceneData, setSceneData] = createSignal(null);
  const [presets, setPresets] = createSignal(null);
  const [renderer, setRenderer] = createSignal(null);
  const [sampleCount, setSampleCount] = createSignal(0);
  const [fps, setFps] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  let canvasRef;

  let animationId;
  let lastTime = 0;
  let frameCount = 0;
  let currentScene = null;

  createEffect(async () => {
    try {
      const [sceneRes, presetsRes] = await Promise.all([
        fetch('/api/scene'),
        fetch('/api/presets')
      ]);
      const scene = await sceneRes.json();
      const presetsData = await presetsRes.json();
      setSceneData(scene);
      setPresets(presetsData);
      setIsLoading(false);
    } catch (err) {
      setError('加载场景失败，请确保后端服务已启动');
      setIsLoading(false);
    }
  });

  createEffect(() => {
    if (!sceneData() || !canvasRef) return;

    const width = Math.min(window.innerWidth - 320, 1200);
    const height = Math.min(window.innerHeight - 40, 800);
    canvasRef.width = width;
    canvasRef.height = height;

    currentScene = new Scene(sceneData());
    const newRenderer = new Renderer(width, height);
    setRenderer(newRenderer);
    setSampleCount(0);
  });

  createEffect(() => {
    if (!renderer() || !sceneData()) return;

    const ctx = canvasRef.getContext('2d');
    let lastFpsTime = performance.now();

    const render = (time) => {
      frameCount++;
      if (time - lastFpsTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsTime = time;
      }

      try {
        renderer().render(currentScene);
        setSampleCount(renderer().sampleCount);

        const imageData = ctx.createImageData(canvasRef.width, canvasRef.height);
        renderer().fillImageData(imageData);
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        console.error('渲染错误:', e);
        setError('渲染过程出现错误: ' + e.message);
        return;
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    onCleanup(() => {
      if (animationId) cancelAnimationFrame(animationId);
    });
  });

  const loadPreset = async (presetId) => {
    if (presetId === 'preset1') {
      const confirmed = window.confirm('⚠️ 该场景包含多个镜面反射球体，可能会导致大量递归计算。虽然已限制最大递归深度为 20 层，但仍可能造成页面短暂卡顿。是否继续加载？');
      if (!confirmed) {
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/preset/${presetId}`);
      const preset = await res.json();
      setSceneData(preset.scene);
      if (renderer()) {
        currentScene = new Scene(preset.scene);
        renderer().reset();
        setSampleCount(0);
      }
    } catch (err) {
      setError('加载预设场景失败');
    } finally {
      setIsLoading(false);
    }
  };

  const resetRender = () => {
    if (renderer()) {
      renderer().reset();
      setSampleCount(0);
    }
  };

  return (
    <div class="app">
      <div class="sidebar">
        <h1>实时光线追踪渲染器</h1>
        
        <div class="section">
          <h2>预设场景</h2>
          {presets() && Object.entries(presets()).map(([id, preset]) => (
            <button
              class="preset-button"
              onClick={() => loadPreset(id)}
              disabled={isLoading()}
            >
              {preset.name}
              <span class="description">{preset.description}</span>
            </button>
          ))}
        </div>

        <div class="section stats">
          <h2>渲染统计</h2>
          <div class="stat-item">
            <span class="label">采样数:</span>
            <span class="value">{sampleCount()}</span>
          </div>
          <div class="stat-item">
            <span class="label">FPS:</span>
            <span class="value">{fps()}</span>
          </div>
          <button class="reset-button" onClick={resetRender}>
            重置渲染
          </button>
        </div>

        <div class="section info">
          <h2>说明</h2>
          <p>点击左侧按钮加载不同的预设场景，观察各种光线追踪效果。</p>
          <ul>
            <li><strong>预设一:</strong> 展示无限递归反射，可触发调用栈溢出</li>
            <li><strong>预设二:</strong> 展示玻璃材质的折射和全内反射</li>
            <li><strong>预设三:</strong> 展示低采样数下的软阴影噪点</li>
            <li><strong>预设四:</strong> 展示 BVH 树失衡的性能问题</li>
          </ul>
        </div>
      </div>

      <div class="viewport">
        {error() && <div class="error">{error()}</div>}
        {isLoading() && <div class="loading">加载中...</div>}
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default App;
