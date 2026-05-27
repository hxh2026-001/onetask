import { defineEventHandler, readBody } from 'h3'
import { tokenize, autoParse, buildDepTree } from '../utils/parser'

export interface ParseRequest {
  sentence: string
}

export interface ParseResponse {
  success: boolean
  tokens: any[]
  arcs: any[]
  states: any[]
  finalState: any
  ambiguityDetected?: boolean
  error?: string
  localOptimumError?: boolean
  attentionOverflow?: boolean
  recursionCrash?: boolean
  errorType?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ParseRequest>(event)
    const sentence = body?.sentence?.trim()

    if (!sentence) {
      return {
        success: false,
        error: '请输入句子'
      } as ParseResponse
    }

    const tokens = tokenize(sentence)
    const parseResult = autoParse(tokens)

    const finalState = parseResult.finalState
    if (!finalState) {
      return {
        success: false,
        error: '解析失败'
      } as ParseResponse
    }

    let localOptimumError = false
    let attentionOverflow = false
    let recursionCrash = false
    let errorType: string | undefined

    if (!parseResult.success) {
      if (finalState.stack.length > 5 && finalState.buffer.length > 3) {
        localOptimumError = true
        errorType = 'local-optimum'
      }
      if (tokens.length > 15) {
        attentionOverflow = true
        errorType = 'attention-overflow'
      }
      if (finalState.buffer.length > 5) {
        recursionCrash = true
        errorType = 'recursion-crash'
      }
    }

    const ambiguousWords = tokens.filter(t =>
      t.pos === 'N' || t.pos === 'VV' || t.word === '和' || t.word === '或'
    )
    const ambiguityDetected = ambiguousWords.length >= 2 ||
      (parseResult.ambiguityDetected && parseResult.success)

    const { nodes, arcs } = buildDepTree(finalState)

    return {
      success: parseResult.success,
      tokens: nodes,
      arcs,
      states: parseResult.states.map((s: any) => ({
        stack: s.stack,
        buffer: s.buffer,
        arcs: s.arcs,
        history: s.history,
        conflicts: s.conflicts,
        warnings: s.warnings,
        errors: s.errors
      })),
      finalState: {
        stack: finalState.stack,
        buffer: finalState.buffer,
        arcs: finalState.arcs,
        history: finalState.history,
        conflicts: finalState.conflicts,
        warnings: finalState.warnings,
        errors: finalState.errors
      },
      ambiguityDetected,
      localOptimumError,
      attentionOverflow,
      recursionCrash,
      errorType,
      error: parseResult.error
    } as ParseResponse
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '服务器内部错误'
    } as ParseResponse
  }
})
