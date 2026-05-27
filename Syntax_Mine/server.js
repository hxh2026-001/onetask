import express from 'express'
import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1')

const app = express()
const PORT = 3013

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())
app.use(express.static('public'))

const lexiconData = JSON.parse(fs.readFileSync(path.join(__dirname, 'lexicon.json'), 'utf8'))
const lexicon = new Map(Object.entries(lexiconData))

function lookupWord(word) {
  return lexicon.get(word)
}

function createInitialState(tokens) {
  return {
    stack: [0],
    buffer: tokens.map(function(_, i) { return i + 1 }),
    arcs: [],
    tokens: [{ id: 0, word: 'ROOT', pos: 'NN' }].concat(tokens),
    history: [],
    conflicts: [],
    errors: [],
    warnings: []
  }
}

function inferDepLabel(token, parentToken) {
  if (!parentToken) return 'dep'
  if (parentToken.pos === 'VV' && token.pos === 'PN') return 'nsubj'
  if (parentToken.pos === 'VV' && token.pos === 'N') return 'dobj'
  if (parentToken.pos === 'VV' && token.pos === 'JJ') return 'amod'
  if (parentToken.pos === 'VV' && token.pos === 'AD') return 'advmod'
  if (parentToken.pos === 'DT') return 'det'
  if (token.pos === 'VV' && parentToken.pos === 'VV') return 'ccomp'
  if (token.pos === 'CC') return 'cc'
  return 'dep'
}

function applyTransition(state, action) {
  const newState = JSON.parse(JSON.stringify(state))
  newState.arcs = state.arcs.slice()
  newState.history = state.history.slice()
  newState.history.push(action)
  newState.conflicts = state.conflicts.slice()
  newState.warnings = state.warnings.slice()
  newState.errors = state.errors.slice()

  switch (action) {
    case 'SHIFT': {
      if (newState.buffer.length === 0) return { state, success: false, action, error: 'Cannot SHIFT' }
      const tokenId = newState.buffer.shift()
      newState.stack.push(tokenId)
      break
    }
    case 'LEFT-ARC': {
      if (newState.stack.length < 2) return { state, success: false, action, error: 'Cannot LEFT-ARC' }
      const s1 = newState.stack.pop()
      const s2 = newState.stack[newState.stack.length - 1]
      const token = state.tokens[s1]
      const parentToken = state.tokens[s2]
      const label = inferDepLabel(token, parentToken)
      newState.arcs.push({ from: s2, to: s1, label })
      break
    }
    case 'RIGHT-ARC': {
      if (newState.stack.length < 2) return { state, success: false, action, error: 'Cannot RIGHT-ARC' }
      const s1 = newState.stack[newState.stack.length - 1]
      const s2 = newState.stack[newState.stack.length - 2]
      const token = state.tokens[s2]
      const parentToken = state.tokens[s1]
      const label = inferDepLabel(token, parentToken)
      newState.arcs.push({ from: s1, to: s2, label })
      newState.stack.splice(newState.stack.length - 2, 1)
      break
    }
    case 'REDUCE': {
      if (newState.stack.length < 2) return { state, success: false, action, error: 'Cannot REDUCE' }
      newState.stack.pop()
      break
    }
    case 'ROOT': {
      if (newState.stack.length < 2) return { state, success: false, action, error: 'Cannot ROOT' }
      const s1 = newState.stack.pop()
      newState.arcs.push({ from: 0, to: s1, label: 'ROOT' })
      break
    }
  }
  return { state: newState, success: true, action, conflict: false }
}

function isComplete(state) {
  return state.buffer.length === 0 && state.stack.length <= 2
}

function autoParse(tokens) {
  let currentState = createInitialState(tokens)
  const states = [JSON.parse(JSON.stringify(currentState))]
  let stepCount = 0

  while (!isComplete(currentState) && stepCount < 100) {
    const candidates = []
    if (currentState.buffer.length > 0) candidates.push('SHIFT')
    if (currentState.stack.length >= 2) candidates.push('LEFT-ARC')
    if (currentState.stack.length >= 2 && currentState.buffer.length > 0) candidates.push('RIGHT-ARC')
    if (currentState.stack.length >= 2) candidates.push('REDUCE')

    if (candidates.length === 0) break

    let action
    const stackTop = currentState.stack[currentState.stack.length - 1]
    const stackSecond = currentState.stack[currentState.stack.length - 2]
    const stackTopToken = currentState.tokens[stackTop]
    const stackSecondToken = stackSecond !== undefined ? currentState.tokens[stackSecond] : null
    
    let priorityOrder
    if (stackTopToken && stackTopToken.pos === 'VV') {
      priorityOrder = ['RIGHT-ARC', 'LEFT-ARC', 'SHIFT', 'REDUCE']
    } else if (stackSecondToken && stackSecondToken.pos === 'VV') {
      priorityOrder = ['LEFT-ARC', 'RIGHT-ARC', 'SHIFT', 'REDUCE']
    } else {
      priorityOrder = ['RIGHT-ARC', 'LEFT-ARC', 'SHIFT', 'REDUCE']
    }
    
    for (let i = 0; i < priorityOrder.length; i++) {
      const t = priorityOrder[i]
      if (candidates.indexOf(t) !== -1) {
        action = t
        break
      }
    }

    let result = applyTransition(currentState, action)
    if (!result.success) {
      const fallback = candidates.find(function(c) { return c !== action })
      if (fallback) {
        action = fallback
        result = applyTransition(currentState, action)
      } else {
        break
      }
    }

    currentState = result.state
    states.push(JSON.parse(JSON.stringify(currentState)))
    stepCount++
  }

  if (currentState.stack.length === 2 && currentState.buffer.length === 0) {
    const rootResult = applyTransition(currentState, 'ROOT')
    if (rootResult.success) {
      currentState = rootResult.state
      states.push(JSON.parse(JSON.stringify(currentState)))
    }
  }

  return {
    states,
    finalState: currentState,
    success: isComplete(currentState) && currentState.arcs.some(function(a) { return a.label === 'ROOT' })
  }
}

function tokenize(sentence) {
  const trimmed = sentence.trim()
  const hasSpaces = trimmed.includes(' ')
  let words
  
  if (hasSpaces) {
    words = trimmed.split(/\s+/)
  } else {
    words = trimmed.split('')
  }
  
  return words.map(function(word, index) {
    const pos = lookupWord(word) || 'X'
    return { id: index + 1, word, pos }
  })
}

app.post('/api/parse', function(req, res) {
  try {
    const sentence = req.body.sentence
    if (!sentence || !sentence.trim()) {
      return res.json({ success: false, error: '请输入句子' })
    }

    const tokens = tokenize(sentence)
    const parseResult = autoParse(tokens)
    const finalState = parseResult.finalState

    let localOptimumError = false
    let attentionOverflow = false
    let recursionCrash = false
    let errorType

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

    const ambiguousWords = tokens.filter(function(t) {
      return t.pos === 'N' || t.pos === 'VV' || t.word === '和' || t.word === '或'
    })
    const ambiguityDetected = ambiguousWords.length >= 2 || parseResult.success

    return res.json({
      success: parseResult.success,
      tokens: finalState.tokens.map(function(t) {
        return { id: t.id, word: t.word, pos: t.pos }
      }),
      arcs: finalState.arcs,
      states: parseResult.states.map(function(s) {
        return {
          stack: s.stack,
          buffer: s.buffer,
          arcs: s.arcs,
          history: s.history,
          conflicts: s.conflicts,
          warnings: s.warnings,
          errors: s.errors
        }
      }),
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
      error: parseResult.success ? undefined : '解析失败',
      tokenCount: tokens.length,
      arcCount: finalState.arcs.length,
      stateCount: parseResult.states.length
    })
  } catch (error) {
    return res.json({ success: false, error: error.message || '服务器内部错误' })
  }
})

app.get('/api/presets', function(req, res) {
  const presets = [
    {
      id: 1,
      name: '花园路径句',
      description: '经典的花园路径句，句法分析容易陷入局部最优',
      sentence: '旧书拍卖掉了',
      keywords: ['花园路径', '局部最优', '歧义'],
      errorType: 'local-optimum'
    },
    {
      id: 2,
      name: '中心词悬空',
      description: '中心词在句尾悬空，导致长距离依赖分析困难',
      sentence: '我看见那只狗在公园里跑',
      keywords: ['中心词悬空', '长距离依赖', '注意力溢出'],
      errorType: 'attention-overflow'
    },
    {
      id: 3,
      name: '并列结构歧义',
      description: '并列结构造成的歧义，多个可能的依存关系',
      sentence: '他和她的父母住在南京和北京',
      keywords: ['并列结构', '歧义', '多义词'],
      errorType: 'polysemy'
    },
    {
      id: 4,
      name: '长距离依赖',
      description: '主语和动词之间的长距离依赖导致栈溢出',
      sentence: '那个被银行雇佣的律师为他的客户在法庭上辩护关于复杂的金融交易案件',
      keywords: ['长距离依赖', '栈溢出', '递归崩溃'],
      errorType: 'recursion-crash'
    }
  ]
  res.json(presets)
})

app.listen(PORT, function() {
  console.log('依存句法树解析器已启动: http://localhost:' + PORT)
})
