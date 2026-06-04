import { writable } from 'svelte/store'

export interface LineSegment {
  rho: number
  theta: number
  startX: number
  startY: number
  endX: number
  endY: number
  votes: number
  isFalsePositive?: boolean
  falseReason?: string
}

export interface DetectionResult {
  edges: number[]
  accumulator: number[]
  rhoBins: number
  thetaBins: number
  lines: LineSegment[]
  imageWidth: number
  imageHeight: number
}

export interface Params {
  cannyLow: number
  cannyHigh: number
  houghThreshold: number
  ransacIter: number
  ransacDist: number
  nmsWindow: number
}

export const detectionResult = writable<DetectionResult | null>(null)
export const currentStage = writable<0 | 1 | 2 | 3>(0)
export const isDetecting = writable<boolean>(false)
export const params = writable<Params>({
  cannyLow: 50,
  cannyHigh: 150,
  houghThreshold: 80,
  ransacIter: 100,
  ransacDist: 5,
  nmsWindow: 5
})
export const activePreset = writable<string | null>(null)
