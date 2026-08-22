import type { CollectorSnapshot } from '../domain/intelligence'

export type CollectorRunState = 'queued' | 'running' | 'ready' | 'failed'

export interface CollectorRun {
  collectionId: string
  collectorId: string
  state: CollectorRunState
}

export interface CollectorGateway {
  run(collectorId: string): Promise<CollectorRun>
  result(collectionId: string): Promise<CollectorSnapshot>
}

/**
 * Browser-facing gateway. API credentials never enter the React bundle.
 * The server endpoint is responsible for authenticating to Bright Data,
 * triggering a collector, polling the dataset, and normalizing the result.
 */
export class HttpCollectorGateway implements CollectorGateway {
  constructor(private readonly baseUrl = '/api') {}

  async run(collectorId: string): Promise<CollectorRun> {
    const response = await fetch(`${this.baseUrl}/collectors/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collectorId }),
    })

    if (!response.ok) {
      throw new Error(`Collector trigger failed with HTTP ${response.status}`)
    }

    return response.json() as Promise<CollectorRun>
  }

  async result(collectionId: string): Promise<CollectorSnapshot> {
    const response = await fetch(`${this.baseUrl}/collectors/result?collectionId=${encodeURIComponent(collectionId)}`)

    if (!response.ok) {
      throw new Error(`Collector result failed with HTTP ${response.status}`)
    }

    return response.json() as Promise<CollectorSnapshot>
  }
}
