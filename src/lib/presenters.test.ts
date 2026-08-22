import { describe, expect, it } from 'vitest'
import type { CollectorSnapshot, ModelDelta } from '../domain/intelligence'
import { formatPrice, formatTokens, presentChanges, presentMetrics, presentModels } from './presenters'

const snapshot: CollectorSnapshot = {
  collectorId: 'c_test',
  source: 'https://example.com/models',
  capturedAt: '2026-08-22T20:00:00.000Z',
  models: [
    {
      key: 'example:model-pro',
      provider: 'Example AI',
      model: 'Model Pro',
      modalities: ['text', 'vision'],
      pricing: { currency: 'USD', inputPerMillion: 0.25, outputPerMillion: 12 },
      limits: { contextTokens: 1_050_000 },
      availability: 'live',
      sourceUrl: 'https://example.com/models/model-pro',
      scrapedAt: '2026-08-22T20:00:00.000Z',
    },
  ],
}

const priceDelta: ModelDelta = {
  id: 'example:model-pro:input-price',
  modelKey: 'example:model-pro',
  provider: 'Example AI',
  model: 'Model Pro',
  kind: 'input-price',
  previous: 0.3,
  current: 0.25,
}

describe('intelligence presenters', () => {
  it('formats prices and context limits without fabricating missing values', () => {
    expect(formatPrice(0.25)).toBe('$0.25')
    expect(formatPrice(null)).toBe('—')
    expect(formatTokens(1_050_000)).toBe('1.05M')
    expect(formatTokens(null)).toBe('—')
  })

  it('maps normalized records into table rows with source provenance', () => {
    expect(presentModels([snapshot], [priceDelta])).toEqual([
      expect.objectContaining({
        id: 'example:model-pro',
        provider: 'Example AI',
        model: 'Model Pro',
        modality: 'text · vision',
        inputPrice: '$0.25',
        outputPrice: '$12',
        context: '1.05M',
        availability: 'Live',
        sourceUrl: 'https://example.com/models/model-pro',
      }),
    ])
  })

  it('turns model deltas into human-readable change events', () => {
    const [event] = presentChanges([priceDelta], 'Latest scan')

    expect(event.type).toBe('price')
    expect(event.title).toBe('Input pricing changed')
    expect(event.detail).toContain('$0.30 → $0.25')
    expect(event.time).toBe('Latest scan')
  })

  it('derives dashboard metrics from active snapshots and collector health', () => {
    const metrics = presentMetrics([snapshot], [priceDelta], 3, 2)

    expect(metrics[0].value).toBe('01')
    expect(metrics[1].value).toBe('03')
    expect(metrics[2].value).toBe('01')
    expect(metrics[3].value).toBe('67%')
  })
})
