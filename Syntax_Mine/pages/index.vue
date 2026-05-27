<template>
  <div class="container">
    <header>
      <h1>依存句法树解析器</h1>
      <p>基于 Arc-Standard 转换系统的神经网络依存分析器</p>
    </header>

    <div class="main-panel">
      <div class="left-panel">
        <div class="panel input-section">
          <div class="panel-title">
            <span>&#x1F4DD;</span> 输入句子
          </div>
          <textarea
            v-model="inputSentence"
            placeholder="请输入自然语言句子..."
            @keydown.enter.ctrl="parseSentence"
          ></textarea>
          <div class="btn-group" style="margin-top: 15px;">
            <button class="btn btn-primary" @click="parseSentence" :disabled="isParsing">
              <span v-if="isParsing" class="spinner" style="width: 16px; height: 16px;"></span>
              <span v-else>&#x1F50D;</span>
              {{ isParsing ? '解析中...' : '开始解析' }}
            </button>
            <button class="btn btn-secondary" @click="clearAll">&#x1F5D1; 清除</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span>&#x1F4C2;</span> 预设场景
          </div>
          <div class="btn-group">
            <button
              v-for="preset in presets"
              :key="preset.id"
              class="btn btn-preset"
              :class="{ active: activePreset === preset.id }"
              @click="loadPreset(preset)"
            >
              预设{{ preset.id }}：{{ preset.name }}
            </button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span>&#x1F5FA;</span> 依存句法树
          </div>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color" style="background: #e74c3c;"></div>
              <span>ROOT</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #3498db;"></div>
              <span>nsubj</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #27ae60;"></div>
              <span>dobj</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #9b59b6;"></div>
              <span>advmod</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #f39c12;"></div>
              <span>det</span>
            </div>
          </div>
          <ParseCanvas
            ref="canvasRef"
            :nodes="displayNodes"
            :arcs="displayArcs"
            :animationEnabled="animationEnabled"
            :errorType="parseResult?.errorType"
            :conflictNodes="conflictNodes"
            @node-drag="handleNodeDrag"
          />
        </div>

        <div v-if="parseResult?.error" class="error-box">
          <h4>&#x26A0; 解析错误</h4>
          <p>{{ parseResult.error }}</p>
        </div>

        <div v-if="parseResult?.warnings?.length > 0" class="warning-box">
          <h4>&#x1F514; 解析警告</h4>
          <p v-for="(warning, idx) in parseResult.warnings" :key="idx">{{ warning }}</p>
        </div>

        <div v-if="parseResult?.ambiguityDetected" class="ambiguity-section">
          <div class="ambiguity-title">
            <span>&#x1F4A1;</span> 检测到句法歧义
          </div>
          <div class="branch-list">
            <div
              v-for="(branch, idx) in ambiguityBranches"
              :key="idx"
              class="branch-item"
              :class="{ selected: selectedBranch === idx }"
              @click="selectBranch(idx)"
            >
              <strong>分支 {{ idx + 1 }}:</strong> {{ branch.description }}
            </div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="panel">
          <div class="panel-title">
            <span>&#x1F4CA;</span> 解析状态
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ parseResult?.tokens?.length || 0 }}</div>
              <div class="stat-label">词语数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ parseResult?.arcs?.length || 0 }}</div>
              <div class="stat-label">依存弧</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ parseResult?.states?.length || 0 }}</div>
              <div class="stat-label">转换步数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" :class="{
                'error': !parseResult?.success,
                'success': parseResult?.success
              }">
                {{ parseResult?.success ? '成功' : '失败' }}
              </div>
              <div class="stat-label">解析状态</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span>&#x1F3AF;</span> 解析栈
          </div>
          <div class="parse-stack">
            <div
              v-for="(item, idx) in displayStack"
              :key="'stack-' + idx"
              class="stack-item"
              :class="{
                highlight: parseResult?.finalState?.conflicts?.length > 0 && idx === displayStack.length - 1,
                warning: parseResult?.warnings?.some((w: string) => w.includes('冲突')),
                crash: parseResult?.errorType === 'recursion-crash' && idx === displayStack.length - 1
              }"
            >
              {{ getWordById(item) }}
            </div>
            <div v-if="displayStack.length === 0" class="stack-item" style="opacity: 0.5;">
              空栈
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span>&#x1F4CB;</span> 缓冲区
          </div>
          <div class="buffer-queue">
            <div
              v-for="(item, idx) in displayBuffer"
              :key="'buffer-' + idx"
              class="buffer-item"
              :class="{ active: idx === 0 && isParsing }"
            >
              {{ getWordById(item) }}
            </div>
            <div v-if="displayBuffer.length === 0" class="buffer-item" style="opacity: 0.5;">
              空队列
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span>&#x23EA; </span> 转换历史
          </div>
          <div class="transition-history">
            <div
              v-for="(action, idx) in displayHistory"
              :key="'history-' + idx"
              class="transition-item"
            >
              <span class="action">{{ action }}</span>
              <span class="detail">{{ getTransitionDetail(idx) }}</span>
            </div>
            <div v-if="displayHistory.length === 0" style="opacity: 0.5; text-align: center; padding: 20px;">
              暂无转换记录
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            <span>&#x1F4AC;</span> 错误分析
          </div>
          <div class="info-panel">
            <div class="info-item">
              <span class="label">错误类型</span>
              <span class="value" :class="{
                'error': parseResult?.localOptimumError,
                'warning': parseResult?.attentionOverflow
              }">
                {{ getErrorTypeName() }}
              </span>
            </div>
            <div v-if="parseResult?.localOptimumError" class="info-item">
              <span class="label">局部最优</span>
              <span class="value warning">检测到</span>
            </div>
            <div v-if="parseResult?.attentionOverflow" class="info-item">
              <span class="label">注意力溢出</span>
              <span class="value warning">检测到</span>
            </div>
            <div v-if="parseResult?.recursionCrash" class="info-item">
              <span class="label">递归崩溃</span>
              <span class="value error">检测到</span>
            </div>
            <div class="info-item">
              <span class="label">歧义分支</span>
              <span class="value">{{ parseResult?.ambiguityDetected ? '存在' : '无' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Preset {
  id: number
  name: string
  description: string
  sentence: string
  keywords: string[]
  errorType?: string
}

interface ParseResult {
  success: boolean
  tokens: Array<{ id: number; word: string; pos: string }>
  arcs: Array<{ from: number; to: number; label: string }>
  states: Array<{
    stack: number[]
    buffer: number[]
    arcs: any[]
    history: string[]
    conflicts: string[]
    warnings: string[]
    errors: string[]
  }>
  finalState: {
    stack: number[]
    buffer: number[]
    arcs: any[]
    history: string[]
    conflicts: string[]
    warnings: string[]
    errors: string[]
  }
  ambiguityDetected?: boolean
  localOptimumError?: boolean
  attentionOverflow?: boolean
  recursionCrash?: boolean
  errorType?: string
  error?: string
}

interface AmbiguityBranch {
  description: string
  arcs: any[]
}

const inputSentence = ref('')
const isParsing = ref(false)
const parseResult = ref<ParseResult | null>(null)
const presets = ref<Preset[]>([])
const activePreset = ref<number | null>(null)
const selectedBranch = ref(0)
const animationEnabled = ref(true)
const conflictNodes = ref<number[]>([])

const canvasRef = ref()

const displayNodes = computed(() => {
  if (!parseResult.value?.tokens) return []
  return parseResult.value.tokens.map((t, idx) => ({
    ...t,
    x: 0,
    y: 0
  }))
})

const displayArcs = computed(() => {
  if (!parseResult.value?.arcs) return []
  return parseResult.value.arcs
})

const displayStack = computed(() => {
  return parseResult.value?.finalState?.stack || []
})

const displayBuffer = computed(() => {
  return parseResult.value?.finalState?.buffer || []
})

const displayHistory = computed(() => {
  return parseResult.value?.finalState?.history || []
})

const ambiguityBranches = computed<AmbiguityBranch[]>(() => {
  if (!parseResult.value?.ambiguityDetected) return []

  const branches: AmbiguityBranch[] = [
    {
      description: '主语优先分析',
      arcs: parseResult.value.arcs.filter((a: any) => a.label === 'nsubj')
    },
    {
      description: '宾语优先分析',
      arcs: parseResult.value.arcs.filter((a: any) => a.label === 'dobj')
    }
  ]

  if (parseResult.value.arcs.some((a: any) => a.label === 'conj')) {
    branches.push({
      description: '并列结构分析',
      arcs: parseResult.value.arcs.filter((a: any) => a.label === 'cc' || a.label === 'conj')
    })
  }

  return branches
})

function getWordById(id: number): string {
  if (id === 0) return 'ROOT'
  const token = parseResult.value?.tokens.find(t => t.id === id)
  return token?.word || `ID:${id}`
}

function getTransitionDetail(idx: number): string {
  const history = parseResult.value?.finalState?.history || []
  if (idx >= history.length) return ''

  const action = history[idx]
  const state = parseResult.value?.states[idx]

  if (!state) return ''

  const stackLen = state.stack.length
  const bufferLen = state.buffer.length

  return `栈:${stackLen} 缓冲:${bufferLen}`
}

function getErrorTypeName(): string {
  if (!parseResult.value) return '无'
  if (parseResult.value.localOptimumError) return '局部最优'
  if (parseResult.value.attentionOverflow) return '注意力溢出'
  if (parseResult.value.recursionCrash) return '递归崩溃'
  if (parseResult.value.error) return '解析失败'
  return '正常'
}

function selectBranch(idx: number) {
  selectedBranch.value = idx
}

async function loadPreset(preset: Preset) {
  activePreset.value = preset.id
  inputSentence.value = preset.sentence
  await parseSentence()
}

async function parseSentence() {
  if (!inputSentence.value.trim()) return

  isParsing.value = true
  animationEnabled.value = true
  conflictNodes.value = []

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence: inputSentence.value })
    })

    const data = await response.json()
    parseResult.value = data

    if (data.finalState?.conflicts) {
      const conflictSet = new Set<number>()
      data.finalState.conflicts.forEach((c: string) => {
        if (c.includes('LEFT-ARC')) {
          const state = data.states.find((s: any) => s.conflicts?.includes(c))
          if (state) {
            conflictSet.add(state.stack[state.stack.length - 1])
          }
        }
      })
      conflictNodes.value = Array.from(conflictSet)
    }

    setTimeout(() => {
      if (canvasRef.value) {
        if (data.success) {
          canvasRef.value.showStampAnimation('解析完成', true)
        } else {
          canvasRef.value.showStampAnimation('解析失败', false)
        }
      }
    }, 1500)

  } catch (error: any) {
    parseResult.value = {
      success: false,
      tokens: [],
      arcs: [],
      states: [],
      finalState: {
        stack: [],
        buffer: [],
        arcs: [],
        history: [],
        conflicts: [],
        warnings: [],
        errors: [error.message]
      },
      error: error.message
    }
  } finally {
    isParsing.value = false
  }
}

function clearAll() {
  inputSentence.value = ''
  parseResult.value = null
  activePreset.value = null
  selectedBranch.value = 0
  conflictNodes.value = []
}

function handleNodeDrag(nodeId: number, x: number, y: number) {
  console.log('Node dragged:', nodeId, x, y)
}

onMounted(async () => {
  try {
    const response = await fetch('/api/presets')
    presets.value = await response.json()
  } catch (error) {
    console.error('Failed to load presets:', error)
  }
})
</script>

<style scoped>
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-panel {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 25px;
  margin-top: 20px;
}

@media (max-width: 1024px) {
  .main-panel {
    grid-template-columns: 1fr;
  }
}
</style>
