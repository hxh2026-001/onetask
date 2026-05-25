<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import * as d3 from 'd3';
import { MinimizedDFAData, MinimizedState, MinimizationStep } from '../types';

const props = defineProps<{
  data: MinimizedDFAData;
  currentStep: number;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const currentStepData = computed(() => {
  if (!props.data.mergeSteps || props.data.mergeSteps.length === 0) return null;
  const stepIndex = Math.min(props.currentStep, props.data.mergeSteps.length - 1);
  return props.data.mergeSteps[stepIndex];
});

const displayedStates = computed(() => {
  return props.data.states;
});

const currentPartitions = computed(() => {
  if (!currentStepData.value) return [];
  return currentStepData.value.partitions || [];
});

const mergedStateIds = computed(() => {
  if (!currentStepData.value) return new Set<number>();
  return new Set(currentStepData.value.mergedStateIds || []);
});

const newStateId = computed(() => {
  return currentStepData.value?.newStateId ?? -1;
});

watch([containerRef, displayedStates], () => {
  if (containerRef.value) {
    renderGraph();
  }
}, { deep: true });

function getNodePosition(
  stateId: number,
  states: MinimizedState[],
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
    .attr('id', 'min-arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 40)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#4facfe');

  defs.append('marker')
    .attr('id', 'min-arrowhead-merge')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 40)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#ffd700');

  if (currentPartitions.value.length > 0) {
    const partitionGroup = svg.append('g').attr('class', 'partitions');
    currentPartitions.value.forEach((partition, pIndex) => {
      if (!Array.isArray(partition)) return;
      const partitionStates = states.filter(s => partition.includes(s.id));
      if (partitionStates.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      partition.forEach(id => {
        const pos = getNodePosition(id, states, startId, acceptIds, width, height);
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      });

      if (minX === Infinity) return;

      const padding = 35;
      const rectX = minX - padding;
      const rectY = minY - padding;
      const rectWidth = maxX - minX + padding * 2;
      const rectHeight = maxY - minY + padding * 2;

      const isMerging = partition.some(id => mergedStateIds.value.has(id));

      partitionGroup.append('rect')
        .attr('x', rectX)
        .attr('y', rectY)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', isMerging ? 'rgba(255, 215, 0, 0.1)' : 'rgba(79, 172, 254, 0.05)')
        .attr('stroke', isMerging ? '#ffd700' : 'rgba(79, 172, 254, 0.3)')
        .attr('stroke-width', isMerging ? 3 : 1)
        .attr('stroke-dasharray', isMerging ? '5,5' : 'none')
        .attr('class', isMerging ? 'merge-animation' : '');
    });
  }

  const edgeGroup = svg.append('g').attr('class', 'edges');

  states.forEach((state) => {
    state.transitions.forEach(([symbol, targetId]) => {
      const fromPos = getNodePosition(state.id, states, startId, acceptIds, width, height);
      const toPos = getNodePosition(targetId, states, startId, acceptIds, width, height);

      const isNew = state.id === newStateId.value;

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offsetX = dist > 0 ? (dx / dist) * 35 : 0;
      const offsetY = dist > 0 ? (dy / dist) * 35 : 0;

      edgeGroup.append('path')
        .attr('class', 'transition-line')
        .attr('d', `M${fromPos.x + offsetX},${fromPos.y + offsetY} L${toPos.x - offsetX},${toPos.y - offsetY}`)
        .attr('stroke', isNew ? '#ffd700' : '#4facfe')
        .attr('stroke-width', isNew ? 3 : 2)
        .attr('fill', 'none')
        .attr('marker-end', isNew ? 'url(#min-arrowhead-merge)' : 'url(#min-arrowhead)')
        .style('stroke-dasharray', '1000')
        .style('stroke-dashoffset', '0');

      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;

      edgeGroup.append('text')
        .attr('class', 'edge-label')
        .attr('x', midX)
        .attr('y', midY - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', isNew ? '#ffd700' : '#4facfe')
        .text(symbol);
    });
  });

  const nodeGroup = svg.append('g').attr('class', 'nodes');

  states.forEach((state, index) => {
    const pos = getNodePosition(state.id, states, startId, acceptIds, width, height);
    const isStart = state.id === startId;
    const isAccept = acceptIds.includes(state.id);
    const isNew = state.id === newStateId.value;
    const isMerging = mergedStateIds.value.has(state.id);

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
        .attr('r', 32)
        .attr('fill', 'transparent')
        .attr('stroke', '#2ed573')
        .attr('stroke-width', 3);
    }

    g.append('circle')
      .attr('r', 26)
      .attr('fill', isAccept ? 'rgba(46, 213, 115, 0.2)' : isStart ? 'rgba(79, 172, 254, 0.3)' : isNew ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)')
      .attr('stroke', isAccept ? '#2ed573' : isStart ? '#4facfe' : isNew ? '#ffd700' : '#666')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', isAccept ? '#2ed573' : '#e0e0e0')
      .attr('font-weight', 'bold')
      .text(`M${state.id}`);

    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', 42)
      .attr('fill', '#888')
      .attr('font-size', '8px')
      .text(`{D${state.originalStates.join(',D')}}`);

    if (isAccept) {
      g.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('y', -36)
        .attr('fill', '#2ed573')
        .attr('font-size', '10px')
        .text('接受');
    }
  });

  if (props.data.equivalenceClasses.length > 0) {
    const legendGroup = svg.append('g').attr('class', 'legend');
    legendGroup.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', '#888')
      .attr('font-size', '12px')
      .text(`等价类: ${props.data.equivalenceClasses.length} 个`);

    props.data.equivalenceClasses.forEach((cls, index) => {
      legendGroup.append('text')
        .attr('x', 10)
        .attr('y', 40 + index * 18)
        .attr('fill', '#aaa')
        .attr('font-size', '10px')
        .text(`M${index}: {D${cls.join(',D')}}`);
    });
  }
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
