import { describe, expect, it } from 'vitest'
import { buildIntelligenceExport } from './exportIntelligence'
import type { ChangeEvent, Collector, ModelRecord } from '../types'

const model: ModelRecord = {
  id: 'example:model-pro',
  provider: 'Example AI',
  model: 'Model Pro',
  modality: 'text · vision',
  inputPrice: '$1',
  outputPrice: '$4',
  context: '128K',
  availability: 'Live',
  change: 'No new signal',
  sourceUrl: 'https://example.com/models/model-pro',
}

const change: ChangeEvent = {
  id: 'delta-1',
  provider: 'Example AI',
  model: 'Model Pro',
  type: 'price',
  title: 'Input pricing changed',
  detail: '$2 → $1',
  time: 'Latest scan',
}

const collector: Collector = {
  id: 'c_example',
  provider: 'Example AI',
  domain: 'example.com',
  health: 'healthy',
  successRate: '100%',
  latency: '1.2s',
  records: 1,
  lastRun: 'just now',
  sourceUrl: 'https://example.com/models',
  statusLabel: 'ready',
}

describe('buildIntelligenceExport', () => {
  it('exports an auditable payload with provenance and summary counts', () => {
    const payload = buildIntelligenceExport({
      mode: 'Live via Bright Data',
      models: [model],
      changes: [change],
      collectors: [collector],
      generatedAt: '2026-08-22T20:00:00.000Z',
    })

    expect(payload).toMatchObject({
      product: 'SpecShift',
      schemaVersion: '0.1',
      generatedAt: '2026-08-22T20:00:00.000Z',
      provenance: { mode: 'Live via Bright Data' },
      summary: { models: 1, changes: 1, collectors: 1 },
    })
    expect(payload.models[0].sourceUrl).toBe('https://example.com/models/model-pro')
    expect(payload.collectors[0].id).toBe('c_example')
  })

  it('explicitly labels demo exports', () => {
    const payload = buildIntelligenceExport({
      mode: 'Labeled demo preview',
      models: [model],
      changes: [],
      collectors: [],
      generatedAt: '2026-08-22T20:00:00.000Z',
    })

    expect(payload.provenance.note.toLowerCase()).toContain('demo')
  })
})
