export type ProviderSlug = 'openai' | 'anthropic' | 'google'

export interface ProviderConfig {
  slug: ProviderSlug
  label: string
  sourceUrl: string
  collectorEnv: string
  accent: string
}

export const PROVIDERS: Record<ProviderSlug, ProviderConfig> = {
  openai: {
    slug: 'openai',
    label: 'OpenAI',
    sourceUrl: 'https://developers.openai.com/api/docs/models',
    collectorEnv: 'BRIGHT_DATA_COLLECTOR_OPENAI',
    accent: 'cyan',
  },
  anthropic: {
    slug: 'anthropic',
    label: 'Anthropic',
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    collectorEnv: 'BRIGHT_DATA_COLLECTOR_ANTHROPIC',
    accent: 'amber',
  },
  google: {
    slug: 'google',
    label: 'Google',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    collectorEnv: 'BRIGHT_DATA_COLLECTOR_GOOGLE',
    accent: 'violet',
  },
}

export const providerSlugs = Object.keys(PROVIDERS) as ProviderSlug[]

export function isProviderSlug(value: unknown): value is ProviderSlug {
  return typeof value === 'string' && value in PROVIDERS
}

export function getProviderConfig(slug: ProviderSlug): ProviderConfig {
  return PROVIDERS[slug]
}

export function getCollectorId(slug: ProviderSlug): string | null {
  const config = getProviderConfig(slug)
  const value = process.env[config.collectorEnv]?.trim()
  return value && value.startsWith('c_') ? value : null
}

export function configuredProviders() {
  return providerSlugs.map((slug) => {
    const config = PROVIDERS[slug]
    return {
      slug,
      label: config.label,
      sourceUrl: config.sourceUrl,
      configured: Boolean(getCollectorId(slug)),
    }
  })
}
