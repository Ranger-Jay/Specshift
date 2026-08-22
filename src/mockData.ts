import type { ChangeEvent, Collector, Metric, ModelRecord } from './types'

export const metrics: Metric[] = [
  { label: 'Models tracked', value: '17', delta: '+3 this week', trend: 'up' },
  { label: 'Provider sources', value: '03', delta: 'all responsive', trend: 'neutral' },
  { label: 'Changes detected', value: '04', delta: 'last 24 hours', trend: 'up' },
  { label: 'Collector uptime', value: '99.8%', delta: '+0.6%', trend: 'up' },
]

export const models: ModelRecord[] = [
  {
    id: 'm1',
    provider: 'OpenAI',
    model: 'GPT family',
    modality: 'Text · Vision',
    inputPrice: '$2.50',
    outputPrice: '$10.00',
    context: '200K',
    availability: 'Live',
    change: 'Price ↓ 16%',
  },
  {
    id: 'm2',
    provider: 'Anthropic',
    model: 'Claude family',
    modality: 'Text · Vision',
    inputPrice: '$3.00',
    outputPrice: '$15.00',
    context: '200K',
    availability: 'Live',
    change: 'Context ↑',
  },
  {
    id: 'm3',
    provider: 'Google',
    model: 'Gemini family',
    modality: 'Text · Vision',
    inputPrice: '$1.25',
    outputPrice: '$5.00',
    context: '1M',
    availability: 'Preview',
    change: 'New tier',
  },
]

export const changeEvents: ChangeEvent[] = [
  {
    id: 'c1',
    provider: 'OpenAI',
    model: 'GPT family',
    type: 'price',
    title: 'Input pricing moved',
    detail: '$3.00 → $2.50 per 1M tokens',
    time: '09:42',
  },
  {
    id: 'c2',
    provider: 'Anthropic',
    model: 'Claude family',
    type: 'context',
    title: 'Context limit changed',
    detail: 'Long-context tier detected',
    time: '08:17',
  },
  {
    id: 'c3',
    provider: 'Google',
    model: 'Gemini family',
    type: 'new',
    title: 'New model tier discovered',
    detail: 'Preview availability surfaced',
    time: 'Yesterday',
  },
]

export const collectors: Collector[] = [
  {
    id: 'c_bd_openai',
    provider: 'OpenAI',
    domain: 'provider pricing page',
    health: 'healthy',
    successRate: '100%',
    latency: '1.8s',
    records: 7,
    lastRun: '38s ago',
  },
  {
    id: 'c_bd_anthropic',
    provider: 'Anthropic',
    domain: 'provider model page',
    health: 'healthy',
    successRate: '99.4%',
    latency: '2.1s',
    records: 5,
    lastRun: '1m ago',
  },
  {
    id: 'c_bd_google',
    provider: 'Google',
    domain: 'provider docs page',
    health: 'healed',
    successRate: '100%',
    latency: '2.4s',
    records: 5,
    lastRun: '2m ago',
  },
]

export const signalPoints = [38, 44, 40, 55, 48, 62, 57, 73, 66, 80, 77, 86]
