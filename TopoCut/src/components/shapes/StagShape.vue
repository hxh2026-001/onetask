<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 200 250"
    :style="{ filter: showMetallic ? 'url(#stagGlow)' : 'none' }"
  >
    <defs>
      <filter id="stagGlow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g :fill="layer.color_hex || '#FFD700'" stroke="#1a1a2e" stroke-width="1.5">
      <path d="M100 100 C140 100 160 130 160 170 L160 220 L140 220 L140 190 L120 190 L120 220 L80 220 L80 190 L60 190 L60 220 L40 220 L40 170 C40 130 60 100 100 100 Z"/>
      
      <path d="M100 100 C110 80 115 60 110 40 L125 30 L115 50 L130 40 L120 65 L105 80 Z"/>
      <path d="M100 100 C90 80 85 60 90 40 L75 30 L85 50 L70 40 L80 65 L95 80 Z"/>
      
      <ellipse cx="100" cy="130" rx="40" ry="35"/>
      
      <circle cx="80" cy="125" r="6" fill="#1a1a2e"/>
      <circle cx="120" cy="125" r="6" fill="#1a1a2e"/>
      
      <ellipse cx="100" cy="145" rx="8" ry="5" fill="#1a1a2e"/>
      
      <path d="M70 70 L65 50 L75 60 Z"/>
      <path d="M130 70 L135 50 L125 60 Z"/>
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
