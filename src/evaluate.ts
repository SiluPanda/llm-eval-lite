import type { CriterionId, EvalOptions, EvalResult, MultiEvalResult } from './types.js'
import {
  scoreSimilarity,
  scoreCompleteness,
  scoreConciseness,
  scoreCoherence,
  scoreHarmlessness,
  scoreFactuality,
  scoreRelevance,
  scoreHelpfulness,
  scoreCustom,
} from './criteria.js'

const DEFAULTS: Record<CriterionId, number> = {
  factuality: 0.7,
  relevance: 0.7,
  completeness: 0.6,
  conciseness: 0.6,
  helpfulness: 0.6,
  harmlessness: 0.8,
  coherence: 0.6,
  similarity: 0.6,
  custom: 0.5,
}

const AUTO_MODE: Record<CriterionId, 'heuristic' | 'model'> = {
  factuality: 'model',
  relevance: 'model',
  completeness: 'heuristic',
  conciseness: 'heuristic',
  helpfulness: 'model',
  harmlessness: 'model',
  coherence: 'heuristic',
  similarity: 'heuristic',
  custom: 'heuristic',
}

function heuristicScore(
  criterion: CriterionId,
  output: string,
  expected: string,
  options?: EvalOptions
): number {
  switch (criterion) {
    case 'similarity':
      return scoreSimilarity(output, expected)
    case 'completeness':
      return scoreCompleteness(output, expected)
    case 'conciseness':
      return scoreConciseness(output, expected)
    case 'coherence':
      return scoreCoherence(output, expected)
    case 'harmlessness':
      return scoreHarmlessness(output, expected)
    case 'factuality':
      return scoreFactuality(output, expected)
    case 'relevance':
      return scoreRelevance(output, expected, options)
    case 'helpfulness':
      return scoreHelpfulness(output, expected, options)
    case 'custom':
      return scoreCustom(output, expected, options)
  }
}

function judgePrompt(criterion: CriterionId, output: string, expected: string): string {
  return `You are an evaluator assessing LLM output quality.

Criterion: ${criterion}
Expected: ${expected}
Output: ${output}

Rate the output on a scale from 0.0 to 1.0 for the criterion "${criterion}".
Respond with "Score: <number>" where <number> is between 0.0 and 1.0.`
}

function parseJudgeScore(response: string): number | null {
  // Try "Score: 0.8" pattern
  const scoreMatch = response.match(/Score:\s*([\d.]+)/i)
  if (scoreMatch) {
    const val = parseFloat(scoreMatch[1])
    if (!isNaN(val)) return Math.min(1, Math.max(0, val))
  }
  // Try "0.8/1.0" pattern
  const ratioMatch = response.match(/([\d.]+)\s*\/\s*1(?:\.0)?/)
  if (ratioMatch) {
    const val = parseFloat(ratioMatch[1])
    if (!isNaN(val)) return Math.min(1, Math.max(0, val))
  }
  // Try bare float on its own line
  const bareMatch = response.match(/^\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*$/m)
  if (bareMatch) {
    const val = parseFloat(bareMatch[1])
    if (!isNaN(val)) return Math.min(1, Math.max(0, val))
  }
  return null
}

async function evaluateSingle(
  output: string,
  expected: string,
  criterion: CriterionId,
  options?: EvalOptions
): Promise<EvalResult> {
  const start = Date.now()
  const threshold = options?.thresholds?.[criterion] ?? options?.threshold ?? DEFAULTS[criterion]

  let resolvedMode: 'heuristic' | 'model'
  if (!options?.mode || options.mode === 'auto') {
    resolvedMode = AUTO_MODE[criterion]
  } else {
    resolvedMode = options.mode
  }

  let score: number
  let usedMode: 'heuristic' | 'model' = 'heuristic'

  if (resolvedMode === 'model' && options?.judge) {
    const prompt = judgePrompt(criterion, output, expected)
    try {
      const response = await options.judge(prompt)
      const parsed = parseJudgeScore(response)
      if (parsed !== null) {
        score = parsed
        usedMode = 'model'
      } else {
        // Fallback to heuristic
        score = heuristicScore(criterion, output, expected, options)
        usedMode = 'heuristic'
      }
    } catch {
      score = heuristicScore(criterion, output, expected, options)
      usedMode = 'heuristic'
    }
  } else {
    score = heuristicScore(criterion, output, expected, options)
    usedMode = 'heuristic'
  }

  const pass = score >= threshold
  const duration = Date.now() - start

  return {
    score,
    pass,
    criterion,
    explanation: `${criterion} score: ${score.toFixed(3)} (threshold: ${threshold}, mode: ${usedMode})`,
    mode: usedMode,
    threshold,
    duration,
  }
}

export async function evaluate(
  output: string,
  expected: string,
  criterion: CriterionId | CriterionId[],
  options?: EvalOptions
): Promise<EvalResult | MultiEvalResult> {
  if (Array.isArray(criterion)) {
    const start = Date.now()
    const entries = await Promise.all(
      criterion.map(c => evaluateSingle(output, expected, c, options))
    )
    const scores: Partial<Record<CriterionId, EvalResult>> = {}
    for (const entry of entries) {
      scores[entry.criterion] = entry
    }
    const scoreValues = entries.map(e => e.score)
    const aggregateScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    const pass = entries.every(e => e.pass)
    return {
      scores,
      aggregateScore,
      pass,
      duration: Date.now() - start,
    }
  }

  return evaluateSingle(output, expected, criterion, options)
}
