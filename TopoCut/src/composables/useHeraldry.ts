import type { Layer, ValidationResult, ValidationError } from '~/server/utils/heraldryRules'

export const useHeraldry = () => {
  const layers = ref<Layer[]>([])
  const currentArms = ref<any>(null)
  const validationResult = ref<ValidationResult | null>(null)
  const historyStack = ref<Layer[][]>([])
  const redoStack = ref<Layer[][]>([])
  const showValidationSuccess = ref(false)
  const showValidationError = ref(false)
  const zIndexConflict = ref(false)
  const nestedChaos = ref(false)
  const canvasSlow = ref(false)

  const availableShapes = [
    { type: 'shield', name: '盾形', category: 'field' },
    { type: 'shield-heater', name: ' heater 盾', category: 'field' },
    { type: 'shield-swiss', name: '瑞士盾', category: 'field' },
    { type: 'lion', name: '狮子', category: 'charge' },
    { type: 'eagle', name: '鹰', category: 'charge' },
    { type: 'stag', name: '鹿', category: 'charge' },
    { type: 'cross', name: '十字', category: 'charge' },
    { type: 'mullet', name: '星', category: 'charge' },
    { type: 'crescent', name: '新月', category: 'cadency' },
    { type: 'label', name: '标签', category: 'cadency' },
    { type: 'bordure', name: '边框', category: 'ornament' }
  ]

  const availableTinctures = [
    { code: 'or', name: '金', type: 'metal', hex: '#FFD700' },
    { code: 'argent', name: '银', type: 'metal', hex: '#E8E8E8' },
    { code: 'gules', name: '红', type: 'color', hex: '#C41E3A' },
    { code: 'azure', name: '蓝', type: 'color', hex: '#0033A0' },
    { code: 'sable', name: '黑', type: 'color', hex: '#1A1A1A' },
    { code: 'vert', name: '绿', type: 'color', hex: '#007A33' },
    { code: 'purpure', name: '紫', type: 'color', hex: '#66023C' }
  ]

  const saveHistory = () => {
    historyStack.value.push(JSON.parse(JSON.stringify(layers.value)))
    redoStack.value = []
  }

  const undo = () => {
    if (historyStack.value.length > 0) {
      redoStack.value.push(JSON.parse(JSON.stringify(layers.value)))
      layers.value = historyStack.value.pop()!
      zIndexConflict.value = true
      setTimeout(() => {
        zIndexConflict.value = false
      }, 3000)
    }
  }

  const redo = () => {
    if (redoStack.value.length > 0) {
      historyStack.value.push(JSON.parse(JSON.stringify(layers.value)))
      layers.value = redoStack.value.pop()!
    }
  }

  const addLayer = (layer: Partial<Layer>) => {
    saveHistory()
    const newLayer: Layer = {
      layer_type: layer.layer_type || 'charge',
      shape: layer.shape || 'shield',
      tincture: layer.tincture,
      color_hex: layer.color_hex,
      position_x: layer.position_x || 50,
      position_y: layer.position_y || 50,
      width: layer.width || 100,
      height: layer.height || 100,
      z_index: layers.value.length,
      parent_layer_id: layer.parent_layer_id || null,
      path_data: layer.path_data
    }
    layers.value.push(newLayer)

    if (layers.value.length > 15) {
      canvasSlow.value = true
    }

    if (layers.value.some(l => l.parent_layer_id !== null)) {
      nestedChaos.value = true
    }
  }

  const updateLayer = (index: number, updates: Partial<Layer>) => {
    saveHistory()
    layers.value[index] = { ...layers.value[index], ...updates }
  }

  const removeLayer = (index: number) => {
    saveHistory()
    layers.value.splice(index, 1)
    layers.value.forEach((layer, i) => {
      layer.z_index = i
    })
  }

  const moveLayer = (fromIndex: number, toIndex: number) => {
    saveHistory()
    const [removed] = layers.value.splice(fromIndex, 1)
    layers.value.splice(toIndex, 0, removed)
    layers.value.forEach((layer, i) => {
      layer.z_index = i
    })
  }

  const validate = async () => {
    try {
      const response = await $fetch<ValidationResult>('/api/validate', {
        method: 'POST',
        body: { layers: layers.value }
      })
      validationResult.value = response

      if (response.valid) {
        showValidationSuccess.value = true
        showValidationError.value = false
        setTimeout(() => {
          showValidationSuccess.value = false
        }, 2000)
      } else {
        showValidationError.value = true
        showValidationSuccess.value = false
        setTimeout(() => {
          showValidationError.value = false
        }, 3000)
      }

      return response
    } catch (error) {
      console.error('Validation error:', error)
      return null
    }
  }

  const loadPreset = async (presetId: string) => {
    try {
      const response = await $fetch<any>('/api/presets')
      const preset = response.presets.find((p: any) => p.id === presetId)
      if (preset) {
        saveHistory()
        layers.value = JSON.parse(JSON.stringify(preset.layers))
        currentArms.value = preset.arms

        if (presetId === 'preset-1') {
          showValidationError.value = true
          setTimeout(() => showValidationError.value = false, 3000)
        }
        if (presetId === 'preset-4') {
          canvasSlow.value = true
          nestedChaos.value = true
        }
      }
    } catch (error) {
      console.error('Load preset error:', error)
    }
  }

  const saveArms = async (name: string, familyName: string) => {
    try {
      const response = await $fetch<any>('/api/arms', {
        method: 'POST',
        body: {
          name,
          family_name: familyName,
          layers: layers.value
        }
      })
      return response
    } catch (error) {
      console.error('Save arms error:', error)
      return null
    }
  }

  const clearAll = () => {
    saveHistory()
    layers.value = []
    validationResult.value = null
    canvasSlow.value = false
    nestedChaos.value = false
    zIndexConflict.value = false
  }

  return {
    layers,
    currentArms,
    validationResult,
    showValidationSuccess,
    showValidationError,
    zIndexConflict,
    nestedChaos,
    canvasSlow,
    availableShapes,
    availableTinctures,
    undo,
    redo,
    addLayer,
    updateLayer,
    removeLayer,
    moveLayer,
    validate,
    loadPreset,
    saveArms,
    clearAll
  }
}
