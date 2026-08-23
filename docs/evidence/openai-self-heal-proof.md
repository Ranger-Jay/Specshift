# OpenAI Collector Self-Heal Proof

## Contest evidence

**Collector ID:** `c_mt5463k81mdjeyzz15`  
**Target:** `https://developers.openai.com/api/docs/models`  
**Post-heal response ID:** `d2t1787449444254robbhr1etj3g`  
**Verified:** 2026-08-22

## Workflow demonstrated

The same Bright Data Scraper Studio collector was used through the recovery cycle:

1. Create a custom collector for the OpenAI developer model catalog.
2. Run the collector and inspect structured output.
3. Identify extraction/schema defects in the initial implementation.
4. Use Bright Data's self-healing workflow to repair the collector.
5. Review and accept the generated changes.
6. Update the output schema and save the repaired scraper to production.
7. Rerun **the same Collector ID** from the Bright Data CLI.
8. Confirm that structured model records are restored without parser-error objects.

Post-heal CLI command:

```powershell
npx -p @brightdata/cli bdata scraper run c_mt5463k81mdjeyzz15 https://developers.openai.com/api/docs/models --pretty
```

## Post-heal verification

The healed production run returned **19 structured model records**.

Verified characteristics:

- `model` is populated with human-readable model names.
- `modalities` is an array rather than an unparsed string.
- `availability` is normalized to `live` for the returned active catalog entries.
- `input_price_per_million`, `output_price_per_million`, and `context_tokens` are numeric where those fields are exposed by the source page.
- Records that legitimately do not expose a given token-price or context field leave it absent rather than fabricating a value.
- `source_url` points to the individual model documentation page.
- The previous parser-error output is absent from the healed run.

A representative sanitized subset is committed at [`openai-healed-sample.json`](./openai-healed-sample.json).

## Why this matters to SpecShift

SpecShift is designed to distinguish two different events:

- **Provider intelligence changed:** valid structured data changed, so SpecShift emits a model/pricing/capability delta.
- **Collector drifted:** required extraction quality degrades, so SpecShift flags collector health and initiates a repair workflow instead of presenting broken data as a provider change.

This same-collector recovery is the core reliability proof for the hackathon demo.
