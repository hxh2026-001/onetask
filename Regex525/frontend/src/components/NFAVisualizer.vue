<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import { NFAData, NFAState, NFABuildStep } from '../types';

const props = defineProps<{
  data: NFAData;
  currentStep: number;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const tooltip = ref({ visible: false, x: 0, y: 0, content: '', title: '' });

const currentStepData = computed(() => {
  if (!props.data.buildSteps || props.data.buildSteps.length === 0) return null;
  const stepIndex = Math.min(props.currentStep, props.data.buildSteps.length - 1);
  return props.data.buildSteps[stepIndex];
});

const displayedStates = computed(() => {
  if (!currentStepData.value) return props.data.states;
  const stepStates = currentStepData.value.states;
  if (!stepStates || stepStates.length === 0) return props.data.states;
  return stepStates;
});

const newStateIds = computed(() => {
  if (!currentStepData.value) return new Set<number>();
  return new Set(currentStepData.value.newStateIds || []);
});

const newTransitions = computed(() => {
  if (!currentStepData.value) return [];
  return currentStepData.value.newTransitions || [];
});

const startStateId = computed(() => {
  return currentStepData.value?.start ?? props.data.start;
});

const acceptStateId = computed(() => {
  return currentStepData.value?.accept ?? props.data.accept;
});

watch([containerRef, displayedStates], () => {
  if (containerRef.value) {
    renderGraph();
  }
}, { deep: true });

function getNodePosition(
  stateId: number,
  states: NFAState[],
  startId: number,
  acceptId: number,
  width: number,
  height: number
): { x: number; y: number } {
  const padding = 60;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  if (stateId === startId) {
    return { x: padding, y: height / 2 };
  }
  if (stateId === acceptId) {
    return { x: width - padding, y: height / 2 };
  }

  const sortedIds = [...states]
    .filter(s => s.id !== startId && s.id !== acceptId)
    .map(s => s.id)
    .sort((a, b) => a - b);

  const index = sortedIds.indexOf(stateId);
  if (index === -1) {
    return { x: width / 2, y: height / 2 };
  }

  const total = sortedIds.length;
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);

  const x = padding + (usableWidth / (cols + 1)) * (col + 1);
  const y = padding + (usableHeight / (rows + 1)) * (row + 1);

  return { x, y };
}

function renderGraph() {
  if (!svgRef.value || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = Math.max(400, containerRef.value.clientHeight);

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  svg.attr('width', width).attr('height', height);

  const states = displayedStates.value;
  const startId = startStateId.value;
  const acceptId = acceptStateId.value;

  const defs = svg.append('defs');

  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 28)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#4facfe');

  defs.append('marker')
    .attr('id', 'arrowhead-epsilon')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 28)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#ffa502');

  defs.append('marker')
    .attr('id', 'arrowhead-active')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 28)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#ffd700');

  const edges: Array<{ from: number; to: number; symbol: string; isEpsilon: boolean; isNew: boolean }> = [];
  const edgeKeySet = new Set<string>();

  for (const state of states) {
    for (const trans of state.transitions) {
      for (const target of trans.targets) {
        const key = `${state.id}-${target}-${trans.symbol}`;
        if (!edgeKeySet.has(key)) {
          edgeKeySet.add(key);
          const isNew = newTransitions.value.some(
            nt => nt.from === state.id && nt.to === target && nt.symbol === trans.symbol
          );
          edges.push({
            from: state.id,
            to: target,
            symbol: trans.symbol,
            isEpsilon: trans.symbol === 'ε',
            isNew
          });
        }
      }
    }
  }

  const edgeGroup = svg.append('g').attr('class', 'edges');

  edges.forEach((edge, index) => {
    const fromPos = getNodePosition(edge.from, states, startId, acceptId, width, height);
    const toPos = getNodePosition(edge.to, states, startId, acceptId, width, height);

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offsetX = dist > 0 ? (dx / dist) * 25 : 0;
    const offsetY = dist > 0 ? (dy / dist) * 25 : 0;

    const path = edgeGroup.append('path')
      .attr('class', 'transition-line')
      .attr('d', `M${fromPos.x + offsetX},${fromPos.y + offsetY} L${toPos.x - offsetX},${toPos.y - offsetY}`)
      .attr('stroke', edge.isEpsilon ? '#ffa502' : '#4facfe')
      .attr('stroke-width', edge.isNew ? 3 : 2)
      .attr('fill', 'none')
      .attr('marker-end', edge.isEpsilon ? 'url(#arrowhead-epsilon)' : 'url(#arrowhead)')
      .style('stroke-dasharray', '1000')
      .style('stroke-dashoffset', '1000');

    if (edge.isNew) {
      path.style('animation', `drawLine 0.8s ease-out ${index * 0.1}s forwards`);
    } else {
      path.style('stroke-dashoffset', '0');
    }

    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;

    edgeGroup.append('text')
      .attr('class', `edge-label ${edge.isEpsilon ? 'epsilon' : ''}`)
      .attr('x', midX)
      .attr('y', midY - 8)
      .attr('text-anchor', 'middle')
      .text(edge.symbol);
  });

  const nodeGroup = svg.append('g').attr('class', 'nodes');

  states.forEach((state, index) => {
    const pos = getNodePosition(state.id, states, startId, acceptId, width, height);
    const isStart = state.id === startId;
    const isAccept = state.id === acceptId;
    const isNew = newStateIds.value.has(state.id);

    const g = nodeGroup.append('g')
      .attr('class', 'nfa-node')
      .attr('transform', `translate(${pos.x},${pos.y})`);

    if (isNew) {
      g.style('opacity', '0')
        .style('transform-origin', `${pos.x}px ${pos.y}px`)
        .transition()
        .delay(index * 50)
        .duration(500)
        .style('opacity', '1')
        .style('transform', `translate(${pos.x}px,${pos.y}px) scale(1)`);
    }

    if (isAccept) {
      g.append('circle')
        .attr('r', 28)
        .attr('fill', 'transparent')
        .attr('stroke', '#2ed573')
        .attr('stroke-width', 3);
    }

    g.append('circle')
      .attr('r', 22)
      .attr('fill', isAccept ? 'rgba(46, 213, 115, 0.2)' : isStart ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.1)')
      .attr('stroke', isAccept ? '#2ed573' : isStart ? '#4facfe' : '#666')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', isAccept ? '#2ed573' : '#e0e0e0')
      .attr('font-weight', 'bold')
      .text(`S${state.id}`);

    if (isStart) {
      g.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('y', 35)
        .attr('fill', '#4facfe')
        .attr('font-size', '10px')
        .text('起始');
    }

    if (isAccept) {
      g.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('y', 35)
        .attr('fill', '#2ed573')
        .attr('font-size', '10px')
        .text('接受');
    }
  });
}

onMounted(() => {
  renderGraph();
  window.addEventListener('resize', renderGraph);
});
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 100%; position: relative;">
    <svg ref="svgRef" style="width: 100%; height: 100%;"></svg>
    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="title">{{ tooltip.title }}</div>
      <div class="content">{{ tooltip.content }}</div>
    </div>
  </div>
</template>
