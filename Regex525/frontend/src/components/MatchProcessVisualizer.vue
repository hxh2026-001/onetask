<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import * as d3 from 'd3';
import { MatchResult, MatchStep } from '../types';

const props = defineProps<{
  testText: string;
  matchResult: MatchResult;
  currentStep: number;
  engine: 'nfa' | 'dfa' | 'minimized-dfa';
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const currentStep = computed(() => {
  if (!props.matchResult.steps || props.matchResult.steps.length === 0) return null;
  const stepIndex = Math.min(props.currentStep, props.matchResult.steps.length - 1);
  return props.matchResult.steps[stepIndex];
});

const matchedRange = computed(() => {
  if (!props.matchResult.success) return null;
  return {
    start: props.matchResult.matchStart,
    end: props.matchResult.matchEnd
  };
});

watch([containerRef, currentStep], () => {
  if (containerRef.value) {
    renderMatchProcess();
  }
}, { deep: true });

function renderMatchProcess() {
  if (!svgRef.value || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = Math.max(200, containerRef.value.clientHeight);

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  svg.attr('width', width).attr('height', height);

  const text = props.testText;
  const charWidth = Math.min(30, (width - 40) / Math.max(text.length, 1));
  const startX = 20;
  const centerY = height / 2;

  const defs = svg.append('defs');

  defs.append('marker')
    .attr('id', 'match-arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 12)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#ffd700');

  const charGroup = svg.append('g').attr('class', 'characters');

  for (let i = 0; i < text.length; i++) {
    const x = startX + i * charWidth;
    const isCurrent = currentStep.value && currentStep.value.inputIndex === i;
    const isMatched = matchedRange.value && i >= matchedRange.value.start && i < matchedRange.value.end;
    const isBacktrack = currentStep.value && currentStep.value.isBacktrack && currentStep.value.inputIndex === i;

    charGroup.append('rect')
      .attr('x', x)
      .attr('y', centerY - 15)
      .attr('width', charWidth - 4)
      .attr('height', 30)
      .attr('rx', 4)
      .attr('fill', isCurrent ? (isBacktrack ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 215, 0, 0.4)') : isMatched ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 255, 255, 0.05)')
      .attr('stroke', isCurrent ? (isBacktrack ? '#ff4757' : '#ffd700') : isMatched ? '#2ed573' : 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', isCurrent ? 3 : 1);

    charGroup.append('text')
      .attr('x', x + (charWidth - 4) / 2)
      .attr('y', centerY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', isCurrent ? (isBacktrack ? '#ff4757' : '#ffd700') : isMatched ? '#2ed573' : '#e0e0e0')
      .attr('font-size', '16px')
      .attr('font-family', 'Consolas, monospace')
      .attr('font-weight', isCurrent || isMatched ? 'bold' : 'normal')
      .text(text[i]);

    charGroup.append('text')
      .attr('x', x + (charWidth - 4) / 2)
      .attr('y', centerY + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '10px')
      .text(i);
  }

  if (currentStep.value) {
    const indicatorGroup = svg.append('g').attr('class', 'indicators');

    const stepX = startX + currentStep.value.inputIndex * charWidth + (charWidth - 4) / 2;

    indicatorGroup.append('path')
      .attr('d', `M${stepX},${centerY - 35} L${stepX - 6},${centerY - 50} L${stepX + 6},${centerY - 50} Z`)
      .attr('fill', currentStep.value.isBacktrack ? '#ff4757' : '#ffd700')
      .attr('class', currentStep.value.isBacktrack ? 'backtrack-indicator' : '');

    if (currentStep.value.transition) {
      const stateBoxGroup = svg.append('g').attr('class', 'state-indicators');

      const stateY = 30;
      const fromStateX = width / 4;
      const toStateX = (width * 3) / 4;

      stateBoxGroup.append('rect')
        .attr('x', fromStateX - 40)
        .attr('y', stateY - 15)
        .attr('width', 80)
        .attr('height', 30)
        .attr('rx', 6)
        .attr('fill', 'rgba(79, 172, 254, 0.2)')
        .attr('stroke', '#4facfe')
        .attr('stroke-width', 2);

      stateBoxGroup.append('text')
        .attr('x', fromStateX)
        .attr('y', stateY + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4facfe')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(`S${currentStep.value.transition.from}`);

      const arrowX = (fromStateX + toStateX) / 2;
      stateBoxGroup.append('line')
        .attr('x1', fromStateX + 40)
        .attr('y1', stateY)
        .attr('x2', toStateX - 40)
        .attr('y2', stateY)
        .attr('stroke', '#ffd700')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#match-arrowhead)');

      stateBoxGroup.append('rect')
        .attr('x', arrowX - 20)
        .attr('y', stateY - 25)
        .attr('width', 40)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', '#ffd700');

      stateBoxGroup.append('text')
        .attr('x', arrowX)
        .attr('y', stateY - 11)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`"${currentStep.value.transition.symbol}"`);

      stateBoxGroup.append('rect')
        .attr('x', toStateX - 40)
        .attr('y', stateY - 15)
        .attr('width', 80)
        .attr('height', 30)
        .attr('rx', 6)
        .attr('fill', 'rgba(255, 215, 0, 0.2)')
        .attr('stroke', '#ffd700')
        .attr('stroke-width', 2);

      stateBoxGroup.append('text')
        .attr('x', toStateX)
        .attr('y', stateY + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffd700')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(`S${currentStep.value.transition.to}`);
    }

    if (currentStep.value.isBacktrack) {
      const backtrackGroup = svg.append('g').attr('class', 'backtrack-indicator');

      backtrackGroup.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff4757')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('⟲ 回溯');
    }

    if (currentStep.value.activeStates && currentStep.value.activeStates.length > 1) {
      const activeGroup = svg.append('g').attr('class', 'active-states');

      activeGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#888')
        .attr('font-size', '12px')
        .text(`活跃状态: {${currentStep.value.activeStates.map(s => `S${s}`).join(', ')}}`);
    }
  }

  if (props.matchResult.success) {
    const successGroup = svg.append('g').attr('class', 'success-path');

    if (matchedRange.value) {
      const startXPos = startX + matchedRange.value.start * charWidth;
      const endXPos = startX + matchedRange.value.end * charWidth;

      successGroup.append('rect')
        .attr('x', startXPos)
        .attr('y', centerY - 20)
        .attr('width', endXPos - startXPos)
        .attr('height', 40)
        .attr('rx', 4)
        .attr('fill', 'none')
        .attr('stroke', '#ffd700')
        .attr('stroke-width', 4)
        .attr('class', 'golden-trail');
    }
  }
}

onMounted(() => {
  renderMatchProcess();
  window.addEventListener('resize', renderMatchProcess);
});
</script>

<template>
  <div v-if="matchResult && testText" style="padding: 0 16px 16px;">
    <div class="panel-title" style="margin-bottom: 8px;">匹配过程可视化</div>
    <div
      ref="containerRef"
      style="width: 100%; min-height: 200px; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 8px;"
    >
      <svg ref="svgRef" style="width: 100%;"></svg>
    </div>
    <div v-if="matchResult" class="stats-grid">
      <div class="stat-card">
        <div class="value">{{ matchResult.executionTime.toFixed(2) }}ms</div>
        <div class="label">执行时间</div>
      </div>
      <div class="stat-card">
        <div class="value">{{ matchResult.stateCount }}</div>
        <div class="label">状态数量</div>
      </div>
      <div class="stat-card">
        <div class="value">{{ matchResult.backtrackCount }}</div>
        <div class="label">回溯次数</div>
      </div>
      <div class="stat-card">
        <div class="value">{{ matchResult.steps?.length || 0 }}</div>
        <div class="label">步骤总数</div>
      </div>
    </div>
  </div>
</template>
