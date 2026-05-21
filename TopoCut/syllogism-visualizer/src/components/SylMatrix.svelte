<script>
  import { onMount, afterUpdate } from 'svelte'

  export let figure
  export let major
  export let minor
  export let conclusion
  export let validationResult
  export let animationState

  let matrixRef
  let nodes = {}

  function getFigureStructure() {
    switch (figure) {
      case 1:
        return {
          major: { subject: 'M', predicate: 'P' },
          minor: { subject: 'S', predicate: 'M' },
          conclusion: { subject: 'S', predicate: 'P' }
        }
      case 2:
        return {
          major: { subject: 'P', predicate: 'M' },
          minor: { subject: 'S', predicate: 'M' },
          conclusion: { subject: 'S', predicate: 'P' }
        }
      case 3:
        return {
          major: { subject: 'M', predicate: 'P' },
          minor: { subject: 'M', predicate: 'S' },
          conclusion: { subject: 'S', predicate: 'P' }
        }
      case 4:
        return {
          major: { subject: 'P', predicate: 'M' },
          minor: { subject: 'M', predicate: 'S' },
          conclusion: { subject: 'S', predicate: 'P' }
        }
      default:
        return null
    }
  }

  $: structure = getFigureStructure()

  function getNodePosition(role, part) {
    const positions = {
      major: {
        subject: { x: 150, y: 120 },
        predicate: { x: 450, y: 120 },
        copula: { x: 300, y: 120 }
      },
      minor: {
        subject: { x: 150, y: 300 },
        predicate: { x: 450, y: 300 },
        copula: { x: 300, y: 300 }
      },
      conclusion: {
        subject: { x: 150, y: 480 },
        predicate: { x: 450, y: 480 },
        copula: { x: 300, y: 480 }
      }
    }
    return positions[role]?.[part] || { x: 0, y: 0 }
  }

  function getTermDisplay(role, part) {
    if (!structure) return ''
    const term = structure[role][part]
    const displayNames = {
      S: '小项 S',
      P: '大项 P',
      M: '中项 M'
    }
    return displayNames[term] || term
  }

  function getDisplayText(role) {
    const texts = {
      major: major.text,
      minor: minor.text,
      conclusion: conclusion.text
    }
    return texts[role] || ''
  }

  function getTypeSymbol(role) {
    const props = { major, minor, conclusion }
    return props[role]?.type || 'A'
  }

  function isMiddleTerm(role, part) {
    if (!structure) return false
    return structure[role][part] === 'M'
  }

  function isMajorTerm(role, part) {
    if (!structure) return false
    return structure[role][part] === 'P'
  }

  function isMinorTerm(role, part) {
    if (!structure) return false
    return structure[role][part] === 'S'
  }
</script>

<div class="syllogism-matrix" bind:this={matrixRef}>
  <svg width="600" height="650" viewBox="0 0 600 650" class="matrix-svg">
    <defs>
      <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <linearGradient id="ropeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#8b6914"/>
        <stop offset="50%" stop-color="#d4af37"/>
        <stop offset="100%" stop-color="#8b6914"/>
      </linearGradient>

      <linearGradient id="greenFlow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00ff88" stop-opacity="0.2"/>
        <stop offset="50%" stop-color="#00ff88" stop-opacity="1"/>
        <stop offset="100%" stop-color="#00ff88" stop-opacity="0.2"/>
      </linearGradient>

      <linearGradient id="redArc" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff4444" stop-opacity="0.3"/>
        <stop offset="50%" stop-color="#ff4444" stop-opacity="1"/>
        <stop offset="100%" stop-color="#ff4444" stop-opacity="0.3"/>
      </linearGradient>

      <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <path d="M0,0 L0,6 L9,3 z" fill="#00ff88"/>
      </marker>

      <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <path d="M0,0 L0,6 L9,3 z" fill="#ff4444"/>
      </marker>
    </defs>

    <rect x="20" y="20" width="560" height="600" fill="rgba(255,255,255,0.6)" 
          rx="16" stroke="#5c4033" stroke-width="3"/>

    <text x="300" y="55" text-anchor="middle" class="matrix-title">
      第{figure}格 · {validationResult?.mood || '___'}式
    </text>

    {#if structure}
      <g class="major-premise">
        <text x="80" y="125" class="premise-label">大前提</text>
        <text x="520" y="125" class="type-symbol">[{getTypeSymbol('major')}]</text>
        
        <g class="term major-subject" class:middle-term={isMiddleTerm('major', 'subject')}
           class:major-term={isMajorTerm('major', 'subject')}
           class:minor-term={isMinorTerm('major', 'subject')}>
          <circle cx="150" cy="120" r="35" fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="150" y="125" text-anchor="middle" class="term-text">{getTermDisplay('major', 'subject')}</text>
        </g>

        <g class="copula">
          <rect x="260" y="105" width="80" height="30" rx="4" fill="#e8dcc8" stroke="#5c4033" stroke-width="1.5"/>
          <text x="300" y="125" text-anchor="middle" class="copula-text">是/不是</text>
        </g>

        <g class="term major-predicate" class:middle-term={isMiddleTerm('major', 'predicate')}
           class:major-term={isMajorTerm('major', 'predicate')}
           class:minor-term={isMinorTerm('major', 'predicate')}>
          <circle cx="450" cy="120" r="35" fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="450" y="125" text-anchor="middle" class="term-text">{getTermDisplay('major', 'predicate')}</text>
        </g>

        <line x1="185" y1="120" x2="260" y2="120" stroke="#5c4033" stroke-width="1.5" stroke-dasharray="5,3"/>
        <line x1="340" y1="120" x2="415" y2="120" stroke="#5c4033" stroke-width="1.5" stroke-dasharray="5,3"/>
      </g>

      <g class="minor-premise">
        <text x="80" y="305" class="premise-label">小前提</text>
        <text x="520" y="305" class="type-symbol">[{getTypeSymbol('minor')}]</text>
        
        <g class="term minor-subject" class:middle-term={isMiddleTerm('minor', 'subject')}
           class:major-term={isMajorTerm('minor', 'subject')}
           class:minor-term={isMinorTerm('minor', 'subject')}>
          <circle cx="150" cy="300" r="35" fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="150" y="305" text-anchor="middle" class="term-text">{getTermDisplay('minor', 'subject')}</text>
        </g>

        <g class="copula">
          <rect x="260" y="285" width="80" height="30" rx="4" fill="#e8dcc8" stroke="#5c4033" stroke-width="1.5"/>
          <text x="300" y="305" text-anchor="middle" class="copula-text">是/不是</text>
        </g>

        <g class="term minor-predicate" class:middle-term={isMiddleTerm('minor', 'predicate')}
           class:major-term={isMajorTerm('minor', 'predicate')}
           class:minor-term={isMinorTerm('minor', 'predicate')}>
          <circle cx="450" cy="300" r="35" fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="450" y="305" text-anchor="middle" class="term-text">{getTermDisplay('minor', 'predicate')}</text>
        </g>

        <line x1="185" y1="300" x2="260" y2="300" stroke="#5c4033" stroke-width="1.5" stroke-dasharray="5,3"/>
        <line x1="340" y1="300" x2="415" y2="300" stroke="#5c4033" stroke-width="1.5" stroke-dasharray="5,3"/>
      </g>

      <g class="conclusion-line">
        <line x1="50" y1="390" x2="550" y2="390" stroke="#5c4033" stroke-width="3" stroke-linecap="round"/>
        <path d="M50 390 L35 380 L35 400 Z" fill="#5c4033"/>
        <path d="M550 390 L565 380 L565 400 Z" fill="#5c4033"/>
      </g>

      <g class="conclusion">
        <text x="80" y="485" class="premise-label">结 论</text>
        <text x="520" y="485" class="type-symbol">[{getTypeSymbol('conclusion')}]</text>
        
        <g class="term conclusion-subject" class:middle-term={isMiddleTerm('conclusion', 'subject')}
           class:major-term={isMajorTerm('conclusion', 'subject')}
           class:minor-term={isMinorTerm('conclusion', 'subject')}>
          <circle cx="150" cy="480" r="35" fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="150" y="485" text-anchor="middle" class="term-text">{getTermDisplay('conclusion', 'subject')}</text>
        </g>

        <g class="copula">
          <rect x="260" y="465" width="80" height="30" rx="4" fill="#e8dcc8" stroke="#5c4033" stroke-width="1.5"/>
          <text x="300" y="485" text-anchor="middle" class="copula-text">是/不是</text>
        </g>

        <g class="term conclusion-predicate" class:middle-term={isMiddleTerm('conclusion', 'predicate')}
           class:major-term={isMajorTerm('conclusion', 'predicate')}
           class:minor-term={isMinorTerm('conclusion', 'predicate')}>
          <circle cx="450" cy="480" r="35" fill="#f4e9d8" stroke="#5c4033" stroke-width="2"/>
          <text x="450" y="485" text-anchor="middle" class="term-text">{getTermDisplay('conclusion', 'predicate')}</text>
        </g>

        <line x1="185" y1="480" x2="260" y2="480" stroke="#5c4033" stroke-width="1.5" stroke-dasharray="5,3"/>
        <line x1="340" y1="480" x2="415" y2="480" stroke="#5c4033" stroke-width="1.5" stroke-dasharray="5,3"/>
      </g>

      {#if animationState.showElasticRope}
        <g class="elastic-ropes">
          <path d="M 300 155 Q 300 210 300 270" 
                fill="none" stroke="url(#ropeGradient)" stroke-width="4"
                stroke-linecap="round" class="elastic-rope"/>
          <path d="M 300 335 Q 300 390 300 450" 
                fill="none" stroke="url(#ropeGradient)" stroke-width="4"
                stroke-linecap="round" class="elastic-rope" style="animation-delay: 0.3s"/>
        </g>
      {/if}

      {#if animationState.showGreenFlow && validationResult?.valid}
        <g class="green-flow">
          <path d="M 150 155 Q 150 210 150 270" 
                fill="none" stroke="url(#greenFlow)" stroke-width="6"
                stroke-linecap="round" filter="url(#glow-green)" class="flow-path"/>
          <path d="M 450 155 Q 450 210 450 270" 
                fill="none" stroke="url(#greenFlow)" stroke-width="6"
                stroke-linecap="round" filter="url(#glow-green)" class="flow-path" style="animation-delay: 0.2s"/>
          <path d="M 150 335 Q 150 390 150 450" 
                fill="none" stroke="url(#greenFlow)" stroke-width="6"
                stroke-linecap="round" filter="url(#glow-green)" class="flow-path" style="animation-delay: 0.4s"/>
          <path d="M 450 335 Q 450 390 450 450" 
                fill="none" stroke="url(#greenFlow)" stroke-width="6"
                stroke-linecap="round" filter="url(#glow-green)" class="flow-path" style="animation-delay: 0.6s"/>
        </g>
      {/if}

      {#if animationState.showRedArc && !validationResult?.valid}
        <g class="red-arcs">
          {#each [0, 1, 2] as i}
            <path d="M {200 + i * 80} 155 Q {250 + i * 80} {200 + i * 20} {300 + i * 80} 270" 
                  fill="none" stroke="url(#redArc)" stroke-width="3"
                  stroke-linecap="round" filter="url(#glow-red)" 
                  class="arc-flash" style="animation-delay: {i * 0.15}s"/>
          {/each}
          {#each [0, 1, 2] as i}
            <path d="M {200 + i * 80} 335 Q {250 + i * 80} {380 + i * 20} {300 + i * 80} 450" 
                  fill="none" stroke="url(#redArc)" stroke-width="3"
                  stroke-linecap="round" filter="url(#glow-red)" 
                  class="arc-flash" style="animation-delay: {0.5 + i * 0.15}s"/>
          {/each}
        </g>
      {/if}

      {#if animationState.showRipple}
        <g class="ripples">
          {#each [0, 1] as i}
            <circle cx="300" cy={210 + i * 180} r="10" fill="none" 
                    stroke="#b8860b" stroke-width="2" class="ripple-ring"
                    style="animation-delay: {i * 0.3}s" filter="url(#glow-gold)"/>
          {/each}
        </g>
      {/if}
    {/if}

    {#if getDisplayText('major')}
      <rect x="50" y="60" width="500" height="35" rx="8" fill="rgba(184,134,11,0.1)" stroke="#b8860b" stroke-width="1"/>
      <text x="300" y="82" text-anchor="middle" class="proposition-text">{getDisplayText('major')}</text>
    {/if}
    {#if getDisplayText('minor')}
      <rect x="50" y="240" width="500" height="35" rx="8" fill="rgba(184,134,11,0.1)" stroke="#b8860b" stroke-width="1"/>
      <text x="300" y="262" text-anchor="middle" class="proposition-text">{getDisplayText('minor')}</text>
    {/if}
    {#if getDisplayText('conclusion') && animationState.showTypewriter}
      <rect x="50" y="420" width="500" height="35" rx="8" fill="rgba(46,139,87,0.1)" stroke="#2e8b57" stroke-width="1"/>
      <text x="300" y="442" text-anchor="middle" class="typewriter-text">{animationState.typewriterText}</text>
    {/if}

    <g class="legend" transform="translate(50, 560)">
      <rect x="0" y="0" width="500" height="50" rx="8" fill="rgba(44,24,16,0.05)" stroke="#5c4033" stroke-width="1"/>
      <circle cx="30" cy="25" r="12" fill="#f4e9d8" stroke="#2e8b57" stroke-width="2"/>
      <text x="50" y="30" class="legend-text">小项 S</text>
      <circle cx="120" cy="25" r="12" fill="#f4e9d8" stroke="#8b0000" stroke-width="2"/>
      <text x="140" y="30" class="legend-text">大项 P</text>
      <circle cx="210" cy="25" r="12" fill="#f4e9d8" stroke="#b8860b" stroke-width="2"/>
      <text x="230" y="30" class="legend-text">中项 M</text>
      <text x="320" y="30" class="legend-text">有效</text>
      <rect x="370" y="18" width="40" height="14" rx="3" fill="#00ff88" opacity="0.6"/>
      <text x="425" y="30" class="legend-text">无效</text>
      <rect x="465" y="18" width="40" height="14" rx="3" fill="#ff4444" opacity="0.6"/>
    </g>
  </svg>
</div>

<style>
  .syllogism-matrix {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(244,233,216,0.8) 100%);
    border: 3px solid var(--border-dark);
    border-radius: 16px;
    padding: 15px;
    box-shadow: 
      0 8px 32px rgba(0,0,0,0.2),
      inset 0 1px 0 rgba(255,255,255,0.5);
  }

  .matrix-svg {
    display: block;
  }

  .matrix-title {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 20px;
    fill: var(--ink-dark);
    font-weight: 700;
  }

  .premise-label {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 14px;
    fill: var(--ink-dark);
    font-weight: 600;
  }

  .type-symbol {
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
    fill: var(--ink-gold);
    font-weight: 700;
  }

  .term-text {
    font-family: 'ZCOOL XiaoWei', serif;
    font-size: 13px;
    fill: var(--ink-dark);
    font-weight: 600;
  }

  .middle-term circle {
    fill: rgba(184, 134, 11, 0.15) !important;
    stroke: var(--ink-gold) !important;
    stroke-width: 3 !important;
    filter: drop-shadow(0 0 8px rgba(184, 134, 11, 0.5));
  }

  .major-term circle {
    fill: rgba(139, 0, 0, 0.1) !important;
    stroke: var(--ink-red) !important;
    stroke-width: 2.5 !important;
  }

  .minor-term circle {
    fill: rgba(46, 139, 87, 0.1) !important;
    stroke: var(--ink-green) !important;
    stroke-width: 2.5 !important;
  }

  .copula-text {
    font-family: 'Noto Serif SC', serif;
    font-size: 12px;
    fill: var(--ink-dark);
    opacity: 0.7;
  }

  .proposition-text {
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
    fill: var(--ink-dark);
  }

  .typewriter-text {
    font-family: 'Noto Serif SC', serif;
    font-size: 14px;
    fill: var(--ink-green);
    font-weight: 600;
    animation: typewriter 2s steps(40) forwards;
    overflow: hidden;
    white-space: nowrap;
  }

  .legend-text {
    font-family: 'Noto Serif SC', serif;
    font-size: 12px;
    fill: var(--ink-dark);
  }

  .elastic-rope {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawRope 1.5s ease-out forwards;
  }

  .flow-path {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawFlow 2s ease-out infinite;
  }

  .arc-flash {
    animation: arcFlash 0.8s ease-out infinite;
  }

  .ripple-ring {
    animation: ripple 2s ease-out infinite;
  }

  @keyframes drawRope {
    to { stroke-dashoffset: 0; }
  }

  @keyframes drawFlow {
    0% { stroke-dashoffset: 1000; }
    100% { stroke-dashoffset: -1000; }
  }

  @keyframes arcFlash {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }

  @keyframes ripple {
    0% { r: 10; opacity: 1; }
    100% { r: 80; opacity: 0; }
  }

  @keyframes typewriter {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
