<script>
  import { onMount } from 'svelte';
  import DNAHelix from './components/DNAHelix.svelte';
  import RNAPolymerase from './components/RNAPolymerase.svelte';
  import CodonHeatmap from './components/CodonHeatmap.svelte';
  import StateTransition from './components/StateTransition.svelte';
  import MatrixRain from './components/MatrixRain.svelte';

  let dnaSequence = 'ATGCGTACCGAATTTGGCAACTGA';
  let inputSequence = dnaSequence;
  let analysisResult = null;
  let loading = false;
  let error = '';
  let activeTab = 'input';
  
  let isHelixAnimating = false;
  let isTranscribing = false;
  let isHeatmapAnimating = false;
  let isMatrixRaining = false;
  let transitionStep = 0;
  let isTransitionAnimating = false;

  const presets = [
    {
      id: 1,
      name: '预设一：移码突变序列',
      description: '插入/删除单个碱基导致移码突变',
      original: 'ATGCGTACCGAATTTGGCAACTGA',
      mutated: 'ATGCGTACCGAATTTGGCACTGA',
      type: 'frameshift'
    },
    {
      id: 2,
      name: '预设二：提前终止密码子',
      description: '含有终止密码子提前出现的序列',
      sequence: 'ATGCGTACCGAATGATTGGCAACTGA',
      type: 'stop'
    },
    {
      id: 3,
      name: '预设三：高度重复序列',
      description: 'ATATATAT... 高度重复',
      sequence: 'ATATATATATATATATATATATATGCG',
      type: 'repeat'
    },
    {
      id: 4,
      name: '预设四：高 GC 含量序列',
      description: 'GC 含量超过 80% 的极端序列',
      sequence: 'GGGCCCGGGCCCGGGCCCGGGCCCAAA',
      type: 'gc'
    }
  ];

  let comparisonMode = false;
  let originalSequence = '';
  let mutatedSequence = '';
  let frameshiftResult = null;

  async function analyzeSequence() {
    loading = true;
    error = '';
    try {
      if (!dnaSequence || dnaSequence.trim() === '') {
        error = '请输入有效的 DNA 序列！序列仅包含碱基 A、T、G、C。';
        loading = false;
        return;
      }
      
      if (dnaSequence.length < 3) {
        error = 'DNA 序列长度至少需要 3 个碱基才能进行翻译分析。';
        loading = false;
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: dnaSequence })
      });

      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || '分析失败，请检查输入序列是否有效。';
        loading = false;
        return;
      }
      
      analysisResult = data;
      startAllAnimations();
    } catch (e) {
      error = '分析失败: ' + e.message + '。请确保后端服务器正常运行。';
    } finally {
      loading = false;
    }
  }

  async function checkFrameshift() {
    loading = true;
    error = '';
    try {
      const cleanOrig = originalSequence.toUpperCase().replace(/[^ATGC]/g, '');
      const cleanMut = mutatedSequence.toUpperCase().replace(/[^ATGC]/g, '');
      
      if (!cleanOrig || !cleanMut) {
        error = '请在两个输入框中都输入有效的 DNA 序列！';
        loading = false;
        return;
      }
      
      if (cleanOrig.length < 3 || cleanMut.length < 3) {
        error = '两个序列的长度都至少需要 3 个碱基。';
        loading = false;
        return;
      }

      const response = await fetch('/api/frameshift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original: cleanOrig, mutated: cleanMut })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || '分析失败，请检查输入序列。';
        loading = false;
        return;
      }
      
      frameshiftResult = data;
      
      const origResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: cleanOrig })
      });
      const origResult = await origResponse.json();
      
      const mutResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: cleanMut })
      });
      const mutResult = await mutResponse.json();
      
      frameshiftResult.originalAnalysis = origResult;
      frameshiftResult.mutatedAnalysis = mutResult;
    } catch (e) {
      error = '分析失败: ' + e.message + '。请确保后端服务器正常运行。';
    } finally {
      loading = false;
    }
  }

  function loadPreset(preset) {
    if (preset.type === 'frameshift') {
      comparisonMode = true;
      originalSequence = preset.original;
      mutatedSequence = preset.mutated;
      dnaSequence = preset.original;
      inputSequence = preset.original;
    } else {
      comparisonMode = false;
      dnaSequence = preset.sequence;
      inputSequence = preset.sequence;
    }
    analysisResult = null;
    frameshiftResult = null;
  }

  function startAllAnimations() {
    isHelixAnimating = true;
    isTranscribing = true;
    isHeatmapAnimating = true;
    isMatrixRaining = true;
    isTransitionAnimating = true;
    transitionStep = 0;
    
    setTimeout(() => { transitionStep = 1; }, 1000);
    setTimeout(() => { transitionStep = 2; }, 2000);
  }

  function stopAllAnimations() {
    isHelixAnimating = false;
    isTranscribing = false;
    isHeatmapAnimating = false;
    isMatrixRaining = false;
    isTransitionAnimating = false;
  }

  function handleInput() {
    dnaSequence = inputSequence.toUpperCase().replace(/[^ATGC]/g, '');
  }

  function setDnaForComparison(useMutated) {
    dnaSequence = useMutated ? mutatedSequence : originalSequence;
    inputSequence = dnaSequence;
    analyzeSequence();
  }

  onMount(() => {
    analyzeSequence();
  });
</script>

<div class="app">
  <header class="header">
    <h1>🧬 遗传密码子解码系统</h1>
    <p class="subtitle">DNA Sequence Decoding & Mutation Simulation System</p>
  </header>

  <nav class="tabs">
    <button class:active={activeTab === 'input'} on:click={() => activeTab = 'input'}>序列输入</button>
    <button class:active={activeTab === 'visualize'} on:click={() => activeTab = 'visualize'}>可视化动画</button>
    <button class:active={activeTab === 'compare'} on:click={() => activeTab = 'compare'}>序列比对</button>
    <button class:active={activeTab === 'analysis'} on:click={() => activeTab = 'analysis'}>分析结果</button>
  </nav>

  <div class="presets">
    <h3>快捷预设场景</h3>
    <div class="preset-buttons">
      {#each presets as preset}
        <button class="preset-btn preset-{preset.type}" on:click={() => loadPreset(preset)}>
          <span class="preset-icon">
            {#if preset.type === 'frameshift'}🔀
            {:else if preset.type === 'stop'}🛑
            {:else if preset.type === 'repeat'}🔁
            {:else if preset.type === 'gc'}📊
            {/if}
          </span>
          <span class="preset-name">{preset.name}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if activeTab === 'input'}
    <section class="input-section">
      <div class="input-card">
        <h2>DNA 序列输入</h2>
        <textarea
          bind:value={inputSequence}
          on:input={handleInput}
          placeholder="输入 DNA 序列 (仅包含 A, T, G, C)"
          rows="4"
        />
        <div class="sequence-info">
          <span>长度: {dnaSequence.length} bp</span>
          <span>GC 含量: {analysisResult && analysisResult.gcContent !== undefined ? analysisResult.gcContent : '...'}%</span>
          {#if inputSequence && /[^ATGCatgc\s]/.test(inputSequence)}
            <span class="filter-warning">⚠️ 已过滤无效字符</span>
          {/if}
        </div>
        <div class="action-buttons">
          <button class="primary-btn" on:click={analyzeSequence} disabled={loading}>
            {loading ? '分析中...' : '🔬 开始分析'}
          </button>
          <button class="secondary-btn" on:click={startAllAnimations}>▶️ 播放动画</button>
          <button class="secondary-btn" on:click={stopAllAnimations}>⏹️ 停止动画</button>
        </div>
        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>
    </section>
  {/if}

  {#if activeTab === 'visualize'}
    <section class="visualization-section">
      <div class="grid-2">
        <div class="card">
          <DNAHelix sequence={dnaSequence} isAnimating={isHelixAnimating} />
        </div>
        <div class="card">
          <RNAPolymerase 
            dnaSequence={dnaSequence} 
            mrnaSequence={analysisResult?.mrna || ''} 
            isTranscribing={isTranscribing} 
          />
        </div>
      </div>
      
      <div class="card full-width">
        <StateTransition 
          dna={dnaSequence}
          mrna={analysisResult?.mrna || ''}
          aminoAcids={analysisResult?.translation?.aminoAcids || []}
          currentStep={transitionStep}
          isAnimating={isTransitionAnimating}
        />
      </div>

      <div class="grid-2">
        <div class="card">
          <CodonHeatmap 
            codons={analysisResult?.translation?.codons || []} 
            isAnimating={isHeatmapAnimating} 
          />
        </div>
        <div class="card">
          <MatrixRain 
            aminoAcids={analysisResult?.translation?.aminoAcids || []} 
            isRaining={isMatrixRaining} 
          />
        </div>
      </div>
    </section>
  {/if}

  {#if activeTab === 'compare'}
    <section class="compare-section">
      <div class="card">
        <h2>序列比对 - 移码突变检测</h2>
        <div class="comparison-inputs">
          <div class="input-group">
            <label>原始序列</label>
            <textarea
              bind:value={originalSequence}
              placeholder="原始 DNA 序列"
              rows="3"
            />
            <button class="small-btn" on:click={() => setDnaForComparison(false)}>分析此序列</button>
          </div>
          <div class="vs">VS</div>
          <div class="input-group">
            <label>突变序列</label>
            <textarea
              bind:value={mutatedSequence}
              placeholder="突变 DNA 序列"
              rows="3"
            />
            <button class="small-btn" on:click={() => setDnaForComparison(true)}>分析此序列</button>
          </div>
        </div>
        <button class="primary-btn" on:click={checkFrameshift} disabled={loading} style="margin-top: 20px;">
          {loading ? '检测中...' : '🔍 检测移码突变'}
        </button>
      </div>

      {#if frameshiftResult}
        <div class="card">
          <h3>移码突变分析结果</h3>
          <div class="result-highlight {frameshiftResult.isFrameshift ? 'warning' : 'success'}">
            {#if frameshiftResult.isFrameshift}
              ⚠️ 检测到移码突变！({frameshiftResult.frameshiftType === 'insertion' ? '插入' : '删除'}了 {Math.abs(frameshiftResult.lengthDifference)} 个碱基)
            {:else}
              ✅ 未检测到移码突变
            {/if}
          </div>

          {#if frameshiftResult.isFrameshift}
            <div class="comparison-display">
              <div class="seq-display">
                <h4>原始序列翻译结果:</h4>
                <div class="amino-acids">
                  {#each frameshiftResult.originalAnalysis.translation.aminoAcids as aa, i}
                    <span class="aa-tag">{aa}</span>
                  {/each}
                </div>
              </div>
              <div class="seq-display">
                <h4>突变序列翻译结果:</h4>
                <div class="amino-acids">
                  {#each frameshiftResult.mutatedAnalysis.translation.aminoAcids as aa, i}
                    <span class="aa-tag mutated">
                      {aa}
                      {#if i < frameshiftResult.originalAnalysis.translation.aminoAcids.length && 
                           aa !== frameshiftResult.originalAnalysis.translation.aminoAcids[i]}
                        <span class="mutation-mark">*</span>
                      {/if}
                    </span>
                  {/each}
                </div>
              </div>
              <p class="explanation">
                <strong>说明:</strong> 由于移码突变，从突变位置开始，下游所有氨基酸都发生了改变（标记 * 的位置）。
                这是因为读码框被打乱，导致后续的密码子全部被错误翻译。
              </p>
            </div>
          {/if}
        </div>
      {/if}
    </section>
  {/if}

  {#if activeTab === 'analysis' && analysisResult}
    <section class="analysis-section">
      <div class="card">
        <h2>序列分析结果</h2>
        
        <div class="result-grid">
          <div class="result-item">
            <label>DNA 序列</label>
            <div class="sequence-display">{analysisResult.dna}</div>
          </div>
          
          <div class="result-item">
            <label>mRNA 序列</label>
            <div class="sequence-display mrna">{analysisResult.mrna}</div>
          </div>
          
          <div class="result-item">
            <label>氨基酸序列</label>
            <div class="amino-acids">
              {#each analysisResult.translation.aminoAcids as aa}
                <span class="aa-tag">{aa}</span>
              {/each}
            </div>
          </div>
          
          <div class="result-item">
            <label>GC 含量</label>
            <div class="gc-bar">
              <div class="gc-fill" style="width: {analysisResult.gcContent}%"></div>
              <span>{analysisResult.gcContent}%</span>
            </div>
          </div>
          
          <div class="result-item">
            <label>终止密码子</label>
            <span class="status {analysisResult.translation.stopFound ? 'found' : 'missing'}">
              {analysisResult.translation.stopFound ? '✅ 检测到终止密码子 (位置 ' + analysisResult.translation.stopPosition + ')' : '⚠️ 未检测到终止密码子 - 翻译至序列末尾'}
            </span>
          </div>
        </div>

        {#if analysisResult.repeats.length > 0}
          <div class="result-item">
            <label>重复序列检测</label>
            <ul class="repeats-list">
              {#each analysisResult.repeats.slice(0, 5) as repeat}
                <li>
                  <span class="repeat-unit">"{repeat.unit}"</span> 
                  重复 {repeat.count} 次 (位置 {repeat.start}-{repeat.end})
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if !analysisResult.translation.stopFound}
          <div class="warning-box">
            <h4>⚠️ 终止密码子缺失说明</h4>
            <p>此序列没有终止密码子（UAA、UAG 或 UGA），翻译过程会一直进行到序列末尾。
               在生物体内，这种情况可能导致产生异常的蛋白质产物。</p>
          </div>
        {/if}

        <div class="codon-table">
          <h4>密码子详情</h4>
          <div class="codons-list">
            {#each analysisResult.translation.codons as codon}
              <div class="codon-item">
                <span class="codon-seq">{codon.codon}</span>
                <span class="arrow">→</span>
                <span class="codon-aa">{codon.aminoAcid}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>
  {/if}

  <footer class="footer">
    <p>遗传密码子解码系统 | 基于后缀自动机的序列比对算法</p>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a1a2a 100%);
    color: #fff;
    padding-bottom: 50px;
  }

  .header {
    text-align: center;
    padding: 30px 20px;
    background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(155, 89, 182, 0.2));
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header h1 {
    margin: 0;
    font-size: 2.5em;
    background: linear-gradient(90deg, #3498db, #9b59b6, #2ecc71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    margin: 10px 0 0 0;
    color: #8b949e;
    font-size: 1em;
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
  }

  .tabs button {
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.1);
    color: #8b949e;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .tabs button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .tabs button.active {
    background: linear-gradient(90deg, #3498db, #9b59b6);
    color: #fff;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
  }

  .presets {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .presets h3 {
    margin: 0 0 15px 0;
    color: #8b949e;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .preset-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }

  .preset-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 20px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
  }

  .preset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  .preset-frameshift { border-color: #e74c3c; }
  .preset-stop { border-color: #f39c12; }
  .preset-repeat { border-color: #9b59b6; }
  .preset-gc { border-color: #3498db; }

  .preset-icon {
    font-size: 24px;
  }

  .preset-name {
    font-size: 13px;
    font-weight: 500;
  }

  .card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .full-width {
    margin-bottom: 20px;
  }

  .input-section,
  .visualization-section,
  .compare-section,
  .analysis-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .input-card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .input-card h2 {
    margin: 0 0 20px 0;
    color: #fff;
  }

  textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
    font-family: monospace;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
    border-color: #3498db;
  }

  .sequence-info {
    display: flex;
    gap: 30px;
    margin: 15px 0;
    color: #8b949e;
    font-size: 14px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-warning {
    color: #f39c12;
    font-size: 13px;
    background: rgba(243, 156, 18, 0.1);
    padding: 4px 10px;
    border-radius: 12px;
  }

  .action-buttons {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .primary-btn,
  .secondary-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .primary-btn {
    background: linear-gradient(90deg, #3498db, #9b59b6);
    color: #fff;
  }

  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .secondary-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .secondary-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.5);
    border-radius: 10px;
    padding: 15px 20px;
    margin: 15px 0 0 0;
    color: #e74c3c;
    font-size: 14px;
    line-height: 1.6;
  }

  .error::before {
    content: '⚠️ ';
    font-size: 18px;
  }

  .result-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .result-item {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    padding: 15px;
  }

  .result-item label {
    display: block;
    color: #8b949e;
    font-size: 12px;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .sequence-display {
    font-family: monospace;
    font-size: 14px;
    word-break: break-all;
    line-height: 1.8;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .sequence-display.mrna {
    color: #e67e22;
  }

  .amino-acids {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .aa-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(39, 174, 96, 0.3));
    border-radius: 20px;
    font-size: 12px;
    border: 1px solid rgba(46, 204, 113, 0.5);
  }

  .aa-tag.mutated {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.3), rgba(192, 57, 43, 0.3));
    border-color: rgba(231, 76, 60, 0.5);
  }

  .mutation-mark {
    color: #e74c3c;
    font-weight: bold;
  }

  .gc-bar {
    position: relative;
    height: 30px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 15px;
    overflow: hidden;
  }

  .gc-fill {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
    transition: width 0.5s ease;
  }

  .gc-bar span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
  }

  .status {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
  }

  .status.found {
    background: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  }

  .status.missing {
    background: rgba(241, 196, 15, 0.2);
    color: #f1c40f;
  }

  .repeats-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .repeats-list li {
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #8b949e;
  }

  .repeat-unit {
    color: #9b59b6;
    font-family: monospace;
    font-weight: bold;
  }

  .warning-box {
    background: rgba(241, 196, 15, 0.1);
    border: 1px solid rgba(241, 196, 15, 0.3);
    border-radius: 10px;
    padding: 15px;
    margin: 20px 0;
  }

  .warning-box h4 {
    margin: 0 0 10px 0;
    color: #f1c40f;
  }

  .warning-box p {
    margin: 0;
    color: #8b949e;
    line-height: 1.6;
  }

  .codon-table {
    margin-top: 30px;
  }

  .codon-table h4 {
    margin: 0 0 15px 0;
    color: #fff;
  }

  .codons-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .codon-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    font-family: monospace;
  }

  .codon-seq {
    color: #3498db;
    font-weight: bold;
  }

  .arrow {
    color: #8b949e;
  }

  .codon-aa {
    color: #2ecc71;
  }

  .comparison-inputs {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 20px;
    align-items: start;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input-group label {
    color: #8b949e;
    font-size: 14px;
  }

  .vs {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: #9b59b6;
    margin-top: 40px;
  }

  .small-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 15px;
    background: rgba(52, 152, 219, 0.3);
    color: #3498db;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;
  }

  .small-btn:hover {
    background: rgba(52, 152, 219, 0.5);
  }

  .result-highlight {
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
  }

  .result-highlight.warning {
    background: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.5);
  }

  .result-highlight.success {
    background: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
    border: 1px solid rgba(46, 204, 113, 0.5);
  }

  .seq-display {
    margin: 15px 0;
  }

  .seq-display h4 {
    margin: 0 0 10px 0;
    color: #8b949e;
    font-size: 14px;
  }

  .explanation {
    background: rgba(52, 152, 219, 0.1);
    border-left: 4px solid #3498db;
    padding: 15px;
    margin-top: 20px;
    color: #8b949e;
    line-height: 1.6;
  }

  .footer {
    text-align: center;
    padding: 30px;
    color: #8b949e;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 50px;
  }

  @media (max-width: 768px) {
    .grid-2 {
      grid-template-columns: 1fr;
    }
    
    .comparison-inputs {
      grid-template-columns: 1fr;
    }
    
    .vs {
      margin: 10px 0;
    }
    
    .preset-buttons {
      grid-template-columns: 1fr;
    }
  }
</style>
