import { describe, expect, it } from 'vitest'
import { normalizeBrightDataRows } from './normalize'

describe('normalizeBrightDataRows', () => {
  it('normalizes common OpenAI scraper field variants into one contract', () => {
    const snapshot = normalizeBrightDataRows(
      'openai',
      'c_openai123',
      [
        {
          model_name: 'GPT Example',
          modalities: 'text, vision',
          input_price: '$2.50 / 1M tokens',
          output_price: '$10.00 / 1M tokens',
          context_window: '200K',
          status: 'Available',
          source_url: 'https://developers.openai.com/api/docs/models/example',
        },
      ],
      '2026-08-22T20:00:00.000Z',
    )

    expect(snapshot.collectorId).toBe('c_openai123')
    expect(snapshot.models).toHaveLength(1)
    expect(snapshot.models[0]).toMatchObject({
      key: 'openai:gpt-example',
      provider: 'OpenAI',
      model: 'GPT Example',
      modalities: ['text', 'vision'],
      pricing: { inputPerMillion: 2.5, outputPerMillion: 10 },
      limits: { contextTokens: 200000 },
      availability: 'live',
    })
  })

  it('flattens noisy Anthropic output and keeps priced Claude model rows', () => {
    const snapshot = normalizeBrightDataRows('anthropic', 'c_anthropic123', [
      {
        models: [
          {
            model: 'Claude Example ( limited availability )',
            input_price_per_million: 10,
            output_price_per_million: 50,
            availability: 'limited',
            source_url: '[https://platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing)',
          },
          {
            model: 'Claude Stable',
            input_price_per_million: 5,
            output_price_per_million: 25,
            availability: 'live',
          },
          { model: 'Billing unit', availability: 'live' },
          { model: 'Cache read (hit)', input_price_per_million: 0.5, availability: 'live' },
        ],
      },
    ])

    expect(snapshot.models).toHaveLength(2)
    expect(snapshot.models.map((model) => model.model)).toEqual(['Claude Example', 'Claude Stable'])
    expect(snapshot.models[0]).toMatchObject({
      availability: 'preview',
      pricing: { inputPerMillion: 10, outputPerMillion: 50 },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    })
  })

  it('unwraps Groq nested price values and recognizes production availability', () => {
    const snapshot = normalizeBrightDataRows(
      'groq',
      'c_groq123',
      [
        {
          model: 'Llama 3.3 70B',
          model_id: 'llama-3.3-70b-versatile',
          input_price_per_million: { value: 0.59, currency: 'USD' },
          output_price_per_million: { value: '0.79', currency: 'USD' },
          context_tokens: { value: 131072 },
          availability: 'production',
          modalities: ['text'],
          source_url: 'https://console.groq.com/docs/models',
        },
      ],
      '2026-08-23T04:00:00.000Z',
    )

    expect(snapshot.models).toHaveLength(1)
    expect(snapshot.models[0]).toMatchObject({
      key: 'groq:llama-3-3-70b',
      provider: 'Groq',
      model: 'Llama 3.3 70B',
      pricing: { inputPerMillion: 0.59, outputPerMillion: 0.79 },
      limits: { contextTokens: 131072 },
      availability: 'live',
      sourceUrl: 'https://console.groq.com/docs/models',
    })
  })

  it('preserves Groq rows with intentionally unavailable numeric fields', () => {
    const snapshot = normalizeBrightDataRows('groq', 'c_groq123', [
      {
        model: 'Compound',
        context_tokens: 131072,
        availability: 'production',
        source_url: 'https://console.groq.com/docs/models',
      },
    ])

    expect(snapshot.models[0].pricing.inputPerMillion).toBeNull()
    expect(snapshot.models[0].pricing.outputPerMillion).toBeNull()
    expect(snapshot.models[0].limits.contextTokens).toBe(131072)
    expect(snapshot.models[0].availability).toBe('live')
  })

  it('skips malformed rows that do not identify a model', () => {
    const snapshot = normalizeBrightDataRows('groq', 'c_groq123', [
      { price: 1 },
      null,
      'bad-row',
      { model: 'Valid Example', context_tokens: '131K' },
    ])

    expect(snapshot.models.map((model) => model.model)).toEqual(['Valid Example'])
  })

  it('reports a not-ready dataset instead of treating status objects as records', () => {
    expect(() => normalizeBrightDataRows('groq', 'c_groq123', { status: 'building' })).toThrow('not ready')
  })
})
