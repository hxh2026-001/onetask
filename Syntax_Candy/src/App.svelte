<script>
  import { onMount } from 'svelte';
  
  let code = '';
  let tokens = [];
  let ast = null;
  let parseSteps = [];
  let symbolTable = {};
  let semanticErrors = [];
  let parseErrors = [];
  let hasParseError = false;
  let currentStep = 0;
  let isAnimating = false;
  let memoryUsage = 0;
  let scopeDepth = 0;
  let maxScopeDepth = 0;
  let parseStack = [];
  let activeTokenIndex = -1;
  let growingNodes = [];
  let typeArrows = [];
  let errorPositions = [];
  let collapsedNodes = [];
  
  const presets = [
    { id: 'preset1', name: '左递归消除', color: '#ff6b6b' },
    { id: 'preset2', name: '悬空 else', color: '#4ecdc4' },
    { id: 'preset3', name: '类型不匹配', color: '#ffe66d' },
    { id: 'preset4', name: '作用域链断裂', color: '#a855f7' }
  ];
  
  async function loadPreset(presetId) {
    const response = await fetch(`/api/preset/${presetId}`);
    const preset = await response.json();
    code = preset.code;
    await analyzeCode();
  }
  
  async function analyzeCode() {
    isAnimating = true;
    currentStep = 0;
    tokens = [];
    ast = null;
    parseSteps = [];
    symbolTable = {};
    semanticErrors = [];
    parseErrors = [];
    hasParseError = false;
    parseStack = [];
    activeTokenIndex = -1;
    growingNodes = [];
    typeArrows = [];
    errorPositions = [];
    collapsedNodes = [];
    scopeDepth = 0;
    maxScopeDepth = 0;
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: code })
    });
    
    const result = await response.json();
    tokens = result.tokens;
    ast = result.ast;
    parseSteps = result.parseSteps;
    symbolTable = result.symbolTable;
    semanticErrors = result.semanticErrors;
    parseErrors = result.parseErrors || [];
    hasParseError = result.hasParseError || false;
    parseStack = result.parseStack;
    maxScopeDepth = result.maxScopeDepth || 0;
    
    animateTokens();
  }
  
  async function animateTokens() {
    for (let i = 0; i < tokens.length; i++) {
      activeTokenIndex = i;
      await delay(200);
    }
    activeTokenIndex = -1;
    await delay(500);
    animateTree();
  }
  
  async function animateTree() {
    if (!ast) return;
    
    function addNodes(node, parentId = null, depth = 0) {
      const nodeId = Math.random().toString(36).substr(2, 9);
      growingNodes.push({ id: nodeId, type: node.type, parentId, depth });
      
      if (node.children) {
        node.children.forEach(child => addNodes(child, nodeId, depth + 1));
      }
      if (node.body) {
        node.body.forEach(child => addNodes(child, nodeId, depth + 1));
      }
      if (node.left) addNodes(node.left, nodeId, depth + 1);
      if (node.right) addNodes(node.right, nodeId, depth + 1);
      if (node.id) addNodes(node.id, nodeId, depth + 1);
      if (node.expression) addNodes(node.expression, nodeId, depth + 1);
    }
    
    addNodes(ast);
    
    for (let i = 0; i < growingNodes.length; i++) {
      growingNodes[i].visible = true;
      await delay(150);
    }
    
    await delay(500);
    animateTypeInference();
  }
  
  async function animateTypeInference() {
    typeArrows = [];
    
    if (semanticErrors.length > 0) {
      semanticErrors.forEach((error, index) => {
        typeArrows.push({
          id: index,
          from: error.type,
          to: 'error',
          error: true,
          message: error.message
        });
      });
    }
    
    for (let i = 0; i < typeArrows.length; i++) {
      typeArrows[i].visible = true;
      await delay(300);
    }
    
    await delay(500);
    highlightErrors();
  }
  
  async function highlightErrors() {
    const allErrors = [
      ...parseErrors.map((err, index) => ({
        id: `parse-${index}`,
        message: err.message,
        type: `语法错误: ${err.type}`,
        active: false,
        isParseError: true
      })),
      ...semanticErrors.map((err, index) => ({
        id: `semantic-${index}`,
        message: err.message,
        type: `语义错误: ${err.type}`,
        active: false,
        isParseError: false
      }))
    ];
    
    errorPositions = allErrors;
    
    for (let i = 0; i < errorPositions.length; i++) {
      errorPositions[i].active = true;
      await delay(400);
    }
    
    await delay(500);
    simulateMemoryUsage();
  }
  
  async function simulateMemoryUsage() {
    for (let i = 0; i <= 100; i += 5) {
      memoryUsage = i;
      await delay(50);
    }
    
    for (let i = 100; i >= 30; i -= 3) {
      memoryUsage = i;
      await delay(30);
    }
    
    animateScopeChain();
  }
  
  async function animateScopeChain() {
    scopeDepth = 0;
    
    for (let i = 0; i <= maxScopeDepth; i++) {
      scopeDepth = i;
      await delay(200);
    }
    
    await delay(1000);
    animateCollapse();
  }
  
  async function animateCollapse() {
    const nodes = growingNodes.filter(n => n.depth > 2);
    
    for (let i = 0; i < nodes.length; i += 2) {
      collapsedNodes.push(nodes[i].id);
      await delay(150);
    }
    
    isAnimating = false;
  }
  
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function getTokenColor(type) {
    const colors = {
      KEYWORD: '#ff6b6b',
      TYPE: '#4ecdc4',
      IDENTIFIER: '#ffe66d',
      NUMBER: '#a855f7',
      STRING: '#20e080',
      OPERATOR: '#ff8c42',
      DELIMITER: '#949494',
      ERROR: '#ff0000'
    };
    return colors[type] || '#ffffff';
  }
  
  function formatAST(node, indent = 0) {
    if (!node) return '';
    
    const prefix = '  '.repeat(indent);
    let result = `${prefix}${node.type}`;
    
    if (node.name) result += `: ${node.name}`;
    if (node.value !== undefined) result += ` = ${node.value}`;
    if (node.operator) result += ` ${node.operator}`;
    
    result += '\n';
    
    if (node.children) {
      node.children.forEach(child => {
        result += formatAST(child, indent + 1);
      });
    }
    if (node.body) {
      node.body.forEach(child => {
        result += formatAST(child, indent + 1);
      });
    }
    if (node.left) result += formatAST(node.left, indent + 1);
    if (node.right) result += formatAST(node.right, indent + 1);
    if (node.id) result += formatAST(node.id, indent + 1);
    if (node.expression) result += formatAST(node.expression, indent + 1);
    
    return result;
  }
  
  onMount(async () => {
    await fetch('/api/presets');
  });
</script>

<style>
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr 1fr;
    gap: 16px;
    padding: 16px;
    height: 100vh;
  }
  
  .header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .header h1 {
    font-size: 24px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .preset-buttons {
    display: flex;
    gap: 12px;
  }
  
  .preset-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
  }
  
  .preset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  
  .panel {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px;
    overflow: hidden;
  }
  
  .panel-title {
    font-size: 16px;
    margin-bottom: 12px;
    color: #a0a0a0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .panel-title::before {
    content: '';
    width: 4px;
    height: 16px;
    background: linear-gradient(180deg, #ff6b6b, #4ecdc4);
    border-radius: 2px;
  }
  
  .code-editor {
    width: 100%;
    height: calc(100% - 40px);
    background: #0d1117;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    color: #e6edf3;
    resize: none;
    outline: none;
    line-height: 1.5;
  }
  
  .tokens-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    max-height: calc(100% - 40px);
    overflow-y: auto;
    padding-right: 4px;
  }
  
  .token {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: monospace;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .token.active {
    animation: tokenFloat 0.5s ease-in-out;
    transform: translateY(-10px);
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
  }
  
  @keyframes tokenFloat {
    0% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(-10px); }
  }
  
  .ast-viewer {
    font-family: monospace;
    font-size: 12px;
    line-height: 1.6;
    max-height: calc(100% - 40px);
    overflow-y: auto;
    white-space: pre-wrap;
  }
  
  .ast-node {
    transition: all 0.3s ease;
    position: relative;
  }
  
  .ast-node.growing {
    animation: nodeGrow 0.3s ease-out;
    color: #4ecdc4;
  }
  
  @keyframes nodeGrow {
    0% { opacity: 0; transform: scale(0.5); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  .ast-node.collapsed {
    opacity: 0.3;
  }
  
  .type-arrow {
    margin: 8px 0;
    padding: 8px;
    border-radius: 6px;
    font-size: 12px;
    transition: all 0.3s ease;
  }
  
  .type-arrow.visible {
    animation: arrowPulse 0.5s ease-out;
  }
  
  .type-arrow.error {
    background: rgba(255, 107, 107, 0.2);
    border-left: 3px solid #ff6b6b;
  }
  
  @keyframes arrowPulse {
    0% { opacity: 0; transform: translateX(-20px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  
  .error-item {
    padding: 10px;
    margin: 8px 0;
    background: rgba(255, 107, 107, 0.15);
    border-radius: 8px;
    border-left: 4px solid #ff6b6b;
    font-size: 13px;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .error-item.active {
    animation: errorWave 0.5s ease-in-out;
  }
  
  @keyframes errorWave {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
    50% { box-shadow: 0 0 20px 5px rgba(255, 107, 107, 0.3); }
  }
  
  .error-item::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: repeating-linear-gradient(90deg, #ff6b6b, #ff6b6b 8px, transparent 8px, transparent 16px);
    animation: waveLine 1s linear infinite;
  }
  
  @keyframes waveLine {
    0% { background-position: 0 0; }
    100% { background-position: 16px 0; }
  }
  
  .symbol-table {
    max-height: calc(100% - 40px);
    overflow-y: auto;
  }
  
  .symbol-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    margin: 4px 0;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    font-size: 13px;
  }
  
  .memory-bar {
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    margin-top: 8px;
  }
  
  .memory-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ecdc4, #ffe66d, #ff6b6b);
    transition: width 0.1s ease;
    border-radius: 12px;
  }
  
  .memory-warning {
    color: #ff6b6b;
    font-size: 12px;
    margin-top: 4px;
  }
  
  .scope-indicator {
    display: flex;
    gap: 4px;
    margin-top: 12px;
  }
  
  .scope-level {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .scope-level.active {
    background: #4ecdc4;
    animation: scopePulse 0.5s ease-out;
  }
  
  @keyframes scopePulse {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .parse-stack {
    max-height: calc(100% - 40px);
    overflow-y: auto;
  }
  
  .stack-item {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    margin: 3px 0;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }
  
  .stack-item.error {
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
  }
  
  .analyze-btn {
    padding: 12px 32px;
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .analyze-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  .analyze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

<div class="container">
  <div class="header">
    <h1>编译器前端可视化工具</h1>
    <div class="preset-buttons">
      {#each presets as preset}
        <button 
          class="preset-btn" 
          style="background: {preset.color};"
          on:click={() => loadPreset(preset.id)}
        >
          {preset.name}
        </button>
      {/each}
      <button 
        class="analyze-btn" 
        on:click={analyzeCode}
        disabled={isAnimating || !code.trim()}
      >
        {isAnimating ? '分析中...' : '开始分析'}
      </button>
    </div>
  </div>
  
  <div class="panel">
    <div class="panel-title">代码编辑器</div>
    <textarea 
      class="code-editor" 
      bind:value={code}
      placeholder="在此输入源代码..."
    />
  </div>
  
  <div class="panel">
    <div class="panel-title">词法分析 - 令牌流</div>
    <div class="tokens-container">
      {#each tokens as token, index}
        <div 
          class="token" 
          class:active={index === activeTokenIndex}
          style="background: {getTokenColor(token.type)}20; color: {getTokenColor(token.type)}; border: 1px solid {getTokenColor(token.type)}40;"
        >
          <span class="token-type">{token.type}</span>
          <span class="token-value">"{token.value}"</span>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="panel">
    <div class="panel-title">语法分析 - 抽象语法树</div>
    <div class="ast-viewer">
      {#if ast}
        {formatAST(ast)}
      {:else}
        等待分析...
      {/if}
    </div>
  </div>
  
  <div class="panel">
    <div class="panel-title">语义分析 - 类型推断</div>
    <div class="type-arrows">
      {#each typeArrows as arrow}
        <div 
          class="type-arrow" 
          class:visible={arrow.visible}
          class:error={arrow.error}
        >
          {arrow.message}
        </div>
      {/each}
      {#if typeArrows.length === 0 && !isAnimating && code}
        <p style="color: #4ecdc4;">类型检查通过</p>
      {/if}
    </div>
  </div>
  
  <div class="panel">
    <div class="panel-title">错误标记</div>
    <div class="errors-container">
      {#each errorPositions as error}
        <div 
          class="error-item" 
          class:active={error.active}
        >
          <strong>{error.type}:</strong> {error.message}
        </div>
      {/each}
      {#if errorPositions.length === 0 && !isAnimating && code}
        <p style="color: #4ecdc4;">未检测到错误</p>
      {/if}
    </div>
  </div>
  
  <div class="panel">
    <div class="panel-title">符号表</div>
    <div class="symbol-table">
      {#each Object.entries(symbolTable) as [name, info]}
        <div class="symbol-item">
          <span style="color: #ffe66d;">{name}</span>
          <span style="color: #4ecdc4;">{info.type}</span>
          <span style="color: #a0a0a0;">作用域: {info.scopeDepth}</span>
        </div>
      {/each}
      {#if Object.keys(symbolTable).length === 0 && !isAnimating && code}
        <p style="color: #a0a0a0;">暂无符号</p>
      {/if}
    </div>
  </div>
  
  <div class="panel">
    <div class="panel-title">内存使用模拟</div>
    <div class="memory-bar">
      <div 
        class="memory-fill" 
        style="width: {memoryUsage}%;"
      />
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px;">
      <span>0%</span>
      <span style="color: {memoryUsage > 80 ? '#ff6b6b' : '#4ecdc4'};">{memoryUsage}%</span>
      <span>100%</span>
    </div>
    {#if memoryUsage > 80}
      <div class="memory-warning">⚠️ 内存峰值警告</div>
    {/if}
  </div>
  
  <div class="panel">
    <div class="panel-title">作用域深度</div>
    <div class="scope-indicator">
      {#each Array(6) as _, i}
        <div 
          class="scope-level" 
          class:active={i < scopeDepth}
          title={`作用域层 ${i + 1}`}
        />
      {/each}
    </div>
    <div style="margin-top: 12px; font-size: 13px;">
      当前深度: <span style="color: #4ecdc4;">{scopeDepth}</span>
    </div>
    {#if scopeDepth > 4}
      <div style="color: #ffe66d; font-size: 12px; margin-top: 8px;">
        ⚠️ 作用域嵌套过深，可能导致查找延迟
      </div>
    {/if}
  </div>
  
  <div class="panel">
    <div class="panel-title">分析栈</div>
    <div class="parse-stack">
      {#each parseStack as item, index}
        <div 
          class="stack-item" 
          class:error={item.action === 'ERROR'}
        >
          <span style="margin-right: 12px; color: #a0a0a0;">{index}</span>
          <span style="font-weight: 600;">{item.action}</span>
          {#if item.token}<span style="margin-left: 8px;">{item.token.value}</span>{/if}
          {#if item.message}<span style="margin-left: 8px; color: #ff6b6b;">{item.message}</span>{/if}
        </div>
      {/each}
      {#if parseStack.length === 0}
        <p style="color: #a0a0a0;">等待分析...</p>
      {/if}
    </div>
  </div>
</div>
