import { describe, expect, it } from 'vitest'
import { signalPointsFromHistory } from './snapshotStore'

describe('signalPointsFromHistory', () => {
  it('uses the supplied fallback before enough real scan history exists', () => {
    const fallback = [10, 20, 30]
    expect(signalPointsFromHistory([], fallback)).toBe(fallback)
    expect(signalPointsFromHistory([{ at: '2026-08-22T20:00:00.000Z', changes: 2 }], fallback)).toBe(fallback)
  })

  it('normalizes real change counts into a bounded twelve-point signal', () => {
    const history = [
      { at: 'a', changes: 0 },
      { at: 'b', changes: 2 },
      { at: 'c', changes: 4 },
      { at: 'd', changes: 8 },
    ]

    const points = signalPointsFromHistory(history, [1, 2])

    expect(points).toHaveLength(12)
    expect(points.at(-1)).toBe(92)
    expect(Math.min(...points)).toBeGreaterThanOrEqual(22)
    expect(Math.max(...points)).toBeLessThanOrEqual(92)
  })
})
