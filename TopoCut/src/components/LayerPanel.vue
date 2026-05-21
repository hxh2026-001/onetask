<template>
  <div class="layer-panel">
    <h3 class="panel-title">图层列表</h3>
    <div class="layer-list">
      <VueDraggable
        v-model="localLayers"
        item-key="id"
        handle=".drag-handle"
        ghost-class="dragging"
        @end="onDragEnd"
      >
        <template #item="{ element, index }">
          <div 
            class="layer-item"
            :class="{ 'selected': selectedIndex === index, 'z-index-conflict': zIndexConflict }"
            @click="$emit('select-layer', index)"
          >
            <div class="drag-handle">⋮⋮</div>
            <div class="layer-preview">
              <div 
                class="color-swatch"
                :style="{ backgroundColor: element.color_hex || '#ccc' }"
              ></div>
            </div>
            <div class="layer-info">
              <div class="layer-name">{{ getLayerName(element) }}</div>
              <div class="layer-type">{{ element.layer_type }} · z:{{ element.z_index }}</div>
            </div>
            <button 
              class="delete-btn"
              @click.stop="$emit('remove-layer', index)"
            >
              ×
            </button>
          </div>
        </template>
      </VueDraggable>
    </div>
    
    <div v-if="layers.length === 0" class="empty-state">
      <p>暂无图层</p>
      <p class="hint">从左侧拖拽元素到画布</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Layer } from '~/server/utils/heraldryRules'

interface Props {
  layers: Layer[]
  selectedIndex: number
  zIndexConflict?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  zIndexConflict: false
})

const emit = defineEmits(['select-layer', 'remove-layer', 'reorder-layers'])

const localLayers = ref([...props.layers])

watch(() => props.layers, (newLayers) => {
  localLayers.value = [...newLayers]
}, { deep: true })

const onDragEnd = () => {
  emit('reorder-layers', localLayers.value)
}

const getLayerName = (layer: Layer) => {
  const shapeNames: Record<string, string> = {
    'shield': '盾形',
    'shield-heater': 'Heater盾',
    'shield-swiss': '瑞士盾',
    'lion': '狮子',
    'eagle': '鹰',
    'stag': '鹿',
    'cross': '十字',
    'mullet': '星',
    'crescent': '新月',
    'label': '标签',
    'bordure': '边框'
  }
  return shapeNames[layer.shape || ''] || layer.shape || '未知'
}
</script>

<style scoped>
.layer-panel {
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #3a3a5a;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3a3a5a;
}

.layer-list {
  max-height: 400px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.layer-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #5a5a7a;
}

.layer-item.selected {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
}

.drag-handle {
  cursor: grab;
  color: #6a6a8a;
  font-size: 14px;
  padding: 0 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.layer-preview {
  flex-shrink: 0;
}

.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 2px solid #3a3a5a;
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8e8e8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-type {
  font-size: 11px;
  color: #8a8aaa;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 0, 0, 0.2);
  color: #ff6666;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(255, 0, 0, 0.4);
  color: #ff4444;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6a6a8a;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state .hint {
  font-size: 12px;
  color: #5a5a7a;
}

.dragging {
  opacity: 0.5;
}
</style>
