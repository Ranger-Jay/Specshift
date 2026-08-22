export type CollectorHealth = 'healthy' | 'healed' | 'drift'
export type ChangeType = 'price' | 'context' | 'new' | 'deprecated'

export interface Metric {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
}

export interface ModelRecord {
  id: string
  provider: string
  model: string
  modality: string
  inputPrice: string
  outputPrice: string
  context: string
  availability: 'Live' | 'Preview' | 'Deprecated'
  change: string
}

export interface ChangeEvent {
  id: string
  provider: string
  model: string
  type: ChangeType
  title: string
  detail: string
  time: string
}

export interface Collector {
  id: string
  provider: string
  domain: string
  health: CollectorHealth
  successRate: string
  latency: string
  records: number
  lastRun: string
}
