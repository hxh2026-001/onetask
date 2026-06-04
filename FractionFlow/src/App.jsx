import { createSignal, createEffect, onMount } from 'solid-js';
import PresetPanel from './components/PresetPanel.jsx';
import FractionCanvas from './components/FractionCanvas.jsx';
import ResultDisplay from './components/ResultDisplay.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import { getPresets, initSession, getHistory, getSessionId } from './services/api.js';
import { animateNumber, animateProgress } from './utils/animations.js';

export default function App() {
  const [presets, setPresets] = createSignal([]);
  const [activePreset, setActivePreset] = createSignal(null);
  const [currentPresetData, setCurrentPresetData] = createSignal(null);
  
  const [fraction1, setFraction1] = createSignal({ numerator: 1, denominator: 4 });
  const [fraction2, setFraction2] = createSignal({ numerator: 2, denominator: 4 });
  const [operator, setOperator] = createSignal('+');
  const [shapeType, setShapeType] = createSignal('circle');
  
  const [result, setResult] = createSignal(null);
  const [steps, setSteps] = createSignal([]);
  const [isCalculating, setIsCalculating] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [displayNum1, setDisplayNum1] = createSignal(1);
  const [displayDen1, setDisplayDen1] = createSignal(4);
  const [displayNum2, setDisplayNum2] = createSignal(2);
  const [displayDen2, setDisplayDen2] = createSignal(4);
  
  const [history, setHistory] = createSignal([]);
  const [errorState, setErrorState] = createSignal({ type: null, message: null });
  const [hint, setHint] = createSignal(null);

  const sessionId = getSessionId();

  onMount(async () => {
    await initSession();
    const presetRes = await getPresets();
    if (presetRes.success) {
      setPresets(presetRes.presets);
    }
    await loadHistory();
  });

  const loadHistory = async () => {
    const res = await getHistory(20);
    if (res.success) {
      setHistory(res.history);
    }
  };

  const handlePresetSelect = async (preset) => {
    setActivePreset(preset.id);
    setCurrentPresetData(preset.data);
    setHint(preset.data.hint);
    setResult(null);
    setSteps([]);
    setErrorState({ type: null, message: null });
    setProgress(0);

    const data = preset.data;
    
    if (data.shapeType) {
      setShapeType(data.shapeType);
    }

    animateNumber(displayNum1(), data.numerator1, 600, (v) => setDisplayNum1(v));
    animateNumber(displayDen1(), data.denominator1, 600, (v) => setDisplayDen1(v));
    animateNumber(displayNum2(), data.numerator2, 600, (v) => setDisplayNum2(v));
    animateNumber(displayDen2(), data.denominator2, 600, (v) => setDisplayDen2(v));

    setTimeout(() => {
      setFraction1({ numerator: data.numerator1, denominator: data.denominator1 });
      setFraction2({ numerator: data.numerator2, denominator: data.denominator2 });
      setOperator(data.operator || '+');
    }, 600);
  };

  const updateFraction = (index, field, value) => {
    const num = Math.max(-999, Math.min(999999937, parseInt(value) || 0));
    if (index === 1) {
      setFraction1(prev => ({ ...prev, [field]: num }));
      if (field === 'numerator') {
        animateNumber(displayNum1(), num, 300, (v) => setDisplayNum1(v));
      } else {
        animateNumber(displayDen1(), num, 300, (v) => setDisplayDen1(v));
      }
    } else {
      setFraction2(prev => ({ ...prev, [field]: num }));
      if (field === 'numerator') {
        animateNumber(displayNum2(), num, 300, (v) => setDisplayNum2(v));
      } else {
        animateNumber(displayDen2(), num, 300, (v) => setDisplayDen2(v));
      }
    }
    setResult(null);
    setSteps([]);
    setErrorState({ type: null, message: null });
  };

  const handleOperatorChange = (op) => {
    setOperator(op);
    setResult(null);
    setSteps([]);
  };

  const handleShapeChange = (shape) => {
    setShapeType(shape);
  };

  const handleCalculate = async () => {
    if (isCalculating()) return;
    
    setIsCalculating(true);
    setResult(null);
    setSteps([]);
    setErrorState({ type: null, message: null });
    
    animateProgress(1200, (p) => setProgress(p * 100));

    setTimeout(async () => {
      const { calculate } = await import('./services/api.js');
      
      const data = {
        numerator1: fraction1().numerator,
        denominator1: fraction1().denominator,
        numerator2: fraction2().numerator,
        denominator2: fraction2().denominator,
        operator: operator(),
        shapeType: shapeType(),
        snapshot: {
          fraction1: fraction1(),
          fraction2: fraction2(),
          operator: operator(),
          shapeType: shapeType(),
          preset: activePreset()
        }
      };

      const res = await calculate(data);
      
      setTimeout(() => {
        setIsCalculating(false);
        setProgress(100);
        
        if (res.result && res.result.isNaN) {
          setErrorState({ type: 'nan', message: res.errors?.[0] || '零作除数的非法运算' });
          setResult({ numerator: NaN, denominator: NaN, isNaN: true });
        } else if (!res.success) {
          const errorMsg = res.errors?.[0] || '运算失败';
          
          if (errorMsg.includes('溢出')) {
            setErrorState({ type: 'overflow', message: errorMsg });
          } else if (errorMsg.includes('死循环') || errorMsg.includes('递归')) {
            setErrorState({ type: 'infinite_loop', message: errorMsg });
          } else if (errorMsg.includes('零') || errorMsg.includes('NaN')) {
            setErrorState({ type: 'nan', message: errorMsg });
            setResult({ numerator: NaN, denominator: NaN, isNaN: true });
          } else {
            setErrorState({ type: 'error', message: errorMsg });
          }
          
          if (res.steps) {
            setSteps(res.steps);
          }
        } else {
          setResult(res.result);
          setSteps(res.steps || []);
          
          if (res.isImproper) {
            setErrorState({ type: 'improper', message: '注意：这是一个假分数，可以化简' });
          }
        }
        
        loadHistory();
      }, 1300);
    }, 100);
  };

  const handleSliceDrop = (sliceData) => {
    const { numerator, denominator, fractionIndex } = sliceData;
    if (fractionIndex === 1) {
      setFraction1({ numerator, denominator });
      animateNumber(displayNum1(), numerator, 400, (v) => setDisplayNum1(v));
      animateNumber(displayDen1(), denominator, 400, (v) => setDisplayDen1(v));
    } else {
      setFraction2({ numerator, denominator });
      animateNumber(displayNum2(), numerator, 400, (v) => setDisplayNum2(v));
      animateNumber(displayDen2(), denominator, 400, (v) => setDisplayDen2(v));
    }
  };

  createEffect(() => {
    if (errorState().type === 'nan' || errorState().type === 'overflow' || errorState().type === 'infinite_loop') {
      import('./utils/animations.js').then(({ triggerGlitchEffect, triggerLayoutBreak }) => {
        setTimeout(() => triggerGlitchEffect('result-display', 2500), 200);
        setTimeout(() => triggerLayoutBreak('fraction-inputs', 3000), 500);
      });
    }
  });

  return (
    <div class="app">
      <header class="app-header">
        <h1>🧮 分数运算教学系统</h1>
        <p>FractionFlow - 可视化学习分数运算 · 会话 ID: {sessionId.slice(0, 12)}...</p>
      </header>

      <div class="main-container">
        <aside class="panel">
          <h2 class="panel-title">📚 预设场景</h2>
          <PresetPanel 
            presets={presets()} 
            activePreset={activePreset()}
            onSelect={handlePresetSelect}
          />
          
          {hint() && (
            <div class="hint-box">
              <strong>💡 提示</strong>
              {hint()}
            </div>
          )}
        </aside>

        <main class="canvas-container">
          <FractionCanvas
            fraction1={fraction1()}
            fraction2={fraction2()}
            operator={operator()}
            shapeType={shapeType()}
            onShapeChange={handleShapeChange}
            onSliceDrop={handleSliceDrop}
            errorState={errorState()}
          />

          <div class="fraction-inputs" id="fraction-inputs">
            <div class={`fraction-box ${errorState().type === 'nan' && fraction1().denominator === 0 ? 'error' : ''}`}>
              <div class={`fraction-display ${errorState().type === 'nan' && fraction1().denominator === 0 ? 'nan' : ''}`}>
                <span class="numerator" id="num1-display">
                  <span class="number-bounce">{displayNum1()}</span>
                  {fraction1().numerator > fraction1().denominator && fraction1().denominator > 0 && (
                    <span class="improper-badge">假分数</span>
                  )}
                </span>
                <span class="denominator" id="den1-display">{displayDen1()}</span>
              </div>
              <div class="input-controls">
                <button onClick={() => updateFraction(1, 'numerator', fraction1().numerator - 1)}>-</button>
                <input 
                  type="number" 
                  value={fraction1().numerator} 
                  onInput={(e) => updateFraction(1, 'numerator', e.target.value)}
                />
                <button onClick={() => updateFraction(1, 'numerator', fraction1().numerator + 1)}>+</button>
                <span style={{ margin: '0 8px' }}>/</span>
                <button onClick={() => updateFraction(1, 'denominator', Math.max(0, fraction1().denominator - 1))}>-</button>
                <input 
                  type="number" 
                  value={fraction1().denominator} 
                  onInput={(e) => updateFraction(1, 'denominator', e.target.value)}
                />
                <button onClick={() => updateFraction(1, 'denominator', fraction1().denominator + 1)}>+</button>
              </div>
            </div>

            <div class="operator">
              <div class="operator-select">
                {['+', '-', '×', '÷'].map(op => (
                  <button 
                    key={op}
                    class={`operator-btn ${operator() === op ? 'active' : ''}`}
                    onClick={() => handleOperatorChange(op)}
                  >
                    {op}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '3rem' }}>{operator()}</div>
            </div>

            <div class={`fraction-box ${errorState().type === 'nan' && fraction2().denominator === 0 ? 'error' : ''}`}>
              <div class={`fraction-display ${errorState().type === 'nan' && fraction2().denominator === 0 ? 'nan' : ''}`}>
                <span class="numerator" id="num2-display">
                  <span class="number-bounce">{displayNum2()}</span>
                  {fraction2().numerator > fraction2().denominator && fraction2().denominator > 0 && (
                    <span class="improper-badge">假分数</span>
                  )}
                </span>
                <span class="denominator" id="den2-display">{displayDen2()}</span>
              </div>
              <div class="input-controls">
                <button onClick={() => updateFraction(2, 'numerator', fraction2().numerator - 1)}>-</button>
                <input 
                  type="number" 
                  value={fraction2().numerator} 
                  onInput={(e) => updateFraction(2, 'numerator', e.target.value)}
                />
                <button onClick={() => updateFraction(2, 'numerator', fraction2().numerator + 1)}>+</button>
                <span style={{ margin: '0 8px' }}>/</span>
                <button onClick={() => updateFraction(2, 'denominator', Math.max(0, fraction2().denominator - 1))}>-</button>
                <input 
                  type="number" 
                  value={fraction2().denominator} 
                  onInput={(e) => updateFraction(2, 'denominator', e.target.value)}
                />
                <button onClick={() => updateFraction(2, 'denominator', fraction2().denominator + 1)}>+</button>
              </div>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${progress()}%` }}></div>
          </div>

          <button 
            class="calculate-btn" 
            onClick={handleCalculate}
            disabled={isCalculating()}
          >
            {isCalculating() ? '🔄 计算中...' : '➗ 计算结果'}
          </button>

          <ResultDisplay 
            result={result()}
            steps={steps()}
            errorState={errorState()}
            isCalculating={isCalculating()}
            fraction1={fraction1()}
            fraction2={fraction2()}
            operator={operator()}
          />
        </main>

        <aside class="panel">
          <h2 class="panel-title">📊 操作历史</h2>
          <HistoryPanel history={history()} />
        </aside>
      </div>
    </div>
  );
}
