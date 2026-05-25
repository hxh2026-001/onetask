import { Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import { CubeRenderer } from "./lib/renderer";
import {
  CubeState,
  Move,
  createSolvedState,
  isValidState,
} from "./lib/cube";
import { stateToIndex, stateToBinary } from "./lib/group";
import { ALL_PRESETS, getInvalidState, getMemoryOverflowState, PresetState } from "./lib/presets";

interface SearchResult {
  solution: Move[];
  nodes: number;
  time: number;
  memory: number;
  maxDepth: number;
}

const App: Component = () => {
  const [currentState, setCurrentState] = createSignal<CubeState>(createSolvedState());
  const [encoder, setEncoder] = createSignal<{
    cornerIndex: number;
    edgeIndex: number;
    fullIndex: string;
    binary: string;
  } | null>(null);
  const [isSolving, setIsSolving] = createSignal(false);
  const [searchResult, setSearchResult] = createSignal<SearchResult | null>(null);
  const [searchProgress, setSearchProgress] = createSignal<{
    depth: number;
    nodes: number;
  } | null>(null);
  const [validation, setValidation] = createSignal<{
    valid: boolean;
    errors: string[];
  } | null>(null);
  const [activePreset, setActivePreset] = createSignal<string>("");
  const [showEffects, setShowEffects] = createSignal(true);
  const [simulateIssues, setSimulateIssues] = createSignal({
    invalidState: false,
    memoryOverflow: false,
    hashCollision: false,
    workerBlock: false,
  });
  const [workerBlocked, setWorkerBlocked] = createSignal(false);
  const [moveHistory, setMoveHistory] = createSignal<Move[]>([]);

  let containerRef: HTMLDivElement | undefined;
  let cubeRenderer: CubeRenderer | null = null;
  let worker: Worker | null = null;

  onMount(() => {
    if (containerRef) {
      cubeRenderer = new CubeRenderer({
        container: containerRef,
        onStateChange: (state) => {
          setCurrentState(state);
          updateEncoding(state);
          checkValidation(state);
        },
        onMoveComplete: (move) => {
          setMoveHistory((prev) => [...prev, move].slice(-20));
        },
      });

      updateEncoding(currentState());
      checkValidation(currentState());

      worker = new Worker(
        new URL("./lib/cubeWorker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (e: MessageEvent) => {
        const data = e.data;

        if (data.type === "solution") {
          setIsSolving(false);
          setSearchResult({
            solution: data.solution || [],
            nodes: data.nodes,
            time: data.time,
            memory: data.memory,
            maxDepth: data.solution?.length || 0,
          });
          setWorkerBlocked(false);

          if (showEffects() && data.solution) {
            cubeRenderer?.showParticles([0, 0, 0], 0x00ff88);
            cubeRenderer?.showBinaryStream(
              stateToBinary(currentState()),
              [-3, 3, 0]
            );
          }
        } else if (data.type === "progress") {
          setSearchProgress({ depth: data.depth, nodes: data.nodes });
        } else if (data.type === "error") {
          setIsSolving(false);
          setWorkerBlocked(false);
        }
      };
    }
  });

  onCleanup(() => {
    if (cubeRenderer) {
      cubeRenderer.dispose();
    }
    if (worker) {
      worker.terminate();
    }
  });

  function updateEncoding(state: CubeState) {
    const { cornerIndex, edgeIndex, fullIndex } = stateToIndex(state);
    const binary = stateToBinary(state);
    setEncoder({ cornerIndex, edgeIndex, fullIndex, binary });

    if (showEffects() && cubeRenderer) {
      const nodes: [number, number, number][] = [];
      for (let i = 0; i < 8; i++) {
        nodes.push([
          Math.cos((i / 8) * Math.PI * 2) * 4,
          2,
          Math.sin((i / 8) * Math.PI * 2) * 4,
        ]);
      }
      cubeRenderer.showNodeConnections(nodes, 0xff8800);
    }
  }

  function checkValidation(state: CubeState) {
    const result = isValidState(state);
    setValidation(result);

    if (!result.valid && showEffects() && cubeRenderer) {
      cubeRenderer.showParticles([0, 0, 0], 0xff0000);
    }
  }

  function handlePresetClick(index: number) {
    const presetFn = ALL_PRESETS[index];
    const preset = presetFn();
    loadPreset(preset);
  }

  function loadPreset(preset: PresetState) {
    setActivePreset(preset.name);
    setMoveHistory([]);
    setSearchResult(null);

    if (cubeRenderer) {
      cubeRenderer.clearAllEffects();
    }

    const solvedState = createSolvedState();
    cubeRenderer?.setState(solvedState);
    setCurrentState(solvedState);
    updateEncoding(solvedState);

    setTimeout(async () => {
      if (cubeRenderer && preset.moves.length > 0) {
        await cubeRenderer.performMoves(preset.moves, 200);
      }

      cubeRenderer?.setState(preset.state);
      setCurrentState(preset.state);
      updateEncoding(preset.state);
      checkValidation(preset.state);

      if (preset.isInvalid && simulateIssues().invalidState && cubeRenderer) {
        cubeRenderer.showParticles([0, 0, 0], 0xff0000);
      }
    }, 100);
  }

  function handleSolve() {
    if (!worker || isSolving()) return;

    setIsSolving(true);
    setSearchResult(null);
    setSearchProgress({ depth: 0, nodes: 0 });

    if (simulateIssues().workerBlock) {
      setWorkerBlocked(true);
      setTimeout(() => {
        worker?.postMessage({
          type: "solve",
          state: currentState(),
          maxDepth: 20,
        });
      }, 5000);
    } else {
      worker.postMessage({
        type: "solve",
        state: currentState(),
        maxDepth: simulateIssues().memoryOverflow ? 30 : 20,
      });
    }
  }

  async function handleAnimateSolution() {
    if (!searchResult() || !cubeRenderer) return;

    setActivePreset("");
    const result = searchResult()!;

    if (showEffects() && cubeRenderer) {
      for (let i = 0; i < result.solution.length - 1; i++) {
        cubeRenderer.showGuideLine(
          [0, 0, 0],
          [
            Math.cos((i / result.solution.length) * Math.PI * 2) * 3,
            0,
            Math.sin((i / result.solution.length) * Math.PI * 2) * 3,
          ]
        );
      }
    }

    await cubeRenderer.performMoves(result.solution, 150);

    if (showEffects() && cubeRenderer) {
      cubeRenderer.showParticles([0, 0, 0], 0x00ff88);
    }
  }

  function handleReset() {
    const solved = createSolvedState();
    setCurrentState(solved);
    updateEncoding(solved);
    checkValidation(solved);
    setMoveHistory([]);
    setSearchResult(null);
    setActivePreset("");

    if (cubeRenderer) {
      cubeRenderer.clearAllEffects();
      cubeRenderer.setState(solved);
    }
  }

  function handleInvalidState() {
    const invalid = getInvalidState();
    loadPreset(invalid);
  }

  function handleMemoryOverflow() {
    const overflow = getMemoryOverflowState();
    loadPreset(overflow);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>魔方状态编码与复原系统</h1>
        <p style={styles.subtitle}>
          Vite + SolidJS + Express + Three.js + better-sqlite3 | 群论编码 + IDA* 搜索
        </p>
      </div>

      <div style={styles.main}>
        <div style={styles.leftPanel}>
          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>预设状态</h3>
            <div style={styles.buttonGroup}>
              <button
                style={{
                  ...styles.presetButton,
                  background: activePreset().includes("随机") ? "#ff6b6b" : "#4ecdc4",
                }}
                onClick={() => handlePresetClick(0)}
              >
                预设一：三阶随机打乱
              </button>
              <button
                style={{
                  ...styles.presetButton,
                  background: activePreset().includes("奇偶") ? "#ff6b6b" : "#45b7d1",
                }}
                onClick={() => handlePresetClick(1)}
              >
                预设二：四阶奇偶校验
              </button>
              <button
                style={{
                  ...styles.presetButton,
                  background: activePreset().includes("盲拧") ? "#ff6b6b" : "#96ceb4",
                }}
                onClick={() => handlePresetClick(2)}
              >
                预设三：盲拧记忆编码
              </button>
              <button
                style={{
                  ...styles.presetButton,
                  background: activePreset().includes("哈希") ? "#ff6b6b" : "#f9ca24",
                }}
                onClick={() => handlePresetClick(3)}
              >
                预设四：状态哈希冲突
              </button>
            </div>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>操作控制</h3>
            <div style={styles.buttonGroup}>
              <button
                style={styles.actionButton}
                onClick={handleSolve}
                disabled={isSolving()}
              >
                {isSolving() ? "搜索中..." : "求解魔方"}
              </button>
              <button
                style={styles.actionButton}
                onClick={handleAnimateSolution}
                disabled={!searchResult()}
              >
                执行复原
              </button>
              <button style={styles.resetButton} onClick={handleReset}>
                重置
              </button>
            </div>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>问题演示</h3>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={simulateIssues().invalidState}
                  onChange={(e) =>
                    setSimulateIssues((s) => ({
                      ...s,
                      invalidState: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
                非法状态
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={simulateIssues().memoryOverflow}
                  onChange={(e) =>
                    setSimulateIssues((s) => ({
                      ...s,
                      memoryOverflow: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
                内存溢出
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={simulateIssues().hashCollision}
                  onChange={(e) =>
                    setSimulateIssues((s) => ({
                      ...s,
                      hashCollision: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
                哈希碰撞
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={simulateIssues().workerBlock}
                  onChange={(e) =>
                    setSimulateIssues((s) => ({
                      ...s,
                      workerBlock: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
                Worker阻塞
              </label>
            </div>
            <div style={styles.buttonGroup}>
              <button style={styles.issueButton} onClick={handleInvalidState}>
                加载非法状态
              </button>
              <button style={styles.issueButton} onClick={handleMemoryOverflow}>
                加载大步数
              </button>
            </div>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>显示选项</h3>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={showEffects()}
                onChange={(e) =>
                  setShowEffects((e.target as HTMLInputElement).checked)
                }
              />
              启用动画效果
            </label>
          </div>
        </div>

        <div style={styles.centerPanel}>
          <div ref={containerRef} style={styles.cubeContainer} />
          <Show when={workerBlocked()}>
            <div style={styles.workerBlockOverlay}>
              <div style={styles.workerBlockContent}>
                <div style={styles.loadingSpinner} />
                <p>Worker 通信阻塞中...</p>
                <p style={{ "font-size": "12px", color: "#888" }}>
                  (模拟 Web Worker 通信阻塞问题)
                </p>
              </div>
            </div>
          </Show>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>状态编码</h3>
            <Show when={encoder()}>
              <div style={styles.encodingBox}>
                <div style={styles.encodingRow}>
                  <span style={styles.encodingLabel}>角块索引:</span>
                  <span style={styles.encodingValue}>
                    {encoder()?.cornerIndex}
                  </span>
                </div>
                <div style={styles.encodingRow}>
                  <span style={styles.encodingLabel}>棱块索引:</span>
                  <span style={styles.encodingValue}>
                    {encoder()?.edgeIndex}
                  </span>
                </div>
                <div style={styles.encodingRow}>
                  <span style={styles.encodingLabel}>状态哈希:</span>
                  <span style={styles.encodingValue}>
                    {encoder()?.fullIndex}
                  </span>
                </div>
                <div style={styles.binaryContainer}>
                  <div style={styles.binaryTitle}>二进制编码:</div>
                  <div style={styles.binaryContent}>
                    {encoder()?.binary}
                  </div>
                </div>
              </div>
            </Show>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>群论验证</h3>
            <Show when={validation()}>
              <div
                style={{
                  ...styles.validationBox,
                  background: validation()?.valid ? "#1a3a1a" : "#3a1a1a",
                }}
              >
                <div style={styles.validationStatus}>
                  {validation()?.valid ? "✓ 合法状态" : "✗ 非法状态"}
                </div>
                <Show when={!validation()?.valid && validation()?.errors}>
                  <ul style={styles.errorList}>
                    {validation()?.errors?.map((error) => (
                      <li style={styles.errorItem}>{error}</li>
                    ))}
                  </ul>
                </Show>
              </div>
            </Show>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>搜索结果</h3>
            <Show when={searchResult()}>
              <div style={styles.resultBox}>
                <div style={styles.resultRow}>
                  <span style={styles.resultLabel}>解法步数:</span>
                  <span style={styles.resultValue}>
                    {searchResult()?.solution.length}
                  </span>
                </div>
                <div style={styles.resultRow}>
                  <span style={styles.resultLabel}>搜索节点:</span>
                  <span style={styles.resultValue}>
                    {searchResult()?.nodes.toLocaleString()}
                  </span>
                </div>
                <div style={styles.resultRow}>
                  <span style={styles.resultLabel}>搜索时间:</span>
                  <span style={styles.resultValue}>
                    {searchResult()?.time}ms
                  </span>
                </div>
                <div style={styles.resultRow}>
                  <span style={styles.resultLabel}>内存使用:</span>
                  <span style={styles.resultValue}>
                    {(searchResult()?.memory / 1024).toFixed(1)}KB
                  </span>
                </div>
                <div style={styles.solutionContainer}>
                  <div style={styles.solutionTitle}>解法:</div>
                  <div style={styles.solutionMoves}>
                    {searchResult()?.solution.join(" ")}
                  </div>
                </div>
              </div>
            </Show>
            <Show when={searchProgress() && isSolving()}>
              <div style={styles.progressBox}>
                <div>搜索深度: {searchProgress()?.depth}</div>
                <div>已搜索节点: {searchProgress()?.nodes.toLocaleString()}</div>
                <div style={styles.loadingAnimation}>搜索中...</div>
              </div>
            </Show>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>移动历史</h3>
            <div style={styles.historyBox}>
              {moveHistory().length > 0 ? (
                moveHistory().join(" ")
              ) : (
                <span style={styles.emptyText}>暂无移动</span>
              )}
            </div>
          </div>

          <div style={styles.panelSection}>
            <h3 style={styles.sectionTitle}>魔方群信息</h3>
            <div style={styles.infoBox}>
              <div>总状态数: 43,252,003,274,489,856,000</div>
              <div>上帝之数: 20</div>
              <div>最大最小步: 26</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p>
          提示：右键拖动可旋转视角 | 数据库存储于 ./data/cube_states.db
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    color: "#eee",
    display: "flex",
    "flex-direction": "column" as const,
    "font-family": "Segoe UI, Arial, sans-serif",
  },
  header: {
    padding: "20px",
    "text-align": "center" as const,
    "border-bottom": "1px solid #333",
  },
  title: {
    margin: 0,
    "font-size": "28px",
    "font-weight": "bold" as const,
    color: "#4ecdc4",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#888",
    "font-size": "14px",
  },
  main: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  leftPanel: {
    width: "280px",
    padding: "15px",
    "overflow-y": "auto" as const,
    "border-right": "1px solid #333",
  },
  centerPanel: {
    flex: 1,
    position: "relative" as const,
    display: "flex",
    "align-items": "center" as const,
    "justify-content": "center" as const,
  },
  rightPanel: {
    width: "320px",
    padding: "15px",
    "overflow-y": "auto" as const,
    "border-left": "1px solid #333",
  },
  panelSection: {
    "margin-bottom": "20px",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    "font-size": "16px",
    color: "#4ecdc4",
    "border-bottom": "2px solid #4ecdc4",
    "padding-bottom": "5px",
  },
  buttonGroup: {
    display: "flex",
    "flex-direction": "column" as const,
    gap: "8px",
  },
  presetButton: {
    padding: "12px",
    border: "none",
    "border-radius": "8px",
    color: "#fff",
    "font-size": "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    "font-weight": "bold" as const,
  },
  actionButton: {
    padding: "12px",
    border: "none",
    "border-radius": "8px",
    background: "#4ecdc4",
    color: "#fff",
    "font-size": "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    "font-weight": "bold" as const,
  },
  resetButton: {
    padding: "10px",
    border: "1px solid #666",
    "border-radius": "8px",
    background: "transparent",
    color: "#aaa",
    "font-size": "13px",
    cursor: "pointer",
  },
  issueButton: {
    padding: "8px",
    border: "1px solid #ff6b6b",
    "border-radius": "6px",
    background: "transparent",
    color: "#ff6b6b",
    "font-size": "12px",
    cursor: "pointer",
  },
  checkboxGroup: {
    display: "flex",
    "flex-direction": "column" as const,
    gap: "8px",
    "margin-bottom": "10px",
  },
  checkbox: {
    display: "flex",
    "align-items": "center" as const,
    gap: "8px",
    "font-size": "13px",
    cursor: "pointer",
  },
  cubeContainer: {
    width: "100%",
    height: "100%",
  },
  workerBlockOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    "align-items": "center" as const,
    "justify-content": "center" as const,
    "z-index": 100,
  },
  workerBlockContent: {
    "text-align": "center" as const,
    color: "#fff",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #333",
    "border-top": "4px solid #4ecdc4",
    "border-radius": "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  encodingBox: {
    background: "rgba(0, 0, 0, 0.3)",
    padding: "12px",
    "border-radius": "8px",
  },
  encodingRow: {
    display: "flex",
    "justify-content": "space-between" as const,
    "margin-bottom": "8px",
    "font-size": "13px",
  },
  encodingLabel: {
    color: "#888",
  },
  encodingValue: {
    color: "#4ecdc4",
    "font-family": "monospace",
  },
  binaryContainer: {
    "margin-top": "10px",
    padding: "10px",
    background: "rgba(0, 255, 255, 0.1)",
    "border-radius": "6px",
  },
  binaryTitle: {
    "font-size": "12px",
    color: "#00ffff",
    "margin-bottom": "5px",
  },
  binaryContent: {
    "font-size": "10px",
    "font-family": "monospace",
    color: "#00ffff",
    "word-break": "break-all" as const,
  },
  validationBox: {
    padding: "12px",
    "border-radius": "8px",
    "font-size": "13px",
  },
  validationStatus: {
    "font-weight": "bold" as const,
    "margin-bottom": "8px",
    "font-size": "15px",
  },
  errorList: {
    margin: 0,
    padding: "0 0 0 20px",
  },
  errorItem: {
    color: "#ff6b6b",
    "font-size": "12px",
  },
  resultBox: {
    background: "rgba(0, 0, 0, 0.3)",
    padding: "12px",
    "border-radius": "8px",
  },
  resultRow: {
    display: "flex",
    "justify-content": "space-between" as const,
    "margin-bottom": "8px",
    "font-size": "13px",
  },
  resultLabel: {
    color: "#888",
  },
  resultValue: {
    color: "#f9ca24",
    "font-weight": "bold" as const,
  },
  solutionContainer: {
    "margin-top": "10px",
    padding: "10px",
    background: "rgba(78, 205, 196, 0.1)",
    "border-radius": "6px",
  },
  solutionTitle: {
    "font-size": "12px",
    color: "#4ecdc4",
    "margin-bottom": "5px",
  },
  solutionMoves: {
    "font-size": "12px",
    "font-family": "monospace",
    color: "#4ecdc4",
    "word-break": "break-all" as const,
  },
  progressBox: {
    background: "rgba(249, 202, 36, 0.1)",
    padding: "12px",
    "border-radius": "8px",
    "font-size": "13px",
    color: "#f9ca24",
  },
  loadingAnimation: {
    "margin-top": "10px",
    animation: "pulse 1.5s infinite",
  },
  historyBox: {
    background: "rgba(0, 0, 0, 0.3)",
    padding: "10px",
    "border-radius": "6px",
    "font-family": "monospace",
    "font-size": "12px",
    "min-height": "40px",
    "word-break": "break-all" as const,
  },
  emptyText: {
    color: "#666",
  },
  infoBox: {
    background: "rgba(0, 0, 0, 0.2)",
    padding: "10px",
    "border-radius": "6px",
    "font-size": "12px",
    color: "#888",
  },
  footer: {
    padding: "10px",
    "text-align": "center" as const,
    "border-top": "1px solid #333",
    "font-size": "12px",
    color: "#666",
  },
};

export default App;
