import type { CollectorSnapshot, ModelAvailability, NormalizedModel } from '../src/domain/intelligence.js'
import { getProviderConfig, type ProviderSlug } from './config.js'

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null

const unwrapValue = (value: unknown): unknown => {
  const record = asRecord(value)
  return record && 'value' in record ? record.value : value
}

const first = (row: UnknownRecord, keys: string[]): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
  }
  return null
}

const text = (value: unknown): string | null => {
  const raw = unwrapValue(value)
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return null
}

const sourceUrl = (value: unknown): string | null => {
  const raw = text(value)
  if (!raw) return null

  const markdown = raw.match(/^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/)
  return markdown?.[2] ?? raw
}

const numberValue = (value: unknown): number | null => {
  const raw = unwrapValue(value)
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return null

  const cleaned = raw
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s*(USD|tokens?|per\s+million|\/\s*1M|\/1M).*$/i, '')
    .trim()

  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const integerValue = (value: unknown): number | null => {
  const raw = unwrapValue(value)
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(raw)
  if (typeof raw !== 'string') return null

  const compactMatch = raw.trim().match(/^([\d.]+)\s*([kKmM])?$/)
  if (compactMatch) {
    const base = Number.parseFloat(compactMatch[1])
    const multiplier = compactMatch[2]?.toLowerCase() === 'm' ? 1_000_000 : compactMatch[2]?.toLowerCase() === 'k' ? 1_000 : 1
    return Number.isFinite(base) ? Math.round(base * multiplier) : null
  }

  const parsed = Number.parseInt(raw.replace(/[^\d]/g, ''), 10)
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
  if (/limited|preview|beta|experimental|early access/.test(raw)) return 'preview'
  if (/live|available|general availability|\bga\b|active|production/.test(raw)) return 'live'
  return 'unknown'
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const candidateRows = (rows: unknown[]): unknown[] => rows.flatMap((value) => {
  const row = asRecord(value)
  if (!row) return [value]
  return Array.isArray(row.models) ? row.models : [value]
})

const cleanAnthropicModel = (value: string): string => value
  .replace(/\s*\(\s*(?:limited availability|retired)[^)]*\)\s*$/i, '')
  .trim()

const isAnthropicBaseModelRow = (
  model: string,
  inputPrice: number | null,
  outputPrice: number | null,
): boolean => {
  if (!/^Claude\s+/i.test(model)) return false
  if (/\s(?:\/|,|\band\b)\s/i.test(model)) return false
  return inputPrice !== null && outputPrice !== null
}

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
  const models = new Map<string, NormalizedModel>()

  candidateRows(rows).forEach((value) => {
    const row = asRecord(value)
    if (!row) return

    const rawModel = text(first(row, ['model', 'model_name', 'name', 'model_id', 'id']))
    if (!rawModel) return

    const model = provider === 'anthropic' ? cleanAnthropicModel(rawModel) : rawModel
    const inputPrice = numberValue(first(row, [
      'input_price_per_million',
      'inputPricePerMillion',
      'input_price',
      'input_cost',
    ]))
    const outputPrice = numberValue(first(row, [
      'output_price_per_million',
      'outputPricePerMillion',
      'output_price',
      'output_cost',
    ]))

    if (provider === 'anthropic' && !isAnthropicBaseModelRow(model, inputPrice, outputPrice)) return

    const key = `${provider}:${slugify(model)}`
    if (models.has(key)) return

    const rowSourceUrl =
      sourceUrl(first(row, ['source_url', 'sourceUrl', 'url', 'documentation_url', 'pricing_url'])) ?? config.sourceUrl

    models.set(key, {
      key,
      provider: config.label,
      model,
      modalities: list(first(row, ['modalities', 'modality', 'input_modalities', 'capabilities'])),
      pricing: {
        currency: 'USD',
        inputPerMillion: inputPrice,
        outputPerMillion: outputPrice,
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
      sourceUrl: rowSourceUrl,
      scrapedAt: capturedAt,
    })
  })

  return {
    collectorId,
    source: config.sourceUrl,
    capturedAt,
    models: [...models.values()],
  }
}
