const BRIGHT_DATA_BASE_URL = 'https://api.brightdata.com'

export class BrightDataError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'BrightDataError'
  }
}

interface BrightDataClientOptions {
  token?: string
  fetchImpl?: typeof fetch
  retries?: number
  retryBaseMs?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class BrightDataClient {
  private readonly token: string
  private readonly fetchImpl: typeof fetch
  private readonly retries: number
  private readonly retryBaseMs: number

  constructor(options: BrightDataClientOptions = {}) {
    const token = options.token ?? process.env.BRIGHT_DATA_API_TOKEN ?? process.env.BRIGHTDATA_API_KEY
    if (!token) {
      throw new Error('Bright Data API token is not configured.')
    }

    this.token = token
    this.fetchImpl = options.fetchImpl ?? fetch
    this.retries = options.retries ?? 3
    this.retryBaseMs = options.retryBaseMs ?? 350
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    let lastError: unknown

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        const response = await this.fetchImpl(`${BRIGHT_DATA_BASE_URL}${path}`, {
          ...init,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...init.headers,
          },
        })

        const text = await response.text()
        let body: unknown = null
        if (text) {
          try {
            body = JSON.parse(text)
          } catch {
            body = text
          }
        }

        if (response.ok) return body

        const retriable = response.status >= 500 || response.status === 429
        if (!retriable || attempt === this.retries) {
          throw new BrightDataError(`Bright Data request failed with HTTP ${response.status}.`, response.status, body)
        }

        lastError = new BrightDataError(`Transient Bright Data HTTP ${response.status}.`, response.status, body)
      } catch (error) {
        if (error instanceof BrightDataError && error.status < 500 && error.status !== 429) throw error
        lastError = error
        if (attempt === this.retries) break
      }

      await sleep(this.retryBaseMs * 2 ** attempt)
    }

    if (lastError instanceof Error) throw lastError
    throw new Error('Bright Data request failed.')
  }

  async trigger(collectorId: string, url: string): Promise<string> {
    const body = await this.request(`/dca/trigger?collector=${encodeURIComponent(collectorId)}&queue_next=1`, {
      method: 'POST',
      body: JSON.stringify([{ url }]),
    })

    if (!body || typeof body !== 'object' || !('collection_id' in body) || typeof body.collection_id !== 'string') {
      throw new Error('Bright Data trigger response did not include collection_id.')
    }

    return body.collection_id
  }

  async dataset(snapshotId: string): Promise<unknown> {
    return this.request(`/dca/dataset?id=${encodeURIComponent(snapshotId)}`, { method: 'GET' })
  }
}
