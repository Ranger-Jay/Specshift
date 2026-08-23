import { describe, expect, it } from 'vitest'
import { normalizeBrightDataRows } from './normalize'

describe('normalizeBrightDataRows', () => {
  it('normalizes common scraper field variants into one contract', () => {
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

  it('does not invent missing numeric values', () => {
    const snapshot = normalizeBrightDataRows('anthropic', 'c_anthropic123', [
      {
        model: 'Claude Example',
        input_price_per_million: 3,
        output_price_per_million: 15,
        availability: 'preview',
      },
    ])

    expect(snapshot.models[0].limits.contextTokens).toBeNull()
    expect(snapshot.models[0].availability).toBe('preview')
  })

  it('flattens noisy Anthropic output and keeps one base-price row per real Claude model', () => {
    const snapshot = normalizeBrightDataRows('anthropic', 'c_anthropic123', [
      {
        models: [
          {
            model: 'Claude Mythos 5 ( limited availability )',
            input_price_per_million: 10,
            output_price_per_million: 50,
            availability: 'limited',
            source_url: '[https://platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing)',
          },
          {
            model: 'Claude Opus 5',
            input_price_per_million: 5,
            output_price_per_million: 25,
            availability: 'live',
          },
          { model: 'Billing unit', availability: 'live' },
          { model: 'Cache read (hit)', input_price_per_million: 0.5, availability: 'live' },
          { model: 'Claude Opus 5', input_price_per_million: 2.5, availability: 'live' },
          { model: 'Claude Opus 5 / Claude Opus 4.8', input_price_per_million: 10, availability: 'live' },
        ],
      },
    ])

    expect(snapshot.models).toHaveLength(2)
    expect(snapshot.models.map((model) => model.model)).toEqual(['Claude Mythos 5', 'Claude Opus 5'])
    expect(snapshot.models[0]).toMatchObject({
      availability: 'preview',
      pricing: { inputPerMillion: 10, outputPerMillion: 50 },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    })
    expect(snapshot.models[1].pricing).toMatchObject({ inputPerMillion: 5, outputPerMillion: 25 })
  })

  it('skips malformed rows that do not identify a model', () => {
    const snapshot = normalizeBrightDataRows('google', 'c_google123', [
      { price: 1 },
      null,
      'bad-row',
      { model: 'Gemini Example', context_tokens: '1M' },
    ])

    expect(snapshot.models.map((model) => model.model)).toEqual(['Gemini Example'])
  })

  it('reports a not-ready dataset instead of treating status objects as records', () => {
    expect(() => normalizeBrightDataRows('google', 'c_google123', { status: 'building' })).toThrow('not ready')
  })
})
