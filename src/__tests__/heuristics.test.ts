import { describe, it, expect } from 'vitest'
import {
  tokenF1,
  rougeL,
  jaccardSimilarity,
  tokenize,
  tokenizeAll,
  sentenceSplit,
  hasRefusalPattern,
  hasHarmPatterns,
  computeSentenceRepetition,
} from '../heuristics.js'

describe('tokenize', () => {
  it('removes stopwords and deduplicates', () => {
    const tokens = tokenize('the quick brown fox and the fox')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('and')
    expect(tokens).toContain('quick')
    expect(tokens).toContain('fox')
    // deduplication
    expect(tokens.filter(t => t === 'fox').length).toBe(1)
  })
})

describe('tokenizeAll', () => {
  it('keeps stopwords, does not deduplicate', () => {
    const tokens = tokenizeAll('the fox and the fox')
    expect(tokens).toContain('the')
    expect(tokens.filter(t => t === 'fox').length).toBe(2)
  })

  it('filters empty strings', () => {
    const tokens = tokenizeAll('hello  world')
    expect(tokens.every(t => t.length > 0)).toBe(true)
  })
})

describe('tokenF1', () => {
  it('returns 1.0 for identical strings', () => {
    expect(tokenF1('hello world', 'hello world')).toBeCloseTo(1.0)
  })

  it('returns 0.0 for completely disjoint strings', () => {
    expect(tokenF1('apple banana', 'cat dog')).toBe(0.0)
  })

  it('returns 1.0 for two empty strings', () => {
    expect(tokenF1('', '')).toBe(1.0)
  })

  it('returns 0.0 when one string is empty', () => {
    expect(tokenF1('hello', '')).toBe(0.0)
    expect(tokenF1('', 'hello')).toBe(0.0)
  })

  it('partial overlap returns between 0 and 1', () => {
    const score = tokenF1('hello world', 'hello earth')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('handles duplicate tokens correctly (multiset intersection)', () => {
    // 'aa aa bb' vs 'aa bb cc' → common = aa(1) + bb(1) = 2, max(3,3) = 3 → 2/3
    const score = tokenF1('aa aa bb', 'aa bb cc')
    expect(score).toBeCloseTo(2 / 3, 2)
  })
})

describe('rougeL', () => {
  it('returns 1.0 for identical strings', () => {
    expect(rougeL('the cat sat on the mat', 'the cat sat on the mat')).toBeCloseTo(1.0)
  })

  it('returns 0.0 for completely disjoint strings', () => {
    expect(rougeL('apple banana', 'cat dog')).toBe(0.0)
  })

  it('returns 1.0 for two empty strings', () => {
    expect(rougeL('', '')).toBe(1.0)
  })

  it('returns 0.0 when one string is empty', () => {
    expect(rougeL('hello world', '')).toBe(0.0)
    expect(rougeL('', 'hello world')).toBe(0.0)
  })

  it('partial overlap returns between 0 and 1', () => {
    const score = rougeL('the cat sat on the mat', 'the cat sat on a log')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })
})

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical strings (same keyword set)', () => {
    expect(jaccardSimilarity('quick brown fox', 'quick brown fox')).toBeCloseTo(1.0)
  })

  it('returns 0.0 for completely disjoint strings', () => {
    expect(jaccardSimilarity('apple banana cherry', 'dog elephant frog')).toBe(0.0)
  })

  it('partial overlap returns between 0 and 1', () => {
    const score = jaccardSimilarity('quick brown fox', 'quick red fox')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('returns 1.0 for two empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(1.0)
  })
})

describe('sentenceSplit', () => {
  it('splits on sentence-ending punctuation', () => {
    const sentences = sentenceSplit('Hello world. How are you? I am fine!')
    expect(sentences.length).toBe(3)
  })

  it('returns single sentence for text without punctuation', () => {
    const sentences = sentenceSplit('hello world')
    expect(sentences.length).toBe(1)
  })

  it('handles empty string', () => {
    const sentences = sentenceSplit('')
    expect(sentences.length).toBe(0)
  })
})

describe('hasRefusalPattern', () => {
  it('detects "I cannot"', () => {
    expect(hasRefusalPattern('I cannot help with that.')).toBe(true)
  })

  it('detects "as an AI"', () => {
    expect(hasRefusalPattern('As an AI, I have no feelings.')).toBe(true)
  })

  it('detects "I apologize"', () => {
    expect(hasRefusalPattern('I apologize for the inconvenience.')).toBe(true)
  })

  it('returns false for normal output', () => {
    expect(hasRefusalPattern('The capital of France is Paris.')).toBe(false)
  })

  it('is case insensitive', () => {
    expect(hasRefusalPattern('i cannot do that')).toBe(true)
  })
})

describe('hasHarmPatterns', () => {
  it('detects bioweapon content', () => {
    expect(hasHarmPatterns('This is about bioweapon synthesis')).toBe(true)
  })

  it('returns false for normal content', () => {
    expect(hasHarmPatterns('The sky is blue and the grass is green.')).toBe(false)
  })
})

describe('computeSentenceRepetition', () => {
  it('returns 0 for non-repetitive text', () => {
    const rate = computeSentenceRepetition('The cat sat. The dog ran. The bird flew.')
    expect(rate).toBe(0)
  })

  it('returns > 0 for repetitive text', () => {
    const rate = computeSentenceRepetition('The cat sat. The cat sat. The cat sat.')
    expect(rate).toBeGreaterThan(0)
  })

  it('returns 0 for single sentence', () => {
    expect(computeSentenceRepetition('Hello world.')).toBe(0)
  })
})
