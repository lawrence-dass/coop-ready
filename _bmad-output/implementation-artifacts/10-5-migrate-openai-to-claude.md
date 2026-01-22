# Story 10.5: Migrate from OpenAI to Claude API

**Epic:** Epic 10 - Quality Fixes & Claude Migration
**Story Key:** 10-5-migrate-openai-to-claude
**Status:** ready-for-dev
**Created:** 2026-01-22
**Priority:** Medium
**Dependencies:** None (can run in parallel with other stories)

---

## Story Summary

As a **system**,
I want **to use Claude API instead of OpenAI for AI-powered analysis and suggestions**,
So that **we have better prompt quality and alignment with the Anthropic ecosystem**.

---

## Current State

**OpenAI Integration:**
- SDK: `openai` v6.16.0
- Model: `gpt-4o-mini` (used exclusively)
- Files: 22 total (6 core lib, 2 actions, 14 prompts)
- Pricing: $0.15/1M input, $0.60/1M output

**Migration Scope:**
- 6 core library files in `lib/openai/`
- 2 server action files (`analysis.ts`, `suggestions.ts`)
- 14 prompt files
- 15 test files

---

## Acceptance Criteria

### AC1: Claude Client Configuration
**Given** the application starts
**When** AI operations are needed
**Then** Anthropic Claude client is initialized
**And** API key is loaded from `ANTHROPIC_API_KEY` environment variable
**And** appropriate model is selected (claude-3.5-sonnet or claude-3-haiku)

**Test:** App start → Claude client initialized without error

---

### AC2: Analysis Works with Claude
**Given** user triggers resume analysis
**When** `runAnalysis()` is called
**Then** Claude API is used for ATS scoring
**And** response is parsed correctly
**And** ATS score and feedback are accurate

**Test:** Run analysis → Score returned, format correct

---

### AC3: Suggestions Work with Claude
**Given** suggestion generation is triggered
**When** any suggestion generator runs
**Then** Claude API is used
**And** JSON responses parse correctly
**And** suggestion quality is maintained or improved

**Test:** Generate suggestions → Suggestions returned correctly

---

### AC4: Retry Logic Compatible
**Given** Claude API returns rate limit or error
**When** retry logic activates
**Then** appropriate backoff applied
**And** retries succeed or fail gracefully

**Test:** Simulate 429 → Retry succeeds

---

### AC5: Cost Tracking Updated
**Given** API calls are made
**When** response is received
**Then** token usage is logged
**And** cost is calculated with Claude pricing
**And** estimates are accurate

**Test:** API call → Cost logged with Claude rates

---

### AC6: All Tests Pass
**Given** migration is complete
**When** test suite runs
**Then** all 15 test files pass
**And** no regression in functionality

**Test:** `npm test` → All pass

---

## Tasks & Subtasks

- [ ] **Task 1: Setup Anthropic SDK** (AC: 1)
  - [ ] 1.1 Install `@anthropic-ai/sdk` package
  - [ ] 1.2 Remove `openai` package (or keep for comparison)
  - [ ] 1.3 Add `ANTHROPIC_API_KEY` to environment variables
  - [ ] 1.4 Update `.env.example` with new variable

- [ ] **Task 2: Update Client Configuration** (AC: 1)
  - [ ] 2.1 Rename `lib/openai/` to `lib/ai/` (optional, cleaner)
  - [ ] 2.2 Update `client.ts` with Anthropic initialization
  - [ ] 2.3 Create `getClaudeClient()` singleton function
  - [ ] 2.4 Update timeout configuration (30s default)
  - [ ] 2.5 Export new client from index

- [ ] **Task 3: Update Response Parsing** (AC: 2, 3)
  - [ ] 3.1 Update `parseResponse.ts` for Claude response structure
  - [ ] 3.2 Extract content from `response.content[0].text`
  - [ ] 3.3 Update token usage extraction (input_tokens, output_tokens)
  - [ ] 3.4 Update cost calculation with Claude pricing
  - [ ] 3.5 Update validation function for Claude responses

- [ ] **Task 4: Update Retry Logic** (AC: 4)
  - [ ] 4.1 Update error classification for Claude error codes
  - [ ] 4.2 Handle Claude-specific rate limit responses
  - [ ] 4.3 Update retry delays if needed
  - [ ] 4.4 Test error handling paths

- [ ] **Task 5: Update Analysis Action** (AC: 2)
  - [ ] 5.1 Update `actions/analysis.ts` imports
  - [ ] 5.2 Replace `openaiClient.chat.completions.create()` with Claude call
  - [ ] 5.3 Update model parameter: `gpt-4o-mini` → `claude-3-5-sonnet-20241022`
  - [ ] 5.4 Adjust temperature mapping if needed
  - [ ] 5.5 Test analysis end-to-end

- [ ] **Task 6: Update Suggestions Action** (AC: 3)
  - [ ] 6.1 Update `actions/suggestions.ts` imports
  - [ ] 6.2 Update all 5 generator functions with Claude calls
  - [ ] 6.3 Test each generator individually
  - [ ] 6.4 Test `generateAllSuggestionsWithCalibration()` orchestrator

- [ ] **Task 7: Review and Optimize Prompts** (AC: 2, 3)
  - [ ] 7.1 Review all 14 prompt files for Claude compatibility
  - [ ] 7.2 Adjust instruction formatting if needed
  - [ ] 7.3 Test prompt outputs for quality
  - [ ] 7.4 Document any prompt changes made

- [ ] **Task 8: Update Tests** (AC: 6)
  - [ ] 8.1 Update mock responses to match Claude format
  - [ ] 8.2 Update client initialization mocks
  - [ ] 8.3 Run all 15 test files
  - [ ] 8.4 Fix any failures

- [ ] **Task 9: Integration Testing** (AC: 1-6)
  - [ ] 9.1 Test full analysis flow with real Claude API
  - [ ] 9.2 Test full suggestion flow with real Claude API
  - [ ] 9.3 Verify cost tracking accuracy
  - [ ] 9.4 Test error handling with intentional failures

---

## Technical Reference

### Files to Update

**Core Library (6 files):**
| File | Lines | Changes |
|------|-------|---------|
| `lib/openai/client.ts` | 73 | Replace OpenAI init with Anthropic |
| `lib/openai/parseResponse.ts` | 132 | Update response structure parsing |
| `lib/openai/retry.ts` | 266 | Adapt error classification |
| `lib/openai/types.ts` | 66 | Update interfaces |
| `lib/openai/index.ts` | 41 | Update exports |
| `package.json` | - | Add @anthropic-ai/sdk |

**Server Actions (2 files):**
| File | Lines | Changes |
|------|-------|---------|
| `actions/analysis.ts` | 525 | Update 1 API call |
| `actions/suggestions.ts` | 2,184 | Update 5 API calls |

**Prompt Files (14 files):**
All in `lib/openai/prompts/` - Review for Claude optimization

### API Call Pattern Change

**Current (OpenAI):**
```typescript
const completion = await openaiClient.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.3,
  max_tokens: 2500,
})
const content = completion.choices[0].message.content
```

**New (Claude):**
```typescript
const message = await claudeClient.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 2500,
  messages: [{ role: 'user', content: prompt }],
})
const content = message.content[0].type === 'text' ? message.content[0].text : ''
```

### Model Mapping

| Use Case | OpenAI (Current) | Claude (New) |
|----------|------------------|--------------|
| ATS Analysis | gpt-4o-mini | claude-3-5-sonnet-20241022 |
| Suggestions | gpt-4o-mini | claude-3-5-sonnet-20241022 |
| Quick tasks | gpt-4o-mini | claude-3-haiku-20240307 (optional) |

### Pricing Comparison

| Model | Input (per 1M) | Output (per 1M) |
|-------|----------------|-----------------|
| gpt-4o-mini | $0.15 | $0.60 |
| claude-3-5-sonnet | $3.00 | $15.00 |
| claude-3-haiku | $0.25 | $1.25 |

**Note:** Claude-3-haiku is closest to gpt-4o-mini pricing. Consider using haiku for high-volume operations.

### Error Code Mapping

| OpenAI | Claude | Handling |
|--------|--------|----------|
| 429 (rate_limit) | 429 (rate_limit) | Retry with backoff |
| 500 (server_error) | 500 (api_error) | Retry once |
| 401 (auth) | 401 (authentication_error) | Fail immediately |

---

## Definition of Done

- [ ] Anthropic SDK installed and configured
- [ ] Claude client initializes correctly
- [ ] All API calls use Claude instead of OpenAI
- [ ] Response parsing works with Claude format
- [ ] Retry logic handles Claude errors
- [ ] Cost tracking uses Claude pricing
- [ ] All 15 test files pass
- [ ] Analysis flow works end-to-end
- [ ] Suggestion flow works end-to-end
- [ ] Documentation updated (env vars, setup)
- [ ] CLAUDE.md updated with model info

---

## Implementation Notes

**Why Claude?**
- Better instruction following for complex prompts
- Alignment with Anthropic ecosystem
- Claude Code integration synergy
- User preference (API key already available)

**Prompt Compatibility:**
- Most prompts should work as-is
- Claude tends to follow JSON formatting instructions well
- May need minor adjustments for optimal output

**Rollback Plan:**
- Keep OpenAI SDK as fallback initially
- Feature flag for easy switching
- Remove OpenAI after validation period

---

## Questions for Developer

- Should we use claude-3-5-sonnet (better quality) or claude-3-haiku (lower cost)?
- Should we keep OpenAI as a configurable fallback?
- Any specific prompt instructions to apply to Claude?
- Preferred naming: keep `lib/openai/` or rename to `lib/ai/`?

---
