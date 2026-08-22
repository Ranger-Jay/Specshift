import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Braces, CircleDot, Database, Gauge, Link2, X } from 'lucide-react'
import type { ModelRecord } from '../types'

interface ModelDrawerProps {
  model: ModelRecord | null
  onClose: () => void
}

export function ModelDrawer({ model, onClose }: ModelDrawerProps) {
  return (
    <AnimatePresence>
      {model && (
        <>
          <motion.button
            className="drawer-backdrop"
            aria-label="Close model detail"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="model-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${model.model} intelligence detail`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          >
            <div className="drawer-topline">
              <span className="drawer-kicker"><CircleDot size={12} /> normalized intelligence</span>
              <button type="button" onClick={onClose} aria-label="Close model detail"><X size={17} /></button>
            </div>

            <div className="drawer-identity">
              <span className="drawer-monogram">{model.provider.slice(0, 2).toUpperCase()}</span>
              <div><span>{model.provider}</span><h2>{model.model}</h2></div>
            </div>

            <div className="drawer-status-row">
              <span className={`availability availability-${model.availability.toLowerCase()}`}>{model.availability}</span>
              <span className="drawer-signal">{model.change}</span>
            </div>

            <div className="drawer-grid">
              <div><span><Database size={13} /> Input / 1M</span><strong>{model.inputPrice}</strong></div>
              <div><span><ArrowUpRight size={13} /> Output / 1M</span><strong>{model.outputPrice}</strong></div>
              <div><span><Gauge size={13} /> Context</span><strong>{model.context}</strong></div>
              <div><span><Braces size={13} /> Modalities</span><strong className="drawer-small-value">{model.modality}</strong></div>
            </div>

            <section className="drawer-section">
              <span className="drawer-section-label">Why this record is safer</span>
              <p>SpecShift promotes a scraped candidate only after normalization and schema/completeness validation. Drifted output remains quarantined while the last-known-good baseline stays active.</p>
            </section>

            <section className="drawer-section">
              <span className="drawer-section-label">Source provenance</span>
              {model.sourceUrl ? (
                <a className="drawer-source" href={model.sourceUrl} target="_blank" rel="noreferrer">
                  <Link2 size={14} />
                  <span>{model.sourceUrl}</span>
                  <ArrowUpRight size={14} />
                </a>
              ) : <span className="drawer-source-muted">No source URL supplied by this record.</span>}
            </section>

            <div className="drawer-contract">
              <span className="drawer-section-label">Normalized contract</span>
              <code>{`{
  "provider": "${model.provider}",
  "model": "${model.model}",
  "inputPerMillion": "${model.inputPrice}",
  "outputPerMillion": "${model.outputPrice}",
  "context": "${model.context}",
  "availability": "${model.availability}"
}`}</code>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
