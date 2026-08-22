# Changelog

All notable SpecShift milestones are documented here.

## v0.004-dev — 2026-08-22

### Added
- Live provider orchestration hook for Bright Data collector discovery, trigger, polling, and result states.
- Per-provider provenance states: setup, idle, queued, running, ready, drift, cached, and error.
- Last-known-good snapshot persistence so invalid candidate output cannot overwrite trusted intelligence.
- Real snapshot diff integration for pricing, context, availability, model additions, and removals.
- Scan-history signal visualization backed by actual validated change counts after live scans.
- Explicit Live / Mixed / Live-ready / Demo data labeling across the dashboard.
- Runtime collector provenance including stable non-secret Collector IDs when available.
- Clearly labeled demo records for environments where live credentials are not configured.
- Architecture documentation for validation, baseline promotion, drift quarantine, and healing.

### Changed
- The premium dashboard now derives metrics, model rows, collector health, and change events from the normalized intelligence pipeline instead of fixed UI mock records.
- The resilience panel is explicitly presented as a controlled UI replay; actual healing evidence is performed with the Bright Data CLI.

### Tests
- Added presentation-contract coverage for pricing, context formatting, source provenance, metrics, and change events.
- Added scan-history signal normalization tests.

### Status
- In development on `feat/live-intelligence-ui` until the exact release commit passes CI.

## v0.003 — 2026-08-22

### Added
- Server-side Bright Data provider registry for OpenAI, Anthropic, and Google Gemini.
- Hardened Bright Data Collection API client with retry/backoff for transient failures.
- Asynchronous collector trigger and dataset-result API endpoints for Vercel.
- Tolerant normalization from custom scraper rows into the canonical intelligence schema.
- Provider configuration/status endpoint without exposing API tokens.
- Dedicated server TypeScript verification and Vercel runtime configuration.
- Fault-injection tests for authentication, transient failures, malformed responses, and row normalization.
- Reproducible CLI runbook for custom scraper creation, execution, self-healing, approval, and rerun evidence.

### Fixed
- Corrected a test-only TypeScript assertion discovered by the expanded server verification gate.

### Release verification
- 15 unit tests passed.
- React production build passed.
- Server/API strict TypeScript verification passed on the pre-release gate.
- Real `c_*` Collector IDs and Bright Data account authorization remain external runtime configuration and are never committed.

## v0.002 — 2026-08-22

### Added
- Canonical normalized AI model intelligence domain contract.
- Snapshot completeness and schema validation.
- Schema-drift detection boundary.
- Deterministic change detection for pricing, context limits, availability, model additions, and removals.
- Browser-safe collector gateway contract that keeps Bright Data credentials server-side.
- Unit tests for validation and snapshot diffing.
- CI verification for unit tests and production builds.

### Release verification
- Pull-request CI passed the unit-test suite and production TypeScript/Vite build before release.
- Live Bright Data collector wiring remained intentionally scoped to v0.003.

## v0.001 — 2026-08-22

### Added
- React 19 + TypeScript + Vite application foundation.
- Premium dark intelligence-dashboard visual system.
- Responsive navigation and data presentation.
- Animated radar identity and change-signal visualization.
- Interactive, clearly labeled drift/self-heal UI simulation.
- Model intelligence table, change stream, and collector-health presentation.
- Initial CI build verification.
