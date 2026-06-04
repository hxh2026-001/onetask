import { createSignal, createEffect, onMount, For } from 'solid-js';
import { getPresets, getPreset, solveConstraints, analyzeConstraints } from './api.js';
import Canvas from './components/Canvas.jsx';
import ResidualChart from './components/ResidualChart.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import Toolbar from './components/Toolbar.jsx';

let nextElementId = 100;
let nextConstraintId = 100;

export default function App() {
  const [presets, setPresets] = createSignal([]);
  const [activePreset, setActivePreset] = createSignal(null);
  const [elements, setElements] = createSignal([]);
  const [constraints, setConstraints] = createSignal([]);
  const [solveResult, setSolveResult] = createSignal(null);
  const [analysis, setAnalysis] = createSignal(null);
  const [isSolving, setIsSolving] = createSignal(false);
  const [currentIteration, setCurrentIteration] = createSignal(0);
  const [showSearchPath, setShowSearchPath] = createSignal(true);
  const [showSkeleton, setShowSkeleton] = createSignal(true);
  const [sceneName, setSceneName] = createSignal('未命名场景');
  const [selectedElement, setSelectedElement] = createSignal(null);
  const [selectedElementIds, setSelectedElementIds] = createSignal(new Set());

  onMount(async () => {
    const presetList = await getPresets();
    setPresets(presetList.filter(p => 
      ['over-constrained', 'under-constrained', 'conflicting', 'cyclic'].includes(p.type)
    ));
  });

  async function loadPreset(presetType) {
    setIsSolving(false);
    setSolveResult(null);
    setCurrentIteration(0);
    
    const preset = await getPreset(presetType);
    if (preset) {
      setActivePreset(presetType);
      setElements(preset.elements);
      setConstraints(preset.constraints);
      setSceneName(preset.name);
      
      const analysisResult = await analyzeConstraints(preset.elements, preset.constraints);
      setAnalysis(analysisResult);
    }
  }

  async function handleSolve() {
    if (isSolving()) return;
    
    setIsSolving(true);
    setCurrentIteration(0);
    
    try {
      const result = await solveConstraints(elements(), constraints());
      setSolveResult(result);
      
      if (result.success && result.elements) {
        setElements(result.elements);
      }
      
      const analysisResult = await analyzeConstraints(elements(), constraints());
      setAnalysis(analysisResult);
      
      setCurrentIteration(result.iterations || 0);
    } catch (error) {
      console.error('求解失败:', error);
    } finally {
      setIsSolving(false);
    }
  }

  function handleReset() {
    if (activePreset()) {
      loadPreset(activePreset());
    } else {
      setSolveResult(null);
      setCurrentIteration(0);
    }
  }

  function handleElementUpdate(updatedElements) {
    setElements(updatedElements);
    setSolveResult(null);
    setCurrentIteration(0);
  }

  function handleSelect(elem) {
    setSelectedElement(elem);
  }

  const selectedElements = () => {
    const ids = selectedElementIds();
    return elements().filter(e => ids.has(e.id));
  };

  function handleElementSelect(elem) {
    const newSelected = new Set(selectedElementIds());
    if (newSelected.has(elem.id)) {
      newSelected.delete(elem.id);
    } else {
      newSelected.add(elem.id);
    }
    setSelectedElementIds(newSelected);
    setSelectedElement(elem);
  }

  function handleCreate(type) {
    const centerX = 400 + Math.random() * 100 - 50;
    const centerY = 300 + Math.random() * 100 - 50;
    const newElements = [...elements()];
    
    if (type === 'point') {
      const id = nextElementId++;
      newElements.push({
        id,
        type: 'point',
        label: `P${id}`,
        params: { x: centerX, y: centerY, fixed: false }
      });
    } else if (type === 'line') {
      const p1Id = nextElementId++;
      const p2Id = nextElementId++;
      const lineId = nextElementId++;
      newElements.push(
        {
          id: p1Id,
          type: 'point',
          label: `P${p1Id}`,
          params: { x: centerX - 50, y: centerY, fixed: false }
        },
        {
          id: p2Id,
          type: 'point',
          label: `P${p2Id}`,
          params: { x: centerX + 50, y: centerY, fixed: false }
        },
        {
          id: lineId,
          type: 'line',
          label: `L${lineId}`,
          params: { startPointId: p1Id, endPointId: p2Id }
        }
      );
    } else if (type === 'circle') {
      const centerId = nextElementId++;
      const circleId = nextElementId++;
      newElements.push(
        {
          id: centerId,
          type: 'point',
          label: `P${centerId}`,
          params: { x: centerX, y: centerY, fixed: false }
        },
        {
          id: circleId,
          type: 'circle',
          label: `C${circleId}`,
          params: { centerId, radius: 60 }
        }
      );
    }
    
    setElements(newElements);
    setSolveResult(null);
    setCurrentIteration(0);
    setActivePreset(null);
    setSceneName('自定义场景');
  }

  function handleAddConstraint(constraintData) {
    const newConstraints = [...constraints(), {
      id: nextConstraintId++,
      ...constraintData
    }];
    setConstraints(newConstraints);
    setSolveResult(null);
    setCurrentIteration(0);
  }

  function handleDeleteSelected() {
    const toDelete = selectedElementIds();
    if (toDelete.size === 0) return;
    
    const newElements = elements().filter(e => !toDelete.has(e.id));
    
    const newConstraints = constraints().filter(c => 
      !c.elementIds.some(id => toDelete.has(id))
    );
    
    setElements(newElements);
    setConstraints(newConstraints);
    setSelectedElementIds(new Set());
    setSelectedElement(null);
    setSolveResult(null);
    setCurrentIteration(0);
  }

  function handleDeleteConstraint(constraintId) {
    const newConstraints = constraints().filter(c => c.id !== constraintId);
    setConstraints(newConstraints);
    setSolveResult(null);
    setCurrentIteration(0);
  }

  function handleContextMenu(elem, x, y) {
    const actions = [
      { label: '删除元素', action: () => {
        const toDelete = new Set([elem.id]);
        const newElements = elements().filter(e => !toDelete.has(e.id));
        const newConstraints = constraints().filter(c => 
          !c.elementIds.some(id => toDelete.has(id))
        );
        setElements(newElements);
        setConstraints(newConstraints);
      }},
      { label: '切换固定状态', action: () => {
        if (elem.type === 'point') {
          const newElements = elements().map(e => {
            if (e.id === elem.id) {
              return { ...e, params: { ...e.params, fixed: !e.params.fixed } };
            }
            return e;
          });
          setElements(newElements);
        }
      }, show: elem.type === 'point' }
    ];
    
    const choice = prompt(
      `对 ${elem.label || elem.id} 执行操作:\n` +
      actions.filter(a => a.show !== false).map((a, i) => `${i + 1}. ${a.label}`).join('\n')
    );
    
    if (choice) {
      const idx = parseInt(choice) - 1;
      const validActions = actions.filter(a => a.show !== false);
      if (idx >= 0 && idx < validActions.length) {
        validActions[idx].action();
      }
    }
  }

  async function reanalyze() {
    if (elements().length > 0) {
      try {
        const analysisResult = await analyzeConstraints(elements(), constraints());
        setAnalysis(analysisResult);
      } catch (e) {
        console.error('分析失败:', e);
      }
    }
  }

  createEffect(() => {
    const timer = setTimeout(() => {
      reanalyze();
    }, 100);
    return () => clearTimeout(timer);
  });

  const systemStatus = () => {
    if (!analysis()) return 'empty';
    return analysis().overallStatus;
  };

  const statusLabel = () => {
    const status = systemStatus();
    const labels = {
      'empty': '无场景',
      'well-constrained': '适定系统',
      'over-constrained': '过约束系统',
      'under-constrained': '欠约束系统',
      'conflicting': '矛盾约束',
      'cyclic': '循环依赖'
    };
    return labels[status] || status;
  };

  const statusColor = () => {
    const status = systemStatus();
    const colors = {
      'empty': 'empty',
      'well-constrained': 'satisfied',
      'over-constrained': 'warning',
      'under-constrained': 'iterating',
      'conflicting': 'unsatisfied',
      'cyclic': 'unsatisfied'
    };
    return colors[status] || 'unsatisfied';
  };

  return (
    <div class="app">
      <header class="header">
        <div>
          <h1>几何约束求解系统</h1>
          <div class="subtitle">基于图论与 Newton-Raphson 数值优化的约束传播求解器</div>
        </div>
        <div class="status-item">
          <span class={`status-dot ${statusColor()}`}></span>
          <span>{statusLabel()}</span>
        </div>
      </header>

      <aside class="sidebar">
        <h2>预设场景</h2>
        <For each={presets()}>
          {(preset, index) => (
            <button
              class={`preset-btn ${activePreset() === preset.type ? 'active' : ''}`}
              onClick={() => loadPreset(preset.type)}
            >
              <span class="preset-num">{index() + 1}</span>
              {preset.name.split('：')[1] || preset.name}
              <span class="preset-desc">{preset.description}</span>
            </button>
          )}
        </For>

        <h2 style="margin-top: 24px">显示控制</h2>
        <div class="slider-container">
          <label>
            <input
              type="checkbox"
              checked={showSkeleton()}
              onChange={(e) => setShowSkeleton(e.target.checked)}
              style="margin-right: 8px"
            />
            骨架抖动动画
          </label>
        </div>
        <div class="slider-container">
          <label>
            <input
              type="checkbox"
              checked={showSearchPath()}
              onChange={(e) => setShowSearchPath(e.target.checked)}
              style="margin-right: 8px"
            />
            可行域搜索路径
          </label>
        </div>
        
        {solveResult() && (
          <div class="slider-container">
            <label>迭代步骤: {currentIteration()} / {solveResult()?.iterations || 0}</label>
            <input
              type="range"
              min="0"
              max={solveResult()?.iterations || 0}
              value={currentIteration()}
              onChange={(e) => setCurrentIteration(parseInt(e.target.value))}
            />
          </div>
        )}
      </aside>

      <main class="canvas-container">
        <Toolbar
          onCreate={handleCreate}
          onAddConstraint={handleAddConstraint}
          onDeleteSelected={handleDeleteSelected}
          onSolve={handleSolve}
          onReset={handleReset}
          onClear={() => { setElements([]); setConstraints([]); setSolveResult(null); setActivePreset(null); setSelectedElementIds(new Set()); setSelectedElement(null); }}
          selectedElements={selectedElements()}
          isSolving={isSolving()}
          elements={elements()}
        />

        <Canvas
          elements={elements()}
          constraints={constraints()}
          solveResult={solveResult()}
          currentIteration={currentIteration()}
          showSearchPath={showSearchPath()}
          showSkeleton={showSkeleton()}
          onUpdate={handleElementUpdate}
          onSelect={handleElementSelect}
          onContextMenu={handleContextMenu}
        />

        <div class="status-bar">
          <div class="status-item">
            <span>场景:</span>
            <strong>{sceneName()}</strong>
          </div>
          <div class="status-item">
            <span>几何元素:</span>
            <strong>{elements().length}</strong>
          </div>
          <div class="status-item">
            <span>约束条件:</span>
            <strong>{constraints().length}</strong>
          </div>
          {analysis() && (
            <>
              <div class="status-item">
                <span>自由度:</span>
                <strong>{analysis().degreesOfFreedom?.totalDOF || 0}</strong>
              </div>
              <div class="status-item">
                <span>净自由度:</span>
                <strong class={analysis().degreesOfFreedom?.netDOF !== 0 ? 'text-warning' : ''}>
                  {analysis().degreesOfFreedom?.netDOF || 0}
                </strong>
              </div>
            </>
          )}
          {solveResult() && (
            <div class="status-item">
              <span>残差:</span>
              <strong>{solveResult()?.finalResidual?.toExponential(4) || 'N/A'}</strong>
            </div>
          )}
        </div>
      </main>

      <aside class="info-panel">
        <InfoPanel
          analysis={analysis()}
          solveResult={solveResult()}
          constraints={constraints()}
          elements={elements()}
          currentIteration={currentIteration()}
          onDeleteConstraint={handleDeleteConstraint}
        />
        
        {solveResult()?.residualHistory?.length > 0 && (
          <>
            <h2>收敛过程</h2>
            <ResidualChart 
              history={solveResult().residualHistory}
              currentIteration={currentIteration()}
            />
          </>
        )}
      </aside>
    </div>
  );
}
