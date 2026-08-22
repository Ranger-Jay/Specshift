import type { CollectorSnapshot, ModelAvailability, NormalizedModel } from '../src/domain/intelligence'
import { getProviderConfig, type ProviderSlug } from './config'

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null

const first = (row: UnknownRecord, keys: string[]): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
  }
  return null
}

const text = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const cleaned = value
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s*(USD|tokens?|per\s+million|\/\s*1M|\/1M).*$/i, '')
    .trim()

  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const integerValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
  if (typeof value !== 'string') return null

  const compactMatch = value.trim().match(/^([\d.]+)\s*([kKmM])?$/)
  if (compactMatch) {
    const base = Number.parseFloat(compactMatch[1])
    const multiplier = compactMatch[2]?.toLowerCase() === 'm' ? 1_000_000 : compactMatch[2]?.toLowerCase() === 'k' ? 1_000 : 1
    return Number.isFinite(base) ? Math.round(base * multiplier) : null
  }

  const parsed = Number.parseInt(value.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : null
}

const list = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(text).filter((entry): entry is string => Boolean(entry))
  const raw = text(value)
  return raw ? raw.split(/[,/|]/).map((item) => item.trim()).filter(Boolean) : []
}

const availability = (value: unknown): ModelAvailability => {
  const raw = text(value)?.toLowerCase() ?? ''
  if (/deprecat|retir|sunset|legacy/.test(raw)) return 'deprecated'
  if (/preview|beta|experimental|early access/.test(raw)) return 'preview'
  if (/live|available|general availability|ga|active/.test(raw)) return 'live'
  return 'unknown'
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function normalizeBrightDataRows(
  provider: ProviderSlug,
  collectorId: string,
  rows: unknown,
  capturedAt = new Date().toISOString(),
): CollectorSnapshot {
  if (!Array.isArray(rows)) {
    throw new Error('Bright Data dataset is not ready yet.')
  }

  const config = getProviderConfig(provider)
  const models: NormalizedModel[] = []

  rows.forEach((value) => {
    const row = asRecord(value)
    if (!row) return

    const model = text(first(row, ['model', 'model_name', 'name', 'model_id', 'id']))
    if (!model) return

    const sourceUrl =
      text(first(row, ['source_url', 'sourceUrl', 'url', 'documentation_url', 'pricing_url'])) ?? config.sourceUrl

    models.push({
      key: `${provider}:${slugify(model)}`,
      provider: config.label,
      model,
      modalities: list(first(row, ['modalities', 'modality', 'input_modalities', 'capabilities'])),
      pricing: {
        currency: 'USD',
        inputPerMillion: numberValue(first(row, [
          'input_price_per_million',
          'inputPricePerMillion',
          'input_price',
          'input_cost',
        ])),
        outputPerMillion: numberValue(first(row, [
          'output_price_per_million',
          'outputPricePerMillion',
          'output_price',
          'output_cost',
        ])),
      },
      limits: {
        contextTokens: integerValue(first(row, [
          'context_tokens',
          'context_window',
          'context_length',
          'context',
        ])),
      },
      availability: availability(first(row, ['availability', 'status', 'lifecycle', 'release_stage'])),
      sourceUrl,
      scrapedAt: capturedAt,
    })
  })

  return {
    collectorId,
    source: config.sourceUrl,
    capturedAt,
    models,
  }
}
