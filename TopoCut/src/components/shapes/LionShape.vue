<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 200 300"
    :style="{ filter: showMetallic ? 'url(#lionGlow)' : 'none' }"
  >
    <defs>
      <filter id="lionGlow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g :fill="layer.color_hex || '#E8E8E8'" stroke="#1a1a2e" stroke-width="1.5">
      <path d="M100 20 C140 20 170 50 170 90 L170 120 C170 140 160 150 150 150 L130 150 L130 180 L160 200 L150 220 L120 200 L120 250 L80 250 L80 200 L50 220 L40 200 L70 180 L70 150 L50 150 C40 150 30 140 30 120 L30 90 C30 50 60 20 100 20 Z"/>
      
      <circle cx="75" cy="80" r="8" fill="#1a1a2e"/>
      <circle cx="125" cy="80" r="8" fill="#1a1a2e"/>
      
      <path d="M90 110 Q100 120 110 110" fill="none" stroke="#1a1a2e" stroke-width="2"/>
      
      <path d="M100 120 L95 135 L105 135 Z" fill="#1a1a2e"/>
      
      <path d="M60 40 Q50 10 70 25 Q60 35 60 40 Z"/>
      <path d="M140 40 Q150 10 130 25 Q140 35 140 40 Z"/>
      
      <path d="M170 160 Q190 180 180 210 Q170 200 170 160 Z"/>
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
