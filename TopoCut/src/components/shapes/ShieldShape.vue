<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 400 500"
    :style="{ filter: showMetallic ? 'url(#metallicGlow)' : 'none' }"
  >
    <defs>
      <filter id="metallicGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" :style="{ stopColor: layer.color_hex || '#C41E3A', stopOpacity: 1 }"/>
        <stop offset="50%" :style="{ stopColor: layer.color_hex || '#C41E3A', stopOpacity: 0.9 }"/>
        <stop offset="100%" :style="{ stopColor: layer.color_hex || '#C41E3A', stopOpacity: 0.8 }"/>
      </linearGradient>
    </defs>
    
    <path 
      :d="getShieldPath(layer.shape)" 
      fill="url(#shieldGradient)"
      :stroke="showMetallic ? '#FFD700' : '#2a2a4a'"
      stroke-width="3"
    />

    <path 
      v-if="showMetallic"
      :d="getShieldPath(layer.shape)"
      fill="none"
      stroke="rgba(255, 255, 255, 0.3)"
      stroke-width="1"
      class="metallic-highlight"
    />
  </svg>
</template>

<script setup lang="ts">
import type { Layer } from '~/server/utils/heraldryRules'

interface Props {
  layer: Layer
  showMetallic?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showMetallic: false
})

const getShieldPath = (shape?: string) => {
  const paths: Record<string, string> = {
    'shield': 'M200 10 L380 80 L380 250 Q380 400 200 490 Q20 400 20 250 L20 80 Z',
    'shield-heater': 'M200 10 L380 60 L380 200 Q380 380 200 490 Q20 380 20 200 L20 60 Z',
    'shield-swiss': 'M200 10 L380 100 L380 300 L300 450 L200 490 L100 450 L20 300 L20 100 Z',
    'shield-per-pale': 'M200 10 L200 490 Q20 400 20 250 L20 80 Z',
    'shield-per-pale-right': 'M200 10 L380 80 L380 250 Q380 400 200 490 Z',
    'quarter-1': 'M20 80 L200 80 L200 250 L20 250 Z',
    'quarter-2': 'M200 80 L380 80 L380 250 L200 250 Z',
    'quarter-3': 'M20 250 L200 250 L200 420 Q20 380 20 250 Z',
    'quarter-4': 'M200 250 L380 250 Q380 380 200 420 Z'
  }
  return paths[shape || 'shield'] || paths['shield']
}
</script>

<style scoped>
.metallic-highlight {
  animation: metallicShine 3s linear infinite;
  stroke-dasharray: 20 10;
}
</style>
