import type { ChangeEvent, Collector, ModelRecord } from '../types'

export interface IntelligenceExportInput {
  mode: string
  models: ModelRecord[]
  changes: ChangeEvent[]
  collectors: Collector[]
  generatedAt?: string
}

export function buildIntelligenceExport(input: IntelligenceExportInput) {
  return {
    product: 'SpecShift',
    schemaVersion: '0.1',
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    provenance: {
      mode: input.mode,
      note: input.mode.toLowerCase().includes('demo')
        ? 'This export contains labeled demo/preview data.'
        : 'Records reflect the active SpecShift baseline. See collector provenance for source state.',
    },
    summary: {
      models: input.models.length,
      changes: input.changes.length,
      collectors: input.collectors.length,
    },
    models: input.models,
    changes: input.changes,
    collectors: input.collectors,
  }
}

export function downloadIntelligenceExport(input: IntelligenceExportInput): void {
  if (typeof window === 'undefined') return

  const payload = buildIntelligenceExport(input)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = payload.generatedAt.slice(0, 19).replace(/[:T]/g, '-')
  anchor.href = url
  anchor.download = `specshift-intelligence-${stamp}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
