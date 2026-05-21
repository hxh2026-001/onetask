<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 100 100"
    :style="{ filter: showMetallic ? 'url(#crescentGlow)' : 'none' }"
  >
    <defs>
      <filter id="crescentGlow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <path 
      d="M80 50 C80 25 60 10 40 10 C15 10 0 30 0 50 C0 70 15 90 40 90 C60 90 80 75 80 50 Z M60 50 C60 35 50 25 40 25 C25 25 15 35 15 50 C15 65 25 75 40 75 C50 75 60 65 60 50 Z"
      :fill="layer.color_hex || '#1A1A1A'"
      stroke="#1a1a2e"
      stroke-width="2"
      fill-rule="evenodd"
    />
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
