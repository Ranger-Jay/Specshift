import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CollectorSnapshot, ModelDelta, ValidationReport } from '../domain/intelligence'
import { createDemoSnapshots, demoDeltas, type DemoProvider } from '../data/demoSnapshots'
import { diffSnapshots } from '../lib/diffSnapshots'
import {
  appendScanHistory,
  loadLastKnownGood,
  loadScanHistory,
  saveLastKnownGood,
  signalPointsFromHistory,
} from '../lib/snapshotStore'
import { presentChanges, presentCollector, presentMetrics, presentModels } from '../lib/presenters'
import { signalPoints as fallbackSignalPoints } from '../mockData'

export type ProviderSlug = DemoProvider
export type DataMode = 'checking' | 'ready' | 'live' | 'mixed' | 'demo'
export type RuntimeStatus = 'idle' | 'queued' | 'running' | 'ready' | 'drift' | 'error' | 'setup' | 'cached'
export type DataOrigin = 'demo' | 'cached' | 'live'

interface ProviderDescriptor {
  slug: ProviderSlug
  label: string
  sourceUrl: string
  configured: boolean
}

interface ProvidersResponse {
  mode: 'live' | 'setup'
  providers: ProviderDescriptor[]
  brightDataTokenConfigured: boolean
  checkedAt: string
}

interface TriggerResponse {
  provider: ProviderSlug
  collectorId: string
  collectionId: string
  status: 'queued'
  sourceUrl: string
  triggeredAt: string
}

interface ResultResponse {
  provider: ProviderSlug
  collectionId: string
  status: 'ready' | 'drift'
  snapshot: CollectorSnapshot
  validation: ValidationReport
}

export interface ProviderRuntime extends ProviderDescriptor {
  status: RuntimeStatus
  origin: DataOrigin
  collectorId?: string
  collectionId?: string
  snapshot: CollectorSnapshot
  validation?: ValidationReport
  startedAt?: string
  finishedAt?: string
  error?: string
}

const PROVIDER_ORDER: ProviderSlug[] = ['openai', 'anthropic', 'google']
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const defaultDescriptor = (slug: ProviderSlug, demo: CollectorSnapshot): ProviderDescriptor => ({
  slug,
  label: demo.models[0]?.provider ?? slug,
  sourceUrl: demo.source,
  configured: false,
})

const errorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: unknown }
    return typeof body.error === 'string' ? body.error : `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export function useIntelligence() {
  const demoSnapshots = useMemo(() => createDemoSnapshots(), [])
  const [providers, setProviders] = useState<Record<ProviderSlug, ProviderDescriptor>>(() => ({
    openai: defaultDescriptor('openai', demoSnapshots.openai),
    anthropic: defaultDescriptor('anthropic', demoSnapshots.anthropic),
    google: defaultDescriptor('google', demoSnapshots.google),
  }))
  const [runtime, setRuntime] = useState<Record<ProviderSlug, ProviderRuntime>>(() => ({
    openai: { ...defaultDescriptor('openai', demoSnapshots.openai), status: 'setup', origin: 'demo', snapshot: demoSnapshots.openai },
    anthropic: { ...defaultDescriptor('anthropic', demoSnapshots.anthropic), status: 'setup', origin: 'demo', snapshot: demoSnapshots.anthropic },
    google: { ...defaultDescriptor('google', demoSnapshots.google), status: 'setup', origin: 'demo', snapshot: demoSnapshots.google },
  }))
  const [configChecked, setConfigChecked] = useState(false)
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [scanDeltas, setScanDeltas] = useState<ModelDelta[]>([])
  const [scanHistory, setScanHistory] = useState(() => loadScanHistory())
  const [configError, setConfigError] = useState<string | null>(null)
  const runtimeRef = useRef(runtime)

  useEffect(() => {
    runtimeRef.current = runtime
  }, [runtime])

  useEffect(() => {
    let cancelled = false

    const checkProviders = async () => {
      try {
        const response = await fetch('/api/providers', { headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error(await errorMessage(response))
        const payload = (await response.json()) as ProvidersResponse
        if (cancelled) return

        const nextProviders = { ...providers }
        const nextRuntime = { ...runtimeRef.current }

        payload.providers.forEach((descriptor) => {
          if (!PROVIDER_ORDER.includes(descriptor.slug)) return
          const cached = loadLastKnownGood(descriptor.slug)
          nextProviders[descriptor.slug] = descriptor
          nextRuntime[descriptor.slug] = {
            ...nextRuntime[descriptor.slug],
            ...descriptor,
            status: cached ? 'cached' : descriptor.configured ? 'idle' : 'setup',
            origin: cached ? 'cached' : 'demo',
            snapshot: cached ?? demoSnapshots[descriptor.slug],
            error: undefined,
          }
        })

        setProviders(nextProviders)
        setRuntime(nextRuntime)
        setTokenConfigured(payload.brightDataTokenConfigured)
        setConfigError(null)
      } catch (error) {
        if (!cancelled) {
          setConfigError(error instanceof Error ? error.message : 'Live runtime unavailable.')
        }
      } finally {
        if (!cancelled) setConfigChecked(true)
      }
    }

    void checkProviders()
    return () => {
      cancelled = true
    }
    // Provider discovery is intentionally a one-time boot check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoSnapshots])

  const patchRuntime = useCallback((slug: ProviderSlug, patch: Partial<ProviderRuntime>) => {
    setRuntime((current) => ({
      ...current,
      [slug]: { ...current[slug], ...patch },
    }))
  }, [])

  const refreshProvider = useCallback(async (slug: ProviderSlug): Promise<ModelDelta[]> => {
    const descriptor = providers[slug]
    if (!descriptor.configured || !tokenConfigured) {
      patchRuntime(slug, { status: 'setup', error: 'Collector or Bright Data token is not configured.' })
      return []
    }

    const startedAt = new Date().toISOString()
    patchRuntime(slug, { status: 'queued', startedAt, finishedAt: undefined, error: undefined })

    try {
      const triggerResponse = await fetch('/api/collectors/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ provider: slug }),
      })

      if (!triggerResponse.ok) throw new Error(await errorMessage(triggerResponse))
      const trigger = (await triggerResponse.json()) as TriggerResponse
      patchRuntime(slug, {
        status: 'running',
        collectorId: trigger.collectorId,
        collectionId: trigger.collectionId,
        startedAt: trigger.triggeredAt,
      })

      for (let attempt = 0; attempt < 50; attempt += 1) {
        if (attempt > 0) await delay(Math.min(1000 + attempt * 120, 2500))

        const resultResponse = await fetch(
          `/api/collectors/result?provider=${encodeURIComponent(slug)}&collectionId=${encodeURIComponent(trigger.collectionId)}`,
          { headers: { Accept: 'application/json' } },
        )

        if (resultResponse.status === 202) {
          patchRuntime(slug, { status: 'running' })
          continue
        }
        if (!resultResponse.ok) throw new Error(await errorMessage(resultResponse))

        const result = (await resultResponse.json()) as ResultResponse
        const finishedAt = new Date().toISOString()
        const previous = loadLastKnownGood(slug)
        const deltas = result.validation.valid && previous ? diffSnapshots(previous, result.snapshot) : []

        if (result.validation.valid) {
          saveLastKnownGood(slug, result.snapshot)
          patchRuntime(slug, {
            status: 'ready',
            origin: 'live',
            collectorId: result.snapshot.collectorId,
            collectionId: result.collectionId,
            snapshot: result.snapshot,
            validation: result.validation,
            finishedAt,
            error: undefined,
          })
        } else {
          patchRuntime(slug, {
            status: 'drift',
            collectorId: result.snapshot.collectorId,
            collectionId: result.collectionId,
            snapshot: previous ?? runtimeRef.current[slug].snapshot,
            validation: result.validation,
            finishedAt,
            error: `${result.validation.issues.length} validation issue${result.validation.issues.length === 1 ? '' : 's'} detected; last-known-good data preserved.`,
          })
        }

        return deltas
      }

      throw new Error('Collector did not become ready before the polling window expired.')
    } catch (error) {
      patchRuntime(slug, {
        status: 'error',
        finishedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Collector failed.',
      })
      return []
    }
  }, [patchRuntime, providers, tokenConfigured])

  const refreshAll = useCallback(async () => {
    const configured = PROVIDER_ORDER.filter((slug) => providers[slug].configured && tokenConfigured)
    if (configured.length === 0) return

    const results = await Promise.all(configured.map(refreshProvider))
    const deltas = results.flat()
    setScanDeltas(deltas)
    setScanHistory(appendScanHistory(deltas.length))
  }, [providers, refreshProvider, tokenConfigured])

  const configuredCount = PROVIDER_ORDER.filter((slug) => providers[slug].configured && tokenConfigured).length
  const liveCount = PROVIDER_ORDER.filter((slug) => runtime[slug].origin === 'live').length
  const isRefreshing = PROVIDER_ORDER.some((slug) => runtime[slug].status === 'queued' || runtime[slug].status === 'running')
  const healthyCount = PROVIDER_ORDER.filter((slug) => runtime[slug].status === 'ready' || runtime[slug].status === 'cached').length

  const mode: DataMode = !configChecked
    ? 'checking'
    : configuredCount === 0
      ? 'demo'
      : liveCount === configuredCount && configuredCount === PROVIDER_ORDER.length
        ? 'live'
        : liveCount > 0
          ? 'mixed'
          : 'ready'

  const activeDeltas = mode === 'demo' ? demoDeltas : scanDeltas
  const snapshots = PROVIDER_ORDER.map((slug) => runtime[slug].snapshot)
  const models = useMemo(() => presentModels(snapshots, activeDeltas), [snapshots, activeDeltas])
  const changes = useMemo(() => presentChanges(activeDeltas, mode === 'demo' ? 'Example signal' : 'Latest scan'), [activeDeltas, mode])
  const metrics = useMemo(
    () => presentMetrics(snapshots, activeDeltas, PROVIDER_ORDER.length, mode === 'demo' ? PROVIDER_ORDER.length : healthyCount),
    [snapshots, activeDeltas, mode, healthyCount],
  )
  const collectors = useMemo(
    () => PROVIDER_ORDER.map((slug) => {
      const item = runtime[slug]
      return presentCollector({
        collectorId: item.collectorId,
        provider: item.label,
        sourceUrl: item.sourceUrl,
        status: item.status,
        snapshot: item.origin === 'demo' && item.status === 'setup' ? undefined : item.snapshot,
        completeness: item.validation?.completeness,
        startedAt: item.startedAt,
        finishedAt: item.finishedAt,
      })
    }),
    [runtime],
  )

  const latestTimestamp = snapshots
    .filter((snapshot) => !snapshot.collectorId.startsWith('c_demo_'))
    .map((snapshot) => snapshot.capturedAt)
    .sort()
    .at(-1)

  const modeLabel: Record<DataMode, string> = {
    checking: 'Checking runtime',
    ready: 'Live ready · preview data',
    live: 'Live via Bright Data',
    mixed: 'Mixed live + baseline',
    demo: 'Labeled demo preview',
  }

  const runtimeMessage = configError
    ? `Live API unavailable: ${configError}`
    : mode === 'demo'
      ? 'No live collector credentials are configured in this environment. All visible model values are labeled demo data.'
      : mode === 'ready'
        ? `${configuredCount} Bright Data collector${configuredCount === 1 ? '' : 's'} configured. Run a live scan to replace preview values.`
        : mode === 'mixed'
          ? `${liveCount} of ${configuredCount} configured providers returned live data. Last-known-good or preview values fill the remainder.`
          : mode === 'live'
            ? 'All configured providers are backed by validated live Bright Data collector output.'
            : 'Checking Bright Data runtime configuration.'

  return {
    mode,
    modeLabel: modeLabel[mode],
    runtimeMessage,
    configuredCount,
    tokenConfigured,
    isRefreshing,
    runtime,
    models,
    changes,
    metrics,
    collectors,
    signalPoints: signalPointsFromHistory(scanHistory, fallbackSignalPoints),
    latestTimestamp,
    refreshAll,
  }
}
