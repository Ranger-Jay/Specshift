import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  Command,
  Database,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Menu,
  Orbit,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useIntelligence } from './hooks/useIntelligence'
import type { CollectorHealth, Metric } from './types'
import './styles.css'

type DemoState = 'healthy' | 'drift' | 'healed'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Models', icon: Orbit },
  { label: 'Changes', icon: GitBranch },
  { label: 'Collectors', icon: Radar },
]

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="brand-orbit brand-orbit-a" />
      <span className="brand-orbit brand-orbit-b" />
      <span className="brand-core" />
    </div>
  )
}

function HealthPill({ health }: { health: CollectorHealth }) {
  const labels: Record<CollectorHealth, string> = {
    healthy: 'Healthy',
    healed: 'Self-healed',
    drift: 'Drift detected',
    running: 'Collecting',
    error: 'Error',
    setup: 'Setup needed',
  }
  return (
    <span className={`health-pill health-${health}`}>
      <span className="health-dot" />
      {labels[health]}
    </span>
  )
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  return (
    <motion.article
      className="metric-card glass-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.5 }}
    >
      <div className="metric-header">
        <span>{metric.label}</span>
        <span className="metric-index">0{index + 1}</span>
      </div>
      <div className="metric-body">
        <strong>{metric.value}</strong>
        <span className={`metric-delta trend-${metric.trend}`}>
          {metric.trend === 'up' && <ArrowUpRight size={13} />}
          {metric.trend === 'down' && <ArrowDownRight size={13} />}
          {metric.delta}
        </span>
      </div>
      <div className="metric-scan" />
    </motion.article>
  )
}

function SignalGraph({ points }: { points: number[] }) {
  const geometry = useMemo(() => {
    const width = 620
    const height = 180
    const max = 100
    const safePoints = points.length > 1 ? points : [0, 0]
    const step = width / (safePoints.length - 1)
    const coords = safePoints.map((value, index) => ({
      x: index * step,
      y: height - (Math.max(0, Math.min(value, max)) / max) * height,
    }))
    const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    const area = `${path} L ${width} ${height} L 0 ${height} Z`
    return { path, area, coords }
  }, [points])

  return (
    <div className="signal-graph-wrap">
      <svg className="signal-graph" viewBox="0 0 620 180" role="img" aria-label="Change signal activity across recent scans">
        <defs>
          <linearGradient id="signalStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#63e7ff" />
            <stop offset="55%" stopColor="#8b7bff" />
            <stop offset="100%" stopColor="#d669ff" />
          </linearGradient>
          <linearGradient id="signalArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c83ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7c83ff" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[36, 72, 108, 144].map((y) => (
          <line key={y} x1="0" y1={y} x2="620" y2={y} className="graph-grid" />
        ))}
        <motion.path
          d={geometry.area}
          fill="url(#signalArea)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />
        <motion.path
          d={geometry.path}
          fill="none"
          stroke="url(#signalStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        {geometry.coords.slice(-4).map((point, index, visible) => (
          <motion.circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={index === visible.length - 1 ? 5 : 3}
            className={index === visible.length - 1 ? 'graph-point graph-point-active' : 'graph-point'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.08 }}
          />
        ))}
      </svg>
      <div className="graph-axis">
        <span>Older</span><span>Scan −3</span><span>Scan −2</span><span>Scan −1</span><span>Latest</span>
      </div>
    </div>
  )
}

function CollectorFlow({ demoState }: { demoState: DemoState }) {
  const steps = [
    { label: 'Fetch', icon: Database },
    { label: 'Validate', icon: ShieldCheck },
    { label: 'Diff', icon: GitBranch },
    { label: 'Signal', icon: Zap },
  ]
  return (
    <div className={`collector-flow collector-flow-${demoState}`}>
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <div className="flow-step" key={step.label}>
            <div className="flow-node"><Icon size={15} /></div>
            <span>{step.label}</span>
            {index < steps.length - 1 && <div className="flow-line"><i /></div>}
          </div>
        )
      })}
    </div>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [demoState, setDemoState] = useState<DemoState>('healthy')
  const intelligence = useIntelligence()

  const demoCopy = {
    healthy: {
      eyebrow: 'Controlled resilience replay',
      title: 'Collector output nominal',
      detail: 'Replay a controlled schema failure to see how SpecShift quarantines drift before stale data replaces a known-good baseline.',
      button: 'Simulate schema drift',
      icon: Activity,
    },
    drift: {
      eyebrow: 'Controlled schema failure',
      title: 'Drift quarantined',
      detail: 'Required pricing fields failed validation. The prior validated snapshot remains active while the collector is repaired.',
      button: 'Preview healed state',
      icon: RefreshCw,
    },
    healed: {
      eyebrow: 'Recovery replay',
      title: 'Stable collector restored',
      detail: 'The repaired collector returns valid structured output while preserving its stable Collector ID and downstream integration.',
      button: 'Reset replay',
      icon: Check,
    },
  }[demoState]

  const DemoIcon = demoCopy.icon
  const ModeIcon = intelligence.mode === 'live'
    ? ShieldCheck
    : intelligence.mode === 'mixed'
      ? Gauge
      : intelligence.mode === 'demo'
        ? Sparkles
        : intelligence.mode === 'checking'
          ? RefreshCw
          : Database

  const signalIndex = intelligence.signalPoints.at(-1) ?? 0
  const canScan = intelligence.configuredCount > 0 && intelligence.tokenConfigured
  const scanLabel = intelligence.isRefreshing
    ? 'Scanning live sources…'
    : canScan
      ? 'Scan live sources'
      : 'Preview resilience'

  const advanceDemo = () => {
    setDemoState((current) => {
      if (current === 'healthy') return 'drift'
      if (current === 'drift') return 'healed'
      return 'healthy'
    })
  }

  const primaryAction = () => {
    if (canScan) {
      void intelligence.refreshAll()
    } else {
      advanceDemo()
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="noise-layer" />

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <a className="brand" href="#top" aria-label="SpecShift home">
            <BrandMark />
            <span>Spec<span className="brand-accent">Shift</span></span>
          </a>
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-kicker">Intelligence</span>
          {navItems.map((item, index) => {
            const Icon = item.icon
            return (
              <a key={item.label} className={`nav-item ${index === 0 ? 'nav-item-active' : ''}`} href={`#${item.label.toLowerCase()}`}>
                <Icon size={17} />
                <span>{item.label}</span>
                {index === 0 && <span className="nav-active-mark" />}
              </a>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className={`system-card system-${intelligence.mode}`}>
          <div className="system-card-icon"><Bot size={17} /></div>
          <div>
            <span>Bright Data bridge</span>
            <strong>{intelligence.configuredCount}/3 collectors configured</strong>
          </div>
          <span className="system-pulse" />
        </div>

        <div className="sidebar-footer">
          <div className="avatar">SS</div>
          <div className="account-copy">
            <strong>SpecShift</strong>
            <span>Self-healing intelligence</span>
          </div>
          <Command size={15} />
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            className="sidebar-backdrop mobile-only"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <main className="main-content" id="top">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span>Intelligence</span>
            <ChevronRight size={13} />
            <strong>Overview</strong>
          </div>
          <div className="topbar-actions">
            <button className="search-button" type="button"><Search size={15} /><span>Search intelligence</span><kbd>⌘ K</kbd></button>
            <span className={`prototype-badge mode-badge mode-${intelligence.mode}`}>
              <ModeIcon size={12} className={intelligence.mode === 'checking' ? 'spin-icon' : undefined} />
              {intelligence.modeLabel}
            </span>
          </div>
        </header>

        <motion.div className="content-wrap" {...pageTransition}>
          <section className="hero" id="overview">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> AI model intelligence layer</div>
              <h1>Know what changed.<br /><span>Before your stack does.</span></h1>
              <p>SpecShift turns fragile provider pages into resilient, normalized intelligence—then validates every extraction before pricing, capability, or availability changes reach downstream developers.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={primaryAction} disabled={intelligence.isRefreshing}>
                  <Radar size={16} className={intelligence.isRefreshing ? 'spin-icon' : undefined} />
                  {scanLabel}
                </button>
                <a className="text-link" href="#collectors">Inspect provenance <ChevronRight size={14} /></a>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="radar-stage">
                <span className="radar-ring ring-1" />
                <span className="radar-ring ring-2" />
                <span className="radar-ring ring-3" />
                <span className="radar-cross radar-cross-x" />
                <span className="radar-cross radar-cross-y" />
                <span className="radar-sweep" />
                <div className="radar-core"><BrandMark /></div>
                <span className="radar-node node-a"><i />OPENAI</span>
                <span className="radar-node node-b"><i />ANTHROPIC</span>
                <span className="radar-node node-c"><i />GOOGLE</span>
                <span className="radar-caption">3 sources · {intelligence.models.length} normalized models</span>
              </div>
            </div>
          </section>

          <div className={`provenance-strip provenance-${intelligence.mode}`} role="status">
            <ModeIcon size={15} className={intelligence.mode === 'checking' ? 'spin-icon' : undefined} />
            <span><strong>{intelligence.modeLabel}</strong>{intelligence.runtimeMessage}</span>
            {canScan && !intelligence.isRefreshing && <button type="button" onClick={() => void intelligence.refreshAll()}>Run scan</button>}
          </div>

          <section className="metrics-grid" aria-label="Key intelligence metrics">
            {intelligence.metrics.map((metric, index) => <MetricCard metric={metric} index={index} key={metric.label} />)}
          </section>

          <section className="dashboard-grid">
            <article className="glass-card intelligence-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Scan history</span>
                  <h2>Change signal</h2>
                </div>
                <div className="live-chip"><CircleDot size={13} /> {intelligence.mode === 'demo' ? 'preview' : 'validated'}</div>
              </div>
              <div className="signal-summary">
                <div><strong>{signalIndex}</strong><span>signal index</span></div>
                <span className="summary-delta"><ArrowUpRight size={14} /> {intelligence.changes.length} latest deltas</span>
              </div>
              <SignalGraph points={intelligence.signalPoints} />
              <div className="provider-legend">
                <span><i className="legend-cyan" /> Pricing</span>
                <span><i className="legend-violet" /> Context</span>
                <span><i className="legend-magenta" /> Availability</span>
              </div>
            </article>

            <article className={`glass-card resilience-card resilience-${demoState}`}>
              <div className="card-heading">
                <div>
                  <span className="section-kicker">{demoCopy.eyebrow}</span>
                  <h2>{demoCopy.title}</h2>
                </div>
                <div className="resilience-icon"><DemoIcon size={18} /></div>
              </div>
              <p>{demoCopy.detail}</p>
              <CollectorFlow demoState={demoState} />
              <div className="terminal-mini">
                <div className="terminal-bar"><span /><span /><span /><strong>recovery.log</strong></div>
                <AnimatePresence mode="wait">
                  <motion.div
                    className="terminal-lines"
                    key={demoState}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {demoState === 'healthy' && <><span><i>✓</i> schema.valid</span><span><i>✓</i> baseline.promoted</span><span><i>✓</i> downstream.safe</span></>}
                    {demoState === 'drift' && <><span className="terminal-error"><i>!</i> price.input → null</span><span className="terminal-error"><i>!</i> candidate.quarantined</span><span><i>→</i> baseline.preserved</span></>}
                    {demoState === 'healed' && <><span><i>✓</i> repair.approved</span><span><i>✓</i> collector.id preserved</span><span><i>✓</i> candidate.promoted</span></>}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button className="demo-button" type="button" onClick={advanceDemo}><DemoIcon size={15} /> {demoCopy.button}</button>
              <span className="demo-disclaimer">Controlled UI replay · actual heal evidence uses Bright Data CLI with the same c_* Collector ID</span>
            </article>
          </section>

          <section className="lower-grid" id="changes">
            <article className="glass-card change-feed">
              <div className="card-heading">
                <div><span className="section-kicker">{intelligence.mode === 'demo' ? 'Example deltas' : 'Validated deltas'}</span><h2>Change stream</h2></div>
                <span className="collector-count">{String(intelligence.changes.length).padStart(2, '0')}</span>
              </div>
              <div className="change-list">
                {intelligence.changes.length === 0 ? (
                  <div className="empty-state"><ShieldCheck size={18} /><div><strong>No changes since baseline</strong><span>Run another validated scan after provider data changes to populate this stream.</span></div></div>
                ) : intelligence.changes.map((event) => (
                  <div className="change-row" key={event.id}>
                    <div className={`change-icon change-${event.type}`}><Activity size={15} /></div>
                    <div className="change-copy">
                      <div><strong>{event.title}</strong><span>{event.time}</span></div>
                      <p><b>{event.provider}</b> · {event.model}</p>
                      <small>{event.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-card collector-card" id="collectors">
              <div className="card-heading">
                <div><span className="section-kicker">Bright Data extraction layer</span><h2>Collector provenance</h2></div>
                <span className="collector-count">03</span>
              </div>
              <div className="collector-list">
                {intelligence.collectors.map((collector) => (
                  <div className="collector-row" key={`${collector.provider}-${collector.id}`}>
                    <div className="provider-monogram">{collector.provider.slice(0, 2).toUpperCase()}</div>
                    <div className="collector-copy">
                      <strong>{collector.provider}</strong>
                      <span>{collector.domain}</span>
                      <code className="collector-id">{collector.id}</code>
                    </div>
                    <div className="collector-stats"><span>{collector.records} rec</span><span>{collector.lastRun}</span></div>
                    <HealthPill health={collector.health} />
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="glass-card models-card" id="models">
            <div className="card-heading models-heading">
              <div><span className="section-kicker">Normalized data contract</span><h2>Model intelligence</h2></div>
              <div className="models-actions">
                <span>{intelligence.latestTimestamp ? `Live baseline ${new Date(intelligence.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : intelligence.mode === 'demo' ? 'Demo preview values' : 'Awaiting first live baseline'}</span>
                <button className="ghost-button" type="button" onClick={() => void intelligence.refreshAll()} disabled={!canScan || intelligence.isRefreshing}>
                  <RefreshCw size={13} className={intelligence.isRefreshing ? 'spin-icon' : undefined} /> Refresh
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Provider / model</th><th>Modality</th><th>Input / 1M</th><th>Output / 1M</th><th>Context</th><th>Status</th><th>Latest signal</th></tr></thead>
                <tbody>
                  {intelligence.models.map((model) => (
                    <tr key={model.id}>
                      <td><div className="model-name"><span>{model.provider.slice(0, 1)}</span><div><strong>{model.model}</strong><small>{model.provider}</small></div></div></td>
                      <td>{model.modality}</td>
                      <td className="mono-cell">{model.inputPrice}</td>
                      <td className="mono-cell">{model.outputPrice}</td>
                      <td className="mono-cell">{model.context}</td>
                      <td><span className={`availability availability-${model.availability.toLowerCase()}`}>{model.availability}</span></td>
                      <td><span className="change-tag">{model.change}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="page-footer">
            <span><BrandMark /> SpecShift · self-healing AI model intelligence</span>
            <span><Code2 size={13} /> React · TypeScript · Bright Data Scraper Studio · {intelligence.modeLabel}</span>
          </footer>
        </motion.div>
      </main>
    </div>
  )
}

export default App
