<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 200 200"
    :style="{ filter: showMetallic ? 'url(#eagleGlow)' : 'none' }"
  >
    <defs>
      <filter id="eagleGlow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g :fill="layer.color_hex || '#FFD700'" stroke="#1a1a2e" stroke-width="1.5">
      <path d="M100 20 C120 20 140 40 140 60 C140 80 120 100 100 100 C80 100 60 80 60 60 C60 40 80 20 100 20 Z"/>
      
      <path d="M100 60 L100 100 L80 120 L100 110 L120 120 Z"/>
      
      <path d="M60 80 C30 70 10 90 20 120 C25 130 40 125 60 110 L60 80 Z"/>
      <path d="M140 80 C170 70 190 90 180 120 C175 130 160 125 140 110 L140 80 Z"/>
      
      <path d="M70 120 L50 160 L70 150 L60 170 L80 140 Z"/>
      <path d="M130 120 L150 160 L130 150 L140 170 L120 140 Z"/>
      
      <circle cx="85" cy="55" r="5" fill="#1a1a2e"/>
      <circle cx="115" cy="55" r="5" fill="#1a1a2e"/>
      
      <path d="M95 70 Q100 75 105 70" fill="none" stroke="#1a1a2e" stroke-width="2"/>
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
