// llm-eval-lite - One-function LLM evaluation with heuristic and model-graded assertions
export { evaluate } from './evaluate.js'
export { evaluateBatch, createEvaluator } from './evaluator.js'
export type {
  CriterionId,
  EvaluationMode,
  JudgeFn,
  EvalResult,
  MultiEvalResult,
  EvalCase,
  CriterionAggregate,
  BatchEvalResult,
  EvalOptions,
  BatchEvalOptions,
  Evaluator,
} from './types.js'
