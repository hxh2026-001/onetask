<template>
  <div class="family-tree">
    <h3 class="panel-title">家族谱系</h3>
    <div class="tree-container" ref="treeContainer">
      <svg :width="svgWidth" :height="svgHeight" class="tree-svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g v-for="(branch, index) in branches" :key="'branch-' + index">
          <line
            :x1="branch.x1"
            :y1="branch.y1"
            :x2="branch.x2"
            :y2="branch.y2"
            stroke="#FFD700"
            stroke-width="2"
            class="tree-branch"
            :style="{ animationDelay: (index * 0.3) + 's' }"
          />
        </g>
        
        <g v-for="(node, index) in nodes" :key="'node-' + index">
          <circle
            :cx="node.x"
            :cy="node.y"
            r="25"
            :fill="getGenerationColor(node.generation)"
            stroke="#FFD700"
            stroke-width="2"
            class="tree-node"
            :style="{ animationDelay: (index * 0.2 + 0.5) + 's' }"
          />
          <text
            :x="node.x"
            :y="node.y + 5"
            text-anchor="middle"
            fill="#e8e8e8"
            font-size="12"
            font-weight="bold"
            class="tree-node"
            :style="{ animationDelay: (index * 0.2 + 0.6) + 's' }"
          >
            {{ node.name.charAt(0) }}
          </text>
          <text
            :x="node.x"
            :y="node.y + 45"
            text-anchor="middle"
            fill="#aaaacc"
            font-size="10"
            class="tree-node"
            :style="{ animationDelay: (index * 0.2 + 0.7) + 's' }"
          >
            {{ node.name }}
          </text>
          <text
            :x="node.x"
            :y="node.y + 58"
            text-anchor="middle"
            fill="#6a6a8a"
            font-size="9"
            class="tree-node"
            :style="{ animationDelay: (index * 0.2 + 0.8) + 's' }"
          >
            第 {{ node.generation }} 代
          </text>
        </g>
      </svg>
    </div>
    
    <div v-if="!familyData || familyData.length === 0" class="empty-state">
      <p>暂无家族数据</p>
      <p class="hint">加载预设场景以查看谱系</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  familyData?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  familyData: () => []
})

const treeContainer = ref<HTMLElement | null>(null)
const svgWidth = ref(400)
const svgHeight = ref(300)

interface TreeNode {
  id: number
  name: string
  generation: number
  parentId: number | null
  x: number
  y: number
}

interface TreeBranch {
  x1: number
  y1: number
  x2: number
  y2: number
}

const nodes = ref<TreeNode[]>([])
const branches = ref<TreeBranch[]>([])

const getGenerationColor = (generation: number) => {
  const colors = ['#C41E3A', '#0033A0', '#007A33', '#66023C', '#800020']
  return colors[(generation - 1) % colors.length]
}

const calculateTreeLayout = () => {
  if (!props.familyData || props.familyData.length === 0) {
    nodes.value = []
    branches.value = []
    return
  }

  const generations = new Map<number, any[]>()
  props.familyData.forEach(person => {
    if (!generations.has(person.generation)) {
      generations.set(person.generation, [])
    }
    generations.get(person.generation)!.push(person)
  })

  const maxGen = Math.max(...Array.from(generations.keys()))
  const levelHeight = 100
  const nodeWidth = 80

  const calculatedNodes: TreeNode[] = []
  const calculatedBranches: TreeBranch[] = []

  generations.forEach((people, gen) => {
    const y = 50 + (gen - 1) * levelHeight
    const totalWidth = people.length * nodeWidth
    const startX = (svgWidth.value - totalWidth) / 2 + nodeWidth / 2

    people.forEach((person, index) => {
      const x = startX + index * nodeWidth
      calculatedNodes.push({
        id: person.id || index,
        name: person.person_name || person.name,
        generation: gen,
        parentId: person.parent_id || person.parentId,
        x,
        y
      })
    })
  })

  calculatedNodes.forEach(node => {
    if (node.parentId !== null) {
      const parentNode = calculatedNodes.find(n => n.id === node.parentId)
      if (parentNode) {
        calculatedBranches.push({
          x1: parentNode.x,
          y1: parentNode.y + 25,
          x2: node.x,
          y2: node.y - 25
        })
      }
    }
  })

  nodes.value = calculatedNodes
  branches.value = calculatedBranches
}

watch(() => props.familyData, () => {
  calculateTreeLayout()
}, { deep: true, immediate: true })

onMounted(() => {
  calculateTreeLayout()
})
</script>

<style scoped>
.family-tree {
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #3a3a5a;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3a3a5a;
}

.tree-container {
  overflow: auto;
  min-height: 300px;
}

.tree-svg {
  display: block;
  margin: 0 auto;
}

.tree-branch {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: branchGrow 1.5s ease-out forwards;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
}

.tree-node {
  opacity: 0;
  transform: scale(0);
  animation: nodeAppear 0.5s ease-out forwards;
}

@keyframes branchGrow {
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes nodeAppear {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6a6a8a;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state .hint {
  font-size: 12px;
  color: #5a5a7a;
}
</style>
