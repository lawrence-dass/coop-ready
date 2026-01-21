# OpenAI Setup Guide

This guide explains how to configure and use the OpenAI integration in CoopReady.

## Prerequisites

- OpenAI API account
- API key with access to GPT-4o-mini model

## Obtaining an API Key

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key immediately (you won't be able to see it again)
6. Store it securely - do not commit it to version control

## Configuration

### 1. Environment Variables

Add your OpenAI API key to `.env.local`:

```bash
# OpenAI Configuration (Server-only)
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important Security Notes:**
- Never commit `.env.local` to version control (it's in `.gitignore`)
- Never prefix this key with `NEXT_PUBLIC_` (it must stay server-side only)
- Never expose the API key in client-side code or browser network requests

### 2. Verify Setup

The OpenAI client automatically validates the API key on initialization. Check the server console for:

```
[OpenAI] Client initialized successfully { timeout: 30000, timestamp: '...' }
```

If the API key is missing or invalid, you'll see:

```
[OpenAI] FATAL: Missing OPENAI_API_KEY environment variable
```

## Usage

The OpenAI client is designed for use in Server Actions only. Here's a basic example:

```typescript
import { getOpenAIClient, parseOpenAIResponse, withRetry } from '@/lib/openai'

export async function analyzeResume(input: AnalysisInput) {
  const client = getOpenAIClient()

  try {
    // Wrap API call in retry logic for automatic error handling
    const completion = await withRetry(async () => {
      return await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a resume analysis expert.' },
          { role: 'user', content: input.resumeText },
        ],
        temperature: 0.7,
      })
    }, 'analyze resume')

    // Parse response and log token usage
    const parsed = parseOpenAIResponse(completion)

    return {
      data: {
        content: parsed.content,
        tokensUsed: parsed.usage.totalTokens,
        cost: parsed.costEstimate,
      },
      error: null,
    }
  } catch (error) {
    // Error is already structured with user-friendly message
    console.error('[analyzeResume] Error:', error)
    return {
      data: null,
      error: {
        message: error.message || 'Analysis failed',
        code: 'OPENAI_ERROR',
      },
    }
  }
}
```

## Error Handling

The integration includes comprehensive error handling:

### Rate Limiting (429 Errors)

**Behavior:** Automatic retry with exponential backoff (formula: 2^attempt × 1000ms)
- Retry 1: After 1 second
- Retry 2: After 2 seconds
- Retry 3: After 4 seconds (last attempt)

**User Message:** "The AI service is busy. Please wait a moment and try again."

### Network Errors

**Behavior:** Single retry after 1 second

**User Message:** "Analysis service temporarily unavailable. Please check your connection and try again."

### Timeout (>30 seconds)

**Behavior:** No retry (could compound the issue)

**User Message:** "Analysis is taking longer than expected. Please try again."

### Configuration Errors

**Behavior:** No retry (requires admin fix)

**User Message:** "Analysis service configuration error"

**Server Log:** `[OpenAI] FATAL: Missing OPENAI_API_KEY environment variable`

## Cost Monitoring

Token usage and cost estimates are automatically logged for every API call:

```
[OpenAI] Token usage { promptTokens: 150, completionTokens: 75, totalTokens: 225 }
[OpenAI] Cost estimate { costUSD: '0.000067' }
```

**GPT-4o-mini Pricing (as of 2026-01-20):**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Example Cost Calculation:**
```
Prompt: 1,000 tokens
Completion: 500 tokens

Input cost: 1000 × $0.15 / 1,000,000 = $0.00015
Output cost: 500 × $0.60 / 1,000,000 = $0.00030
Total cost: $0.00045
```

### ATS Analysis Cost Estimates

**Typical Resume Analysis:**
- Average resume length: 500-800 words
- Job description: 200-400 words
- Prompt template: ~200 tokens
- Total input tokens: ~1,000 tokens
- Expected output: ~500 tokens
- **Average cost per analysis**: $0.001-0.003

**Monthly Cost Projections:**

| Usage Tier | Scans/Month | Estimated Cost |
|------------|-------------|----------------|
| Free (3 scans) | 3 | $0.003-0.009 |
| Basic (30 scans) | 30 | $0.03-0.09 |
| Pro (100 scans) | 100 | $0.10-0.30 |
| Enterprise (1000 scans) | 1,000 | $1.00-3.00 |

**Cost Optimization Tips:**
1. Cache analysis results for identical resume+JD pairs (future enhancement)
2. Monitor token usage logs to identify optimization opportunities
3. Consider batching analyses if API usage grows significantly
4. Review logs regularly for unexpected cost spikes

## Error Codes Returned to Frontend

The integration returns structured errors that are safe to display to users:

| Error Type | Code | User-Friendly Message |
|------------|------|----------------------|
| Rate Limit | `OPENAI_ERROR` | "The AI service is busy. Please wait a moment and try again." |
| Network | `OPENAI_ERROR` | "Analysis service temporarily unavailable. Please check your connection and try again." |
| Timeout | `OPENAI_ERROR` | "Analysis is taking longer than expected. Please try again." |
| Config | `OPENAI_ERROR` | "Analysis service configuration error" |
| Malformed | `OPENAI_ERROR` | "Unexpected response from analysis service" |

**Note:** Never expose raw OpenAI API errors to users (security risk).

## Troubleshooting

### "Missing OPENAI_API_KEY" Error

**Problem:** API key not configured

**Solution:**
1. Verify `.env.local` exists in project root
2. Check that `OPENAI_API_KEY=sk-...` is present
3. Restart development server after adding the key
4. Ensure the key is not wrapped in quotes unless necessary

### "Invalid API Key" Error

**Problem:** API key is incorrect or expired

**Solution:**
1. Verify key is copied correctly (no extra spaces)
2. Check key hasn't been revoked in OpenAI dashboard
3. Create a new API key if needed

### Requests Timing Out

**Problem:** Requests taking longer than 30 seconds

**Solution:**
1. Check OpenAI API status: https://status.openai.com
2. Reduce prompt size if possible
3. Consider model alternatives for faster responses
4. Check server's internet connection

### High Costs

**Problem:** Unexpected API costs

**Solution:**
1. Review server logs for token usage patterns
2. Check for infinite loops or repeated calls
3. Implement rate limiting at application level
4. Consider caching responses when appropriate

## Best Practices

1. **Always use `withRetry`**: Wraps API calls with automatic error handling
2. **Never expose API key**: Keep in `.env.local` and server-side only
3. **Monitor token usage**: Check logs regularly for cost tracking
4. **Handle errors gracefully**: Use structured error responses
5. **Set appropriate timeouts**: Default 30s is usually sufficient
6. **Cache when possible**: Avoid redundant API calls
7. **Validate input**: Use Zod schemas before making API calls

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Pricing](https://openai.com/pricing)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Error Codes](https://platform.openai.com/docs/guides/error-codes)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
