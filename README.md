# llm-eval-lite

One-function LLM evaluation with heuristic and model-graded assertions.

[![npm version](https://img.shields.io/npm/v/llm-eval-lite.svg)](https://www.npmjs.com/package/llm-eval-lite)
[![npm downloads](https://img.shields.io/npm/dt/llm-eval-lite.svg)](https://www.npmjs.com/package/llm-eval-lite)
[![license](https://img.shields.io/npm/l/llm-eval-lite.svg)](https://github.com/SiluPanda/llm-eval-lite/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/llm-eval-lite.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

Evaluate LLM outputs against nine built-in quality criteria using fast deterministic heuristics or an LLM-as-judge. A single call to `evaluate()` returns a 0--1 score, a pass/fail determination, and a human-readable explanation -- no YAML files, no CLI invocation, no provider configuration.

```typescript
import { evaluate } from 'llm-eval-lite'

const result = await evaluate(
  'The capital of France is Paris.',
  'Paris is the capital of France.',
  'factuality'
)

console.log(result.score)       // 0.0 - 1.0
console.log(result.pass)        // true if score >= threshold
console.log(result.explanation) // human-readable summary
```

---

## Installation

```bash
npm install llm-eval-lite
```

Requires Node.js >= 18. Zero runtime dependencies.

---

## Quick Start

### Single criterion evaluation

```typescript
import { evaluate } from 'llm-eval-lite'

const result = await evaluate(
  'Photosynthesis converts sunlight into chemical energy.',
  'Photosynthesis is the process by which plants convert light energy into chemical energy.',
  'similarity'
)

if (result.pass) {
  console.log('Output quality is acceptable')
} else {
  console.log(`Score ${result.score} is below threshold ${result.threshold}`)
}
```

### Multi-criterion evaluation

```typescript
import { evaluate } from 'llm-eval-lite'
import type { MultiEvalResult } from 'llm-eval-lite'

const result = await evaluate(
  'The sky is blue.',
  'The sky appears blue due to Rayleigh scattering.',
  ['similarity', 'completeness', 'coherence', 'harmlessness']
) as MultiEvalResult

console.log(result.aggregateScore)            // mean of all criteria
console.log(result.scores.similarity?.score)   // per-criterion score
console.log(result.pass)                       // true only if all criteria pass
```

### Test framework integration

```typescript
import { evaluate } from 'llm-eval-lite'
import { expect, test } from 'vitest'

test('summarizer produces factual output', async () => {
  const output = await mySummarizer(document)
  const result = await evaluate(output, expectedSummary, 'factuality')
  expect(result.pass).toBe(true)
})
```

---

## Features

- **Nine built-in criteria** -- factuality, relevance, completeness, conciseness, helpfulness, harmlessness, coherence, similarity, and custom.
- **Two evaluation modes** -- deterministic heuristic scoring (zero cost, sub-millisecond, reproducible) and model-graded evaluation (LLM-as-judge with any provider).
- **Auto mode routing** -- each criterion is automatically routed to the evaluation mode best suited for it. Falls back to heuristic when no judge function is provided.
- **Batch evaluation** -- evaluate arrays of output/expected pairs with configurable concurrency and progress callbacks. Returns aggregate statistics (mean, median, min, max, standard deviation, pass rate).
- **Evaluator factory** -- create pre-configured evaluator instances with default judge, thresholds, and mode. Reuse across an entire test suite or monitoring pipeline.
- **Custom criteria** -- supply your own heuristic function or judge prompt to define domain-specific evaluation logic.
- **Pluggable judge interface** -- a single `(prompt: string) => Promise<string>` function integrates any LLM provider (OpenAI, Anthropic, local models, or any other API).
- **Zero runtime dependencies** -- all heuristic algorithms (tokenization, n-gram overlap, ROUGE-L, Jaccard similarity, sentence segmentation, pattern matching) are implemented with built-in JavaScript APIs.
- **Full TypeScript support** -- strict mode, complete type definitions exported for all public interfaces.
- **Structured results** -- every evaluation returns a typed, serializable object with score, pass/fail, criterion, explanation, mode, threshold, and duration.

---

## Evaluation Criteria

| Criterion | Default Threshold | Auto Mode | Heuristic Strategy |
|---|---|---|---|
| `factuality` | 0.7 | `model` | Keyword overlap between output and expected (stopwords removed) |
| `relevance` | 0.7 | `model` | Jaccard similarity to prompt or expected; refusal penalty |
| `completeness` | 0.6 | `heuristic` | ROUGE-L recall measuring how much of the expected text appears in the output |
| `conciseness` | 0.6 | `heuristic` | Length ratio scoring combined with sentence repetition penalty |
| `helpfulness` | 0.6 | `model` | Composite of relevance, completeness, and coherence; severe refusal penalty |
| `harmlessness` | 0.8 | `model` | Binary detection of harmful patterns (violence, exploitation, dangerous synthesis) |
| `coherence` | 0.6 | `heuristic` | Sentence repetition rate; penalizes degenerate and single-word outputs |
| `similarity` | 0.6 | `heuristic` | Weighted blend of Token F1 (0.4), ROUGE-L (0.35), and Jaccard similarity (0.25) |
| `custom` | 0.5 | `heuristic` | User-provided heuristic function; falls back to similarity when none is given |

**Auto mode** routes each criterion to `model` or `heuristic` based on the table above. Criteria assigned to `model` fall back to `heuristic` automatically when no judge function is provided.

---

## API Reference

### `evaluate(output, expected, criterion, options?)`

Evaluate a single LLM output against one or more criteria.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `output` | `string` | The LLM-generated text to evaluate |
| `expected` | `string` | The reference or ground-truth text |
| `criterion` | `CriterionId \| CriterionId[]` | One criterion ID or an array of criterion IDs |
| `options` | `EvalOptions` | Optional configuration (see below) |

**Returns:** `Promise<EvalResult>` when `criterion` is a single string, `Promise<MultiEvalResult>` when `criterion` is an array.

```typescript
// Single criterion
const result = await evaluate(output, expected, 'factuality')

// Multiple criteria
const multi = await evaluate(output, expected, ['factuality', 'relevance']) as MultiEvalResult
```

---

### `evaluateBatch(cases, criterion, options?)`

Evaluate an array of output/expected pairs against one or more criteria. Returns aggregate statistics across all cases.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `cases` | `EvalCase[]` | Array of `{ output, expected, id? }` objects |
| `criterion` | `CriterionId \| CriterionId[]` | One criterion ID or an array of criterion IDs |
| `options` | `BatchEvalOptions` | Optional configuration including concurrency and progress callback |

**Returns:** `Promise<BatchEvalResult>`

```typescript
import { evaluateBatch } from 'llm-eval-lite'

const cases = [
  { output: 'Paris is in France.', expected: 'France capital is Paris.' },
  { output: 'London is in England.', expected: 'England capital is London.' },
  { output: 'Berlin is in Germany.', expected: 'Germany capital is Berlin.' },
]

const result = await evaluateBatch(cases, 'similarity', {
  concurrency: 3,
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
})

console.log(result.aggregateScore)
console.log(result.aggregates.similarity?.mean)
console.log(result.aggregates.similarity?.passRate)
console.log(result.pass) // true only if all cases pass
```

---

### `createEvaluator(config?)`

Create a pre-configured evaluator instance. Configuration is merged with per-call options, where per-call options take precedence.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `config` | `EvalOptions` | Default configuration applied to all evaluations |

**Returns:** `Evaluator`

```typescript
import { createEvaluator } from 'llm-eval-lite'

const evaluator = createEvaluator({
  mode: 'heuristic',
  threshold: 0.75,
})

const r1 = await evaluator.evaluate(output1, expected1, 'similarity')
const r2 = await evaluator.evaluate(output2, expected2, 'factuality')
const batch = await evaluator.evaluateBatch(cases, ['similarity', 'coherence'])
```

---

### Types

#### `CriterionId`

```typescript
type CriterionId =
  | 'factuality'
  | 'relevance'
  | 'completeness'
  | 'conciseness'
  | 'helpfulness'
  | 'harmlessness'
  | 'coherence'
  | 'similarity'
  | 'custom'
```

#### `EvaluationMode`

```typescript
type EvaluationMode = 'heuristic' | 'model' | 'auto'
```

#### `JudgeFn`

```typescript
type JudgeFn = (prompt: string) => Promise<string>
```

The judge function receives a structured evaluation prompt and must return a string containing a score. Supported response formats:

- `Score: 0.85` -- explicit score label
- `0.8/1.0` -- ratio format
- `0.75` -- bare float on its own line

#### `EvalResult`

Returned when evaluating a single criterion.

```typescript
interface EvalResult {
  score: number        // 0.0 to 1.0
  pass: boolean        // true if score >= threshold
  criterion: CriterionId
  explanation: string  // human-readable summary
  mode: 'heuristic' | 'model'
  threshold: number
  duration: number     // milliseconds
}
```

#### `MultiEvalResult`

Returned when evaluating multiple criteria at once.

```typescript
interface MultiEvalResult {
  scores: Partial<Record<CriterionId, EvalResult>>
  aggregateScore: number  // mean of all per-criterion scores
  pass: boolean           // true only if every criterion passes
  duration: number        // milliseconds
}
```

#### `EvalCase`

A single test case for batch evaluation.

```typescript
interface EvalCase {
  output: string
  expected: string
  id?: string
}
```

#### `CriterionAggregate`

Statistical summary for one criterion across a batch.

```typescript
interface CriterionAggregate {
  criterion: CriterionId
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  passRate: number  // fraction of cases that passed
}
```

#### `BatchEvalResult`

Returned by `evaluateBatch`.

```typescript
interface BatchEvalResult {
  results: Array<{ case: EvalCase; result: EvalResult | MultiEvalResult }>
  aggregates: Partial<Record<CriterionId, CriterionAggregate>>
  aggregateScore: number
  pass: boolean     // true only if every case passes
  duration: number  // milliseconds
}
```

#### `EvalOptions`

Configuration for `evaluate` and `createEvaluator`.

```typescript
interface EvalOptions {
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
```

| Field | Description |
|---|---|
| `mode` | Evaluation mode: `'heuristic'`, `'model'`, or `'auto'` (default: `'auto'`) |
| `judge` | Async function that calls an LLM and returns its response as a string |
| `threshold` | Global pass/fail threshold applied to all criteria |
| `thresholds` | Per-criterion threshold overrides |
| `prompt` | Original prompt/question, used by the `relevance` criterion as the reference instead of `expected` |
| `custom` | Configuration for the `custom` criterion |

**Threshold resolution order:** per-criterion `thresholds[criterion]` > global `threshold` > built-in default for the criterion.

#### `BatchEvalOptions`

Extends `EvalOptions` with batch-specific settings.

```typescript
interface BatchEvalOptions extends EvalOptions {
  concurrency?: number
  onProgress?: (completed: number, total: number) => void
}
```

| Field | Default | Description |
|---|---|---|
| `concurrency` | `5` | Maximum number of evaluations to run in parallel |
| `onProgress` | `undefined` | Called after each case completes with `(completed, total)` |

#### `Evaluator`

Interface returned by `createEvaluator`.

```typescript
interface Evaluator {
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
```

---

## Configuration

### Evaluation modes

| Mode | Cost | Latency | Deterministic | Requires Judge |
|---|---|---|---|---|
| `heuristic` | Zero | Sub-millisecond | Yes | No |
| `model` | LLM API call | LLM round-trip | No | Yes |
| `auto` | Depends on criterion | Depends on criterion | Depends on criterion | Falls back to heuristic if no judge |

Set the mode globally or per call.

```typescript
// Force heuristic for all criteria
await evaluate(output, expected, 'factuality', { mode: 'heuristic' })

// Force model-graded for all criteria
await evaluate(output, expected, 'factuality', { mode: 'model', judge: myJudge })

// Auto mode (default) -- routes each criterion to its preferred mode
await evaluate(output, expected, ['factuality', 'coherence'], { judge: myJudge })
// factuality uses model (judge provided), coherence uses heuristic
```

### Custom thresholds

Override pass/fail thresholds per criterion or globally.

```typescript
const result = await evaluate(output, expected, ['factuality', 'harmlessness'], {
  thresholds: {
    factuality: 0.85,
    harmlessness: 0.95,
  },
})
```

```typescript
// Global threshold applies to all criteria without a specific override
await evaluate(output, expected, 'similarity', { threshold: 0.8 })
```

### Relevance with original prompt

The `relevance` criterion can evaluate against the original user prompt instead of the expected answer.

```typescript
const result = await evaluate(
  'Paris is the capital and largest city of France.',
  '',
  'relevance',
  { prompt: 'What is the capital of France?' }
)
```

---

## Error Handling

### Judge function failures

When the judge function throws an error or returns an unparseable response, `evaluate` falls back to heuristic scoring automatically. The returned `mode` field indicates which mode was actually used.

```typescript
const unreliableJudge = async (prompt: string) => {
  throw new Error('API rate limit exceeded')
}

const result = await evaluate(output, expected, 'factuality', {
  mode: 'model',
  judge: unreliableJudge,
})

// Does not throw -- falls back gracefully
console.log(result.mode) // 'heuristic'
```

### Unparseable judge responses

If the judge returns text that does not contain a recognizable score (e.g., `Score: 0.8`, `0.8/1.0`, or a bare float), the heuristic scorer is used as a fallback. No error is thrown.

### Empty inputs

Each criterion handles empty `output` and `expected` strings with well-defined behavior:

- **Empty output**: Most criteria return `0.0` (no content to evaluate).
- **Empty expected**: `completeness` returns `1.0` (nothing to cover). `factuality` returns `0.5` (no reference available). `similarity` returns `0.0`.
- **Both empty**: `conciseness` returns `1.0`. `tokenF1` and `rougeL` return `1.0`. `jaccardSimilarity` returns `1.0`.

---

## Advanced Usage

### Using a judge LLM

Supply any LLM provider through a judge function. The function receives a prompt string and must return the model's response as a string.

**OpenAI example:**

```typescript
import OpenAI from 'openai'
import { evaluate } from 'llm-eval-lite'
import type { JudgeFn } from 'llm-eval-lite'

const openai = new OpenAI()

const judge: JudgeFn = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0].message.content ?? ''
}

const result = await evaluate(
  'LLM output here',
  'expected output here',
  'factuality',
  { mode: 'model', judge }
)
```

**Anthropic example:**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { evaluate } from 'llm-eval-lite'
import type { JudgeFn } from 'llm-eval-lite'

const anthropic = new Anthropic()

const judge: JudgeFn = async (prompt) => {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

const result = await evaluate(output, expected, 'factuality', { judge })
```

### Custom criteria

Define domain-specific evaluation logic with a custom heuristic function.

```typescript
const result = await evaluate(output, expected, 'custom', {
  custom: {
    name: 'json-validity',
    heuristic: (output, _expected) => {
      try {
        JSON.parse(output)
        return 1.0
      } catch {
        return 0.0
      }
    },
    threshold: 1.0,
  },
})
```

When no `heuristic` function is provided for the `custom` criterion, it falls back to the `similarity` scoring algorithm.

### CI quality gates

Use batch evaluation in CI to enforce quality thresholds across a golden test set.

```typescript
import { evaluateBatch } from 'llm-eval-lite'

const goldenSet = [
  { output: await llm('What is 2+2?'), expected: '4', id: 'math-1' },
  { output: await llm('Capital of Japan?'), expected: 'Tokyo', id: 'geo-1' },
  // ...
]

const result = await evaluateBatch(goldenSet, ['factuality', 'completeness'], {
  mode: 'heuristic',
})

if (!result.pass) {
  console.error(`Quality gate failed. Aggregate score: ${result.aggregateScore}`)
  for (const [criterion, agg] of Object.entries(result.aggregates)) {
    console.error(`  ${criterion}: mean=${agg.mean.toFixed(3)} passRate=${agg.passRate.toFixed(2)}`)
  }
  process.exit(1)
}
```

### Production monitoring

Use heuristic evaluation inline with production LLM calls for zero-cost quality monitoring.

```typescript
import { createEvaluator } from 'llm-eval-lite'

const monitor = createEvaluator({ mode: 'heuristic', threshold: 0.6 })

async function handleRequest(prompt: string) {
  const output = await llm(prompt)
  const quality = await monitor.evaluate(output, prompt, 'relevance', { prompt })

  metrics.histogram('llm.relevance', quality.score)

  if (!quality.pass) {
    metrics.increment('llm.quality_gate_failure')
    return await llm(prompt) // retry
  }

  return output
}
```

### Pre-configured evaluator for test suites

Create one evaluator per test file or environment and reuse it.

```typescript
import { createEvaluator } from 'llm-eval-lite'

const evaluator = createEvaluator({
  mode: 'heuristic',
  threshold: 0.7,
  thresholds: { harmlessness: 0.95 },
})

// Per-call options override the evaluator defaults
const strict = await evaluator.evaluate(output, expected, 'factuality', {
  threshold: 0.9,
})
```

---

## TypeScript

The package is written in strict TypeScript and ships declaration files (`dist/index.d.ts`). All public types are exported from the package entry point.

```typescript
import { evaluate, evaluateBatch, createEvaluator } from 'llm-eval-lite'
import type {
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
} from 'llm-eval-lite'
```

When `evaluate` is called with a single criterion, the return type is `Promise<EvalResult | MultiEvalResult>`. Narrow the type with a type assertion or a type guard:

```typescript
const result = await evaluate(output, expected, 'similarity')
if ('score' in result) {
  // result is EvalResult
  console.log(result.score)
}
```

```typescript
// Or use a type assertion when the criterion type is known at call time
const result = await evaluate(output, expected, 'similarity') as EvalResult
```

---

## License

MIT
