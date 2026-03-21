import type {
  CriterionId,
  CriterionAggregate,
  EvalCase,
  EvalResult,
  MultiEvalResult,
  BatchEvalResult,
  BatchEvalOptions,
  EvalOptions,
  Evaluator,
} from './types.js'
import { evaluate } from './evaluate.js'

function computeAggregate(
  criterion: CriterionId,
  scores: number[],
  threshold: number
): CriterionAggregate {
  const sorted = [...scores].sort((a, b) => a - b)
  const n = sorted.length
  const mean = scores.reduce((a, b) => a + b, 0) / n
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]
  const min = sorted[0]
  const max = sorted[n - 1]
  const variance = scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  const passRate = scores.filter(s => s >= threshold).length / n

  return { criterion, mean, median, min, max, stdDev, passRate }
}

function getDefaultThreshold(criterion: CriterionId): number {
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
  return DEFAULTS[criterion]
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
  onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let idx = 0
  let completed = 0
  const total = tasks.length

  async function worker(): Promise<void> {
    while (idx < total) {
      const i = idx++
      results[i] = await tasks[i]()
      completed++
      onProgress?.(completed, total)
    }
  }

  const workers: Promise<void>[] = []
  for (let i = 0; i < Math.min(concurrency, total); i++) {
    workers.push(worker())
  }
  await Promise.all(workers)
  return results
}

export async function evaluateBatch(
  cases: EvalCase[],
  criterion: CriterionId | CriterionId[],
  options?: BatchEvalOptions
): Promise<BatchEvalResult> {
  const start = Date.now()
  const concurrency = options?.concurrency ?? 5

  const tasks = cases.map(c => () => evaluate(c.output, c.expected, criterion, options))
  const evalResults = await runWithConcurrency(tasks, concurrency, options?.onProgress)

  const resultPairs = cases.map((c, i) => ({ case: c, result: evalResults[i] }))

  // Collect per-criterion scores
  const criterionScoresMap: Partial<Record<CriterionId, number[]>> = {}
  const criteria = Array.isArray(criterion) ? criterion : [criterion]

  for (const res of evalResults) {
    if (Array.isArray(criterion)) {
      const multi = res as MultiEvalResult
      for (const c of criteria) {
        const entry = multi.scores[c]
        if (entry) {
          if (!criterionScoresMap[c]) criterionScoresMap[c] = []
          criterionScoresMap[c]!.push(entry.score)
        }
      }
    } else {
      const single = res as EvalResult
      const c = single.criterion
      if (!criterionScoresMap[c]) criterionScoresMap[c] = []
      criterionScoresMap[c]!.push(single.score)
    }
  }

  const aggregates: Partial<Record<CriterionId, CriterionAggregate>> = {}
  for (const c of criteria) {
    const scores = criterionScoresMap[c]
    if (scores && scores.length > 0) {
      const threshold = options?.thresholds?.[c] ?? options?.threshold ?? getDefaultThreshold(c)
      aggregates[c] = computeAggregate(c, scores, threshold)
    }
  }

  // Overall aggregate score
  const allScores: number[] = []
  for (const scores of Object.values(criterionScoresMap)) {
    if (scores) allScores.push(...scores)
  }
  const aggregateScore = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0

  const pass = resultPairs.every(r => {
    const res = r.result
    if ('pass' in res) return res.pass
    return false
  })

  return {
    results: resultPairs,
    aggregates,
    aggregateScore,
    pass,
    duration: Date.now() - start,
  }
}

export function createEvaluator(config?: EvalOptions): Evaluator {
  return {
    evaluate(output, expected, criterion, options) {
      return evaluate(output, expected, criterion, { ...config, ...options })
    },
    evaluateBatch(cases, criterion, options) {
      return evaluateBatch(cases, criterion, { ...config, ...options })
    },
  }
}
