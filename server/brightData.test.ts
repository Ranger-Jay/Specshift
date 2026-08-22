import { describe, expect, it, vi } from 'vitest'
import { BrightDataClient, BrightDataError } from './brightData'

describe('BrightDataClient', () => {
  it('triggers a collector and returns the Bright Data collection ID', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ collection_id: 'j_run123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof fetch

    const client = new BrightDataClient({ token: 'test-token', fetchImpl, retries: 0 })
    const collectionId = await client.trigger('c_collector123', 'https://example.com/models')

    expect(collectionId).toBe('j_run123')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]
    expect(String(url)).toContain('/dca/trigger?collector=c_collector123&queue_next=1')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-token' })
  })

  it('retries transient upstream failures before succeeding', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'temporary' }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ collection_id: 'j_recovered' }), { status: 200 })) as unknown as typeof fetch

    const client = new BrightDataClient({ token: 'test-token', fetchImpl, retries: 1, retryBaseMs: 0 })

    await expect(client.trigger('c_collector123', 'https://example.com')).resolves.toBe('j_recovered')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('does not retry authentication failures', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
    ) as unknown as typeof fetch

    const client = new BrightDataClient({ token: 'bad-token', fetchImpl, retries: 3, retryBaseMs: 0 })

    try {
      await client.dataset('j_run123')
      throw new Error('Expected the Bright Data request to fail.')
    } catch (error) {
      expect(error).toBeInstanceOf(BrightDataError)
      expect((error as BrightDataError).status).toBe(401)
    }

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed trigger responses instead of inventing an ID', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 })) as unknown as typeof fetch
    const client = new BrightDataClient({ token: 'test-token', fetchImpl, retries: 0 })

    await expect(client.trigger('c_collector123', 'https://example.com')).rejects.toThrow('collection_id')
  })
})
