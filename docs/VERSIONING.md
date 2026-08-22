# SpecShift Versioning Discipline

SpecShift uses a deliberate pre-1.0 milestone sequence modeled after the development discipline used on Orocue.

## Milestone numbers

Human-facing milestones use `v0.NNN`:

- `v0.001` — foundation and premium React dashboard
- `v0.002` — normalized intelligence validation and snapshot diff pipeline
- `v0.003` — live Bright Data server adapter and first real collector
- later milestones increment by one testable capability slice

While a milestone is still on a feature branch, `VERSION` uses the `-dev` suffix, for example `v0.002-dev`. The suffix is removed only when the milestone is release-ready.

Because npm requires SemVer-compatible numeric identifiers, `package.json` maps the milestone sequence as follows:

- `v0.001` → `0.1.0`
- `v0.002` → `0.2.0`
- `v0.003` → `0.3.0`

## Branch discipline

Use narrowly scoped branches:

- `feat/<scope>` for product capabilities
- `fix/<scope>` for bug fixes
- `test/<scope>` for isolated test work when needed
- `docs/<scope>` for documentation-only work when needed

Do not combine unrelated features in one branch merely to reduce pull-request count.

## Commit discipline

Each commit must represent one coherent change category.

- `feat:` one main feature or capability
- `test:` one test series or verification expansion
- `fix:` one bug fix or tightly related bug-fix set
- `docs:` one documentation update
- `ci:` CI/build infrastructure only
- `chore:` repository/tooling maintenance only

Do not mix feature code, unrelated fixes, tests, and documentation in a single grab-bag commit.

## Release gate

A milestone is considered release-ready only when:

1. The feature has a clear, testable boundary.
2. Unit tests for the changed domain logic pass.
3. TypeScript compilation and the production build pass.
4. No API keys, Bright Data tokens, or secrets are committed.
5. User-visible prototype/simulated data is labeled honestly until replaced by real collector output.
6. Relevant README/architecture/reproduction documentation is current.
7. The milestone version is changed from `v0.NNN-dev` to `v0.NNN` in a dedicated release/version commit.

## History rules

- Do not force-push `main`.
- Preserve meaningful commit history for hackathon judging.
- Prefer reviewable commits over a single AI-generated code dump.
- Fix discovered defects in dedicated `fix:` commits whenever practical rather than silently folding them into unrelated later work.
