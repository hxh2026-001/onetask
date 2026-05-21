<template>
  <svg 
    :width="layer.width" 
    :height="layer.height" 
    viewBox="0 0 150 150"
    :style="{ filter: showMetallic ? 'url(#mulletGlow)' : 'none' }"
  >
    <defs>
      <filter id="mulletGlow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <polygon 
      :points="getStarPoints()"
      :fill="layer.color_hex || '#C41E3A'"
      stroke="#1a1a2e"
      stroke-width="2"
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

const getStarPoints = () => {
  const cx = 75
  const cy = 75
  const outerR = 70
  const innerR = 30
  const points: string[] = []
  
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  
  return points.join(' ')
}
</script>
