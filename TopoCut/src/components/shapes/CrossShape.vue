<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 150 150"
    :style="{ filter: showMetallic ? 'url(#crossGlow)' : 'none' }"
  >
    <defs>
      <filter id="crossGlow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g :fill="layer.color_hex || '#C41E3A'" stroke="#1a1a2e" stroke-width="2">
      <rect x="55" y="10" width="40" height="130" rx="5"/>
      <rect x="10" y="55" width="130" height="40" rx="5"/>
    </g>
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
