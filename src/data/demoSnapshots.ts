import type { CollectorSnapshot, ModelDelta } from '../domain/intelligence'

export type DemoProvider = 'openai' | 'anthropic' | 'google'

export function createDemoSnapshots(now = new Date().toISOString()): Record<DemoProvider, CollectorSnapshot> {
  return {
    openai: {
      collectorId: 'c_demo_openai',
      source: 'https://developers.openai.com/api/docs/models',
      capturedAt: now,
      models: [
        {
          key: 'openai:gpt-5-6-terra',
          provider: 'OpenAI',
          model: 'GPT-5.6 Terra',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 2, outputPerMillion: 12 },
          limits: { contextTokens: 1_050_000 },
          availability: 'live',
          sourceUrl: 'https://developers.openai.com/api/docs/models',
          scrapedAt: now,
        },
        {
          key: 'openai:gpt-5-6-luna',
          provider: 'OpenAI',
          model: 'GPT-5.6 Luna',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 0.2, outputPerMillion: 1.2 },
          limits: { contextTokens: 1_050_000 },
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
          key: 'anthropic:claude-opus-5',
          provider: 'Anthropic',
          model: 'Claude Opus 5',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 5, outputPerMillion: 25 },
          limits: { contextTokens: null },
          availability: 'live',
          sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
          scrapedAt: now,
        },
        {
          key: 'anthropic:claude-sonnet-5',
          provider: 'Anthropic',
          model: 'Claude Sonnet 5',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 2, outputPerMillion: 10 },
          limits: { contextTokens: null },
          availability: 'live',
          sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
          scrapedAt: now,
        },
        {
          key: 'anthropic:claude-haiku-4-5',
          provider: 'Anthropic',
          model: 'Claude Haiku 4.5',
          modalities: ['text', 'vision'],
          pricing: { currency: 'USD', inputPerMillion: 1, outputPerMillion: 5 },
          limits: { contextTokens: null },
          availability: 'live',
          sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
          scrapedAt: now,
        },
      ],
    },
    google: {
      collectorId: 'c_demo_google',
      source: 'https://ai.google.dev/gemini-api/docs/pricing',
      capturedAt: now,
      models: [
        {
          key: 'google:gemini-3-5-flash-lite',
          provider: 'Google',
          model: 'Gemini 3.5 Flash-Lite',
          modalities: ['text', 'vision', 'audio', 'video'],
          pricing: { currency: 'USD', inputPerMillion: 0.3, outputPerMillion: 2.5 },
          limits: { contextTokens: null },
          availability: 'live',
          sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
          scrapedAt: now,
        },
      ],
    },
  }
}

export const demoDeltas: ModelDelta[] = [
  {
    id: 'demo-openai-price',
    modelKey: 'openai:gpt-5-6-luna',
    provider: 'OpenAI',
    model: 'GPT-5.6 Luna',
    kind: 'input-price',
    previous: 0.25,
    current: 0.2,
  },
  {
    id: 'demo-anthropic-model',
    modelKey: 'anthropic:claude-sonnet-5',
    provider: 'Anthropic',
    model: 'Claude Sonnet 5',
    kind: 'model-added',
    previous: null,
    current: 'Claude Sonnet 5',
  },
  {
    id: 'demo-google-availability',
    modelKey: 'google:gemini-3-5-flash-lite',
    provider: 'Google',
    model: 'Gemini 3.5 Flash-Lite',
    kind: 'availability',
    previous: 'preview',
    current: 'live',
  },
]
