import { describe, expect, it } from 'vitest'
import type { CollectorSnapshot, NormalizedModel } from '../domain/intelligence'
import { diffSnapshots } from './diffSnapshots'

const model = (overrides: Partial<NormalizedModel> = {}): NormalizedModel => ({
  key: 'example:model-pro',
  provider: 'Example AI',
  model: 'Model Pro',
  modalities: ['text'],
  pricing: { currency: 'USD', inputPerMillion: 3, outputPerMillion: 12 },
  limits: { contextTokens: 128000 },
  availability: 'live',
  sourceUrl: 'https://example.com/models/model-pro',
  scrapedAt: '2026-08-22T19:00:00.000Z',
  ...overrides,
})

const snapshot = (models: NormalizedModel[]): CollectorSnapshot => ({
  collectorId: 'c_demo123',
  source: 'https://example.com/models',
  capturedAt: '2026-08-22T19:00:00.000Z',
  models,
})

describe('diffSnapshots', () => {
  it('reports pricing and context changes independently', () => {
    const previous = snapshot([model()])
    const current = snapshot([
      model({
        pricing: { currency: 'USD', inputPerMillion: 2.5, outputPerMillion: 10 },
        limits: { contextTokens: 200000 },
      }),
    ])

    const kinds = diffSnapshots(previous, current).map((delta) => delta.kind)

    expect(kinds).toEqual(['input-price', 'output-price', 'context-limit'])
  })

  it('reports newly discovered models', () => {
    const current = snapshot([
      model(),
      model({ key: 'example:model-mini', model: 'Model Mini' }),
    ])

    const deltas = diffSnapshots(snapshot([model()]), current)

    expect(deltas).toHaveLength(1)
    expect(deltas[0].kind).toBe('model-added')
    expect(deltas[0].model).toBe('Model Mini')
  })

  it('reports models that disappear from a provider snapshot', () => {
    const previous = snapshot([
      model(),
      model({ key: 'example:model-old', model: 'Model Old', availability: 'deprecated' }),
    ])

    const deltas = diffSnapshots(previous, snapshot([model()]))

    expect(deltas).toHaveLength(1)
    expect(deltas[0].kind).toBe('model-removed')
    expect(deltas[0].model).toBe('Model Old')
  })

  it('returns no deltas when normalized intelligence is unchanged', () => {
    expect(diffSnapshots(snapshot([model()]), snapshot([model()]))).toEqual([])
  })
})
