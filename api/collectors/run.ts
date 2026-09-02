import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BrightDataClient, BrightDataError } from '../../server/brightData.js'
import { getCollectorId, getProviderConfig, isProviderSlug } from '../../server/config.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')


  const secret = process.env.SPECSHIFT_API_SECRET
  const auth = typeof req.headers.authorization === 'string' ? req.headers.authorization : ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const provider = req.body?.provider
  if (!isProviderSlug(provider)) {
    return res.status(400).json({ error: 'A valid provider is required.' })
  }

  const collectorId = getCollectorId(provider)
  if (!collectorId) {
    return res.status(503).json({
      error: `${getProviderConfig(provider).label} collector is not configured.`,
      code: 'COLLECTOR_NOT_CONFIGURED',
    })
  }

  try {
    const client = new BrightDataClient()
    const config = getProviderConfig(provider)
    const collectionId = await client.trigger(collectorId, config.sourceUrl)

    return res.status(202).json({
      provider,
      collectorId,
      collectionId,
      status: 'queued',
      sourceUrl: config.sourceUrl,
      triggeredAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof BrightDataError) {
      return res.status(error.status >= 500 ? 502 : error.status).json({
        error: 'Bright Data rejected the collector trigger.',
        code: 'BRIGHT_DATA_TRIGGER_FAILED',
        upstreamStatus: error.status,
      })
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to trigger collector.',
      code: 'COLLECTOR_TRIGGER_FAILED',
    })
  }
}
