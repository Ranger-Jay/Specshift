import { describe, expect, it } from 'vitest'
import type { CollectorSnapshot } from '../domain/intelligence'
import { isSchemaDrift, validateSnapshot } from './validateSnapshot'

const validSnapshot: CollectorSnapshot = {
  collectorId: 'c_demo123',
  source: 'https://example.com/models',
  capturedAt: '2026-08-22T19:00:00.000Z',
  models: [
    {
      key: 'example:model-pro',
      provider: 'Example AI',
      model: 'Model Pro',
      modalities: ['text', 'vision'],
      pricing: { currency: 'USD', inputPerMillion: 2.5, outputPerMillion: 10 },
      limits: { contextTokens: 200000 },
      availability: 'live',
      sourceUrl: 'https://example.com/models/model-pro',
      scrapedAt: '2026-08-22T19:00:00.000Z',
    },
  ],
}

describe('validateSnapshot', () => {
  it('accepts a complete normalized snapshot', () => {
    const report = validateSnapshot(validSnapshot)

    expect(report.valid).toBe(true)
    expect(report.completeness).toBe(1)
    expect(report.issues).toEqual([])
  })

  it('flags malformed required fields as schema drift', () => {
    const report = validateSnapshot({
      ...validSnapshot,
      models: [{ ...validSnapshot.models[0], model: '', sourceUrl: '' }],
    })

    expect(report.valid).toBe(false)
    expect(isSchemaDrift(report)).toBe(true)
    expect(report.issues.map((issue) => issue.path)).toContain('models.0.model')
    expect(report.issues.map((issue) => issue.path)).toContain('models.0.sourceUrl')
  })

  it('rejects impossible numeric values', () => {
    const report = validateSnapshot({
      ...validSnapshot,
      models: [
        {
          ...validSnapshot.models[0],
          pricing: { currency: 'USD', inputPerMillion: -1, outputPerMillion: 10 },
          limits: { contextTokens: 0 },
        },
      ],
    })

    expect(report.valid).toBe(false)
    expect(report.issues).toHaveLength(2)
  })
})
