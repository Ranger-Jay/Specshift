import type { VercelRequest, VercelResponse } from '@vercel/node'
import { configuredProviders } from '../server/config'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const providers = configuredProviders()

  return res.status(200).json({
    mode: providers.every((provider) => provider.configured) ? 'live' : 'setup',
    providers,
    brightDataTokenConfigured: Boolean(process.env.BRIGHT_DATA_API_TOKEN ?? process.env.BRIGHTDATA_API_KEY),
    checkedAt: new Date().toISOString(),
  })
}
