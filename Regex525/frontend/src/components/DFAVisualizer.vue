<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import * as d3 from 'd3';
import { DFAData, DFAState, DFABuildStep } from '../types';

const props = defineProps<{
  data: DFAData;
  currentStep: number;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const currentStepData = computed(() => {
  if (!props.data.buildSteps || props.data.buildSteps.length === 0) return null;
  const stepIndex = Math.min(props.currentStep, props.data.buildSteps.length - 1);
  return props.data.buildSteps[stepIndex];
});

const displayedStates = computed(() => {
  if (!currentStepData.value) return props.data.states;
  const stepStates = currentStepData.value.dfaStates;
  if (!stepStates || stepStates.length === 0) return props.data.states;
  return stepStates;
});

const epsilonClosureSteps = computed(() => {
  if (!currentStepData.value) return [];
  return currentStepData.value.epsilonClosureSteps || [];
});

const newStateId = computed(() => {
  return currentStepData.value?.newStateId ?? -1;
});

const transitionDetails = computed(() => {
  return currentStepData.value?.transitionDetails || [];
});

watch([containerRef, displayedStates], () => {
  if (containerRef.value) {
    renderGraph();
  }
}, { deep: true });

function getNodePosition(
  stateId: number,
  states: DFAState[],
  startId: number,
  acceptIds: number[],
  width: number,
  height: number
): { x: number; y: number } {
  const padding = 60;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  if (stateId === startId) {
    return { x: padding, y: height / 2 };
  }
  if (acceptIds.includes(stateId)) {
    const acceptIndex = acceptIds.indexOf(stateId);
    const acceptCount = acceptIds.length;
    const x = width - padding;
    const y = padding + (usableHeight / (acceptCount + 1)) * (acceptIndex + 1);
    return { x, y };
  }

  const nonSpecialStates = states.filter(
    s => s.id !== startId && !acceptIds.includes(s.id)
  );
  const sortedIds = nonSpecialStates.map(s => s.id).sort((a, b) => a - b);

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
  const startId = props.data.start;
  const acceptIds = props.data.acceptStates;

  const defs = svg.append('defs');

  defs.append('marker')
    .attr('id', 'dfa-arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 35)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#4facfe');

  defs.append('marker')
    .attr('id', 'dfa-arrowhead-new')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 35)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#ffd700');

  if (epsilonClosureSteps.value.length > 0) {
    const waveGroup = svg.append('g').attr('class', 'epsilon-waves');
    epsilonClosureSteps.value.forEach((ecs, index) => {
      const waveCircle = waveGroup.append('circle')
        .attr('cx', () => {
          const fromState = states.find(s => s.nfaStates.includes(ecs.fromState));
          if (fromState) {
            const pos = getNodePosition(fromState.id, states, startId, acceptIds, width, height);
            return pos.x;
          }
          return width / 2;
        })
        .attr('cy', () => {
          const fromState = states.find(s => s.nfaStates.includes(ecs.fromState));
          if (fromState) {
            const pos = getNodePosition(fromState.id, states, startId, acceptIds, width, height);
            return pos.y;
          }
          return height / 2;
        })
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', '#ffa502')
        .attr('stroke-width', 2)
        .attr('class', 'epsilon-wave')
        .style('animation', `waveExpand 1s ease-out ${index * 0.2}s forwards`);
    });
  }

  const edgeGroup = svg.append('g').attr('class', 'edges');

  states.forEach((state) => {
    state.transitions.forEach(([symbol, targetId]) => {
      const fromPos = getNodePosition(state.id, states, startId, acceptIds, width, height);
      const toPos = getNodePosition(targetId, states, startId, acceptIds, width, height);

      const isNewTransition = transitionDetails.value.some(
        td => td.from === state.id && td.to === targetId && td.symbol === symbol
      );

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offsetX = dist > 0 ? (dx / dist) * 30 : 0;
      const offsetY = dist > 0 ? (dy / dist) * 30 : 0;

      const path = edgeGroup.append('path')
        .attr('class', 'transition-line')
        .attr('d', `M${fromPos.x + offsetX},${fromPos.y + offsetY} L${toPos.x - offsetX},${toPos.y - offsetY}`)
        .attr('stroke', isNewTransition ? '#ffd700' : '#4facfe')
        .attr('stroke-width', isNewTransition ? 3 : 2)
        .attr('fill', 'none')
        .attr('marker-end', isNewTransition ? 'url(#dfa-arrowhead-new)' : 'url(#dfa-arrowhead)')
        .style('stroke-dasharray', '1000')
        .style('stroke-dashoffset', '1000');

      if (isNewTransition) {
        path.style('animation', 'drawLine 0.8s ease-out forwards');
      } else {
        path.style('stroke-dashoffset', '0');
      }

      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;

      edgeGroup.append('text')
        .attr('class', 'edge-label')
        .attr('x', midX)
        .attr('y', midY - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', isNewTransition ? '#ffd700' : '#4facfe')
        .text(symbol);
    });
  });

  const nodeGroup = svg.append('g').attr('class', 'nodes');

  states.forEach((state, index) => {
    const pos = getNodePosition(state.id, states, startId, acceptIds, width, height);
    const isStart = state.id === startId;
    const isAccept = acceptIds.includes(state.id);
    const isNew = state.id === newStateId.value;

    const g = nodeGroup.append('g')
      .attr('class', 'nfa-node')
      .attr('transform', `translate(${pos.x},${pos.y})`);

    if (isNew) {
      g.style('opacity', '0')
        .transition()
        .delay(index * 50)
        .duration(500)
        .style('opacity', '1');
    }

    if (isAccept) {
      g.append('circle')
        .attr('r', 30)
        .attr('fill', 'transparent')
        .attr('stroke', '#2ed573')
        .attr('stroke-width', 3);
    }

    g.append('circle')
      .attr('r', 24)
      .attr('fill', isAccept ? 'rgba(46, 213, 115, 0.2)' : isStart ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.1)')
      .attr('stroke', isAccept ? '#2ed573' : isStart ? '#4facfe' : '#666')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', isAccept ? '#2ed573' : '#e0e0e0')
      .attr('font-weight', 'bold')
      .text(`D${state.id}`);

    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', 38)
      .attr('fill', '#888')
      .attr('font-size', '9px')
      .text(`{${state.nfaStates.join(',')}}`);

    if (isAccept) {
      g.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('y', -32)
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
  </div>
</template>
