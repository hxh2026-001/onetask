<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { buildAutomaton, getPresets, getHistory, deleteHistory, clearHistory, matchPattern } from './api';
import {
  BuildResponse,
  PresetScenario,
  RegexHistory,
  VisualizationMode,
  MatchStep
} from './types';
import NFAVisualizer from './components/NFAVisualizer.vue';
import DFAVisualizer from './components/DFAVisualizer.vue';
import MinimizedDFAVisualizer from './components/MinimizedDFAVisualizer.vue';
import MatchProcessVisualizer from './components/MatchProcessVisualizer.vue';

const pattern = ref('');
const testText = ref('');
const isBuilding = ref(false);
const buildResponse = ref<BuildResponse | null>(null);
const presets = ref<PresetScenario[]>([]);
const history = ref<RegexHistory[]>([]);
const currentMode = ref<VisualizationMode>('nfa');
const currentBuildStep = ref(0);
const isPlaying = ref(false);
const playSpeed = ref(1000);
const matchEngine = ref<'nfa' | 'dfa' | 'minimized-dfa'>('nfa');
const matchSteps = ref<MatchStep[]>([]);
const currentMatchStep = ref(0);
const isMatchPlaying = ref(false);

let playInterval: ReturnType<typeof setInterval> | null = null;
let matchPlayInterval: ReturnType<typeof setInterval> | null = null;

const totalBuildSteps = computed(() => {
  if (!buildResponse.value) return 0;
  if (currentMode.value === 'nfa') {
    return buildResponse.value.nfa.buildSteps.length;
  } else if (currentMode.value === 'dfa') {
    return buildResponse.value.dfa.buildSteps.length;
  } else {
    return buildResponse.value.minimizedDfa.mergeSteps.length;
  }
});

const currentStepDescription = computed(() => {
  if (!buildResponse.value) return '';
  if (currentMode.value === 'nfa') {
    return buildResponse.value.nfa.buildSteps[currentBuildStep.value]?.description || '';
  } else if (currentMode.value === 'dfa') {
    return buildResponse.value.dfa.buildSteps[currentBuildStep.value]?.description || '';
  } else {
    return buildResponse.value.minimizedDfa.mergeSteps[currentBuildStep.value]?.description || '';
  }
});

const totalMatchSteps = computed(() => matchSteps.value.length);

const currentMatchDescription = computed(() => {
  const step = matchSteps.value[currentMatchStep.value];
  if (!step) return '';
  if (step.isBacktrack) {
    return `回溯: 在位置 ${step.inputIndex} 字符 "${step.currentChar}" 处回溯`;
  }
  if (step.transition) {
    return `状态 ${step.transition.from} --"${step.transition.symbol}"--> 状态 ${step.transition.to}`;
  }
  return `初始状态: 状态 ${step.currentState}`;
});

onMounted(async () => {
  try {
    const [presetsRes, historyRes] = await Promise.all([getPresets(), getHistory()]);
    presets.value = presetsRes.presets;
    history.value = historyRes.history;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
});

watch(currentMode, () => {
  currentBuildStep.value = 0;
  stopPlaying();
});

async function handleBuild() {
  if (!pattern.value.trim()) return;

  isBuilding.value = true;
  stopPlaying();
  stopMatchPlaying();

  try {
    const response = await buildAutomaton(pattern.value, testText.value);
    buildResponse.value = response;
    currentBuildStep.value = 0;
    matchSteps.value = response.matchResult.steps || [];
    currentMatchStep.value = 0;

    const historyRes = await getHistory();
    history.value = historyRes.history;
  } catch (error) {
    console.error('Build failed:', error);
    alert('构建失败: ' + (error as Error).message);
  } finally {
    isBuilding.value = false;
  }
}

function loadPreset(preset: PresetScenario) {
  pattern.value = preset.pattern;
  testText.value = preset.testText;
  currentMode.value = 'nfa';
}

function loadHistoryItem(item: RegexHistory) {
  pattern.value = item.pattern;
  testText.value = item.testText;
}

async function handleDeleteHistory(id: number) {
  await deleteHistory(id);
  const res = await getHistory();
  history.value = res.history;
}

async function handleClearHistory() {
  await clearHistory();
  history.value = [];
}

function playSteps() {
  if (isPlaying.value) {
    stopPlaying();
    return;
  }

  isPlaying.value = true;
  playInterval = setInterval(() => {
    if (currentBuildStep.value < totalBuildSteps.value - 1) {
      currentBuildStep.value++;
    } else {
      stopPlaying();
    }
  }, playSpeed.value);
}

function stopPlaying() {
  isPlaying.value = false;
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

function stepForward() {
  if (currentBuildStep.value < totalBuildSteps.value - 1) {
    currentBuildStep.value++;
  }
}

function stepBackward() {
  if (currentBuildStep.value > 0) {
    currentBuildStep.value--;
  }
}

function resetSteps() {
  currentBuildStep.value = 0;
  stopPlaying();
}

function playMatch() {
  if (isMatchPlaying.value) {
    stopMatchPlaying();
    return;
  }

  isMatchPlaying.value = true;
  matchPlayInterval = setInterval(() => {
    if (currentMatchStep.value < totalMatchSteps.value - 1) {
      currentMatchStep.value++;
    } else {
      stopMatchPlaying();
    }
  }, playSpeed.value);
}

function stopMatchPlaying() {
  isMatchPlaying.value = false;
  if (matchPlayInterval) {
    clearInterval(matchPlayInterval);
    matchPlayInterval = null;
  }
}

function stepMatchForward() {
  if (currentMatchStep.value < totalMatchSteps.value - 1) {
    currentMatchStep.value++;
  }
}

function stepMatchBackward() {
  if (currentMatchStep.value > 0) {
    currentMatchStep.value--;
  }
}

function resetMatch() {
  currentMatchStep.value = 0;
  stopMatchPlaying();
}

async function runMatchWithEngine(engine: 'nfa' | 'dfa' | 'minimized-dfa') {
  if (!pattern.value.trim() || !testText.value.trim()) return;

  try {
    const result = await matchPattern(pattern.value, testText.value, engine);
    matchEngine.value = engine;
    matchSteps.value = result.matchResult.steps || [];
    currentMatchStep.value = 0;
  } catch (error) {
    console.error('Match failed:', error);
  }
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div>
        <h1>正则表达式引擎内部机制可视化系统</h1>
        <div class="subtitle">
          Thompson 构造法 → 子集构造法 → DFA 最小化 → 匹配执行
        </div>
      </div>
    </header>

    <div class="main-content">
      <aside class="input-panel">
        <div>
          <div class="panel-title">正则表达式输入</div>
          <div class="input-group">
            <label>正则表达式</label>
            <textarea
              v-model="pattern"
              rows="2"
              placeholder="例如: (a|b)*c"
              @keyup.enter.ctrl="handleBuild"
            ></textarea>
          </div>
          <div class="input-group">
            <label>待匹配文本</label>
            <textarea
              v-model="testText"
              rows="4"
              placeholder="输入要匹配的文本"
            ></textarea>
          </div>
          <button class="build-btn" :disabled="isBuilding" @click="handleBuild">
            {{ isBuilding ? '构建中...' : '构建并可视化' }}
          </button>
        </div>

        <div>
          <div class="panel-title">预设场景</div>
          <div class="preset-buttons">
            <button
              v-for="preset in presets"
              :key="preset.id"
              class="preset-btn"
              @click="loadPreset(preset)"
            >
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-desc">{{ preset.description }}</div>
            </button>
          </div>
        </div>
      </aside>

      <main class="visualization-area">
        <div class="visualization-tabs">
          <button
            class="tab-btn"
            :class="{ active: currentMode === 'nfa' }"
            @click="currentMode = 'nfa'"
          >
            NFA 构建过程
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentMode === 'dfa' }"
            @click="currentMode = 'dfa'"
          >
            DFA 转换过程
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentMode === 'minimized' }"
            @click="currentMode = 'minimized'"
          >
            DFA 最小化
          </button>
        </div>

        <div class="visualization-container">
          <div class="svg-container">
            <NFAVisualizer
              v-if="buildResponse && currentMode === 'nfa'"
              :data="buildResponse.nfa"
              :current-step="currentBuildStep"
            />
            <DFAVisualizer
              v-else-if="buildResponse && currentMode === 'dfa'"
              :data="buildResponse.dfa"
              :current-step="currentBuildStep"
            />
            <MinimizedDFAVisualizer
              v-else-if="buildResponse && currentMode === 'minimized'"
              :data="buildResponse.minimizedDfa"
              :current-step="currentBuildStep"
            />
            <div v-else class="empty-state">
              <div class="icon">⚙️</div>
              <div class="message">输入正则表达式并点击"构建并可视化"开始</div>
            </div>
          </div>

          <div v-if="buildResponse" class="control-panel">
            <button
              class="control-btn"
              :disabled="currentBuildStep === 0"
              @click="stepBackward"
            >
              ◀
            </button>
            <button
              class="control-btn"
              @click="playSteps"
            >
              {{ isPlaying ? '⏸' : '▶' }}
            </button>
            <button
              class="control-btn"
              :disabled="currentBuildStep >= totalBuildSteps - 1"
              @click="stepForward"
            >
              ▶
            </button>
            <button
              class="control-btn"
              @click="resetSteps"
            >
              ⏮
            </button>

            <span class="step-indicator">
              {{ currentBuildStep + 1 }} / {{ totalBuildSteps }}
            </span>

            <div class="speed-control">
              <label>速度:</label>
              <input
                type="range"
                v-model.number="playSpeed"
                min="200"
                max="3000"
                step="100"
              />
            </div>

            <div class="step-description">
              {{ currentStepDescription }}
            </div>
          </div>

          <div v-if="buildResponse && matchSteps.length > 0" class="match-panel">
            <div class="match-result">
              <span
                class="match-status"
                :class="buildResponse.matchResult.success ? 'success' : 'fail'"
              >
                {{ buildResponse.matchResult.success ? '匹配成功' : '匹配失败' }}
              </span>
              <span class="match-info" v-if="buildResponse.matchResult.success">
                匹配: "{{ buildResponse.matchResult.matchedText }}"
                ({{ buildResponse.matchResult.matchStart }}-{{ buildResponse.matchResult.matchEnd }})
              </span>
            </div>

            <button
              class="control-btn"
              :disabled="currentMatchStep === 0"
              @click="stepMatchBackward"
            >
              ◀
            </button>
            <button
              class="control-btn"
              @click="playMatch"
            >
              {{ isMatchPlaying ? '⏸' : '▶' }}
            </button>
            <button
              class="control-btn"
              :disabled="currentMatchStep >= totalMatchSteps - 1"
              @click="stepMatchForward"
            >
              ▶
            </button>
            <button
              class="control-btn"
              @click="resetMatch"
            >
              ⏮
            </button>

            <span class="step-indicator">
              {{ currentMatchStep + 1 }} / {{ totalMatchSteps }}
            </span>

            <div class="step-description">
              {{ currentMatchDescription }}
            </div>
          </div>
        </div>
      </main>

      <aside class="history-panel">
        <div class="panel-title">历史记录</div>
        <button
          class="control-btn"
          style="width: 100%; margin-bottom: 8px;"
          @click="handleClearHistory"
        >
          清空历史
        </button>
        <div class="history-list">
          <div
            v-for="item in history"
            :key="item.id"
            class="history-item"
            @click="loadHistoryItem(item)"
          >
            <div class="pattern">{{ item.pattern }}</div>
            <div class="text">{{ item.testText }}</div>
            <div class="time">{{ new Date(item.createdAt).toLocaleString() }}</div>
            <button
              class="control-btn"
              style="margin-top: 6px; padding: 4px 8px; font-size: 11px;"
              @click.stop="handleDeleteHistory(item.id)"
            >
              删除
            </button>
          </div>
          <div v-if="history.length === 0" class="empty-state">
            <div class="icon">📋</div>
            <div class="message">暂无历史记录</div>
          </div>
        </div>
      </aside>
    </div>

    <MatchProcessVisualizer
      v-if="buildResponse"
      :test-text="testText"
      :match-result="buildResponse.matchResult"
      :current-step="currentMatchStep"
      :engine="matchEngine"
    />
  </div>
</template>
