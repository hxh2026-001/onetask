<template>
  <div class="property-editor">
    <h3 class="panel-title">属性编辑</h3>
    
    <div v-if="layer" class="property-form">
      <div class="form-group">
        <label>形状</label>
        <input 
          type="text" 
          :value="layer.shape"
          disabled
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label>类型</label>
        <input 
          type="text" 
          :value="layer.layer_type"
          disabled
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>颜色</label>
        <div class="color-picker">
          <div 
            v-for="tincture in tinctures"
            :key="tincture.code"
            class="color-swatch"
            :style="{ backgroundColor: tincture.hex }"
            :class="{ 'selected': layer.tincture === tincture.code }"
            @click="updateTincture(tincture)"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>X 位置</label>
          <input 
            type="number" 
            :value="layer.position_x"
            @input="updateProperty('position_x', $event)"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Y 位置</label>
          <input 
            type="number" 
            :value="layer.position_y"
            @input="updateProperty('position_y', $event)"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>宽度</label>
          <input 
            type="number" 
            :value="layer.width"
            @input="updateProperty('width', $event)"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>高度</label>
          <input 
            type="number" 
            :value="layer.height"
            @input="updateProperty('height', $event)"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Z 层级</label>
        <input 
          type="number" 
          :value="layer.z_index"
          @input="updateProperty('z_index', $event)"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>父图层 ID</label>
        <input 
          type="number" 
          :value="layer.parent_layer_id || ''"
          @input="updateProperty('parent_layer_id', $event)"
          class="form-input"
          placeholder="无父图层"
        />
      </div>
    </div>

    <div v-else class="empty-state">
      <p>选择一个图层以编辑属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Layer } from '~/server/utils/heraldryRules'

interface Props {
  layer: Layer | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update-layer'])

const tinctures = [
  { code: 'or', name: '金', hex: '#FFD700' },
  { code: 'argent', name: '银', hex: '#E8E8E8' },
  { code: 'gules', name: '红', hex: '#C41E3A' },
  { code: 'azure', name: '蓝', hex: '#0033A0' },
  { code: 'sable', name: '黑', hex: '#1A1A1A' },
  { code: 'vert', name: '绿', hex: '#007A33' },
  { code: 'purpure', name: '紫', hex: '#66023C' }
]

const updateTincture = (tincture: any) => {
  if (props.layer) {
    emit('update-layer', {
      tincture: tincture.code,
      color_hex: tincture.hex
    })
  }
}

const updateProperty = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = key === 'parent_layer_id' 
    ? (target.value === '' ? null : parseInt(target.value))
    : parseInt(target.value)
  
  if (props.layer) {
    emit('update-layer', { [key]: value })
  }
}
</script>

<style scoped>
.property-editor {
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

.property-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-group label {
  font-size: 12px;
  color: #aaaacc;
  font-weight: 500;
}

.form-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  color: #e8e8e8;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6a6a8a;
}

.empty-state p {
  margin: 0;
}
</style>
