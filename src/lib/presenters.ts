import type { CollectorSnapshot, ModelDelta, NormalizedModel } from '../domain/intelligence'
import type { ChangeEvent, Collector, Metric, ModelRecord } from '../types'

export interface RuntimePresentation {
  metrics: Metric[]
  models: ModelRecord[]
  changes: ChangeEvent[]
}

const compactNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatPrice(value: number | null): string {
  if (value === null) return '—'
  if (value < 1) return `$${value.toFixed(2)}`
  return `$${compactNumber.format(value)}`
}

export function formatTokens(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1_000_000) return `${compactNumber.format(value / 1_000_000)}M`
  if (value >= 1_000) return `${compactNumber.format(value / 1_000)}K`
  return compactNumber.format(value)
}

const titleAvailability = (value: NormalizedModel['availability']): ModelRecord['availability'] => {
  if (value === 'live') return 'Live'
  if (value === 'preview') return 'Preview'
  if (value === 'deprecated') return 'Deprecated'
  return 'Unknown'
}

const deltaSummary = (delta: ModelDelta): string => {
  if (delta.kind === 'model-added') return 'New model'
  if (delta.kind === 'model-removed') return 'Removed'
  if (delta.kind === 'input-price') return `Input ${formatPrice(delta.previous as number | null)} → ${formatPrice(delta.current as number | null)}`
  if (delta.kind === 'output-price') return `Output ${formatPrice(delta.previous as number | null)} → ${formatPrice(delta.current as number | null)}`
  if (delta.kind === 'context-limit') return `Context ${formatTokens(delta.previous as number | null)} → ${formatTokens(delta.current as number | null)}`
  return `${String(delta.previous ?? 'unknown')} → ${String(delta.current ?? 'unknown')}`
}

export function presentModels(snapshots: CollectorSnapshot[], deltas: ModelDelta[]): ModelRecord[] {
  const latestDelta = new Map<string, ModelDelta>()
  deltas.forEach((delta) => latestDelta.set(delta.modelKey, delta))

  return snapshots
    .flatMap((snapshot) => snapshot.models)
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model))
    .map((model) => {
      const delta = latestDelta.get(model.key)
      return {
        id: model.key,
        provider: model.provider,
        model: model.model,
        modality: model.modalities.length > 0 ? model.modalities.join(' · ') : 'Not stated',
        inputPrice: formatPrice(model.pricing.inputPerMillion),
        outputPrice: formatPrice(model.pricing.outputPerMillion),
        context: formatTokens(model.limits.contextTokens),
        availability: titleAvailability(model.availability),
        change: delta ? deltaSummary(delta) : 'No new signal',
        sourceUrl: model.sourceUrl,
      }
    })
}

const eventType = (delta: ModelDelta): ChangeEvent['type'] => {
  if (delta.kind === 'input-price' || delta.kind === 'output-price') return 'price'
  if (delta.kind === 'context-limit') return 'context'
  if (delta.kind === 'model-added') return 'new'
  if (delta.kind === 'model-removed') return 'deprecated'
  return 'availability'
}

const eventTitle = (delta: ModelDelta): string => {
  if (delta.kind === 'input-price') return 'Input pricing changed'
  if (delta.kind === 'output-price') return 'Output pricing changed'
  if (delta.kind === 'context-limit') return 'Context limit changed'
  if (delta.kind === 'model-added') return 'New model discovered'
  if (delta.kind === 'model-removed') return 'Model disappeared from source'
  return 'Availability changed'
}

export function presentChanges(deltas: ModelDelta[], timeLabel = 'Latest scan'): ChangeEvent[] {
  return deltas.slice(0, 12).map((delta) => ({
    id: delta.id,
    provider: delta.provider,
    model: delta.model,
    type: eventType(delta),
    title: eventTitle(delta),
    detail: deltaSummary(delta),
    time: timeLabel,
  }))
}

export function presentMetrics(
  snapshots: CollectorSnapshot[],
  deltas: ModelDelta[],
  providerCount: number,
  healthyCollectors: number,
): Metric[] {
  const modelCount = snapshots.reduce((total, snapshot) => total + snapshot.models.length, 0)
  const collectorRate = providerCount === 0 ? 0 : (healthyCollectors / providerCount) * 100

  return [
    { label: 'Models tracked', value: String(modelCount).padStart(2, '0'), delta: 'normalized records', trend: modelCount > 0 ? 'up' : 'neutral' },
    { label: 'Provider sources', value: String(providerCount).padStart(2, '0'), delta: `${healthyCollectors} healthy`, trend: healthyCollectors === providerCount && providerCount > 0 ? 'up' : 'neutral' },
    { label: 'Changes detected', value: String(deltas.length).padStart(2, '0'), delta: 'latest valid scan', trend: deltas.length > 0 ? 'up' : 'neutral' },
    { label: 'Collector health', value: `${collectorRate.toFixed(0)}%`, delta: 'ready / configured', trend: collectorRate === 100 ? 'up' : collectorRate > 0 ? 'neutral' : 'down' },
  ]
}

export function relativeTime(iso?: string): string {
  if (!iso) return 'not run'
  const timestamp = Date.parse(iso)
  if (Number.isNaN(timestamp)) return 'unknown'

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

export function presentCollector(input: {
  collectorId?: string
  provider: string
  sourceUrl: string
  status: 'idle' | 'queued' | 'running' | 'ready' | 'drift' | 'error' | 'setup' | 'cached'
  snapshot?: CollectorSnapshot
  completeness?: number
  startedAt?: string
  finishedAt?: string
}): Collector {
  const health: Collector['health'] =
    input.status === 'ready' || input.status === 'cached'
      ? 'healthy'
      : input.status === 'drift'
        ? 'drift'
        : input.status === 'queued' || input.status === 'running'
          ? 'running'
          : input.status === 'error'
            ? 'error'
            : 'setup'

  const latency = input.startedAt && input.finishedAt
    ? `${Math.max(0, (Date.parse(input.finishedAt) - Date.parse(input.startedAt)) / 1000).toFixed(1)}s`
    : '—'

  return {
    id: input.collectorId ?? 'not-configured',
    provider: input.provider,
    domain: new URL(input.sourceUrl).hostname,
    health,
    successRate: input.completeness === undefined ? '—' : `${Math.round(input.completeness * 100)}%`,
    latency,
    records: input.snapshot?.models.length ?? 0,
    lastRun: relativeTime(input.snapshot?.capturedAt ?? input.finishedAt),
    sourceUrl: input.sourceUrl,
    statusLabel: input.status,
  }
}
