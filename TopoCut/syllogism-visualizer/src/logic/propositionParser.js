import { identifyPropositionType, extractTerms } from './syllogismEngine.js'

const MAX_PARSE_DEPTH = 20
const MAX_NESTED_PROPOSITIONS = 10

export function parseNaturalLanguage(text) {
  const result = {
    originalText: text,
    type: identifyPropositionType(text),
    terms: extractTerms(text, identifyPropositionType(text)),
    logicalForm: null,
    parseTree: null,
    ambiguities: [],
    complexity: 0
  }

  try {
    result.logicalForm = buildLogicalForm(text, result.type, result.terms)
    result.parseTree = buildParseTree(text)
    result.complexity = calculateComplexity(result.parseTree)
    
    if (result.complexity > 8) {
      result.ambiguities.push({
        type: 'high_complexity',
        message: '命题结构复杂，可能存在歧义或解析错误'
      })
    }
  } catch (error) {
    result.parseError = error.message
  }

  return result
}

export function buildLogicalForm(text, type, terms) {
  if (!terms.subject || !terms.predicate) {
    return null
  }

  const S = normalizeTerm(terms.subject)
  const P = normalizeTerm(terms.predicate)

  switch (type) {
    case 'A':
      return {
        operator: '∀',
        formula: `∀x(${S}(x) → ${P}(x))`,
        variables: ['x'],
        predicates: [S, P]
      }
    case 'E':
      return {
        operator: '∀¬',
        formula: `∀x(${S}(x) → ¬${P}(x))`,
        variables: ['x'],
        predicates: [S, P]
      }
    case 'I':
      return {
        operator: '∃',
        formula: `∃x(${S}(x) ∧ ${P}(x))`,
        variables: ['x'],
        predicates: [S, P]
      }
    case 'O':
      return {
        operator: '∃¬',
        formula: `∃x(${S}(x) ∧ ¬${P}(x))`,
        variables: ['x'],
        predicates: [S, P]
      }
    default:
      return null
  }
}

export function buildParseTree(text, depth = 0) {
  if (depth > MAX_PARSE_DEPTH) {
    throw new Error('Parse stack overflow: maximum recursion depth exceeded')
  }

  const tree = {
    nodeType: 'proposition',
    text: text,
    children: [],
    depth: depth
  }

  const connectorMatch = text.match(/(如果|若|那么|所以|因此|因为|由于|并且|而且|或者|要么|但是|然而)/)
  
  if (connectorMatch) {
    const connector = connectorMatch[0]
    const parts = text.split(connector)
    
    tree.nodeType = 'compound'
    tree.connector = connector
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim()
      if (part && part.length > 2) {
        try {
          const child = buildParseTree(part, depth + 1)
          tree.children.push(child)
        } catch (e) {
          tree.children.push({
            nodeType: 'leaf',
            text: part,
            error: e.message,
            depth: depth + 1
          })
        }
      }
    }
    
    if (tree.children.length > MAX_NESTED_PROPOSITIONS) {
      throw new Error('Parse stack overflow: too many nested propositions')
    }
  } else {
    tree.nodeType = 'simple'
    const type = identifyPropositionType(text)
    const terms = extractTerms(text, type)
    
    if (terms.subject && terms.predicate) {
      tree.terms = terms
      tree.type = type
    }
  }

  return tree
}

export function normalizeTerm(term) {
  return term
    .replace(/^(所有|全部|凡|每一个|有些|有的|某些|存在)/, '')
    .replace(/^(是|不是|都是|都不是|为)/, '')
    .replace(/[的地得]$/, '')
    .trim()
    .replace(/\s+/g, '_')
}

export function calculateComplexity(parseTree) {
  if (!parseTree) return 0
  
  let complexity = 1
  
  if (parseTree.children && parseTree.children.length > 0) {
    for (const child of parseTree.children) {
      complexity += calculateComplexity(child)
    }
  }
  
  if (parseTree.nodeType === 'compound') {
    complexity += 2
  }
  
  return complexity
}

export function buildPredicateLogicTree(propositions) {
  const forest = []
  const termReferences = {}
  let hasCycle = false
  const visited = new Set()
  const recursionStack = new Set()

  for (let i = 0; i < propositions.length; i++) {
    const prop = propositions[i]
    const parsed = parseNaturalLanguage(prop.text)
    
    const node = {
      id: `prop-${i}`,
      original: prop,
      parsed: parsed,
      children: [],
      parents: [],
      index: i
    }
    
    if (parsed.terms) {
      for (const term of [parsed.terms.subject, parsed.terms.predicate]) {
        if (term) {
          termReferences[term] = termReferences[term] || []
          termReferences[term].push(node)
        }
      }
    }
    
    forest.push(node)
  }

  for (let i = 0; i < forest.length - 1; i++) {
    const current = forest[i]
    const next = forest[i + 1]
    
    if (current.parsed.terms && next.parsed.terms) {
      const currentTerms = new Set([current.parsed.terms.subject, current.parsed.terms.predicate])
      const nextTerms = new Set([next.parsed.terms.subject, next.parsed.terms.predicate])
      
      const sharedTerms = [...currentTerms].filter(t => nextTerms.has(t) && t)
      
      if (sharedTerms.length > 0) {
        current.children.push({ node: next, sharedTerms })
        next.parents.push({ node: current, sharedTerms })
      }
    }
  }

  function detectCycle(node) {
    if (recursionStack.has(node.id)) {
      hasCycle = true
      return
    }
    if (visited.has(node.id)) return
    
    visited.add(node.id)
    recursionStack.add(node.id)
    
    for (const child of node.children) {
      detectCycle(child.node)
    }
    
    recursionStack.delete(node.id)
  }

  for (const node of forest) {
    if (!visited.has(node.id)) {
      detectCycle(node)
    }
  }

  return {
    nodes: forest,
    termReferences,
    hasCycle,
    analysis: analyzePredicateTree(forest)
  }
}

export function analyzePredicateTree(forest) {
  const analysis = {
    totalNodes: forest.length,
    totalPredicates: new Set(),
    chainLength: 0,
    isolatedNodes: 0,
    complexityLevel: 'simple'
  }

  let maxChain = 0
  
  for (const node of forest) {
    if (node.parsed.logicalForm) {
      node.parsed.logicalForm.predicates.forEach(p => analysis.totalPredicates.add(p))
    }
    
    if (node.children.length === 0 && node.parents.length === 0) {
      analysis.isolatedNodes++
    }
    
    let chainLength = 1
    let current = node
    while (current.children.length > 0) {
      chainLength++
      current = current.children[0].node
    }
    maxChain = Math.max(maxChain, chainLength)
  }
  
  analysis.chainLength = maxChain
  analysis.totalPredicates = analysis.totalPredicates.size
  
  if (analysis.totalPredicates > 5 || analysis.chainLength > 3) {
    analysis.complexityLevel = 'moderate'
  }
  if (analysis.totalPredicates > 10 || analysis.chainLength > 5) {
    analysis.complexityLevel = 'complex'
  }
  if (analysis.totalPredicates > 20 || analysis.chainLength > 8) {
    analysis.complexityLevel = 'high'
  }

  return analysis
}

export function detectCircularDependency(args) {
  const visited = new Set()
  const recursionStack = new Set()
  const cycles = []
  
  function dfs(argId, path = []) {
    if (recursionStack.has(argId)) {
      const cycleStart = path.indexOf(argId)
      cycles.push([...path.slice(cycleStart), argId])
      return true
    }
    
    if (visited.has(argId)) return false
    
    visited.add(argId)
    recursionStack.add(argId)
    path.push(argId)
    
    const arg = args.find(a => a.id === argId)
    if (arg && arg.dependsOn) {
      for (const depId of arg.dependsOn) {
        dfs(depId, [...path])
      }
    }
    
    recursionStack.delete(argId)
    return false
  }
  
  for (const arg of args) {
    if (!visited.has(arg.id)) {
      dfs(arg.id)
    }
  }
  
  return cycles
}
