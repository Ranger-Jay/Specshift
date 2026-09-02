import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BrightDataClient, BrightDataError } from '../../server/brightData.js'
import { getCollectorId, isProviderSlug } from '../../server/config.js'
import { normalizeBrightDataRows } from '../../server/normalize.js'
import { validateSnapshot } from '../../src/lib/validateSnapshot.js'

const firstQueryValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')


  const secret = process.env.SPECSHIFT_API_SECRET
  const auth = typeof req.headers.authorization === 'string' ? req.headers.authorization : ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const provider = firstQueryValue(req.query.provider)
  const collectionId = firstQueryValue(req.query.collectionId)

  if (!isProviderSlug(provider)) {
    return res.status(400).json({ error: 'A valid provider is required.' })
  }
  if (!collectionId || !collectionId.startsWith('j_')) {
    return res.status(400).json({ error: 'A valid Bright Data collection ID is required.' })
  }

  const collectorId = getCollectorId(provider)
  if (!collectorId) {
    return res.status(503).json({ error: 'Collector is not configured.', code: 'COLLECTOR_NOT_CONFIGURED' })
  }

  try {
    const client = new BrightDataClient()
    const dataset = await client.dataset(collectionId)

    if (!Array.isArray(dataset)) {
      const status =
        dataset && typeof dataset === 'object' && 'status' in dataset && typeof dataset.status === 'string'
          ? dataset.status
          : 'building'

      return res.status(202).json({ provider, collectionId, status })
    }

    const snapshot = normalizeBrightDataRows(provider, collectorId, dataset)
    const validation = validateSnapshot(snapshot)

    return res.status(200).json({
      provider,
      collectionId,
      status: validation.valid ? 'ready' : 'drift',
      snapshot,
      validation,
    })
  } catch (error) {
    if (error instanceof BrightDataError) {
      return res.status(error.status >= 500 ? 502 : error.status).json({
        error: 'Bright Data dataset lookup failed.',
        code: 'BRIGHT_DATA_DATASET_FAILED',
        upstreamStatus: error.status,
      })
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load collector result.',
      code: 'COLLECTOR_RESULT_FAILED',
    })
  }
}
