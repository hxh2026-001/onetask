import { createSignal, createEffect, onMount, onCleanup, For } from 'solid-js';
import { CanvasRenderer } from '~/lib/renderer';
import { GraphData, PathResult, dijkstra, astar, euclideanDistance, misleadingHeuristic, badHeuristic } from '~/lib/graph';
import { MazeConfig, DynamicObstacleManager, getAllPresets, createNegativeCycleTrap, createBridgeNodeCutoff, createSparseGraphDeadEnd, createMisleadingHeuristic } from '~/lib/maze';

interface AlgorithmResult {
  name: string;
  result: PathResult;
  time: number;
  nodesVisited: number;
  heuristic?: string;
}

export default function App() {
  let canvasRef: HTMLCanvasElement | undefined;
  let renderer: CanvasRenderer | undefined;
  
  const [currentMaze, setCurrentMaze] = createSignal<MazeConfig | null>(null);
  const [graph, setGraph] = createSignal<GraphData | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = createSignal<'dijkstra' | 'astar'>('dijkstra');
  const [selectedHeuristic, setSelectedHeuristic] = createSignal<'euclidean' | 'misleading' | 'bad'>('euclidean');
  const [isRunning, setIsRunning] = createSignal(false);
  const [pathResult, setPathResult] = createSignal<PathResult | null>(null);
  const [selectedEdge, setSelectedEdge] = createSignal<{ from: number; to: number } | null>(null);
  const [edgeWeight, setEdgeWeight] = createSignal(1);
  const [animationSpeed, setAnimationSpeed] = createSignal(100);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [algorithmResults, setAlgorithmResults] = createSignal<AlgorithmResult[]>([]);
  const [showComparison, setShowComparison] = createSignal(false);
  const [showFog, setShowFog] = createSignal(true);
  const [showStatsPanel, setShowStatsPanel] = createSignal(true);
  const [loadingProgress, setLoadingProgress] = createSignal({ current: 0, total: 100, message: '' });
  
  const obstacleManager = new DynamicObstacleManager();
  const presets = getAllPresets();

  const loadPreset = (presetId: string) => {
    stopAnimation();
    setErrorMessage(null);
    setPathResult(null);
    setAlgorithmResults([]);
    obstacleManager.clear();
    
    let preset: MazeConfig;
    switch (presetId) {
      case 'negative-cycle':
        preset = createNegativeCycleTrap();
        break;
      case 'bridge-cutoff':
        preset = createBridgeNodeCutoff();
        break;
      case 'sparse-deadend':
        preset = createSparseGraphDeadEnd();
        break;
      case 'misleading-heuristic':
        preset = createMisleadingHeuristic();
        break;
      default:
        preset = createNegativeCycleTrap();
    }
    
    setCurrentMaze(preset);
    setGraph({ ...preset.graph });
    
    if (renderer) {
      renderer.clearEffects();
      if (showFog()) {
        renderer.initFog();
      }
    }
  };

  const runAlgorithm = async () => {
    if (!graph() || !currentMaze() || isRunning()) return;
    
    setIsRunning(true);
    setErrorMessage(null);
    setPathResult(null);
    setAlgorithmResults([]);
    setLoadingProgress({ current: 0, total: 100, message: '初始化...' });
    
    const currentGraph = obstacleManager.applyToGraph(graph()!);
    
    if (showComparison()) {
      await runAlgorithmComparison(currentGraph);
    } else {
      await runSingleAlgorithm(currentGraph);
    }
    
    setLoadingProgress({ current: 0, total: 100, message: '' });
    setIsRunning(false);
  };

  const runSingleAlgorithm = async (currentGraph: GraphData) => {
    const algoName = selectedAlgorithm() === 'dijkstra' ? 'Dijkstra' : 'A*';
    setLoadingProgress({ current: 10, total: 100, message: `正在执行 ${algoName}...` });
    
    const startTime = performance.now();
    const visitedOrder: number[] = [];
    
    const heuristic = selectedHeuristic() === 'euclidean' 
      ? euclideanDistance 
      : selectedHeuristic() === 'misleading'
        ? misleadingHeuristic
        : badHeuristic;
    
    setLoadingProgress({ current: 20, total: 100, message: `执行 ${algoName} 搜索中...` });
    
    const result = selectedAlgorithm() === 'dijkstra'
      ? dijkstra(currentGraph, currentMaze()!.startNode, currentMaze()!.endNode, (nodeId) => {
          visitedOrder.push(nodeId);
        })
      : astar(currentGraph, currentMaze()!.startNode, currentMaze()!.endNode, heuristic, (nodeId) => {
          visitedOrder.push(nodeId);
        });
    
    const endTime = performance.now();
    
    setLoadingProgress({ current: 50, total: 100, message: '计算完成，正在准备动画...' });
    
    setAlgorithmResults([{
      name: algoName,
      result,
      time: endTime - startTime,
      nodesVisited: visitedOrder.length,
      heuristic: selectedAlgorithm() === 'astar' ? selectedHeuristic() : undefined
    }]);
    
    setLoadingProgress({ current: 60, total: 100, message: '播放节点遍历动画...' });
    await animateVisited(visitedOrder, currentGraph);
    
    setLoadingProgress({ current: 80, total: 100, message: '播放路径动画...' });
    
    if (result.crashed) {
      setErrorMessage(result.error || '算法崩溃！');
    }
    
    if (result.path.length > 0 && !result.crashed) {
      await animatePath(result.path, currentGraph);
      const endNode = currentGraph.nodes.find(n => n.id === currentMaze()!.endNode);
      if (endNode && renderer) {
        setTimeout(() => renderer!.addFireworks(endNode.x, endNode.y), 300);
      }
    } else if (!result.crashed) {
      setErrorMessage('未找到路径！');
    }
    
    setLoadingProgress({ current: 100, total: 100, message: '完成' });
    setPathResult(result);
  };

  const runAlgorithmComparison = async (currentGraph: GraphData) => {
    const results: AlgorithmResult[] = [];
    
    setLoadingProgress({ current: 5, total: 100, message: '开始算法对比...' });
    
    setLoadingProgress({ current: 10, total: 100, message: '执行 Dijkstra 算法...' });
    const dijkstraStartTime = performance.now();
    const dijkstraVisited: number[] = [];
    const dijkstraResult = dijkstra(currentGraph, currentMaze()!.startNode, currentMaze()!.endNode, (nodeId) => {
      dijkstraVisited.push(nodeId);
    });
    const dijkstraEndTime = performance.now();
    
    results.push({
      name: 'Dijkstra',
      result: dijkstraResult,
      time: dijkstraEndTime - dijkstraStartTime,
      nodesVisited: dijkstraVisited.length
    });
    
    setLoadingProgress({ current: 25, total: 100, message: 'Dijkstra 完成，耗时 ' + (dijkstraEndTime - dijkstraStartTime).toFixed(2) + 'ms' });
    
    const heuristics = [
      { name: 'euclidean', label: '欧氏距离' },
      { name: 'misleading', label: '误导性' },
      { name: 'bad', label: '零启发' }
    ];
    
    let step = 35;
    for (const h of heuristics) {
      setLoadingProgress({ current: step, total: 100, message: `执行 A* (${h.label})...` });
      
      const heuristicFn = h.name === 'euclidean' ? euclideanDistance : 
                         h.name === 'misleading' ? misleadingHeuristic : badHeuristic;
      
      const astarStartTime = performance.now();
      const astarVisited: number[] = [];
      const astarResult = astar(currentGraph, currentMaze()!.startNode, currentMaze()!.endNode, heuristicFn, (nodeId) => {
        astarVisited.push(nodeId);
      });
      const astarEndTime = performance.now();
      
      results.push({
        name: `A* (${h.label})`,
        result: astarResult,
        time: astarEndTime - astarStartTime,
        nodesVisited: astarVisited.length,
        heuristic: h.name
      });
      
      step += 15;
      setLoadingProgress({ current: step, total: 100, message: `A* (${h.label}) 完成，耗时 ${(astarEndTime - astarStartTime).toFixed(2)}ms` });
    }
    
    setLoadingProgress({ current: 75, total: 100, message: '正在准备可视化数据...' });
    setAlgorithmResults(results);
    
    const bestResult = results.filter(r => !r.result.crashed && r.result.path.length > 0)
      .reduce((best, current) => current.result.distance < best.result.distance ? current : best, results[0]);
    
    const allVisited = [...new Set([
      ...dijkstraVisited,
      ...results.filter(r => r.name.startsWith('A*')).flatMap(r => {
        const visited: number[] = [];
        astar(currentGraph, currentMaze()!.startNode, currentMaze()!.endNode, 
          r.heuristic === 'euclidean' ? euclideanDistance : 
          r.heuristic === 'misleading' ? misleadingHeuristic : badHeuristic, 
          (nodeId) => visited.push(nodeId));
        return visited;
      })
    ])];
    
    setLoadingProgress({ current: 80, total: 100, message: '播放节点遍历动画...' });
    await animateVisited(allVisited, currentGraph);
    
    setLoadingProgress({ current: 90, total: 100, message: '播放路径动画...' });
    
    if (bestResult && !bestResult.result.crashed) {
      await animatePath(bestResult.result.path, currentGraph);
      const endNode = currentGraph.nodes.find(n => n.id === currentMaze()!.endNode);
      if (endNode && renderer) {
        setTimeout(() => renderer!.addFireworks(endNode.x, endNode.y), 300);
      }
    }
    
    const crashedCount = results.filter(r => r.result.crashed).length;
    if (crashedCount === results.length) {
      setErrorMessage('所有算法均崩溃！');
    }
    
    setLoadingProgress({ current: 100, total: 100, message: '对比完成' });
    setPathResult(bestResult?.result || null);
  };

  const animateVisited = async (visited: number[], currentGraph: GraphData): Promise<void> => {
    if (!renderer) return;
    
    const delay = Math.max(10, animationSpeed());
    
    for (let i = 0; i < visited.length; i++) {
      const nodeId = visited[i];
      const node = currentGraph.nodes.find(n => n.id === nodeId);
      
      if (node && renderer) {
        renderer.setVisitedNodes(visited.slice(0, i + 1));
        
        if (showFog()) {
          renderer.clearFogAroundNode(node, 80);
        }
        
        renderer.addRipple(node.x, node.y, 'rgba(59, 130, 246, 1)');
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const animatePath = async (path: number[], currentGraph: GraphData): Promise<void> => {
    if (!renderer) return;
    
    const delay = Math.max(30, animationSpeed() * 2);
    
    for (let i = 0; i <= path.length; i++) {
      renderer!.setCurrentPath(path.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const stopAnimation = () => {
    setIsRunning(false);
    if (renderer) {
      renderer.clearEffects();
      renderer.setVisitedNodes([]);
      renderer.setCurrentPath([]);
    }
    setPathResult(null);
    setErrorMessage(null);
    setAlgorithmResults([]);
  };

  const updateEdgeWeight = () => {
    if (!selectedEdge() || !graph()) return;
    
    const { from, to } = selectedEdge()!;
    const newWeight = edgeWeight();
    
    setGraph(prev => {
      if (!prev) return null;
      
      const newEdges = prev.edges.map(edge => {
        if ((edge.from === from && edge.to === to) || 
            (edge.from === to && edge.to === from)) {
          return { ...edge, weight: newWeight };
        }
        return edge;
      });
      
      return { ...prev, edges: newEdges };
    });
    
    if (renderer) {
      renderer.addEdgePulse(from, to);
    }
  };

  const toggleBridgeNode = (nodeId: number) => {
    if (!graph()) return;
    
    const isObstacle = graph()!.nodes.find(n => n.id === nodeId)?.isObstacle;
    
    if (isObstacle) {
      obstacleManager.removeNodeObstacle(nodeId);
    } else {
      obstacleManager.addNodeObstacle(nodeId);
    }
    
    setGraph(prev => {
      if (!prev) return null;
      return obstacleManager.applyToGraph(prev);
    });
    
    if (renderer && graph()) {
      const node = graph()!.nodes.find(n => n.id === nodeId);
      if (node) {
        renderer.addRipple(node.x, node.y, 'rgba(239, 68, 68, 1)');
      }
    }
  };

  const handleCanvasClick = (e: MouseEvent) => {
    if (!canvasRef || !graph()) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const nodes = graph()!.nodes;
    for (const node of nodes) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < 20) {
        if (!node.isStart && !node.isEnd) {
          toggleBridgeNode(node.id);
        }
        return;
      }
    }
    
    const edges = graph()!.edges;
    for (const edge of edges) {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) continue;
      
      const lineLen = Math.sqrt((toNode.x - fromNode.x) ** 2 + (toNode.y - fromNode.y) ** 2);
      const t = Math.max(0, Math.min(1, ((x - fromNode.x) * (toNode.x - fromNode.x) + (y - fromNode.y) * (toNode.y - fromNode.y)) / (lineLen * lineLen)));
      
      const closestX = fromNode.x + t * (toNode.x - fromNode.x);
      const closestY = fromNode.y + t * (toNode.y - fromNode.y);
      const dist = Math.sqrt((closestX - x) ** 2 + (closestY - y) ** 2);
      
      if (dist < 10) {
        setSelectedEdge({ from: edge.from, to: edge.to });
        setEdgeWeight(edge.weight);
        return;
      }
    }
    
    setSelectedEdge(null);
  };

  onMount(() => {
    if (canvasRef) {
      renderer = new CanvasRenderer(canvasRef);
      if (showFog()) {
        renderer.initFog();
      }
      
      const defaultPreset = createNegativeCycleTrap();
      setCurrentMaze(defaultPreset);
      setGraph(defaultPreset.graph);
      
      renderer.startAnimationLoop(defaultPreset.graph);
      
      canvasRef.addEventListener('click', handleCanvasClick);
      
      window.addEventListener('resize', () => {
        renderer?.resize();
      });
    }
  });

  onCleanup(() => {
    if (renderer) {
      renderer.stopAnimationLoop();
    }
    if (canvasRef) {
      canvasRef.removeEventListener('click', handleCanvasClick);
    }
  });

  createEffect(() => {
    if (renderer && graph()) {
      renderer.stopAnimationLoop();
      renderer.startAnimationLoop(graph()!);
    }
  });

  createEffect(() => {
    if (renderer) {
      if (showFog()) {
        renderer.initFog();
      } else {
        renderer.clearEffects();
      }
    }
  });

  return (
    <div class="flex h-screen w-screen bg-gray-900 overflow-hidden">
      <div class="flex-1 relative">
        <canvas
          ref={canvasRef}
          class="w-full h-full cursor-crosshair"
        />
        
        <div class="absolute top-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 max-w-md">
          <h1 class="text-xl font-bold text-amber-400 mb-2">Labyrinth Weave</h1>
          <p class="text-sm text-gray-300">
            {currentMaze()?.name}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {currentMaze()?.description}
          </p>
        </div>
        
        {errorMessage() && (
          <div class="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            ⚠️ {errorMessage()}
          </div>
        )}
        
        {isRunning() && (
          <div class="absolute top-4 right-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 min-w-80">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm font-semibold text-amber-400">处理中...</span>
            </div>
            <div class="text-sm text-gray-300 mb-2">{loadingProgress().message}</div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(loadingProgress().current / loadingProgress().total) * 100}%` }}
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1 text-right">
              {Math.round((loadingProgress().current / loadingProgress().total) * 100)}%
            </div>
          </div>
        )}
        
        {showStatsPanel() && algorithmResults().length > 0 && (
          <div class="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 min-w-80">
            <h3 class="text-sm font-bold text-amber-400 mb-3">📊 算法统计</h3>
            <div class="space-y-2">
              <For each={algorithmResults()}>
                {(algo) => (
                  <div class={`p-2 rounded ${algo.result.crashed ? 'bg-red-900/50' : algo.result.path.length > 0 ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-semibold text-white">{algo.name}</span>
                      {algo.result.crashed && (
                        <span class="text-xs text-red-400">崩溃</span>
                      )}
                      {!algo.result.crashed && algo.result.path.length === 0 && (
                        <span class="text-xs text-yellow-400">无解</span>
                      )}
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span class="text-gray-400">时间:</span>
                        <span class="text-blue-400 ml-1">{algo.time.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span class="text-gray-400">节点:</span>
                        <span class="text-amber-400 ml-1">{algo.nodesVisited}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">权重:</span>
                        <span class="text-green-400 ml-1">{algo.result.distance.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
            
            {algorithmResults().length > 1 && (
              <div class="mt-3 pt-3 border-t border-gray-700">
                <div class="text-xs text-gray-400 mb-2">🏆 最优算法</div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-green-400">
                    {algorithmResults().filter(r => !r.result.crashed && r.result.path.length > 0)
                      .reduce((best, curr) => curr.result.distance < best.result.distance ? curr : best, algorithmResults()[0])?.name}
                  </span>
                  <span class="text-xs text-gray-500">
                    (权重最小)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedEdge() && (
          <div class="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 w-64">
            <h3 class="text-sm font-bold text-amber-400 mb-2">边权重调整</h3>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs text-gray-400">边:</span>
              <span class="text-sm text-white">
                {selectedEdge()!.from} → {selectedEdge()!.to}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={edgeWeight()}
                onInput={(e) => setEdgeWeight(Number(e.target.value))}
                class="flex-1"
              />
              <span class="text-sm font-mono w-8 text-center">
                {edgeWeight()}
              </span>
            </div>
            <button
              onClick={updateEdgeWeight}
              disabled={isRunning()}
              class="mt-2 w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 text-white text-sm py-1 px-3 rounded transition-colors"
            >
              应用权重
            </button>
          </div>
        )}
      </div>

      <div class="w-80 bg-gray-800 p-4 overflow-y-auto">
        <div class="mb-6">
          <h2 class="text-lg font-bold text-amber-400 mb-3">预设迷宫</h2>
          <div class="space-y-2">
            <For each={presets}>
              {(preset) => (
                <button
                  onClick={() => loadPreset(preset.id)}
                  disabled={isRunning()}
                  class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    currentMaze()?.id === preset.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  {preset.name}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="mb-6">
          <h2 class="text-lg font-bold text-amber-400 mb-3">算法选择</h2>
          <div class="space-y-2">
            <button
              onClick={() => setSelectedAlgorithm('dijkstra')}
              disabled={isRunning()}
              class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedAlgorithm() === 'dijkstra'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              Dijkstra 算法
            </button>
            <button
              onClick={() => setSelectedAlgorithm('astar')}
              disabled={isRunning()}
              class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedAlgorithm() === 'astar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              A* 算法
            </button>
          </div>
        </div>

        {selectedAlgorithm() === 'astar' && (
          <div class="mb-6">
            <h2 class="text-lg font-bold text-amber-400 mb-3">启发函数</h2>
            <div class="space-y-2">
              <button
                onClick={() => setSelectedHeuristic('euclidean')}
                disabled={isRunning()}
                class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedHeuristic() === 'euclidean'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                欧氏距离 (正常)
              </button>
              <button
                onClick={() => setSelectedHeuristic('misleading')}
                disabled={isRunning()}
                class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedHeuristic() === 'misleading'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                误导性启发 (绕远路)
              </button>
              <button
                onClick={() => setSelectedHeuristic('bad')}
                disabled={isRunning()}
                class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedHeuristic() === 'bad'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                零启发 (退化为BFS)
              </button>
            </div>
          </div>
        )}

        <div class="mb-6">
          <h2 class="text-lg font-bold text-amber-400 mb-3">动画速度</h2>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">快</span>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={animationSpeed()}
              onInput={(e) => setAnimationSpeed(Number(e.target.value))}
              class="flex-1"
            />
            <span class="text-xs text-gray-400">慢</span>
          </div>
        </div>

        <div class="mb-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFog()}
              onChange={(e) => setShowFog(e.target.checked)}
              class="w-4 h-4"
            />
            <span class="text-sm text-gray-300">显示迷雾效果</span>
          </label>
        </div>

        <div class="mb-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showComparison()}
              onChange={(e) => setShowComparison(e.target.checked)}
              class="w-4 h-4"
            />
            <span class="text-sm text-gray-300">算法对比模式</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">
            同时运行 Dijkstra 和所有 A* 变体进行对比
          </p>
        </div>

        <div class="mb-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStatsPanel()}
              onChange={(e) => setShowStatsPanel(e.target.checked)}
              class="w-4 h-4"
            />
            <span class="text-sm text-gray-300">显示统计面板</span>
          </label>
        </div>

        <div class="space-y-3 mb-6">
          <button
            onClick={runAlgorithm}
            disabled={isRunning() || !graph()}
            class="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {isRunning() ? '运行中...' : showComparison() ? '▶ 运行所有算法' : '▶ 开始寻路'}
          </button>
          <button
            onClick={stopAnimation}
            disabled={!isRunning() && !pathResult()}
            class="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            ⟳ 重置
          </button>
        </div>

        <div class="mb-6">
          <h2 class="text-lg font-bold text-amber-400 mb-3">动态障碍物</h2>
          <p class="text-xs text-gray-400 mb-2">
            点击图中的节点可切换为障碍物状态（切断连接）
          </p>
          {graph() && (
            <div class="text-xs text-gray-500">
              当前障碍物数量: {graph()!.nodes.filter(n => n.isObstacle).length}
            </div>
          )}
        </div>

        <div class="mb-6">
          <h2 class="text-lg font-bold text-amber-400 mb-3">图例</h2>
          <div class="space-y-1 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-green-500"></div>
              <span class="text-gray-300">起点 (S)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-red-500"></div>
              <span class="text-gray-300">终点 (E)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-blue-500"></div>
              <span class="text-gray-300">已访问节点</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-amber-500"></div>
              <span class="text-gray-300">最短路径</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-purple-500"></div>
              <span class="text-gray-300">负权重边</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-red-700"></div>
              <span class="text-gray-300">障碍物节点</span>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-4">
          <h2 class="text-sm font-bold text-amber-400 mb-2">操作提示</h2>
          <ul class="text-xs text-gray-400 space-y-1">
            <li>• 点击节点可切换为障碍物</li>
            <li>• 点击边可调整权重</li>
            <li>• 负权重可能导致算法崩溃</li>
            <li>• 动态障碍物会触发重计算</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
