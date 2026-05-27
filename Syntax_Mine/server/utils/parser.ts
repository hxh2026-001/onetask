import { lookupWord } from './db'

export interface Token {
  id: number
  word: string
  pos: string
  head: number | null
  dep: string | null
  attrs?: any
}

export interface Arc {
  from: number
  to: number
  label: string
}

export interface ParseState {
  stack: number[]
  buffer: number[]
  arcs: Arc[]
  tokens: Token[]
  history: string[]
  conflicts: string[]
  errors: string[]
  warnings: string[]
}

export type Transition = 'SHIFT' | 'LEFT-ARC' | 'RIGHT-ARC' | 'REDUCE' | 'ROOT'

export interface TransitionResult {
  state: ParseState
  success: boolean
  action: Transition
  error?: string
  conflict?: boolean
  ambiguity?: boolean
}

const POS_TO_DEP: Record<string, Record<string, string>> = {
  'PN': { nsubj: 'nsubj' },
  'N': { nsubj: 'nsubj', dobj: 'dobj', attr: 'attr', conj: 'conj' },
  'VV': { root: 'root', ccomp: 'ccomp', xcomp: 'xcomp', conj: 'conj' },
  'JJ': { amod: 'amod' },
  'AD': { advmod: 'advmod' },
  'DT': { det: 'det' },
  'M': { nmod: 'nmod' },
  'CD': { numod: 'numod' },
  'P': { case: 'case', prep: 'prep' },
  'CC': { cc: 'cc', conj: 'conj' },
  'VC': { cop: 'cop' },
  'VE': { root: 'root' },
  'DEC': { mark: 'mark' },
  'AS': { asp: 'asp' },
  'Q': { discourse: 'discourse' },
  'CS': { mark: 'mark' },
  'BA': { ba: 'ba' },
  'SB': { passive: 'passive' },
  'VV*': { root: 'root', ccomp: 'ccomp' }
}

export function createInitialState(tokens: Token[]): ParseState {
  return {
    stack: [0],
    buffer: tokens.map((_, i) => i + 1),
    arcs: [],
    tokens: [{ id: 0, word: 'ROOT', pos: 'NN', head: null, dep: null }, ...tokens],
    history: [],
    conflicts: [],
    errors: [],
    warnings: []
  }
}

export function canLeftArc(state: ParseState): boolean {
  if (state.stack.length < 2) return false
  const s1 = state.stack[state.stack.length - 1]
  const s2 = state.stack[state.stack.length - 2]
  if (s2 === 0) return false
  const arcExists = state.arcs.some(a => a.from === s2 && a.to === s1)
  return !arcExists
}

export function canRightArc(state: ParseState): boolean {
  if (state.stack.length < 2) return false
  const s1 = state.stack[state.stack.length - 1]
  return state.buffer.includes(s1)
}

export function canShift(state: ParseState): boolean {
  return state.buffer.length > 0
}

export function canReduce(state: ParseState): boolean {
  if (state.stack.length < 2) return false
  const s1 = state.stack[state.stack.length - 1]
  const hasArc = state.arcs.some(a => a.to === s1)
  return hasArc
}

export function isComplete(state: ParseState): boolean {
  return state.buffer.length === 0 && state.stack.length === 2
}

function detectConflict(state: ParseState, action: Transition): { conflict: boolean, type?: string } {
  const s1 = state.stack[state.stack.length - 1]
  const s2 = state.stack[state.stack.length - 2]

  if (action === 'LEFT-ARC' && s1 !== 0) {
    const existingArcsFromS2 = state.arcs.filter(a => a.from === s2)
    if (existingArcsFromS2.length > 0) {
      return { conflict: true, type: 'multiple-head' }
    }
    const tokenS1 = state.tokens[s1]
    const existingArc = state.arcs.find(a => a.to === s1)
    if (existingArc) {
      return { conflict: true, type: 'multiple-dependency' }
    }
  }

  if (action === 'RIGHT-ARC' && s2 !== 0) {
    const existingArcsToS1 = state.arcs.filter(a => a.to === s1)
    if (existingArcsToS1.length > 0) {
      return { conflict: true, type: 'attachment-ambiguity' }
    }
  }

  return { conflict: false }
}

function inferDepLabel(token: Token, parentToken: Token | null, action: Transition): string {
  if (parentToken && parentToken.pos === 'VV' && token.pos === 'N') {
    if (action === 'LEFT-ARC') return 'nsubj'
    if (action === 'RIGHT-ARC') return 'dobj'
  }

  if (parentToken && parentToken.pos === 'VV' && token.pos === 'JJ') {
    return 'amod'
  }

  if (parentToken && parentToken.pos === 'VV' && token.pos === 'AD') {
    return 'advmod'
  }

  if (parentToken && parentToken.pos === 'DT') {
    return 'det'
  }

  if (token.pos === 'VV' && parentToken && parentToken.pos === 'VV') {
    return 'ccomp'
  }

  if (token.pos === 'CC') {
    return 'cc'
  }

  const posRules = POS_TO_DEP[token.pos]
  if (posRules) {
    for (const [key, dep] of Object.entries(posRules)) {
      if (key.startsWith('VV') && token.pos.startsWith('VV')) {
        return dep
      }
      if (key === token.pos) {
        return dep
      }
    }
  }

  return token.pos.toLowerCase()
}

export function applyTransition(state: ParseState, action: Transition): TransitionResult {
  const newState: ParseState = JSON.parse(JSON.stringify(state))
  newState.arcs = [...state.arcs]
  newState.history = [...state.history, action]
  newState.conflicts = [...state.conflicts]
  newState.warnings = [...state.warnings]
  newState.errors = [...state.errors]

  const conflictCheck = detectConflict(state, action)
  if (conflictCheck.conflict) {
    newState.conflicts.push(`${action}: ${conflictCheck.type}`)
  }

  switch (action) {
    case 'SHIFT': {
      if (!canShift(state)) {
        return { state, success: false, action, error: 'Cannot SHIFT: buffer is empty' }
      }
      const tokenId = newState.buffer.shift()!
      newState.stack.push(tokenId)
      break
    }

    case 'LEFT-ARC': {
      if (!canLeftArc(state)) {
        return { state, success: false, action, error: 'Cannot LEFT-ARC: violates Arc-Standard constraints' }
      }
      const s1 = newState.stack.pop()!
      const s2 = newState.stack[newState.stack.length - 1]
      const token = state.tokens[s1]
      const parentToken = state.tokens[s2]
      const label = inferDepLabel(token, parentToken, action)
      newState.arcs.push({ from: s2, to: s1, label })
      break
    }

    case 'RIGHT-ARC': {
      if (!canRightArc(state)) {
        return { state, success: false, action, error: 'Cannot RIGHT-ARC: violates Arc-Standard constraints' }
      }
      const s1 = newState.stack[newState.stack.length - 1]
      const token = state.tokens[s1]
      const bufferFirst = state.buffer[0]
      const childToken = bufferFirst !== undefined ? state.tokens[bufferFirst] : null
      const label = inferDepLabel(token, childToken, action)
      const s1Pop = newState.stack.pop()!
      if (newState.buffer.length > 0) {
        newState.buffer.shift()
        newState.stack.push(s1Pop)
      }
      const bufferFirstNew = state.buffer[0]
      if (bufferFirstNew !== undefined) {
        newState.arcs.push({ from: s1Pop, to: bufferFirstNew, label })
      }
      break
    }

    case 'REDUCE': {
      if (!canReduce(state)) {
        return { state, success: false, action, error: 'Cannot REDUCE: no arc to reduce' }
      }
      newState.stack.pop()
      break
    }

    case 'ROOT': {
      if (state.stack.length < 2) {
        return { state, success: false, action, error: 'Cannot add ROOT: stack too small' }
      }
      const s1 = newState.stack.pop()!
      newState.arcs.push({ from: 0, to: s1, label: 'ROOT' })
      break
    }
  }

  return {
    state: newState,
    success: true,
    action,
    conflict: conflictCheck.conflict,
    ambiguity: false
  }
}

export function autoParse(tokens: Token[], maxSteps = 100): {
  states: ParseState[]
  finalState: ParseState | null
  success: boolean
  error?: string
  ambiguityDetected?: boolean
} {
  let currentState = createInitialState(tokens)
  const states: ParseState[] = [JSON.parse(JSON.stringify(currentState))]
  let stepCount = 0

  while (!isComplete(currentState) && stepCount < maxSteps) {
    const candidates: Transition[] = []

    if (canShift(currentState)) candidates.push('SHIFT')
    if (canLeftArc(currentState)) candidates.push('LEFT-ARC')
    if (canRightArc(currentState)) candidates.push('RIGHT-ARC')
    if (canReduce(currentState)) candidates.push('REDUCE')

    if (candidates.length === 0) {
      if (currentState.buffer.length > 0) {
        return {
          states,
          finalState: currentState,
          success: false,
          error: `栈溢出: 无法完成解析，缓冲区剩余 ${currentState.buffer.length} 个词`
        }
      }
      break
    }

    let action: Transition
    if (currentState.stack.length > 4 && currentState.buffer.length > 3) {
      const hasAmbiguity = currentState.arcs.some(a =>
        a.label === 'nsubj' || a.label === 'dobj'
      )
      if (hasAmbiguity && candidates.includes('RIGHT-ARC')) {
        const result = applyTransition(currentState, 'RIGHT-ARC')
        currentState = result.state
        states.push(JSON.parse(JSON.stringify(currentState)))
        if (result.conflict) {
          return {
            states,
            finalState: currentState,
            success: true,
            ambiguityDetected: true
          }
        }
        stepCount++
        continue
      }
    }

    const priorityOrder: Transition[] = ['RIGHT-ARC', 'LEFT-ARC', 'SHIFT', 'REDUCE']
    for (const t of priorityOrder) {
      if (candidates.includes(t)) {
        action = t
        break
      }
    }
    action = candidates[0]

    const result = applyTransition(currentState, action)
    if (!result.success) {
      return {
        states,
        finalState: currentState,
        success: false,
        error: result.error
      }
    }

    currentState = result.state
    states.push(JSON.parse(JSON.stringify(currentState)))

    if (result.conflict) {
      currentState.warnings.push(`步骤 ${stepCount + 1}: 检测到冲突 - ${result.action}`)
    }

    stepCount++
  }

  if (currentState.buffer.length > 0 && currentState.stack.length === 1) {
    currentState.errors.push('解析栈崩溃: 缓冲区未完全消耗')
    return {
      states,
      finalState: currentState,
      success: false,
      error: '解析栈深度递归崩溃'
    }
  }

  return {
    states,
    finalState: currentState,
    success: isComplete(currentState)
  }
}

export function tokenize(sentence: string): Token[] {
  const words = sentence.trim().split(/\s+/)
  return words.map((word, index) => {
    const dictEntry = lookupWord(word)
    return {
      id: index + 1,
      word,
      pos: dictEntry?.pos || 'X',
      head: null,
      dep: null,
      attrs: dictEntry?.attrs ? JSON.parse(dictEntry.attrs) : {}
    }
  })
}

export function buildDepTree(state: ParseState): {
  nodes: Array<{ id: number, word: string, pos: string, x?: number, y?: number }>
  arcs: Arc[]
} {
  return {
    nodes: state.tokens.map(t => ({
      id: t.id,
      word: t.word,
      pos: t.pos
    })),
    arcs: state.arcs
  }
}
