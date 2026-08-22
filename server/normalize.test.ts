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
      { model: 'Claude Example', availability: 'preview' },
    ])

    expect(snapshot.models[0].pricing.inputPerMillion).toBeNull()
    expect(snapshot.models[0].pricing.outputPerMillion).toBeNull()
    expect(snapshot.models[0].limits.contextTokens).toBeNull()
    expect(snapshot.models[0].availability).toBe('preview')
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
