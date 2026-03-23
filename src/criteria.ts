import {
  tokenF1,
  rougeL,
  rougeLRecall,
  jaccardSimilarity,
  tokenize,
  tokenizeAll,
  hasRefusalPattern,
  hasHarmPatterns,
  computeSentenceRepetition,
} from './heuristics.js'
import type { EvalOptions } from './types.js'

export function scoreSimilarity(output: string, expected: string): number {
  if (output.trim().length === 0 || expected.trim().length === 0) return 0
  const f1 = tokenF1(output, expected)
  const rl = rougeL(output, expected)
  const jac = jaccardSimilarity(output, expected)
  return 0.4 * f1 + 0.35 * rl + 0.25 * jac
}

export function scoreCompleteness(output: string, expected: string): number {
  if (expected.trim().length === 0) return 1.0
  if (output.trim().length === 0) return 0.0
  const recall = rougeLRecall(expected, output)
  if (recall > 0) return recall

  // Fallback: tokenF1 recall variant
  const expTokens = tokenizeAll(expected)
  const outTokens = tokenizeAll(output)
  if (expTokens.length === 0) return 1.0
  if (outTokens.length === 0) return 0.0

  const outSet = new Set(outTokens)
  let covered = 0
  for (const t of expTokens) {
    if (outSet.has(t)) covered++
  }
  return covered / expTokens.length
}

export function scoreConciseness(output: string, expected: string): number {
  if (output.trim().length === 0 && expected.trim().length === 0) return 1.0
  if (output.trim().length === 0 || expected.trim().length === 0) return 0.0

  const outLen = tokenizeAll(output).length
  const expLen = tokenizeAll(expected).length
  if (outLen === 0 && expLen === 0) return 1.0
  if (outLen === 0 || expLen === 0) return 0.0
  const lengthRatio = Math.min(expLen, outLen) / Math.max(expLen, outLen)
  const repetitionRate = computeSentenceRepetition(output)
  return (1 - repetitionRate) * 0.3 + lengthRatio * 0.7
}

export function scoreCoherence(output: string, _expected: string = ''): number {
  const words = tokenizeAll(output)
  if (words.length < 3) return 0.3
  if (words.length > 0 && new Set(words).size === 1) return 0
  const repetitionRate = computeSentenceRepetition(output)
  return 1 - repetitionRate
}

export function scoreHarmlessness(output: string, _expected: string): number {
  return hasHarmPatterns(output) ? 0 : 1.0
}

export function scoreFactuality(output: string, expected: string): number {
  if (expected.trim().length === 0) return 0.5
  if (output.trim().length === 0) return 0.0

  const expKeywords = tokenize(expected)
  if (expKeywords.length === 0) return 0.5

  const outKeywords = new Set(tokenize(output))
  let overlap = 0
  for (const kw of expKeywords) {
    if (outKeywords.has(kw)) overlap++
  }
  return overlap / expKeywords.length
}

export function scoreRelevance(output: string, expected: string, options?: EvalOptions): number {
  const reference = options?.prompt ?? expected
  let score = jaccardSimilarity(output, reference)
  if (hasRefusalPattern(output)) {
    score *= 0.3
  }
  return score
}

export function scoreHelpfulness(output: string, expected: string, options?: EvalOptions): number {
  const relevance = scoreRelevance(output, expected, options)
  const completeness = scoreCompleteness(output, expected)
  const coherence = scoreCoherence(output, expected)
  const composite = (relevance + completeness + coherence) / 3
  if (hasRefusalPattern(output)) {
    return composite * 0.1
  }
  return composite
}

export function scoreCustom(output: string, expected: string, options?: EvalOptions): number {
  if (options?.custom?.heuristic) {
    return options.custom.heuristic(output, expected)
  }
  return scoreSimilarity(output, expected)
}
