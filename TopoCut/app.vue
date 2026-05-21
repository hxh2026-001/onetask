<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="title-icon">⚜</span>
          纹章学规则推演系统
          <span class="title-icon">⚜</span>
        </h1>
        <p class="app-subtitle">Heraldry Rule Deduction System</p>
      </div>
    </header>

    <div class="preset-bar">
      <button 
        v-for="preset in presets"
        :key="preset.id"
        class="preset-btn"
        @click="loadPreset(preset.id)"
      >
        {{ preset.name }}
      </button>
    </div>

    <div class="main-content">
      <aside class="sidebar left-sidebar">
        <Toolbox 
          @select-tincture="selectedTincture = $event"
        />
      </aside>

      <main class="canvas-area">
        <div class="canvas-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-btn" @click="undo" title="撤销">
              ↶ 撤销
            </button>
            <button class="toolbar-btn" @click="redo" title="重做">
              ↷ 重做
            </button>
            <button class="toolbar-btn" @click="clearAll" title="清空">
              🗑 清空
            </button>
          </div>
          <div class="toolbar-right">
            <button 
              class="toolbar-btn validate-btn"
              :class="{ 'glow-animation': showValidationSuccess }"
              @click="validate"
            >
              ✓ 校验规则
            </button>
            <button class="toolbar-btn save-btn" @click="showSaveModal = true">
              💾 保存
            </button>
          </div>
        </div>

        <div 
          class="canvas-wrapper"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          :class="{ 'drag-over': isDragOver }"
        >
          <ArmsRenderer
            :layers="layers"
            :show-error="showValidationError"
            :show-success-badge="showValidationSuccess"
            :nested-chaos="nestedChaos"
            :canvas-slow="canvasSlow"
            @layer-click="selectedLayerIndex = $event"
          />
        </div>

        <div class="canvas-info">
          <span v-if="zIndexConflict" class="info-tag warning">
            ⚠ Z-index 冲突检测中...
          </span>
          <span v-if="nestedChaos" class="info-tag warning">
            ⚠ 嵌套分区渲染混乱
          </span>
          <span v-if="canvasSlow" class="info-tag warning">
            ⚠ Canvas 渲染性能警告
          </span>
          <span class="info-tag">
            图层数量: {{ layers.length }}
          </span>
        </div>
      </main>

      <aside class="sidebar right-sidebar">
        <div class="sidebar-tabs">
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'layers' }"
            @click="activeTab = 'layers'"
          >
            图层
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'properties' }"
            @click="activeTab = 'properties'"
          >
            属性
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'validation' }"
            @click="activeTab = 'validation'"
          >
            校验
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'family' }"
            @click="activeTab = 'family'"
          >
            谱系
          </button>
        </div>

        <div class="sidebar-content">
          <LayerPanel
            v-if="activeTab === 'layers'"
            :layers="layers"
            :selected-index="selectedLayerIndex"
            :z-index-conflict="zIndexConflict"
            @select-layer="selectedLayerIndex = $event"
            @remove-layer="removeLayer($event)"
            @reorder-layers="reorderLayers($event)"
          />
          
          <PropertyEditor
            v-else-if="activeTab === 'properties'"
            :layer="selectedLayer"
            @update-layer="updateSelectedLayer($event)"
          />
          
          <ValidationPanel
            v-else-if="activeTab === 'validation'"
            :validation-result="validationResult"
          />
          
          <FamilyTree
            v-else-if="activeTab === 'family'"
            :family-data="currentFamilyTree"
          />
        </div>
      </aside>
    </div>

    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-content">
        <h3>保存纹章</h3>
        <div class="form-group">
          <label>纹章名称</label>
          <input 
            v-model="saveName"
            type="text"
            class="form-input"
            placeholder="输入纹章名称"
          />
        </div>
        <div class="form-group">
          <label>家族名称</label>
          <input 
            v-model="saveFamilyName"
            type="text"
            class="form-input"
            placeholder="输入家族名称"
          />
        </div>
        <div class="modal-actions">
          <button class="btn secondary" @click="showSaveModal = false">取消</button>
          <button class="btn primary" @click="saveArmsData">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHeraldry } from '~/composables/useHeraldry'
import Toolbox from '~/components/Toolbox.vue'
import ArmsRenderer from '~/components/ArmsRenderer.vue'
import LayerPanel from '~/components/LayerPanel.vue'
import PropertyEditor from '~/components/PropertyEditor.vue'
import ValidationPanel from '~/components/ValidationPanel.vue'
import FamilyTree from '~/components/FamilyTree.vue'
import type { Layer } from '~/server/utils/heraldryRules'

const {
  layers,
  currentArms,
  validationResult,
  showValidationSuccess,
  showValidationError,
  zIndexConflict,
  nestedChaos,
  canvasSlow,
  undo,
  redo,
  addLayer,
  updateLayer,
  removeLayer,
  moveLayer,
  validate,
  loadPreset,
  saveArms,
  clearAll
} = useHeraldry()

const activeTab = ref('layers')
const selectedLayerIndex = ref(-1)
const selectedTincture = ref<any>(null)
const isDragOver = ref(false)
const showSaveModal = ref(false)
const saveName = ref('')
const saveFamilyName = ref('')
const currentFamilyTree = ref<any[]>([])

const presets = [
  { id: 'preset-1', name: '预设一：违规色彩叠压' },
  { id: 'preset-2', name: '预设二：异族通婚合并' },
  { id: 'preset-3', name: '预设三：继承权断代' },
  { id: 'preset-4', name: '预设四：复杂分区破碎' }
]

const selectedLayer = computed(() => {
  if (selectedLayerIndex.value >= 0 && selectedLayerIndex.value < layers.value.length) {
    return layers.value[selectedLayerIndex.value]
  }
  return null
})

const onDragOver = (event: DragEvent) => {
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = (event: DragEvent) => {
  isDragOver.value = false
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (data) {
      const shapeData = JSON.parse(data)
      
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const x = event.clientX - rect.left - 50
      const y = event.clientY - rect.top - 50
      
      addLayer({
        layer_type: shapeData.category || 'charge',
        shape: shapeData.type,
        tincture: shapeData.tincture || selectedTincture.value?.code || 'gules',
        color_hex: shapeData.color_hex || selectedTincture.value?.hex || '#C41E3A',
        position_x: Math.max(0, x),
        position_y: Math.max(0, y),
        width: 100,
        height: 100
      })
    }
  } catch (e) {
    console.error('Drop error:', e)
  }
}

const updateSelectedLayer = (updates: Partial<Layer>) => {
  if (selectedLayerIndex.value >= 0) {
    updateLayer(selectedLayerIndex.value, updates)
  }
}

const reorderLayers = (newLayers: Layer[]) => {
  newLayers.forEach((layer, index) => {
    layer.z_index = index
  })
  layers.value = newLayers
}

const saveArmsData = async () => {
  if (!saveName.value.trim()) {
    alert('请输入纹章名称')
    return
  }
  
  const result = await saveArms(saveName.value, saveFamilyName.value)
  if (result) {
    alert('纹章保存成功！')
    showSaveModal.value = false
    saveName.value = ''
    saveFamilyName.value = ''
  } else {
    alert('保存失败，请重试')
  }
}

onMounted(async () => {
  try {
    const response = await $fetch<any>('/api/presets')
    console.log('Presets loaded:', response.presets.length)
  } catch (e) {
    console.error('Failed to load presets:', e)
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.8) 100%);
  border-bottom: 2px solid #FFD700;
  padding: 20px;
  text-align: center;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.app-title {
  font-size: 28px;
  font-weight: bold;
  color: #FFD700;
  margin: 0;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.title-icon {
  margin: 0 10px;
  font-size: 24px;
}

.app-subtitle {
  font-size: 14px;
  color: #8a8aaa;
  margin: 8px 0 0 0;
  letter-spacing: 2px;
}

.preset-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(26, 26, 46, 0.6);
  border-bottom: 1px solid #3a3a5a;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3a3a5a 0%, #2a2a4a 100%);
  border: 1px solid #5a5a7a;
  border-radius: 8px;
  color: #e8e8e8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  background: linear-gradient(135deg, #FFD700 0%, #DAA520 100%);
  border-color: #FFD700;
  color: #1a1a2e;
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.3);
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 20px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px;
  border: 1px solid #3a3a5a;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  color: #e8e8e8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #5a5a7a;
}

.validate-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  border-color: #4CAF50;
  color: white;
}

.validate-btn:hover {
  background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
  border-color: #66BB6A;
}

.save-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border-color: #2196F3;
  color: white;
}

.save-btn:hover {
  background: linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%);
  border-color: #42A5F5;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px dashed transparent;
  transition: all 0.3s ease;
  min-height: 600px;
}

.canvas-wrapper.drag-over {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

.canvas-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.info-tag {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a5a;
  border-radius: 20px;
  font-size: 12px;
  color: #aaaacc;
}

.info-tag.warning {
  background: rgba(255, 152, 0, 0.1);
  border-color: rgba(255, 152, 0, 0.3);
  color: #FFB74D;
}

.sidebar-tabs {
  display: flex;
  gap: 4px;
  background: rgba(26, 26, 46, 0.9);
  padding: 4px;
  border-radius: 12px 12px 0 0;
  border: 1px solid #3a3a5a;
  border-bottom: none;
}

.tab-btn {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #8a8aaa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #e8e8e8;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  min-width: 400px;
  border: 1px solid #3a3a5a;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-content h3 {
  color: #FFD700;
  margin: 0 0 20px 0;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #aaaacc;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  color: #e8e8e8;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #FFD700;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #e8e8e8;
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn.primary {
  background: linear-gradient(135deg, #FFD700 0%, #DAA520 100%);
  color: #1a1a2e;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.3);
}
</style>
