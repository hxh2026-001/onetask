export const PROPOSITION_TYPES = {
  A: { name: '全称肯定', symbol: '∀', quality: 'affirmative', quantity: 'universal' },
  E: { name: '全称否定', symbol: '∀¬', quality: 'negative', quantity: 'universal' },
  I: { name: '特称肯定', symbol: '∃', quality: 'affirmative', quantity: 'particular' },
  O: { name: '特称否定', symbol: '∃¬', quality: 'negative', quantity: 'particular' }
}

export const FIGURE_DESCRIPTIONS = {
  1: '中项在大前提作主项，在小前提作谓项',
  2: '中项在两个前提中都作谓项',
  3: '中项在两个前提中都作主项',
  4: '中项在大前提作谓项，在小前提作主项'
}

export const DISTRIBUTION_RULES = {
  A: { subject: true, predicate: false },
  E: { subject: true, predicate: true },
  I: { subject: false, predicate: false },
  O: { subject: false, predicate: true }
}

export const VALID_MOODS = {
  1: ['AAA', 'EAE', 'AII', 'EIO', 'AAI', 'EAO'],
  2: ['AEE', 'EAE', 'AOO', 'EIO', 'AEO', 'EAO'],
  3: ['AAI', 'IAI', 'AII', 'EAO', 'OAO', 'EIO'],
  4: ['AAI', 'AEE', 'IAI', 'EAO', 'EIO', 'AEO']
}

export function getFigurePattern(figure) {
  switch (figure) {
    case 1: return { major: ['M', 'P'], minor: ['S', 'M'] }
    case 2: return { major: ['P', 'M'], minor: ['S', 'M'] }
    case 3: return { major: ['M', 'P'], minor: ['M', 'S'] }
    case 4: return { major: ['P', 'M'], minor: ['M', 'S'] }
    default: return null
  }
}

export function identifyPropositionType(text) {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('所有') || lowerText.includes('全部') || lowerText.includes('凡') || lowerText.includes('每一个')) {
    if (lowerText.includes('不') || lowerText.includes('非') || lowerText.includes('没有')) {
      return 'E'
    }
    return 'A'
  }
  if (lowerText.includes('有些') || lowerText.includes('有的') || lowerText.includes('某些') || lowerText.includes('存在')) {
    if (lowerText.includes('不') || lowerText.includes('非') || lowerText.includes('没有')) {
      return 'O'
    }
    return 'I'
  }
  if (lowerText.startsWith('如果') || lowerText.startsWith('若') || lowerText.includes('→')) {
    return 'conditional'
  }
  return 'unknown'
}

export function extractTerms(proposition, type) {
  const text = proposition
  const result = { subject: '', predicate: '', copula: '' }
  
  if (type === 'A' || type === 'E') {
    const allMatch = text.match(/^(所有|全部|凡|每一个)(.+?)(是|不是|都是|都不是|为)(.+)$/)
    if (allMatch) {
      result.subject = allMatch[2].trim()
      result.copula = allMatch[3].trim()
      result.predicate = allMatch[4].trim()
    }
  } else if (type === 'I' || type === 'O') {
    const someMatch = text.match(/^(有些|有的|某些|存在)(.+?)(是|不是|为)(.+)$/)
    if (someMatch) {
      result.subject = someMatch[2].trim()
      result.copula = someMatch[3].trim()
      result.predicate = someMatch[4].trim()
    }
  }
  
  return result
}

export function validateSyllogism(major, minor, conclusion, figure) {
  const result = {
    valid: false,
    fallacies: [],
    warnings: [],
    mood: '',
    figure: figure,
    distributionAnalysis: {}
  }

  const majorType = major.type || identifyPropositionType(major.text)
  const minorType = minor.type || identifyPropositionType(minor.text)
  const conclusionType = conclusion.type || identifyPropositionType(conclusion.text)
  
  result.mood = `${majorType}${minorType}${conclusionType}`

  const pattern = getFigurePattern(figure)
  if (!pattern) {
    result.fallacies.push({ type: 'invalid_figure', message: '无效的格' })
    return result
  }

  const majorTerms = extractTerms(major.text, majorType)
  const minorTerms = extractTerms(minor.text, minorType)
  const conclusionTerms = extractTerms(conclusion.text, conclusionType)

  result.distributionAnalysis = {
    major: {
      type: majorType,
      subjectDistributed: DISTRIBUTION_RULES[majorType]?.subject || false,
      predicateDistributed: DISTRIBUTION_RULES[majorType]?.predicate || false
    },
    minor: {
      type: minorType,
      subjectDistributed: DISTRIBUTION_RULES[minorType]?.subject || false,
      predicateDistributed: DISTRIBUTION_RULES[minorType]?.predicate || false
    },
    conclusion: {
      type: conclusionType,
      subjectDistributed: DISTRIBUTION_RULES[conclusionType]?.subject || false,
      predicateDistributed: DISTRIBUTION_RULES[conclusionType]?.predicate || false
    }
  }

  const allTerms = new Set([
    majorTerms.subject, majorTerms.predicate,
    minorTerms.subject, minorTerms.predicate,
    conclusionTerms.subject, conclusionTerms.predicate
  ].filter(t => t))

  if (allTerms.size > 3) {
    result.fallacies.push({
      type: 'four_terms',
      message: `检测到 ${allTerms.size} 个不同的词项，违反三段论规则`,
      terms: Array.from(allTerms),
      severity: 'critical'
    })
    return result
  }

  let middleTerm = null
  const majorPredicate = majorTerms.predicate
  const minorSubject = minorTerms.subject
  const conclusionSubject = conclusionTerms.subject
  const conclusionPredicate = conclusionTerms.predicate

  const majorTermsSet = new Set([majorTerms.subject, majorTerms.predicate])
  const minorTermsSet = new Set([minorTerms.subject, minorTerms.predicate])
  
  for (const term of majorTermsSet) {
    if (minorTermsSet.has(term) && term !== conclusionSubject && term !== conclusionPredicate) {
      middleTerm = term
      break
    }
  }

  if (!middleTerm) {
    result.fallacies.push({
      type: 'no_middle_term',
      message: '无法识别中项',
      severity: 'critical'
    })
    return result
  }

  const majorDist = result.distributionAnalysis.major
  const minorDist = result.distributionAnalysis.minor
  
  let middleDistributed = false
  if (figure === 1) {
    middleDistributed = majorDist.subjectDistributed || minorDist.predicateDistributed
  } else if (figure === 2) {
    middleDistributed = majorDist.predicateDistributed || minorDist.predicateDistributed
  } else if (figure === 3) {
    middleDistributed = majorDist.subjectDistributed || minorDist.subjectDistributed
  } else if (figure === 4) {
    middleDistributed = majorDist.predicateDistributed || minorDist.subjectDistributed
  }

  if (!middleDistributed) {
    result.fallacies.push({
      type: 'undistributed_middle',
      message: '中项在两个前提中都不周延',
      severity: 'high'
    })
  }

  const conclusionDist = result.distributionAnalysis.conclusion
  const majorTerm = conclusionPredicate
  const minorTerm = conclusionSubject

  const majorTermInMajor = majorTerms.subject === majorTerm || majorTerms.predicate === majorTerm
  const minorTermInMinor = minorTerms.subject === minorTerm || minorTerms.predicate === minorTerm

  if (conclusionDist.subjectDistributed && minorTermInMinor) {
    const minorTermPos = minorTerms.subject === minorTerm ? 'subject' : 'predicate'
    if (!result.distributionAnalysis.minor[`${minorTermPos}Distributed`]) {
      result.fallacies.push({
        type: 'illicit_minor',
        message: '小项在前提中不周延但在结论中周延',
        severity: 'high'
      })
    }
  }

  if (conclusionDist.predicateDistributed && majorTermInMajor) {
    const majorTermPos = majorTerms.subject === majorTerm ? 'subject' : 'predicate'
    if (!result.distributionAnalysis.major[`${majorTermPos}Distributed`]) {
      result.fallacies.push({
        type: 'illicit_major',
        message: '大项在前提中不周延但在结论中周延',
        severity: 'high'
      })
    }
  }

  if (majorType === 'E' && minorType === 'E') {
    result.fallacies.push({
      type: 'exclusive_premises',
      message: '两个否定前提不能得出结论',
      severity: 'high'
    })
  }

  if ((majorType === 'E' || minorType === 'E') && conclusionType !== 'E' && conclusionType !== 'O') {
    result.fallacies.push({
      type: 'negative_premise_affirmative_conclusion',
      message: '否定前提不能得出肯定结论',
      severity: 'high'
    })
  }

  if ((majorType === 'I' && minorType === 'I')) {
    result.fallacies.push({
      type: 'two_particular_premises',
      message: '两个特称前提不能得出结论',
      severity: 'high'
    })
  }

  if ((majorType === 'A' || minorType === 'A') && conclusionType === 'I' && result.fallacies.length === 0) {
    result.warnings.push({
      type: 'existential_import',
      message: '从全称前提推出特称结论，需要存在预设',
      severity: 'medium'
    })
  }

  const validMoodsForFigure = VALID_MOODS[figure] || []
  if (validMoodsForFigure.includes(result.mood) && result.fallacies.length === 0) {
    result.valid = true
  }

  return result
}

export function detectAmbiguity(terms, context) {
  const ambiguities = []
  
  const termOccurrences = {}
  for (const term of terms) {
    termOccurrences[term] = termOccurrences[term] || []
    for (const ctx of context) {
      if (ctx.text.includes(term)) {
        termOccurrences[term].push(ctx)
      }
    }
  }

  for (const [term, occurrences] of Object.entries(termOccurrences)) {
    if (occurrences.length >= 2) {
      const usages = occurrences.map(o => o.role)
      if (new Set(usages).size > 1) {
        ambiguities.push({
          term,
          usages,
          message: `词项"${term}"在不同位置使用，可能存在歧义`,
          type: 'semantic_ambiguity'
        })
      }
    }
  }

  return ambiguities
}

export function analyzeSoritesChain(premises) {
  const analysis = {
    valid: true,
    chain: [],
    paradox: false,
    warnings: []
  }

  for (let i = 0; i < premises.length - 1; i++) {
    const current = premises[i]
    const next = premises[i + 1]
    
    const currentTerms = extractTerms(current.text, current.type || 'A')
    const nextTerms = extractTerms(next.text, next.type || 'A')

    const link = currentTerms.predicate === nextTerms.subject || 
                 currentTerms.subject === nextTerms.predicate
    
    analysis.chain.push({
      premise1: current,
      premise2: next,
      linked: link,
      middleTerm: currentTerms.predicate
    })

    if (!link) {
      analysis.valid = false
      analysis.warnings.push(`步骤 ${i + 1} 的论证链断裂`)
    }
  }

  if (premises.length > 5 && analysis.valid) {
    analysis.paradox = true
    analysis.warnings.push('长论证链可能导致连锁悖论')
  }

  return analysis
}
