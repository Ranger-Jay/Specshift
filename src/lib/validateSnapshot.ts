import type { CollectorSnapshot, NormalizedModel, ValidationIssue, ValidationReport } from '../domain/intelligence'

const REQUIRED_MODEL_FIELDS: Array<keyof Pick<NormalizedModel, 'key' | 'provider' | 'model' | 'sourceUrl' | 'scrapedAt'>> = [
  'key',
  'provider',
  'model',
  'sourceUrl',
  'scrapedAt',
]

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export function validateSnapshot(snapshot: CollectorSnapshot): ValidationReport {
  const issues: ValidationIssue[] = []

  if (!isNonEmptyString(snapshot.collectorId)) {
    issues.push({ path: 'collectorId', message: 'Collector ID is required.' })
  }
  if (!isNonEmptyString(snapshot.source)) {
    issues.push({ path: 'source', message: 'Source is required.' })
  }
  if (!isNonEmptyString(snapshot.capturedAt) || Number.isNaN(Date.parse(snapshot.capturedAt))) {
    issues.push({ path: 'capturedAt', message: 'Captured timestamp must be a valid ISO date.' })
  }
  if (!Array.isArray(snapshot.models) || snapshot.models.length === 0) {
    issues.push({ path: 'models', message: 'At least one normalized model is required.' })
    return { valid: false, completeness: 0, issues }
  }

  let populatedFields = 0
  let possibleFields = 0

  snapshot.models.forEach((model, modelIndex) => {
    REQUIRED_MODEL_FIELDS.forEach((field) => {
      possibleFields += 1
      if (isNonEmptyString(model[field])) {
        populatedFields += 1
      } else {
        issues.push({ path: `models.${modelIndex}.${field}`, message: `${field} is required.` })
      }
    })

    const optionalSignals = [
      model.pricing.inputPerMillion,
      model.pricing.outputPerMillion,
      model.limits.contextTokens,
      model.modalities.length > 0 ? model.modalities : null,
      model.availability === 'unknown' ? null : model.availability,
    ]

    optionalSignals.forEach((value) => {
      possibleFields += 1
      if (value !== null && value !== undefined) populatedFields += 1
    })

    if (model.pricing.inputPerMillion !== null && model.pricing.inputPerMillion < 0) {
      issues.push({ path: `models.${modelIndex}.pricing.inputPerMillion`, message: 'Input price cannot be negative.' })
    }
    if (model.pricing.outputPerMillion !== null && model.pricing.outputPerMillion < 0) {
      issues.push({ path: `models.${modelIndex}.pricing.outputPerMillion`, message: 'Output price cannot be negative.' })
    }
    if (model.limits.contextTokens !== null && model.limits.contextTokens <= 0) {
      issues.push({ path: `models.${modelIndex}.limits.contextTokens`, message: 'Context limit must be positive.' })
    }
  })

  const completeness = possibleFields === 0 ? 0 : populatedFields / possibleFields

  return {
    valid: issues.length === 0 && completeness >= 0.7,
    completeness,
    issues,
  }
}

export function isSchemaDrift(report: ValidationReport, threshold = 0.7): boolean {
  return !report.valid || report.completeness < threshold
}
