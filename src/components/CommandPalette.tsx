import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Database, Radar, Search, ShieldCheck, X } from 'lucide-react'
import type { ModelRecord } from '../types'

interface CommandPaletteProps {
  open: boolean
  models: ModelRecord[]
  canScan: boolean
  isRefreshing: boolean
  onClose: () => void
  onScan: () => void
  onSelectModel: (model: ModelRecord) => void
}

export function CommandPalette({
  open,
  models,
  canScan,
  isRefreshing,
  onClose,
  onScan,
  onSelectModel,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return models.slice(0, 7)
    return models
      .filter((model) => [model.provider, model.model, model.modality, model.availability].join(' ').toLowerCase().includes(needle))
      .slice(0, 8)
  }, [models, query])

  const jump = (hash: string) => {
    window.location.hash = hash
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="command-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.section
            className="command-panel"
            role="dialog"
            aria-modal="true"
            aria-label="SpecShift command palette"
            initial={{ opacity: 0, y: -18, scale: .985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: .99 }}
            transition={{ duration: .2, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="command-search">
              <Search size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search models, providers, capabilities…"
                aria-label="Search SpecShift intelligence"
              />
              <button type="button" onClick={onClose} aria-label="Close command palette"><X size={15} /></button>
            </div>

            {!query && (
              <div className="command-actions">
                <span className="command-label">Actions</span>
                <button
                  type="button"
                  disabled={!canScan || isRefreshing}
                  onClick={() => {
                    onScan()
                    onClose()
                  }}
                >
                  <span className="command-icon command-icon-cyan"><Radar size={15} /></span>
                  <span><strong>{isRefreshing ? 'Scan in progress' : 'Scan live sources'}</strong><small>Trigger every configured Bright Data collector</small></span>
                  <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => jump('collectors')}>
                  <span className="command-icon command-icon-violet"><Database size={15} /></span>
                  <span><strong>Inspect collector provenance</strong><small>Collector IDs, source domains, health and baseline age</small></span>
                  <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => jump('changes')}>
                  <span className="command-icon command-icon-green"><ShieldCheck size={15} /></span>
                  <span><strong>Review validated deltas</strong><small>Changes emitted only after candidate validation</small></span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <div className="command-results">
              <div className="command-results-head"><span className="command-label">{query ? 'Matches' : 'Models'}</span><small>{results.length} shown</small></div>
              {results.length === 0 ? (
                <div className="command-empty"><Search size={16} /><span>No intelligence matches “{query}”.</span></div>
              ) : results.map((model) => (
                <button
                  className="command-model"
                  type="button"
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model)
                    onClose()
                  }}
                >
                  <span className="provider-monogram command-monogram">{model.provider.slice(0, 2).toUpperCase()}</span>
                  <span><strong>{model.model}</strong><small>{model.provider} · {model.modality}</small></span>
                  <span className={`availability availability-${model.availability.toLowerCase()}`}>{model.availability}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>

            <footer className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> browse</span><span><kbd>esc</kbd> close</span><span><kbd>⌘</kbd><kbd>K</kbd> toggle</span></footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
