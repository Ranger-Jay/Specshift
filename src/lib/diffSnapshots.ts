import type { CollectorSnapshot, ModelDelta, NormalizedModel } from '../domain/intelligence'

const modelMap = (models: NormalizedModel[]) => new Map(models.map((model) => [model.key, model]))

const deltaId = (modelKey: string, kind: ModelDelta['kind']) => `${modelKey}:${kind}`

export function diffSnapshots(previous: CollectorSnapshot, current: CollectorSnapshot): ModelDelta[] {
  const before = modelMap(previous.models)
  const after = modelMap(current.models)
  const deltas: ModelDelta[] = []

  for (const [key, model] of after) {
    const old = before.get(key)

    if (!old) {
      deltas.push({
        id: deltaId(key, 'model-added'),
        modelKey: key,
        provider: model.provider,
        model: model.model,
        kind: 'model-added',
        previous: null,
        current: model.model,
      })
      continue
    }

    const comparable: Array<{
      kind: ModelDelta['kind']
      previous: string | number | null
      current: string | number | null
    }> = [
      { kind: 'input-price', previous: old.pricing.inputPerMillion, current: model.pricing.inputPerMillion },
      { kind: 'output-price', previous: old.pricing.outputPerMillion, current: model.pricing.outputPerMillion },
      { kind: 'context-limit', previous: old.limits.contextTokens, current: model.limits.contextTokens },
      { kind: 'availability', previous: old.availability, current: model.availability },
    ]

    comparable.forEach((change) => {
      if (change.previous !== change.current) {
        deltas.push({
          id: deltaId(key, change.kind),
          modelKey: key,
          provider: model.provider,
          model: model.model,
          kind: change.kind,
          previous: change.previous,
          current: change.current,
        })
      }
    })
  }

  for (const [key, model] of before) {
    if (!after.has(key)) {
      deltas.push({
        id: deltaId(key, 'model-removed'),
        modelKey: key,
        provider: model.provider,
        model: model.model,
        kind: 'model-removed',
        previous: model.model,
        current: null,
      })
    }
  }

  return deltas
}
