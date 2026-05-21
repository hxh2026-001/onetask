<template>
  <div 
    class="arms-renderer"
    :class="{ 
      'error-scan-container': showError,
      'nested-chaos': nestedChaos 
    }"
    ref="rendererRef"
  >
    <div v-if="showError" class="error-scan-line"></div>
    
    <div v-if="canvasSlow" class="canvas-slow-warning">
      ⚠ Canvas 渲染性能警告：图层过多可能导致卡顿
    </div>

    <div class="arms-canvas" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
      <div
        v-for="(layer, index) in sortedLayers"
        :key="layer.id || index"
        class="layer-element"
        :class="[
          getLayerClass(layer),
          { 'dissolve-animation': layer.isNew }
        ]"
        :style="getLayerStyle(layer)"
        @click="$emit('layer-click', index)"
      >
        <component 
          :is="getShapeComponent(layer.shape)" 
          :layer="layer" 
          :showMetallic="isMetallic(layer)"
        />
      </div>
    </div>

    <div v-if="showSuccessBadge" class="success-badge badge-bounce">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="28" fill="#FFD700" stroke="#DAA520" stroke-width="3"/>
        <path d="M20 30 L27 37 L42 22" stroke="#1a1a2e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>纹章合规</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Layer } from '~/server/utils/heraldryRules'
import ShieldShape from './shapes/ShieldShape.vue'
import LionShape from './shapes/LionShape.vue'
import EagleShape from './shapes/EagleShape.vue'
import StagShape from './shapes/StagShape.vue'
import CrossShape from './shapes/CrossShape.vue'
import MulletShape from './shapes/MulletShape.vue'
import CrescentShape from './shapes/CrescentShape.vue'
import GenericShape from './shapes/GenericShape.vue'

interface Props {
  layers: Layer[]
  canvasWidth?: number
  canvasHeight?: number
  showError?: boolean
  showSuccessBadge?: boolean
  nestedChaos?: boolean
  canvasSlow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canvasWidth: 400,
  canvasHeight: 500,
  showError: false,
  showSuccessBadge: false,
  nestedChaos: false,
  canvasSlow: false
})

defineEmits(['layer-click'])

const rendererRef = ref<HTMLElement | null>(null)

const sortedLayers = computed(() => {
  return [...props.layers].sort((a, b) => {
    if (a.z_index === b.z_index) {
      return Math.random() - 0.5
    }
    return a.z_index - b.z_index
  })
})

const getShapeComponent = (shape?: string) => {
  if (!shape) return GenericShape
  const shapeMap: Record<string, any> = {
    'shield': ShieldShape,
    'shield-heater': ShieldShape,
    'shield-swiss': ShieldShape,
    'shield-per-pale': ShieldShape,
    'shield-per-pale-right': ShieldShape,
    'quarter-1': ShieldShape,
    'quarter-2': ShieldShape,
    'quarter-3': ShieldShape,
    'quarter-4': ShieldShape,
    'lion': LionShape,
    'eagle': EagleShape,
    'stag': StagShape,
    'cross': CrossShape,
    'mullet': MulletShape,
    'crescent': CrescentShape,
    'label': GenericShape,
    'bordure': GenericShape
  }
  return shapeMap[shape] || GenericShape
}

const getLayerClass = (layer: Layer) => {
  const classes: string[] = []
  if (layer.tincture === 'or' || layer.tincture === 'argent') {
    classes.push('metallic-layer')
    classes.push('parallax-layer')
  }
  return classes
}

const getLayerStyle = (layer: Layer) => {
  const style: any = {
    position: 'absolute',
    left: layer.position_x + 'px',
    top: layer.position_y + 'px',
    width: layer.width + 'px',
    height: layer.height + 'px',
    zIndex: layer.z_index,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
  return style
}

const isMetallic = (layer: Layer) => {
  return layer.tincture === 'or' || layer.tincture === 'argent'
}
</script>

<style scoped>
.arms-renderer {
  position: relative;
  background: linear-gradient(145deg, #2a2a4a 0%, #1a1a3a 100%);
  border-radius: 12px;
  border: 2px solid #3a3a5a;
  padding: 20px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.arms-canvas {
  position: relative;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: visible;
}

.layer-element:hover {
  filter: brightness(1.2);
  transform: scale(1.02);
}

.success-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
}

.success-badge span {
  color: #FFD700;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
