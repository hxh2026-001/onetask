export type TinctureType = 'metal' | 'color' | 'fur'

export interface TinctureInfo {
  name: string
  type: TinctureType
  hex: string
}

export const TINCTURES: Record<string, TinctureInfo> = {
  or: { name: '金', type: 'metal', hex: '#FFD700' },
  argent: { name: '银', type: 'metal', hex: '#E8E8E8' },
  gules: { name: '红', type: 'color', hex: '#C41E3A' },
  azure: { name: '蓝', type: 'color', hex: '#0033A0' },
  sable: { name: '黑', type: 'color', hex: '#1A1A1A' },
  vert: { name: '绿', type: 'color', hex: '#007A33' },
  purpure: { name: '紫', type: 'color', hex: '#66023C' },
  murrey: { name: '桑椹', type: 'color', hex: '#800020' }
}

export interface Layer {
  id?: number
  layer_type: string
  shape?: string
  tincture?: string
  color_hex?: string
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  parent_layer_id?: number | null
  path_data?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  ruleCode: string
  ruleName: string
  message: string
  layerId?: number
  severity: 'error' | 'warning'
}

export function validateTinctureRule(layers: Layer[]): ValidationResult {
  const errors: ValidationError[] = []
  const layerMap = new Map<number, Layer>()
  
  layers.forEach(layer => {
    if (layer.id !== undefined) {
      layerMap.set(layer.id, layer)
    }
  })

  layers.forEach(layer => {
    if (!layer.tincture && layer.color_hex) {
      layer.tincture = findTinctureByHex(layer.color_hex)
    }
    
    if (layer.tincture) {
      const tinctureInfo = TINCTURES[layer.tincture]
      if (tinctureInfo) {
        const parentLayer = layer.parent_layer_id ? layerMap.get(layer.parent_layer_id) : null
        if (parentLayer && parentLayer.tincture) {
          const parentInfo = TINCTURES[parentLayer.tincture]
          if (parentInfo) {
            if (tinctureInfo.type === parentInfo.type && tinctureInfo.type !== 'fur') {
              errors.push({
                ruleCode: 'TINCTURE_RULE',
                ruleName: '色彩对比律',
                message: `违反色彩对比律：${tinctureInfo.type === 'metal' ? '金属色' : '颜色色'} 不能叠加在同类${tinctureInfo.type === 'metal' ? '金属色' : '颜色色'}上`,
                layerId: layer.id,
                severity: 'error'
              })
            }
          }
        }
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

export function findTinctureByHex(hex: string): string | undefined {
  return Object.keys(TINCTURES).find(key => 
    TINCTURES[key].hex.toLowerCase() === hex.toLowerCase()
  )
}

export function validateInheritanceRule(arms: any, ancestorArms?: any): ValidationResult {
  const errors: ValidationError[] = []
  
  if (ancestorArms) {
    const hasCadencyMark = checkCadencyMark(arms.layers)
    if (!hasCadencyMark && !isFirstborn(arms)) {
      errors.push({
        ruleCode: 'INHERITANCE_RULE',
        ruleName: '继承规则',
        message: '非长子继承纹章时必须添加次子标识',
        severity: 'warning'
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function checkCadencyMark(layers: Layer[]): boolean {
  return layers.some(layer => 
    layer.shape?.includes('label') || 
    layer.shape?.includes('crescent') ||
    layer.shape?.includes('mullet')
  )
}

function isFirstborn(arms: any): boolean {
  return arms.isFirstborn === true
}

export function validateMarshalingRule(spouse1Layers: Layer[], spouse2Layers: Layer[]): ValidationResult {
  const errors: ValidationError[] = []
  
  const hasProperDivision = checkMarshalingDivision(spouse1Layers, spouse2Layers)
  
  if (!hasProperDivision) {
    errors.push({
      ruleCode: 'MARSHALING_RULE',
      ruleName: '婚姻合并规则',
      message: '婚姻合并纹章需正确分区展示夫妻双方纹章',
      severity: 'warning'
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function checkMarshalingDivision(layers1: Layer[], layers2: Layer[]): boolean {
  return layers1.length > 0 && layers2.length > 0
}

export function validateAll(layers: Layer[], options?: {
  ancestorArms?: any
  spouseLayers?: Layer[]
}): ValidationResult {
  const allErrors: ValidationError[] = []

  const tinctureResult = validateTinctureRule(layers)
  allErrors.push(...tinctureResult.errors)

  if (options?.ancestorArms) {
    const inheritanceResult = validateInheritanceRule({}, options.ancestorArms)
    allErrors.push(...inheritanceResult.errors)
  }

  if (options?.spouseLayers) {
    const marshalingResult = validateMarshalingRule(layers, options.spouseLayers)
    allErrors.push(...marshalingResult.errors)
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  }
}
