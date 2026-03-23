import { describe, it, expect, vi } from 'vitest'
import { evaluate } from '../evaluate.js'
import { evaluateBatch, createEvaluator } from '../evaluator.js'
import type { EvalResult, MultiEvalResult, BatchEvalResult } from '../types.js'

describe('evaluate - single criterion', () => {
  it('returns score close to 1.0 and pass=true for identical strings (similarity)', async () => {
    const result = await evaluate('hello world', 'hello world', 'similarity') as EvalResult
    expect(result.score).toBeGreaterThan(0.8)
    expect(result.pass).toBe(true)
    expect(result.criterion).toBe('similarity')
    expect(result.mode).toBe('heuristic')
    expect(result.threshold).toBe(0.6)
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(typeof result.explanation).toBe('string')
  })

  it('returns score 0 and pass=false for empty output (similarity)', async () => {
    const result = await evaluate('', 'expected output', 'similarity') as EvalResult
    expect(result.score).toBe(0)
    expect(result.pass).toBe(false)
  })

  it('returns score 0 for empty output (completeness)', async () => {
    const result = await evaluate('', 'some expected text here', 'completeness') as EvalResult
    expect(result.score).toBe(0)
    expect(result.pass).toBe(false)
  })

  it('returns score 1.0 for harmless output (harmlessness)', async () => {
    const result = await evaluate('The sky is blue.', 'anything', 'harmlessness') as EvalResult
    expect(result.score).toBe(1.0)
    expect(result.pass).toBe(true)
  })

  it('returns score 0 for harmful output (harmlessness)', async () => {
    const result = await evaluate('This involves bioweapon synthesis', 'anything', 'harmlessness') as EvalResult
    expect(result.score).toBe(0)
    expect(result.pass).toBe(false)
  })

  it('penalizes refusal in relevance', async () => {
    const result = await evaluate(
      'I cannot help with that request.',
      'Paris is the capital of France.',
      'relevance'
    ) as EvalResult
    expect(result.score).toBeLessThan(0.5)
  })

  it('uses custom threshold via options', async () => {
    const result = await evaluate('hello world', 'hello world', 'similarity', { threshold: 0.99 }) as EvalResult
    // score should be high but threshold is 0.99 so may or may not pass
    expect(result.threshold).toBe(0.99)
  })

  it('uses per-criterion threshold via thresholds option', async () => {
    const result = await evaluate('hello world', 'hello world', 'similarity', {
      thresholds: { similarity: 0.1 }
    }) as EvalResult
    expect(result.threshold).toBe(0.1)
    expect(result.pass).toBe(true)
  })

  it('uses heuristic mode when mode=heuristic', async () => {
    const result = await evaluate('hello world', 'hello world', 'factuality', {
      mode: 'heuristic'
    }) as EvalResult
    expect(result.mode).toBe('heuristic')
  })

  it('falls back to heuristic if judge returns unparseable response', async () => {
    const mockJudge = vi.fn().mockResolvedValue('This is a great response!')
    const result = await evaluate('hello world', 'hello world', 'factuality', {
      mode: 'model',
      judge: mockJudge,
    }) as EvalResult
    // Falls back to heuristic since response is unparseable
    expect(result.mode).toBe('heuristic')
  })

  it('uses judge score when response is parseable', async () => {
    const mockJudge = vi.fn().mockResolvedValue('Score: 0.9')
    const result = await evaluate('hello world', 'hello world', 'factuality', {
      mode: 'model',
      judge: mockJudge,
    }) as EvalResult
    expect(result.mode).toBe('model')
    expect(result.score).toBeCloseTo(0.9)
  })

  it('uses judge score from ratio format "0.8/1.0"', async () => {
    const mockJudge = vi.fn().mockResolvedValue('I rate this 0.8/1.0')
    const result = await evaluate('some output', 'expected', 'relevance', {
      mode: 'model',
      judge: mockJudge,
    }) as EvalResult
    expect(result.mode).toBe('model')
    expect(result.score).toBeCloseTo(0.8)
  })
})

describe('evaluate - multiple criteria', () => {
  it('returns MultiEvalResult for array of criteria', async () => {
    const result = await evaluate(
      'hello world',
      'hello world',
      ['similarity', 'coherence']
    ) as MultiEvalResult
    expect(result.scores).toBeDefined()
    expect(result.scores.similarity).toBeDefined()
    expect(result.scores.coherence).toBeDefined()
    expect(typeof result.aggregateScore).toBe('number')
    expect(typeof result.pass).toBe('boolean')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('aggregateScore is mean of individual scores', async () => {
    const result = await evaluate(
      'hello world',
      'hello world',
      ['similarity', 'coherence', 'harmlessness']
    ) as MultiEvalResult

    const scores = Object.values(result.scores).map(r => r!.score)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    expect(result.aggregateScore).toBeCloseTo(mean, 5)
  })

  it('pass=false if any criterion fails', async () => {
    const result = await evaluate(
      'This involves bioweapon synthesis',
      'harmless text',
      ['similarity', 'harmlessness']
    ) as MultiEvalResult
    expect(result.pass).toBe(false)
  })
})

describe('evaluateBatch', () => {
  it('returns BatchEvalResult with 3 cases', async () => {
    const cases = [
      { output: 'hello world', expected: 'hello world' },
      { output: 'foo bar', expected: 'foo bar' },
      { output: '', expected: 'some expected text' },
    ]
    const result: BatchEvalResult = await evaluateBatch(cases, 'similarity')
    expect(result.results.length).toBe(3)
    expect(result.aggregates.similarity).toBeDefined()
    expect(typeof result.aggregateScore).toBe('number')
    expect(typeof result.pass).toBe('boolean')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('computes correct aggregate statistics', async () => {
    const cases = [
      { output: 'hello world', expected: 'hello world' },
      { output: 'hello world', expected: 'hello world' },
    ]
    const result: BatchEvalResult = await evaluateBatch(cases, 'similarity')
    const agg = result.aggregates.similarity!
    expect(agg.mean).toBeGreaterThan(0.8)
    expect(agg.min).toBeGreaterThan(0.8)
    expect(agg.max).toBeGreaterThan(0.8)
    expect(agg.stdDev).toBeCloseTo(0, 5)
  })

  it('calls onProgress callback', async () => {
    const progressCalls: Array<[number, number]> = []
    const cases = [
      { output: 'a', expected: 'a' },
      { output: 'b', expected: 'b' },
      { output: 'c', expected: 'c' },
    ]
    await evaluateBatch(cases, 'similarity', {
      onProgress: (completed, total) => progressCalls.push([completed, total]),
    })
    expect(progressCalls.length).toBe(3)
    expect(progressCalls[progressCalls.length - 1]).toEqual([3, 3])
  })

  it('handles multiple criteria in batch', async () => {
    const cases = [
      { output: 'hello world', expected: 'hello world' },
      { output: 'foo bar', expected: 'foo bar baz' },
    ]
    const result: BatchEvalResult = await evaluateBatch(cases, ['similarity', 'completeness'])
    expect(result.aggregates.similarity).toBeDefined()
    expect(result.aggregates.completeness).toBeDefined()
  })
})

describe('createEvaluator', () => {
  it('creates an evaluator with bound config', async () => {
    const evaluator = createEvaluator({ threshold: 0.1 })
    const result = await evaluator.evaluate('hello world', 'hello world', 'similarity') as EvalResult
    expect(result.threshold).toBe(0.1)
    expect(result.pass).toBe(true)
  })

  it('allows option override per call', async () => {
    const evaluator = createEvaluator({ threshold: 0.1 })
    const result = await evaluator.evaluate('hello world', 'hello world', 'similarity', {
      threshold: 0.99,
    }) as EvalResult
    expect(result.threshold).toBe(0.99)
  })

  it('evaluateBatch works via evaluator', async () => {
    const evaluator = createEvaluator()
    const cases = [
      { output: 'hello', expected: 'hello' },
      { output: 'world', expected: 'world' },
    ]
    const result = await evaluator.evaluateBatch(cases, 'similarity')
    expect(result.results.length).toBe(2)
  })
})

describe('scoreCustom', () => {
  it('uses custom heuristic function', async () => {
    const result = await evaluate('anything', 'anything', 'custom', {
      custom: {
        name: 'my-criterion',
        heuristic: (_output, _expected) => 0.42,
      },
    }) as EvalResult
    expect(result.score).toBeCloseTo(0.42)
  })

  it('falls back to similarity when no heuristic provided', async () => {
    const result = await evaluate('hello world', 'hello world', 'custom') as EvalResult
    expect(result.score).toBeGreaterThan(0.5)
  })
})

describe('edge cases', () => {
  it('conciseness returns valid score for non-word-character-only inputs', async () => {
    const result = await evaluate('!!!', '???', 'conciseness', { mode: 'heuristic' })
    const single = result as EvalResult
    expect(Number.isNaN(single.score)).toBe(false)
    expect(single.score).toBeGreaterThanOrEqual(0)
    expect(single.score).toBeLessThanOrEqual(1)
  })

  it('empty batch returns pass: false', async () => {
    const result = await evaluateBatch([], 'similarity')
    expect(result.pass).toBe(false)
    expect(result.aggregateScore).toBe(0)
    expect(result.results).toHaveLength(0)
  })
})
