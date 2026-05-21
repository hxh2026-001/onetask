<template>
  <div class="toolbox">
    <h3 class="panel-title">纹章元素库</h3>
    
    <div class="tool-section">
      <h4 class="section-title">盾形</h4>
      <div class="tool-grid">
        <div
          v-for="shape in fieldShapes"
          :key="shape.type"
          class="tool-item"
          draggable="true"
          @dragstart="onDragStart($event, shape)"
        >
          <div class="tool-icon">
            <svg width="40" height="40" viewBox="0 0 40 50">
              <path 
                d="M20 2 L38 8 L38 25 Q38 40 20 48 Q2 40 2 25 L2 8 Z"
                fill="#C41E3A"
                stroke="#2a2a4a"
                stroke-width="1"
              />
            </svg>
          </div>
          <span class="tool-name">{{ shape.name }}</span>
        </div>
      </div>
    </div>

    <div class="tool-section">
      <h4 class="section-title">动物图腾</h4>
      <div class="tool-grid">
        <div
          v-for="shape in chargeShapes"
          :key="shape.type"
          class="tool-item"
          draggable="true"
          @dragstart="onDragStart($event, shape)"
        >
          <div class="tool-icon">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#FFD700" stroke="#2a2a4a" stroke-width="1"/>
            </svg>
          </div>
          <span class="tool-name">{{ shape.name }}</span>
        </div>
      </div>
    </div>

    <div class="tool-section">
      <h4 class="section-title">色彩</h4>
      <div class="color-grid">
        <div
          v-for="tincture in tinctures"
          :key="tincture.code"
          class="color-item"
          :style="{ backgroundColor: tincture.hex }"
          :title="`${tincture.name} (${tincture.type === 'metal' ? '金属' : '颜色'})`"
          @click="selectTincture(tincture)"
          :class="{ 'selected': selectedTincture?.code === tincture.code }"
        >
          <span v-if="tincture.type === 'metal'" class="metal-badge">金</span>
        </div>
      </div>
    </div>

    <div class="tool-section">
      <h4 class="section-title">次子标识</h4>
      <div class="tool-grid">
        <div
          v-for="shape in cadencyShapes"
          :key="shape.type"
          class="tool-item"
          draggable="true"
          @dragstart="onDragStart($event, shape)"
        >
          <div class="tool-icon">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#1A1A1A" stroke="#2a2a4a" stroke-width="1"/>
            </svg>
          </div>
          <span class="tool-name">{{ shape.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['drag-start', 'select-tincture'])

const selectedTincture = ref<any>(null)

const fieldShapes = [
  { type: 'shield', name: '标准盾', category: 'field' },
  { type: 'shield-heater', name: 'Heater盾', category: 'field' },
  { type: 'shield-swiss', name: '瑞士盾', category: 'field' }
]

const chargeShapes = [
  { type: 'lion', name: '狮子', category: 'charge' },
  { type: 'eagle', name: '鹰', category: 'charge' },
  { type: 'stag', name: '鹿', category: 'charge' },
  { type: 'cross', name: '十字', category: 'charge' },
  { type: 'mullet', name: '星', category: 'charge' }
]

const cadencyShapes = [
  { type: 'crescent', name: '新月', category: 'cadency' },
  { type: 'label', name: '标签', category: 'cadency' },
  { type: 'bordure', name: '边框', category: 'ornament' }
]

const tinctures = [
  { code: 'or', name: '金', type: 'metal', hex: '#FFD700' },
  { code: 'argent', name: '银', type: 'metal', hex: '#E8E8E8' },
  { code: 'gules', name: '红', type: 'color', hex: '#C41E3A' },
  { code: 'azure', name: '蓝', type: 'color', hex: '#0033A0' },
  { code: 'sable', name: '黑', type: 'color', hex: '#1A1A1A' },
  { code: 'vert', name: '绿', type: 'color', hex: '#007A33' },
  { code: 'purpure', name: '紫', type: 'color', hex: '#66023C' }
]

const onDragStart = (event: DragEvent, shape: any) => {
  event.dataTransfer?.setData('application/json', JSON.stringify({
    ...shape,
    tincture: selectedTincture.value?.code,
    color_hex: selectedTincture.value?.hex
  }))
  emit('drag-start', shape)
}

const selectTincture = (tincture: any) => {
  selectedTincture.value = tincture
  emit('select-tincture', tincture)
}
</script>

<style scoped>
.toolbox {
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #3a3a5a;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3a3a5a;
}

.tool-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #aaaacc;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
}

.tool-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #FFD700;
  transform: translateY(-2px);
}

.tool-item:active {
  cursor: grabbing;
}

.tool-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-name {
  font-size: 11px;
  color: #ccccee;
  text-align: center;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-item {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.selected {
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.metal-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: rgba(255, 215, 0, 0.9);
  color: #1a1a2e;
  font-size: 9px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
