export type ModelAvailability = 'live' | 'preview' | 'deprecated' | 'unknown'

export interface NormalizedModel {
  key: string
  provider: string
  model: string
  modalities: string[]
  pricing: {
    currency: 'USD'
    inputPerMillion: number | null
    outputPerMillion: number | null
  }
  limits: {
    contextTokens: number | null
  }
  availability: ModelAvailability
  sourceUrl: string
  scrapedAt: string
}

export interface CollectorSnapshot {
  collectorId: string
  source: string
  capturedAt: string
  models: NormalizedModel[]
}

export type DeltaKind =
  | 'model-added'
  | 'model-removed'
  | 'input-price'
  | 'output-price'
  | 'context-limit'
  | 'availability'

export interface ModelDelta {
  id: string
  modelKey: string
  provider: string
  model: string
  kind: DeltaKind
  previous: string | number | null
  current: string | number | null
}

export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidationReport {
  valid: boolean
  completeness: number
  issues: ValidationIssue[]
}
