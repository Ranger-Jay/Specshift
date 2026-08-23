import type { CollectorSnapshot, ModelDelta } from '../domain/intelligence'

export type DemoProvider = 'openai' | 'anthropic' | 'groq'

export function createDemoSnapshots(now = new Date().toISOString()): Record<DemoProvider, CollectorSnapshot> {
  return {
    openai: {
      collectorId: 'c_demo_openai',
      source: 'https://developers.openai.com/api/docs/models',
      capturedAt: now,
      models: [
        {
          key: 'openai:gpt-demo',
          provider: 'OpenAI',
          model: 'GPT demo model',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 2, outputPerMillion: 12 },
          limits: { contextTokens: 1_000_000 },
          availability: 'live',
          sourceUrl: 'https://developers.openai.com/api/docs/models',
          scrapedAt: now,
        },
      ],
    },
    anthropic: {
      collectorId: 'c_demo_anthropic',
      source: 'https://platform.claude.com/docs/en/about-claude/pricing',
      capturedAt: now,
      models: [
        {
          key: 'anthropic:claude-demo',
          provider: 'Anthropic',
          model: 'Claude demo model',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 3, outputPerMillion: 15 },
          limits: { contextTokens: 200_000 },
          availability: 'live',
          sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
          scrapedAt: now,
        },
      ],
    },
    groq: {
      collectorId: 'c_demo_groq',
      source: 'https://console.groq.com/docs/models',
      capturedAt: now,
      models: [
        {
          key: 'groq:llama-3-3-70b-versatile',
          provider: 'Groq',
          model: 'Llama 3.3 70B',
          modalities: ['text'],
          pricing: { currency: 'USD', inputPerMillion: 0.59, outputPerMillion: 0.79 },
          limits: { contextTokens: 131_072 },
          availability: 'live',
          sourceUrl: 'https://console.groq.com/docs/models',
          scrapedAt: now,
        },
      ],
    },
  }
}

export const demoDeltas: ModelDelta[] = [
  {
    id: 'demo-openai-price',
    modelKey: 'openai:gpt-demo',
    provider: 'OpenAI',
    model: 'GPT demo model',
    kind: 'input-price',
    previous: 2.5,
    current: 2,
  },
  {
    id: 'demo-anthropic-model',
    modelKey: 'anthropic:claude-demo',
    provider: 'Anthropic',
    model: 'Claude demo model',
    kind: 'model-added',
    previous: null,
    current: 'Claude demo model',
  },
  {
    id: 'demo-groq-availability',
    modelKey: 'groq:llama-3-3-70b-versatile',
    provider: 'Groq',
    model: 'Llama 3.3 70B',
    kind: 'availability',
    previous: 'preview',
    current: 'live',
  },
]
