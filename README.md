# llm-eval-lite

One-function LLM evaluation with heuristic and model-graded assertions. Evaluate LLM outputs against 9 built-in criteria using fast heuristics or a judge LLM.

## Install

```bash
npm install llm-eval-lite
```

## Quick Start

```typescript
import { evaluate } from 'llm-eval-lite'

const result = await evaluate(
  'The capital of France is Paris.',  // LLM output
  'Paris is the capital of France.',  // expected / reference
  'similarity'
)

console.log(result.score)       // 0.0 – 1.0
console.log(result.pass)        // true if score >= threshold
console.log(result.explanation) // human-readable summary
```

## All Criteria

| Criterion | Default Threshold | Heuristic Strategy |
|-----------|------------------|--------------------|
| `similarity` | 0.6 | Blend of token-F1, ROUGE-L, Jaccard |
| `completeness` | 0.6 | ROUGE-L recall (how much of expected is in output) |
| `conciseness` | 0.6 | Length ratio + sentence repetition penalty |
| `coherence` | 0.6 | 1 minus sentence repetition rate |
| `harmlessness` | 0.8 | Binary: 0 if harmful patterns detected, 1 otherwise |
| `factuality` | 0.7 | Keyword overlap (stopwords removed) |
| `relevance` | 0.7 | Jaccard similarity to prompt or expected; penalizes refusal |
| `helpfulness` | 0.6 | Composite of relevance + completeness + coherence; penalizes refusal |
| `custom` | 0.5 | Your own heuristic function |

## Evaluation Modes

- **`heuristic`** — fast, no API calls, deterministic
- **`model`** — calls a judge function you provide; falls back to heuristic if judge response is unparseable
- **`auto`** — uses the recommended mode per criterion (some criteria like factuality default to model when a judge is available)

## Multiple Criteria

```typescript
import { evaluate } from 'llm-eval-lite'
import type { MultiEvalResult } from 'llm-eval-lite'

const result = await evaluate(
  'The sky is blue.',
  'The sky appears blue due to Rayleigh scattering.',
  ['similarity', 'completeness', 'coherence', 'harmlessness']
) as MultiEvalResult

console.log(result.aggregateScore) // mean of all criteria
console.log(result.scores.similarity?.score)
```

## Using a Judge LLM

```typescript
import { evaluate } from 'llm-eval-lite'

const myJudge = async (prompt: string) => {
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
  { mode: 'model', judge: myJudge }
)
```

The judge prompt asks for a score in the format `Score: 0.8` (0.0–1.0). If parsing fails, the heuristic scorer is used as a fallback.

## Custom Criterion

```typescript
const result = await evaluate(output, expected, 'custom', {
  custom: {
    name: 'my-criterion',
    heuristic: (output, expected) => {
      // return 0.0 – 1.0
      return output.includes(expected) ? 1.0 : 0.0
    },
    threshold: 0.8,
  },
})
```

## Batch Evaluation

```typescript
import { evaluateBatch } from 'llm-eval-lite'
import type { BatchEvalResult } from 'llm-eval-lite'

const cases = [
  { output: 'Paris is in France.', expected: 'France capital is Paris.' },
  { output: 'London is in England.', expected: 'England capital is London.' },
  { output: 'Berlin is in Germany.', expected: 'Germany capital is Berlin.' },
]

const result: BatchEvalResult = await evaluateBatch(cases, 'similarity', {
  concurrency: 3,
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
})

console.log(result.aggregateScore)
console.log(result.aggregates.similarity?.mean)
console.log(result.aggregates.similarity?.passRate)
```

## Evaluator Factory

```typescript
import { createEvaluator } from 'llm-eval-lite'

const evaluator = createEvaluator({ threshold: 0.75, mode: 'heuristic' })

const r1 = await evaluator.evaluate(output1, expected1, 'similarity')
const r2 = await evaluator.evaluate(output2, expected2, 'factuality')
const batch = await evaluator.evaluateBatch(cases, ['similarity', 'coherence'])
```

## Custom Thresholds

```typescript
const result = await evaluate(output, expected, ['factuality', 'harmlessness'], {
  thresholds: {
    factuality: 0.8,
    harmlessness: 0.95,
  },
})
```

## API

### `evaluate(output, expected, criterion, options?)`

- `output` — the LLM-generated text to evaluate
- `expected` — the reference / ground-truth text
- `criterion` — a `CriterionId` or array of `CriterionId`
- Returns `EvalResult` for a single criterion, `MultiEvalResult` for an array

### `evaluateBatch(cases, criterion, options?)`

- `cases` — array of `{ output, expected, id? }`
- Returns `BatchEvalResult` with per-case results and per-criterion aggregates

### `createEvaluator(config?)`

Returns an `Evaluator` object with `evaluate()` and `evaluateBatch()` bound to the given config.

## License

MIT
