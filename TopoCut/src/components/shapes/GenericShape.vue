<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 100 100"
    :style="{ filter: showMetallic ? 'url(#genericGlow)' : 'none' }"
  >
    <defs>
      <filter id="genericGlow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <rect 
      v-if="layer.shape === 'bordure'"
      x="5" y="5" width="90" height="90"
      fill="none"
      :stroke="layer.color_hex || '#007A33'"
      stroke-width="10"
    />
    
    <rect 
      v-else-if="layer.shape === 'label'"
      x="10" y="10" width="80" height="30"
      rx="5"
      :fill="layer.color_hex || '#E8E8E8'"
      stroke="#1a1a2e"
      stroke-width="2"
    />
    
    <rect 
      v-else
      x="10" y="10" width="80" height="80"
      rx="5"
      :fill="layer.color_hex || '#C41E3A'"
      stroke="#1a1a2e"
      stroke-width="2"
    />
    
    <text 
      v-if="layer.shape === 'label'"
      x="50" y="32"
      text-anchor="middle"
      fill="#1a1a2e"
      font-size="16"
      font-weight="bold"
    >
      3
    </text>
  </svg>
</template>

<script setup lang="ts">
import type { Layer } from '~/server/utils/heraldryRules'

interface Props {
  layer: Layer
  showMetallic?: boolean
}

withDefaults(defineProps<Props>(), {
  showMetallic: false
})
</script>
