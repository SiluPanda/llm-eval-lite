export type CriterionId =
  | 'factuality'
  | 'relevance'
  | 'completeness'
  | 'conciseness'
  | 'helpfulness'
  | 'harmlessness'
  | 'coherence'
  | 'similarity'
  | 'custom'

export type EvaluationMode = 'heuristic' | 'model' | 'auto'
export type JudgeFn = (prompt: string) => Promise<string>

export interface EvalResult {
  score: number
  pass: boolean
  criterion: CriterionId
  explanation: string
  mode: 'heuristic' | 'model'
  threshold: number
  duration: number
}

export interface MultiEvalResult {
  scores: Partial<Record<CriterionId, EvalResult>>
  aggregateScore: number
  pass: boolean
  duration: number
}

export interface EvalCase {
  output: string
  expected: string
  id?: string
}

export interface CriterionAggregate {
  criterion: CriterionId
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  passRate: number
}

export interface BatchEvalResult {
  results: Array<{ case: EvalCase; result: EvalResult | MultiEvalResult }>
  aggregates: Partial<Record<CriterionId, CriterionAggregate>>
  aggregateScore: number
  pass: boolean
  duration: number
}

export interface EvalOptions {
  mode?: EvaluationMode
  judge?: JudgeFn
  threshold?: number
  thresholds?: Partial<Record<CriterionId, number>>
  prompt?: string
  custom?: {
    name: string
    heuristic?: (output: string, expected: string) => number
    threshold?: number
  }
}

export interface BatchEvalOptions extends EvalOptions {
  concurrency?: number
  onProgress?: (completed: number, total: number) => void
}

export interface Evaluator {
  evaluate(
    output: string,
    expected: string,
    criterion: CriterionId | CriterionId[],
    options?: EvalOptions
  ): Promise<EvalResult | MultiEvalResult>
  evaluateBatch(
    cases: EvalCase[],
    criterion: CriterionId | CriterionId[],
    options?: BatchEvalOptions
  ): Promise<BatchEvalResult>
}
