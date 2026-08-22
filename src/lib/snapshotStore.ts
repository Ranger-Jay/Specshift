import type { CollectorSnapshot } from '../domain/intelligence'

const SNAPSHOT_PREFIX = 'specshift:lkg:'
const HISTORY_KEY = 'specshift:scan-history'

export interface ScanHistoryPoint {
  at: string
  changes: number
}

const getStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

const isSnapshot = (value: unknown): value is CollectorSnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CollectorSnapshot>
  return (
    typeof candidate.collectorId === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.capturedAt === 'string' &&
    Array.isArray(candidate.models)
  )
}

export function loadLastKnownGood(provider: string): CollectorSnapshot | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(`${SNAPSHOT_PREFIX}${provider}`)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveLastKnownGood(provider: string, snapshot: CollectorSnapshot): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(`${SNAPSHOT_PREFIX}${provider}`, JSON.stringify(snapshot))
  } catch {
    // Storage is a best-effort resilience layer. Runtime data remains usable if persistence is unavailable.
  }
}

export function loadScanHistory(): ScanHistoryPoint[] {
  const storage = getStorage()
  if (!storage) return []

  try {
    const raw = storage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((point): point is ScanHistoryPoint => {
        if (!point || typeof point !== 'object') return false
        const candidate = point as Partial<ScanHistoryPoint>
        return typeof candidate.at === 'string' && typeof candidate.changes === 'number'
      })
      .slice(-12)
  } catch {
    return []
  }
}

export function appendScanHistory(changes: number, at = new Date().toISOString()): ScanHistoryPoint[] {
  const next = [...loadScanHistory(), { at, changes }].slice(-12)
  const storage = getStorage()

  if (storage) {
    try {
      storage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      // Non-fatal; the current session can still render the new point.
    }
  }

  return next
}

export function signalPointsFromHistory(history: ScanHistoryPoint[], fallback: number[]): number[] {
  if (history.length < 2) return fallback

  const max = Math.max(...history.map((point) => point.changes), 1)
  const normalized = history.map((point) => 28 + Math.round((point.changes / max) * 64))

  if (normalized.length >= 12) return normalized.slice(-12)

  const pad = Array.from({ length: 12 - normalized.length }, (_, index) => Math.max(22, normalized[0] - (12 - normalized.length - index) * 2))
  return [...pad, ...normalized]
}
