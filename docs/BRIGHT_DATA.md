# Bright Data Scraper Studio Runbook

SpecShift uses **custom Bright Data Scraper Studio collectors** created and operated through the Bright Data CLI. The stable `c_*` Collector IDs are injected into the server runtime through environment variables; API tokens never enter the React bundle or repository.

Official references:

- CLI: https://docs.brightdata.com/datasets/scraper-studio/build-with-the-cli
- API quickstart: https://docs.brightdata.com/datasets/scraper-studio/quickstart
- Self-Healing: https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool

## 1. Authenticate once

```bash
npx -p @brightdata/cli bdata login
```

The CLI opens Bright Data authentication in the browser and stores the credential locally. Do not paste tokens into source files, screenshots, issues, or demo footage.

## 2. Canonical comparison rule

Provider pricing structures differ. To keep comparisons meaningful, SpecShift's primary numeric price fields mean:

- `input_price_per_million`: standard online **text input** price in USD per 1M tokens.
- `output_price_per_million`: standard online **text output** price in USD per 1M tokens.
- When a provider has prompt-length tiers, use the <=200K / lowest standard tier as the primary value.
- Batch, flex, priority, caching, image-output, audio-specific, and grounding prices are not substituted into the primary text fields.
- Missing values remain null. Never invent a number.

This gives the diff engine an apples-to-apples baseline while leaving room for richer pricing dimensions after the hackathon.

## 3. Create the OpenAI collector

Target:

```text
https://developers.openai.com/api/docs/models
```

Command:

```bash
npx -p @brightdata/cli bdata scraper create \
  https://developers.openai.com/api/docs/models \
  "Return one row per model shown in the model catalog. Output exactly these fields: model, modalities, input_price_per_million, output_price_per_million, context_tokens, availability, source_url. model should use the displayed Model ID when present. input_price_per_million and output_price_per_million must be numeric USD per 1M text tokens with currency symbols and labels removed. context_tokens must be an integer token count, converting K and M notation. modalities must be an array of strings inferred only from explicitly listed capabilities. availability should be live, preview, deprecated, or unknown based only on page wording. source_url must be the public page URL. Use null for any field not stated; never infer prices or limits." 
```

Save the returned `c_*` ID as:

```text
BRIGHT_DATA_COLLECTOR_OPENAI
```

## 4. Create the Anthropic collector

Target:

```text
https://platform.claude.com/docs/en/about-claude/pricing
```

Command:

```bash
npx -p @brightdata/cli bdata scraper create \
  https://platform.claude.com/docs/en/about-claude/pricing \
  "Return one row per Claude model with standard model pricing. Output exactly these fields: model, modalities, input_price_per_million, output_price_per_million, context_tokens, availability, source_url. Use standard online text-token pricing in USD per 1M tokens, excluding batch discounts, prompt caching prices, tool charges, and third-party platform pricing. Prices must be numeric. If context length or modalities are not stated on this page, return null or an empty array rather than guessing. availability must be live, preview, deprecated, or unknown based only on page wording. source_url must be the public pricing page URL." 
```

Save the returned `c_*` ID as:

```text
BRIGHT_DATA_COLLECTOR_ANTHROPIC
```

## 5. Create the Google Gemini collector

Target:

```text
https://ai.google.dev/gemini-api/docs/pricing
```

Command:

```bash
npx -p @brightdata/cli bdata scraper create \
  https://ai.google.dev/gemini-api/docs/pricing \
  "Return one row per Gemini model or model variant with standard paid-tier pricing. Output exactly these fields: model, modalities, input_price_per_million, output_price_per_million, context_tokens, availability, source_url. For the primary price fields use standard online text input and text output USD per 1M tokens. When prompt-length tiers exist, use the <=200K or lowest standard tier. Do not substitute batch, flex, priority, caching, image-output, audio-only, grounding, or storage prices. Prices must be numeric. Capture modalities only when the page states them. Use null for unstated context length. availability must be live, preview, deprecated, or unknown from explicit page wording. source_url must be the public pricing page URL." 
```

Save the returned `c_*` ID as:

```text
BRIGHT_DATA_COLLECTOR_GOOGLE
```

## 6. Verify every collector from the CLI

```bash
npx -p @brightdata/cli bdata scraper run "$BRIGHT_DATA_COLLECTOR_OPENAI" \
  https://developers.openai.com/api/docs/models --pretty

npx -p @brightdata/cli bdata scraper run "$BRIGHT_DATA_COLLECTOR_ANTHROPIC" \
  https://platform.claude.com/docs/en/about-claude/pricing --pretty

npx -p @brightdata/cli bdata scraper run "$BRIGHT_DATA_COLLECTOR_GOOGLE" \
  https://ai.google.dev/gemini-api/docs/pricing --pretty
```

Acceptance checks:

1. Output is a JSON array.
2. Every valid row identifies a model.
3. Numeric price values are numbers, not decorated strings.
4. Missing data is null/empty rather than fabricated.
5. Keep the returned Collector IDs; do not create replacements simply because the page later changes.

## 7. Demonstrate self-healing

The contest's core proof is **run → inspect failure → heal → approve → rerun**, with the same Collector ID.

When a collector returns missing or malformed fields:

```bash
npx -p @brightdata/cli bdata scraper heal "$BRIGHT_DATA_COLLECTOR_OPENAI" \
  "The expected model pricing or context fields are missing or null after a page structure change. Restore the existing output schema without changing field meanings. Do not invent values." \
  --url https://developers.openai.com/api/docs/models
```

Review the proposed preview. If correct:

```bash
npx -p @brightdata/cli bdata scraper approve "$BRIGHT_DATA_COLLECTOR_OPENAI" \
  --url https://developers.openai.com/api/docs/models
```

Then rerun the **same** `c_*` ID:

```bash
npx -p @brightdata/cli bdata scraper run "$BRIGHT_DATA_COLLECTOR_OPENAI" \
  https://developers.openai.com/api/docs/models --pretty
```

For the demo, capture the Collector ID before and after the heal so judges can see that downstream integration did not change.

## 8. Server environment

Copy `.env.example` locally or configure the same variables in Vercel:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_OPENAI=c_...
BRIGHT_DATA_COLLECTOR_ANTHROPIC=c_...
BRIGHT_DATA_COLLECTOR_GOOGLE=c_...
```

The runtime exposes only provider configuration status and run provenance. It does not send the Bright Data API token to the browser.

## 9. Product API flow

The dashboard uses the same stable collectors through Bright Data's Collection API:

1. `POST /api/collectors/run` with `{ "provider": "openai" }`.
2. SpecShift calls `POST /dca/trigger?collector=c_*&queue_next=1` server-side.
3. The browser receives the non-secret `j_*` collection ID.
4. The browser polls `GET /api/collectors/result?provider=openai&collectionId=j_*`.
5. SpecShift calls `GET /dca/dataset?id=j_*` server-side.
6. When rows are ready, they are normalized, validated, and marked `ready` or `drift` before reaching the intelligence UI.
