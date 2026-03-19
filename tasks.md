# llm-eval-lite — Task Breakdown

This file tracks all implementation tasks derived from [SPEC.md](./SPEC.md). Tasks are grouped into phases matching the implementation roadmap (Section 18).

---

## Phase 0: Project Scaffolding and Setup

- [ ] **Install dev dependencies** — Add `typescript`, `vitest`, and `eslint` as devDependencies in `package.json`. Verify `npm install` succeeds. | Status: not_done
- [ ] **Configure ESLint** — Create `.eslintrc` (or `eslint.config.js`) with a TypeScript-appropriate configuration. Verify `npm run lint` runs without errors on an empty `src/`. | Status: not_done
- [ ] **Configure Vitest** — Create `vitest.config.ts` with TypeScript support. Verify `npm run test` runs (passing with zero tests). | Status: not_done
- [ ] **Create directory structure** — Create all directories specified in Section 17: `src/criteria/`, `src/heuristic/`, `src/judge/`, `src/__tests__/`, `src/__tests__/criteria/`, `src/__tests__/heuristic/`, `src/__tests__/judge/`. | Status: not_done
- [ ] **Create placeholder source files** — Create empty/stub files for every source module listed in Section 17: `src/types.ts`, `src/defaults.ts`, `src/evaluate.ts`, `src/evaluator.ts`, `src/criteria/*.ts`, `src/heuristic/*.ts`, `src/judge/*.ts`. Verify `npm run build` compiles with no errors. | Status: not_done
- [ ] **Set up index.ts exports** — Update `src/index.ts` to export all public functions and types as specified in Section 17 (re-exports from `evaluate`, `evaluator`, `types`). Initially these can be empty stubs. | Status: not_done

---

## Phase 1: Type Definitions and Defaults

- [ ] **Define CriterionId type** — Implement `CriterionId` union type with all 9 criterion IDs: `factuality`, `relevance`, `completeness`, `conciseness`, `helpfulness`, `harmlessness`, `coherence`, `similarity`, `custom` (Section 8.3). | Status: not_done
- [ ] **Define EvaluationMode type** — Implement `EvaluationMode` as `'heuristic' | 'model' | 'auto'` (Section 8.3). | Status: not_done
- [ ] **Define JudgeFn type** — Implement `JudgeFn` as `(prompt: string) => Promise<string>` (Section 8.3). | Status: not_done
- [ ] **Define EvalResult interface** — Implement `EvalResult` with fields: `score`, `pass`, `criterion`, `explanation`, `mode`, `threshold`, `duration` (Section 8.3). | Status: not_done
- [ ] **Define MultiEvalResult interface** — Implement `MultiEvalResult` with fields: `scores` (Record of CriterionId to EvalResult), `aggregateScore`, `pass`, `duration` (Section 8.3). | Status: not_done
- [ ] **Define EvalCase interface** — Implement `EvalCase` with fields: `output`, `expected`, optional `id`, optional `metadata` (Section 8.3). | Status: not_done
- [ ] **Define CriterionAggregate interface** — Implement `CriterionAggregate` with fields: `criterion`, `mean`, `median`, `min`, `max`, `stdDev`, `passRate` (Section 8.3). | Status: not_done
- [ ] **Define BatchEvalResult interface** — Implement `BatchEvalResult` with fields: `results` (array of case+result), `aggregates` (Record of CriterionId to CriterionAggregate), `aggregateScore`, `pass`, `duration` (Section 8.3). | Status: not_done
- [ ] **Define EvalOptions interface** — Implement `EvalOptions` with fields: `mode`, `judge`, `threshold`, `thresholds`, `prompt`, `custom`, `judgePrompts`, `criterionModes` (Sections 8.3, 11.3, 12.3). | Status: not_done
- [ ] **Define BatchEvalOptions interface** — Implement `BatchEvalOptions` extending `EvalOptions` with `concurrency` (default 4) and `onProgress` callback (Section 8.3). | Status: not_done
- [ ] **Define CustomCriterionConfig interface** — Implement `CustomCriterionConfig` with fields: `name`, optional `heuristic` function, optional `judgePrompt` template, optional `threshold` (Section 8.3). | Status: not_done
- [ ] **Define EvaluatorConfig interface** — Implement `EvaluatorConfig` extending `EvalOptions` with optional `criteria` array (Section 8.3). | Status: not_done
- [ ] **Define Evaluator interface** — Implement `Evaluator` interface with `evaluate()` and `evaluateBatch()` methods (Section 8.3). | Status: not_done
- [ ] **Implement default thresholds map** — In `defaults.ts`, define the default threshold for each criterion: factuality=0.7, relevance=0.7, completeness=0.6, conciseness=0.6, helpfulness=0.6, harmlessness=0.8, coherence=0.6, similarity=0.6, custom=0.5 (Section 12.1). | Status: not_done
- [ ] **Implement auto mode routing table** — In `defaults.ts`, define the default mode for each criterion in auto mode: factuality=model, relevance=model, completeness=heuristic, conciseness=heuristic, helpfulness=model, harmlessness=model, coherence=heuristic, similarity=heuristic, custom=per-config (Section 6.3). | Status: not_done
- [ ] **Write types.test.ts** — Type-level tests verifying all exported types are correct and composable. Ensure `EvalResult`, `MultiEvalResult`, `BatchEvalResult`, etc. are structurally sound. | Status: not_done

---

## Phase 2: Heuristic Utilities

### 2a: Tokenizer (`src/heuristic/tokenizer.ts`)

- [ ] **Implement word tokenizer** — Split text on whitespace, strip leading/trailing punctuation from each token, lowercase, filter out empty tokens and single-character tokens (Section 10.1). | Status: not_done
- [ ] **Implement English stopword list** — Build a set of ~150 common English stopwords (articles, prepositions, conjunctions, pronouns, common verbs) as specified in Section 10.1. | Status: not_done
- [ ] **Implement content keyword extraction** — Tokenize text and remove stopwords to produce a set of content keywords. This is used by factuality, relevance, completeness, and similarity. | Status: not_done
- [ ] **Handle non-Latin-script text gracefully** — Ensure tokenizer does not crash or return NaN on non-English text; it may degrade in quality but must not error (Section 14.5). | Status: not_done
- [ ] **Handle Unicode and special characters** — Ensure no encoding errors on Unicode input (Section 14.5). | Status: not_done
- [ ] **Write tokenizer.test.ts** — Test word tokenization, stopword removal, edge cases (empty input, single word, punctuation-only, Unicode). | Status: not_done

### 2b: Sentence Segmentation (`src/heuristic/sentences.ts`)

- [ ] **Implement sentence boundary detection** — Split on `.`, `!`, `?` followed by whitespace and a capital letter (or end of string) (Section 10.2). | Status: not_done
- [ ] **Implement abbreviation handling** — Do not split on common abbreviations: "Dr.", "Mr.", "Mrs.", "Inc.", "Ltd.", "e.g.", "i.e.", "vs.", "etc." (Section 10.2). | Status: not_done
- [ ] **Implement list item detection** — Lines starting with `-`, `*`, or `\d+\.` are treated as individual items (Section 10.2). | Status: not_done
- [ ] **Implement non-factual sentence filter** — Filter out sentences that are questions, meta-commentary ("Great question!"), hedging-only ("I'm not sure"), greetings ("Hello!"), transition phrases ("Let me explain.") (Section 10.2). | Status: not_done
- [ ] **Write sentences.test.ts** — Test sentence splitting, abbreviation handling, list items, non-factual sentence filtering, empty input, single sentence. | Status: not_done

### 2c: N-gram Jaccard Similarity (`src/heuristic/ngrams.ts`)

- [ ] **Implement n-gram extraction** — Extract unigrams, bigrams, and trigrams from a list of tokens (Section 10.3). | Status: not_done
- [ ] **Implement Jaccard similarity** — Compute `|A ∩ B| / |A ∪ B|` on n-gram sets (Section 10.3). | Status: not_done
- [ ] **Implement weighted composite Jaccard** — Combine unigram (0.2), bigram (0.3), trigram (0.5) Jaccard scores with configurable weights (Section 10.3). | Status: not_done
- [ ] **Write ngrams.test.ts** — Test n-gram extraction, Jaccard similarity, composite scoring, empty inputs, identical inputs, disjoint inputs. | Status: not_done

### 2d: ROUGE-L / LCS (`src/heuristic/rougeL.ts`)

- [ ] **Implement LCS computation** — Standard dynamic programming LCS algorithm with O(m*n) time and O(min(m,n)) space on word sequences (Section 10.4). | Status: not_done
- [ ] **Implement ROUGE-L scoring** — Compute LCS-based precision, recall, and F1 from the LCS length (Section 10.4). | Status: not_done
- [ ] **Handle edge cases** — Empty input for either text returns 0. Identical texts return 1.0. | Status: not_done
- [ ] **Write rougeL.test.ts** — Test LCS computation, ROUGE-L F1, edge cases (empty, identical, completely different, long texts). | Status: not_done

### 2e: Token F1 (`src/heuristic/tokenF1.ts`)

- [ ] **Implement Token F1 computation** — Compute precision, recall, and F1 on unigram token overlap between output and expected, with lowercasing, punctuation removal, and stopword removal (Section 10.5). | Status: not_done
- [ ] **Handle zero-denominator cases** — Return 0 when denominator is zero in precision, recall, or F1 (Section 5.8). | Status: not_done
- [ ] **Write tokenF1.test.ts** — Test F1 computation, edge cases (empty strings, identical strings, no overlap). | Status: not_done

### 2f: Entity Extraction (`src/heuristic/entities.ts`)

- [ ] **Implement capitalized phrase extraction** — Extract sequences of capitalized words as proper nouns/names/places (Section 10.6). | Status: not_done
- [ ] **Implement numeric expression extraction** — Extract numbers, dates, percentages, currency amounts using regex (Section 10.6). | Status: not_done
- [ ] **Implement quoted string extraction** — Extract text within quotation marks (Section 10.6). | Status: not_done
- [ ] **Implement entity coverage computation** — Compute fraction of expected entities that appear (case-insensitive exact or substring match) in the output (Section 10.6). | Status: not_done
- [ ] **Write entities.test.ts** — Test entity extraction for proper nouns, numbers, dates, quoted strings, and coverage computation. | Status: not_done

### 2g: Pattern Catalogs (`src/heuristic/patterns.ts`)

- [ ] **Implement toxicity word list** — Categorized by severity: critical (severe slurs, explicit threats, self-harm), warning (mild profanity, aggressive), info (mildly inappropriate). ~200 terms (Section 10.7). | Status: not_done
- [ ] **Implement PII pattern regexes** — Email, phone (US + international), SSN, credit card, IP address patterns (Section 5.6, 10.7). | Status: not_done
- [ ] **Implement harmful instruction detection patterns** — Trigger phrases ("how to make", "steps to", "instructions for") combined with harmful topic word list (Section 5.6). | Status: not_done
- [ ] **Implement refusal phrase patterns** — Direct refusal, policy citation, safety refusal, capability limitation patterns (Section 10.7). | Status: not_done
- [ ] **Implement filler phrase patterns** — "In conclusion", "It is important to note that", "As mentioned earlier", "Let me explain", "To elaborate further" (Section 5.4). | Status: not_done
- [ ] **Implement generic response patterns** — "I don't have information about...", "I'm not sure what you mean by...", "Could you please clarify..." (Section 5.2). | Status: not_done
- [ ] **Compile all regexes at module load time** — Ensure all patterns are pre-compiled, not constructed per-call (Section 10.7). | Status: not_done
- [ ] **Audit all regexes for ReDoS safety** — No nested quantifiers, no unbounded alternation inside quantifiers (Section 10.7, 15.3). | Status: not_done
- [ ] **Write patterns.test.ts** — Test each pattern category: toxicity detection at all severity levels, PII detection for each type, refusal detection, filler detection, generic response detection, ReDoS safety (ensure patterns complete quickly on adversarial input). | Status: not_done

---

## Phase 3: Heuristic Criteria Implementations

### 3a: Similarity Criterion (`src/criteria/similarity.ts`)

- [ ] **Implement similarity heuristic algorithm** — Compute Token F1 (0.4 weight), ROUGE-L (0.35 weight), Jaccard similarity (0.25 weight), clamp to [0,1] (Section 5.8). | Status: not_done
- [ ] **Handle empty expected** — Return 0.0 when expected is empty (Section 5.8). | Status: not_done
- [ ] **Generate explanation string** — Describe which sub-scores contributed to the final score. | Status: not_done
- [ ] **Write similarity.test.ts** — Test high similarity (paraphrased), low similarity (unrelated), empty expected, identical texts, partial overlap. | Status: not_done

### 3b: Conciseness Criterion (`src/criteria/conciseness.ts`)

- [ ] **Implement length ratio scoring** — Compute `output_word_count / expected_word_count` and score per the piecewise function: ratio<=1.0 -> 1.0, 1.0-1.5 -> linear penalty, 1.5-3.0 -> steeper penalty, >3.0 -> heavy penalty (Section 5.4). | Status: not_done
- [ ] **Handle empty expected** — Use default expected length of 100 words when expected is empty (Section 5.4). | Status: not_done
- [ ] **Implement repetition penalty** — Count duplicate sentences, deduct 0.1 per duplicate up to max 0.4 (Section 5.4). | Status: not_done
- [ ] **Implement filler penalty** — Detect filler phrases, deduct 0.05 per filler up to max 0.2 (Section 5.4). | Status: not_done
- [ ] **Combine scores** — `conciseness = length_score - repetition_penalty - filler_penalty`, clamped to [0,1] (Section 5.4). | Status: not_done
- [ ] **Generate explanation string** — Describe length ratio, repetition issues, filler phrases found. | Status: not_done
- [ ] **Write conciseness.test.ts** — Test concise output, verbose output, extremely verbose output, repetitive output, filler-heavy output, empty expected. | Status: not_done

### 3c: Coherence Criterion (`src/criteria/coherence.ts`)

- [ ] **Implement repetition detection (trigram)** — Compute trigram frequency distribution, calculate repetition ratio `(trigrams >1) / unique trigrams`. Score: `1.0 - min(1.0, ratio * 1.5)`, weight 0.40 (Section 5.7). | Status: not_done
- [ ] **Implement duplicate sentence detection** — Count exact duplicate sentences. Score: `1.0 - (duplicates / total)`, weight 0.15 (Section 5.7). | Status: not_done
- [ ] **Implement lexical diversity (TTR)** — Compute `unique_words / total_words`. For >500 words, use moving-average TTR over 100-word sliding windows. Score: `min(1.0, TTR / 0.4)`, weight 0.20 (Section 5.7). | Status: not_done
- [ ] **Implement sentence structure scoring** — Check average sentence length. Penalty for <3 words or >80 words average. Sigmoid centered at 15-20 words. Weight 0.10 (Section 5.7). | Status: not_done
- [ ] **Implement degenerate output detection** — Empty output -> 0.0, single char repeated -> 0.0, >90% punctuation/special -> 0.1. Weight 0.15, overrides other sub-scores when triggered (Section 5.7). | Status: not_done
- [ ] **Combine weighted sub-scores** — `coherence = weighted_sum(...)`, clamped to [0,1] (Section 5.7). | Status: not_done
- [ ] **Generate explanation string** — Describe which coherence signals were detected (repetition, low diversity, degenerate content, etc.). | Status: not_done
- [ ] **Write coherence.test.ts** — Test well-structured text, repetitive text, degenerate output (empty, single char, all punctuation), low diversity text, very short/long sentences. | Status: not_done

### 3d: Completeness Criterion (`src/criteria/completeness.ts`)

- [ ] **Implement sentence-level coverage** — Segment expected into sentences (filter non-factual). For each expected sentence, compute best match against output using composite of n-gram Jaccard + LCS ratio (Section 5.3). | Status: not_done
- [ ] **Implement coverage threshold** — An expected sentence is "covered" if best match score > 0.25 (Section 5.3). | Status: not_done
- [ ] **Compute completeness score** — `covered_sentences / total_expected_sentences` (Section 5.3). | Status: not_done
- [ ] **Handle empty expected** — Return 1.0 when expected is empty (Section 5.3). | Status: not_done
- [ ] **Generate explanation string** — Describe how many expected sentences were covered and which were missed. | Status: not_done
- [ ] **Write completeness.test.ts** — Test complete coverage, partial coverage, no coverage, empty expected, output longer than expected. | Status: not_done

### 3e: Relevance Criterion (`src/criteria/relevance.ts`)

- [ ] **Implement reference selection** — Use `options.prompt` if provided, otherwise use `expected` as proxy (Section 5.2). | Status: not_done
- [ ] **Implement keyword coverage scoring** — Compute `|refKeywords ∩ outputKeywords| / |refKeywords|`, scale with `min(1.0, coverage * 1.5)`, weight 0.6 (Section 5.2). | Status: not_done
- [ ] **Implement generic response penalty** — Detect generic response patterns, deduct 0.15 per pattern, weight 0.2 (Section 5.2). | Status: not_done
- [ ] **Implement question-type alignment** — Extract question type (who/what/when/where/why/how/yes-no), check output alignment, misalignment deducts 0.15, weight 0.2 (Section 5.2). | Status: not_done
- [ ] **Combine scores** — `relevance = coverage * 0.6 + (1 - generic_penalty) * 0.2 + question_alignment * 0.2`, clamped to [0,1] (Section 5.2). | Status: not_done
- [ ] **Generate explanation string** — Describe keyword coverage, generic response detection, question-type alignment. | Status: not_done
- [ ] **Write relevance.test.ts** — Test relevant output, irrelevant output, generic responses, question-type misalignment, using prompt vs expected. | Status: not_done

### 3f: Factuality Criterion (`src/criteria/factuality.ts`)

- [ ] **Implement claim-level coverage** — Extract sentences from output, filter non-factual, compute keyword overlap with expected per sentence. Sentence is "supported" if overlap > 0.3 (Section 5.1). | Status: not_done
- [ ] **Implement entity coverage** — Extract entities from both texts, compute fraction of expected entities appearing in output (Section 5.1). | Status: not_done
- [ ] **Compute factuality score** — `0.6 * (supported / total_factual) + 0.4 * entity_coverage`, clamped to [0,1] (Section 5.1). | Status: not_done
- [ ] **Handle no factual sentences** — Return 1.0 if output contains no factual sentences (Section 5.1). | Status: not_done
- [ ] **Handle empty expected** — Fall back to reduced evaluation: self-consistency, hedging density, structural indicators. Note in explanation that no reference was available (Section 5.1). | Status: not_done
- [ ] **Generate explanation string** — Describe supported sentences, entity coverage, and any fallback mode. | Status: not_done
- [ ] **Write factuality.test.ts** — Test matching facts, contradictory facts, empty expected, output with no factual sentences, paraphrased facts. | Status: not_done

### 3g: Harmlessness Criterion (`src/criteria/harmlessness.ts`)

- [ ] **Implement toxicity scoring** — Scan output against toxicity word list by severity. Critical: -0.4 each, warning: -0.15 each, info: -0.05 each. Score = `1.0 - total_deductions`, floored at 0.0 (Section 5.6). | Status: not_done
- [ ] **Implement PII detection scoring** — Scan for email, phone, SSN, credit card, IP patterns. Each match deducts 0.15. Score = `1.0 - pii_deductions`, floored at 0.0 (Section 5.6). | Status: not_done
- [ ] **Implement harmful instruction detection** — Detect instructional patterns combined with harmful topics. Each match deducts 0.3 (Section 5.6). | Status: not_done
- [ ] **Combine scores** — `harmlessness = min(toxicity_score, pii_score, instruction_score)` — worst-case approach (Section 5.6). | Status: not_done
- [ ] **Generate explanation string** — Describe which harmful content categories were detected (toxicity, PII, harmful instructions). | Status: not_done
- [ ] **Write harmlessness.test.ts** — Test safe content, toxic content at each severity level, PII leakage (each type), harmful instructions, combined harmful content. | Status: not_done

### 3h: Helpfulness Criterion (`src/criteria/helpfulness.ts`)

- [ ] **Implement composite helpfulness** — Compute relevance (0.35), completeness (0.25), conciseness (0.15), coherence (0.15) sub-scores using existing criterion algorithms (Section 5.5). | Status: not_done
- [ ] **Implement refusal penalty** — Detect refusal patterns ("I can't help with that", "I'm unable to", "As an AI"), deduct 0.3-0.5 depending on severity (Section 5.5). | Status: not_done
- [ ] **Combine scores** — `helpfulness = weighted_sum - refusal_penalty`, clamped to [0,1] (Section 5.5). | Status: not_done
- [ ] **Note proxy estimation in explanation** — Explanation must note that helpfulness was estimated from proxy signals and model-graded evaluation is recommended (Section 5.5). | Status: not_done
- [ ] **Write helpfulness.test.ts** — Test helpful output, unhelpful/refusal output, partially helpful output. Verify explanation mentions proxy estimation. | Status: not_done

### 3i: Custom Criterion (`src/criteria/custom.ts`)

- [ ] **Implement custom heuristic evaluation** — Call user-provided `heuristic(output, expected)` function and return its 0-1 score (Section 5.9). | Status: not_done
- [ ] **Validate custom config** — Require `name` field. At least one of `heuristic` or `judgePrompt` must be provided. Throw clear error if neither is given. | Status: not_done
- [ ] **Handle missing custom config** — If `evaluate` is called with criterion `'custom'` but no `custom` config in options, throw a descriptive error. | Status: not_done
- [ ] **Generate explanation string** — Include custom criterion name in explanation. | Status: not_done
- [ ] **Write custom.test.ts** — Test custom heuristic function, missing config error, missing name error, threshold override. | Status: not_done

---

## Phase 4: Core evaluate Function

- [ ] **Implement single-criterion evaluate()** — Accept `output`, `expected`, single `CriterionId`, optional `EvalOptions`. Route to the appropriate criterion handler. Return `EvalResult` with score, pass (score >= threshold), criterion, explanation, mode, threshold, duration (Section 8.2). | Status: not_done
- [ ] **Implement multi-criterion evaluate()** — Accept `CriterionId[]`. Evaluate each criterion independently. Return `MultiEvalResult` with per-criterion scores, aggregateScore (mean of scores), pass (all criteria pass), duration (Section 8.2). | Status: not_done
- [ ] **Implement function overloading / union return type** — `evaluate` returns `EvalResult` for single criterion, `MultiEvalResult` for array. Handle type narrowing correctly (Section 8.2). | Status: not_done
- [ ] **Implement threshold resolution** — Resolve threshold per criterion: per-call `options.threshold` > per-call `options.thresholds[criterion]` > evaluator defaults > built-in defaults. Follow hierarchy from Section 12.2. | Status: not_done
- [ ] **Implement mode resolution** — Resolve mode: per-call `options.mode` > evaluator default > `'auto'`. In auto mode, consult routing table. Support `criterionModes` overrides (Sections 6.3, 12.3). | Status: not_done
- [ ] **Implement duration tracking** — Measure wall-clock time for each evaluation using `performance.now()` or `Date.now()`. Include in result (Section 8.3). | Status: not_done
- [ ] **Implement lazy short-circuit for empty output** — If output is empty, short-circuit to the criterion's empty-output score without running the full algorithm (Section 15.3). | Status: not_done
- [ ] **Write evaluate.test.ts** — Test single criterion evaluation, multi-criterion evaluation, threshold override, mode override, duration presence, empty output, auto mode fallback to heuristic when no judge. | Status: not_done

---

## Phase 5: Batch Evaluation

- [ ] **Implement evaluateBatch()** — Accept array of `EvalCase`, single or multiple criteria, `BatchEvalOptions`. Evaluate each case. Return `BatchEvalResult` (Section 8.2). | Status: not_done
- [ ] **Implement concurrency control** — Limit concurrent evaluations to `options.concurrency` (default 4). Use a semaphore or promise pool pattern (Section 8.2). | Status: not_done
- [ ] **Implement onProgress callback** — Call `onProgress(completed, total)` after each case completes (Section 8.2). | Status: not_done
- [ ] **Implement aggregate statistics** — Compute per-criterion: mean, median, min, max, stdDev, passRate (Section 8.3). | Status: not_done
- [ ] **Implement overall aggregateScore** — Mean of per-criterion means. For single criterion, straightforward mean of scores (Section 8.3). | Status: not_done
- [ ] **Implement overall pass determination** — `pass = true` if all per-criterion aggregate means pass their thresholds (Section 8.3). | Status: not_done
- [ ] **Implement batch duration tracking** — Total wall-clock duration for the entire batch (Section 8.3). | Status: not_done
- [ ] **Handle empty cases array** — Return empty results with no aggregates, pass=true, score=0 or similar sensible default. | Status: not_done
- [ ] **Write evaluateBatch.test.ts** — Test batch with multiple cases, concurrency behavior, progress callback, aggregate statistics correctness (mean, median, min, max, stdDev, passRate), empty batch, mixed pass/fail cases. | Status: not_done

---

## Phase 6: Evaluator Factory

- [ ] **Implement createEvaluator()** — Accept `EvaluatorConfig`, return an `Evaluator` instance with `evaluate()` and `evaluateBatch()` methods (Section 8.2). | Status: not_done
- [ ] **Implement configuration merging** — Per-call options override evaluator-level config, which overrides built-in defaults. No global state, no environment variables (Section 12.2). | Status: not_done
- [ ] **Implement default criteria** — If `config.criteria` is set, `evaluator.evaluate(output, expected)` without a criterion argument uses the default criteria. (Note: validate if spec supports this; the spec shows criterion as required, so this may be evaluator-specific sugar.) | Status: not_done
- [ ] **Ensure evaluator instances are independent** — Two evaluators with different configs must not interfere (Section 12.2). | Status: not_done
- [ ] **Write createEvaluator.test.ts** — Test evaluator creation with custom config, config merging (per-call overrides evaluator), independent evaluator instances, default judge function, default thresholds. | Status: not_done

---

## Phase 7: Model-Graded Evaluation (Judge Integration)

### 7a: Prompt Templates (`src/judge/prompts.ts`)

- [ ] **Implement factuality judge prompt template** — Template with `{{output}}` and `{{expected}}` placeholders as specified in Section 5.1. | Status: not_done
- [ ] **Implement relevance judge prompt template** — As specified in Section 5.2. | Status: not_done
- [ ] **Implement completeness judge prompt template** — As specified in Section 5.3. | Status: not_done
- [ ] **Implement conciseness judge prompt template** — As specified in Section 5.4. | Status: not_done
- [ ] **Implement helpfulness judge prompt template** — As specified in Section 5.5. | Status: not_done
- [ ] **Implement harmlessness judge prompt template** — As specified in Section 5.6. Note: harmlessness prompt does not include `{{expected}}` (Section 5.6). | Status: not_done
- [ ] **Implement coherence judge prompt template** — As specified in Section 5.7. Note: coherence prompt does not include `{{expected}}` (Section 5.7). | Status: not_done
- [ ] **Implement similarity judge prompt template** — As specified in Section 5.8. | Status: not_done
- [ ] **Implement template variable substitution** — Replace `{{output}}` and `{{expected}}` with actual text. If variable is not available, replace with `[not provided]` (Section 11.2). | Status: not_done
- [ ] **Support custom prompt overrides via judgePrompts option** — Allow per-criterion prompt overrides in `EvalOptions.judgePrompts` (Section 11.3). | Status: not_done
- [ ] **Write prompts.test.ts** — Test each prompt template generates correct prompt text, variable substitution, missing variable handling, custom prompt override. | Status: not_done

### 7b: Response Parser (`src/judge/responseParser.ts`)

- [ ] **Implement primary JSON parse** — `JSON.parse(response.trim())` for standard JSON responses (Section 9.5, strategy 1). | Status: not_done
- [ ] **Implement fence stripping** — Strip `` ```json `` / `` ``` `` fences and retry JSON parse (Section 9.5, strategy 2). | Status: not_done
- [ ] **Implement regex field extraction** — Extract `score` via `"score"\s*:\s*(\d+\.?\d*)` and `explanation` via `"explanation"\s*:\s*"([^"]*)"` (Section 9.5, strategy 3). | Status: not_done
- [ ] **Implement numeric fallback** — If response is a bare number (e.g., "0.8"), use it as score with generic explanation (Section 9.5, strategy 4). | Status: not_done
- [ ] **Implement final fallback** — Return `score: 0.5` (neutral) with explanation noting parse failure. Include raw judge response for debugging. Never throw (Section 9.5, strategy 5). | Status: not_done
- [ ] **Clamp parsed score to [0, 1]** — Ensure parsed score is always within valid range regardless of judge response. | Status: not_done
- [ ] **Write responseParser.test.ts** — Test standard JSON, JSON with code fences, malformed JSON with extractable fields, bare number response, completely unparseable response, score out of range. | Status: not_done

### 7c: Model Mode for Each Criterion

- [ ] **Implement model mode for factuality** — Construct prompt via template, call judge, parse response, return EvalResult with mode='model' (Section 5.1). | Status: not_done
- [ ] **Implement model mode for relevance** — Construct prompt, call judge, parse response (Section 5.2). | Status: not_done
- [ ] **Implement model mode for completeness** — Construct prompt, call judge, parse response (Section 5.3). | Status: not_done
- [ ] **Implement model mode for conciseness** — Construct prompt, call judge, parse response (Section 5.4). | Status: not_done
- [ ] **Implement model mode for helpfulness** — Construct prompt, call judge, parse response (Section 5.5). | Status: not_done
- [ ] **Implement model mode for harmlessness** — Construct prompt (output only, no expected), call judge, parse response (Section 5.6). | Status: not_done
- [ ] **Implement model mode for coherence** — Construct prompt (output only, no expected), call judge, parse response (Section 5.7). | Status: not_done
- [ ] **Implement model mode for similarity** — Construct prompt, call judge, parse response (Section 5.8). | Status: not_done
- [ ] **Implement model mode for custom criterion** — Use user-provided `judgePrompt` template, substitute variables, call judge, parse response (Section 5.9). | Status: not_done

### 7d: Auto Mode and Fallback

- [ ] **Implement auto mode routing** — Route each criterion to its default mode per the routing table (Section 6.3). | Status: not_done
- [ ] **Implement judge-not-provided fallback** — When auto mode routes to model but no judge is provided, fall back to heuristic. Include warning in explanation (Section 6.3). | Status: not_done
- [ ] **Implement criterionModes override** — Allow per-criterion mode overrides via `options.criterionModes` (Section 12.3). | Status: not_done
- [ ] **Implement judge failure fallback** — If judge function throws, fall back to heuristic or return neutral score (0.5) with explanation noting judge failure (Section 14.3). | Status: not_done
- [ ] **Implement model mode without judge error** — If mode is explicitly `'model'` and no judge is provided, throw a descriptive error (not silently fall back). | Status: not_done

### 7e: Model-Graded Tests

- [ ] **Write model-graded tests with mock judge** — Test each criterion in model mode with a mock judge returning scripted JSON responses (Section 14.3). | Status: not_done
- [ ] **Write fallback parsing tests** — Test each response parser fallback strategy with realistic malformed responses (Section 14.3). | Status: not_done
- [ ] **Write auto mode routing tests** — Verify each criterion routes to correct mode in auto mode, with and without a judge (Section 14.3). | Status: not_done
- [ ] **Write judge failure tests** — Verify graceful handling when judge throws (Section 14.3). | Status: not_done
- [ ] **Write custom criterion model mode tests** — Verify custom judge prompt is used correctly. | Status: not_done

---

## Phase 8: Integration Tests

- [ ] **Write realistic QA evaluation test** — Evaluate question-answering output with factuality, relevance, similarity (Section 14.4). | Status: not_done
- [ ] **Write realistic summarization evaluation test** — Evaluate summarization output with completeness, conciseness, factuality. | Status: not_done
- [ ] **Write multi-criterion integration test** — Evaluate output against multiple criteria simultaneously, verify MultiEvalResult structure (Section 14.4). | Status: not_done
- [ ] **Write batch evaluation integration test** — Run evaluateBatch with multiple cases and criteria, verify aggregate statistics (Section 14.4). | Status: not_done
- [ ] **Write createEvaluator integration test** — Create evaluator with config, run multiple evaluations, verify config merging. | Status: not_done
- [ ] **Write model+heuristic mixed-mode test** — Evaluate with auto mode where some criteria use heuristic and others use model (mock judge). | Status: not_done

---

## Phase 9: Edge Cases and Robustness

- [ ] **Test empty output for all criteria** — Verify each criterion returns a valid score for empty output (coherence=0.0, harmlessness=1.0, etc.) (Section 14.5). | Status: not_done
- [ ] **Test empty expected for all criteria** — Verify each criterion handles missing reference gracefully (similarity=0.0, completeness=1.0, etc.) (Section 14.5). | Status: not_done
- [ ] **Test very long text (10,000+ words)** — Verify heuristic mode completes in under 100ms (Section 14.5). | Status: not_done
- [ ] **Test non-English text** — Verify tokenization degrades gracefully, no crashes, no NaN (Section 14.5). | Status: not_done
- [ ] **Test Unicode and special characters** — Verify correct handling, no encoding errors (Section 14.5). | Status: not_done
- [ ] **Test judge returning non-JSON** — Verify fallback parsing handles various malformed responses (Section 14.5). | Status: not_done
- [ ] **Test concurrent batch evaluation** — Verify concurrency control works correctly under load. | Status: not_done
- [ ] **Test score clamping** — Verify all criteria clamp scores to [0,1] even with extreme inputs. | Status: not_done
- [ ] **Test NaN/Infinity prevention** — Ensure division by zero and other numeric edge cases never produce NaN or Infinity in results. | Status: not_done

---

## Phase 10: Performance Verification

- [ ] **Benchmark single evaluate (1 criterion, heuristic)** — Verify < 10ms for typical outputs under 1,000 words (Section 15.1). | Status: not_done
- [ ] **Benchmark single evaluate (all 8 criteria, heuristic)** — Verify < 50ms (Section 15.1). | Status: not_done
- [ ] **Benchmark evaluateBatch (100 cases, 1 criterion)** — Verify < 1s (Section 15.1). | Status: not_done
- [ ] **Benchmark evaluateBatch (1,000 cases, 1 criterion)** — Verify < 10s (Section 15.1). | Status: not_done
- [ ] **Verify no external calls in heuristic mode** — Audit code to ensure no network requests, file I/O, or child processes in heuristic path (Section 15.3). | Status: not_done
- [ ] **Verify single-pass algorithms** — Audit that text is scanned once for tokenization, once for segmentation (Section 15.3). | Status: not_done

---

## Phase 11: Public API Finalization

- [ ] **Finalize src/index.ts exports** — Export `evaluate`, `evaluateBatch`, `createEvaluator`, and all type exports as specified in Section 17. | Status: not_done
- [ ] **Verify all public types are exported** — Ensure `CriterionId`, `EvaluationMode`, `JudgeFn`, `EvalResult`, `MultiEvalResult`, `EvalCase`, `BatchEvalResult`, `CriterionAggregate`, `EvalOptions`, `BatchEvalOptions`, `CustomCriterionConfig`, `EvaluatorConfig`, `Evaluator` are all exported (Section 17). | Status: not_done
- [ ] **Verify zero runtime dependencies** — Ensure `package.json` has no `dependencies` field or it is empty. All algorithms use built-in JS/Node.js APIs (Section 16). | Status: not_done
- [ ] **Verify Node.js >= 18 compatibility** — Ensure ES2022 features used (`Array.prototype.at`, `Object.hasOwn`) are available in Node 18 (Section 16). | Status: not_done
- [ ] **Verify TypeScript declaration output** — Run `npm run build` and verify `dist/index.d.ts` contains all exported types (Section 16). | Status: not_done
- [ ] **Verify package.json fields** — Ensure `main`, `types`, `files`, `engines` are correctly set for publishing (existing `package.json` review). | Status: not_done

---

## Phase 12: Documentation

- [ ] **Write README.md** — Quick start, installation, API reference, usage examples, comparison with promptfoo/autoevals, integration examples (Section 18, Phase 3). | Status: not_done
- [ ] **Add JSDoc comments to all public exports** — Document `evaluate`, `evaluateBatch`, `createEvaluator`, and all exported types with usage examples (Section 18, Phase 3). | Status: not_done
- [ ] **Document judge function examples** — Include OpenAI, Anthropic, and local model judge examples in README (Sections 9.2-9.4). | Status: not_done
- [ ] **Document custom criterion usage** — Include example of defining and using a custom criterion in README (Section 5.9). | Status: not_done
- [ ] **Document threshold configuration** — Include example of overriding thresholds per criterion in README (Section 12.1). | Status: not_done
- [ ] **Document auto mode behavior** — Explain routing table, fallback behavior, and criterionModes override in README (Section 6.3). | Status: not_done

---

## Phase 13: Build, Lint, and CI Readiness

- [ ] **Verify npm run build succeeds** — Full TypeScript compilation with no errors. | Status: not_done
- [ ] **Verify npm run lint succeeds** — All source files pass ESLint. | Status: not_done
- [ ] **Verify npm run test succeeds** — All tests pass with vitest. | Status: not_done
- [ ] **Verify npm pack produces correct artifact** — Only `dist/` is included in the package (per `files` field in package.json). | Status: not_done
- [ ] **Version bump to 0.2.0** — Bump version in package.json after Phase 1 heuristic core is complete. | Status: not_done
- [ ] **Version bump to 0.3.0** — Bump version in package.json after Phase 2 model-graded is complete. | Status: not_done
- [ ] **Version bump to 1.0.0** — Bump version in package.json after Phase 3 polish is complete (Section 18). | Status: not_done
