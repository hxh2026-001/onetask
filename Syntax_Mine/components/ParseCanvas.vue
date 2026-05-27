<template>
  <div class="parse-canvas" ref="canvasContainer">
    <svg ref="svgRef" @mousemove="handleMouseMove" @mouseup="handleMouseUp">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3498db" />
        </marker>
        <marker id="arrowhead-root" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#e74c3c" />
        </marker>
        <marker id="arrowhead-conflict" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f39c12" />
        </marker>
      </defs>

      <g ref="contentGroup">
        <path
          v-for="(arc, idx) in arcs"
          :key="'arc-' + idx"
          :d="getArcPath(arc)"
          :class="[
            'arc-line',
            arc.label,
            {
              'arc-animate': animationEnabled,
              'local-optimum-error': errorType === 'local-optimum' && arc.label === 'nsubj',
              'attention-overflow': errorType === 'attention-overflow' && arc.label === 'dobj',
              'spring-vibrate': errorType === 'recursion-crash' && isLongArc(arc)
            }
          ]"
          :stroke="getArcColor(arc.label)"
          :stroke-dasharray="arc.label === 'ROOT' ? '8 4' : 'none'"
          :marker-end="getMarkerUrl(arc)"
          :style="{ animationDelay: animationEnabled ? (idx * 0.15) + 's' : '0s' }"
        />

        <text
          v-for="arc in arcs"
          :key="'arc-label-' + arc.from + '-' + arc.to"
          :x="getArcLabelPosition(arc).x"
          :y="getArcLabelPosition(arc).y"
          class="arc-label"
          fill="#f39c12"
          font-size="12"
          text-anchor="middle"
        >
          {{ arc.label }}
        </text>

        <g
          v-for="node in nodes"
          :key="'node-' + node.id"
          :class="[
            'word-node',
            {
              'attention-overflow': errorType === 'attention-overflow' && node.id > 5,
              'recursion-crash': errorType === 'recursion-crash' && node.id > 8
            }
          ]"
          :transform="`translate(${node.x || 0}, ${node.y || 0})`"
          @mousedown="startDrag($event, node)"
        >
          <circle
            :r="node.id === 0 ? 30 : 25"
            :class="{ 'conflict-flash': isConflictNode(node.id) }"
          />
          <text y="-5" class="word-text">{{ node.word }}</text>
          <text y="12" class="pos-tag">[{{ node.pos }}]</text>
        </g>
      </g>

      <g v-if="showStamp" class="stamp-container" :transform="stampPosition">
        <g class="stamp">
          <circle r="40" />
          <text y="5">{{ stampText }}</text>
        </g>
      </g>
    </svg>

    <div v-if="tooltip.show" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Arc {
  from: number
  to: number
  label: string
}

interface Node {
  id: number
  word: string
  pos: string
  x?: number
  y?: number
}

interface Tooltip {
  show: boolean
  x: number
  y: number
  text: string
}

const props = defineProps<{
  nodes: Node[]
  arcs: Arc[]
  animationEnabled?: boolean
  errorType?: string
  conflictNodes?: number[]
}>()

const emit = defineEmits<{
  (e: 'node-drag', nodeId: number, x: number, y: number): void
}>()

const svgRef = ref<SVGSVGElement>()
const contentGroup = ref<SVGGElement>()
const canvasContainer = ref<HTMLDivElement>()
const showStamp = ref(false)
const stampText = ref('解析完成')
const stampPosition = ref('translate(0, 0)')

const tooltip = ref<Tooltip>({
  show: false,
  x: 0,
  y: 0,
  text: ''
})

const draggedNode = ref<{ id: number; startX: number; startY: number } | null>(null)

const width = ref(800)
const height = ref(500)

const nodePositions = computed(() => {
  const positions: Record<number, { x: number; y: number }> = {}
  const nodeCount = props.nodes.length

  if (nodeCount === 0) return positions

  const startX = 80
  const startY = height.value - 100
  const spacing = Math.min((width.value - 160) / Math.max(nodeCount - 1, 1), 100)

  const sortedNodes = [...props.nodes].sort((a, b) => a.id - b.id)

  sortedNodes.forEach((node, index) => {
    positions[node.id] = {
      x: startX + index * spacing,
      y: startY - Math.abs(node.id % 3) * 50
    }
  })

  return positions
})

const arcs = computed(() => {
  return props.arcs.map(arc => ({
    ...arc,
    fromPos: nodePositions.value[arc.from],
    toPos: nodePositions.value[arc.to]
  }))
})

watch(() => props.nodes, (newNodes) => {
  if (newNodes.length > 0) {
    calculateNodePositions()
  }
}, { immediate: true, deep: true })

function calculateNodePositions() {
  const nodes = props.nodes
  const count = nodes.length
  if (count === 0) return

  const svgWidth = width.value
  const svgHeight = height.value

  const startX = 60
  const endX = svgWidth - 60
  const startY = svgHeight - 80
  const endY = 80

  const step = (endX - startX) / Math.max(count - 1, 1)

  const sortedNodes = [...nodes].sort((a, b) => a.id - b.id)
  sortedNodes.forEach((node, index) => {
    node.x = startX + index * step
    node.y = endY + (index % 3) * 30
  })

  const rootIndex = sortedNodes.findIndex(n => n.id === 0)
  if (rootIndex !== -1) {
    sortedNodes[rootIndex].x = svgWidth / 2
    sortedNodes[rootIndex].y = 50
  }
}

function getArcPath(arc: any): string {
  const from = nodePositions.value[arc.from]
  const to = nodePositions.value[arc.to]

  if (!from || !to) return ''

  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const offset = Math.abs(to.x - from.x) * 0.3

  if (arc.label === 'ROOT' || arc.label === 'nsubj' || arc.label === 'dobj') {
    return `M ${from.x} ${from.y} Q ${midX} ${midY - 40} ${to.x} ${to.y}`
  }

  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
}

function getArcColor(label: string): string {
  const colors: Record<string, string> = {
    'ROOT': '#e74c3c',
    'nsubj': '#3498db',
    'dobj': '#27ae60',
    'advmod': '#9b59b6',
    'det': '#f39c12',
    'ccomp': '#e67e22',
    'amod': '#1abc9c',
    'case': '#95a5a6',
    'cc': '#e74c3c',
    'ROOT': '#c0392b'
  }
  return colors[label] || '#3498db'
}

function getMarkerUrl(arc: Arc): string {
  if (arc.label === 'ROOT') return 'url(#arrowhead-root)'
  if (arc.label === 'nsubj' || arc.label === 'dobj') return 'url(#arrowhead-conflict)'
  return 'url(#arrowhead)'
}

function getArcLabelPosition(arc: any): { x: number; y: number } {
  const from = nodePositions.value[arc.from]
  const to = nodePositions.value[arc.to]

  if (!from || !to) return { x: 0, y: 0 }

  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - 15
  }
}

function isLongArc(arc: Arc): boolean {
  const from = nodePositions.value[arc.from]
  const to = nodePositions.value[arc.to]
  if (!from || !to) return false
  return Math.abs(to.x - from.x) > 200
}

function isConflictNode(nodeId: number): boolean {
  return props.conflictNodes?.includes(nodeId) || false
}

function startDrag(event: MouseEvent, node: Node) {
  event.preventDefault()
  draggedNode.value = {
    id: node.id,
    startX: event.clientX,
    startY: event.clientY
  }
}

function handleMouseMove(event: MouseEvent) {
  if (draggedNode.value) {
    const rect = svgRef.value?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    emit('node-drag', draggedNode.value.id, x, y)
  }
}

function handleMouseUp() {
  draggedNode.value = null
}

function showStampAnimation(text: string = '解析完成', success: boolean = true) {
  stampText.value = text
  showStamp.value = true

  const svgWidth = width.value
  const svgHeight = height.value
  stampPosition.value = `translate(${svgWidth / 2 - 50}, ${svgHeight / 2 - 50})`

  setTimeout(() => {
    showStamp.value = false
  }, 2000)
}

onMounted(() => {
  if (canvasContainer.value) {
    width.value = canvasContainer.value.clientWidth
    height.value = canvasContainer.value.clientHeight
  }

  window.addEventListener('resize', () => {
    if (canvasContainer.value) {
      width.value = canvasContainer.value.clientWidth
      height.value = canvasContainer.value.clientHeight
      calculateNodePositions()
    }
  })
})

defineExpose({
  showStampAnimation
})
</script>

<style scoped>
.parse-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.parse-canvas svg {
  width: 100%;
  height: 100%;
}

.word-text {
  fill: #fff;
  font-size: 14px;
  font-weight: 500;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.pos-tag {
  fill: #f39c12;
  font-size: 11px;
  text-anchor: middle;
}

.arc-label {
  font-family: 'Noto Sans SC', sans-serif;
  pointer-events: none;
}
</style>
