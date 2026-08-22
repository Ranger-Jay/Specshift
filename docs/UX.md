# SpecShift UX & Accessibility Contract

## Interaction goals

The dashboard is designed to feel like a premium developer-intelligence product rather than a hackathon admin panel. Visual polish must not come at the cost of provenance, keyboard access, or truthful data state.

## Global command palette

Open with:

- macOS: `⌘ K`
- Windows/Linux: `Ctrl K`

Within model results:

- `↑` / `↓` moves the active result.
- `Enter` opens the active model detail.
- `Esc` closes the palette.

The palette also exposes direct actions for a live scan, collector provenance, and validated change review.

## Model exploration

The model table supports:

- provider filters;
- mouse selection;
- keyboard focus with `Enter` or `Space` to open detail;
- a right-side model intelligence drawer;
- direct public source links;
- human-readable normalized pricing/context fields;
- an example of the normalized record contract.

## Export

`Export JSON` creates a client-side intelligence package containing:

- current provenance mode;
- model rows;
- validated change events;
- collector provenance;
- generation timestamp and summary counts.

Demo-mode exports explicitly say they contain demo/preview data.

## Motion

Animations communicate scanning, state transition, and spatial hierarchy. Users with `prefers-reduced-motion: reduce` receive effectively static transitions and animations.

## Focus and keyboard visibility

All interactive controls use visible `:focus-visible` treatment. Model rows, dialogs, command controls, filter chips, source links, and close actions can be reached without relying on pointer hover.

## Responsive behavior

The experience is designed for desktop judging while remaining usable on tablet/mobile widths:

- sidebar collapses behind the mobile navigation control;
- command palette becomes nearly full-screen on small devices;
- model drawer uses full width on narrow screens;
- filters and export actions wrap rather than overflow;
- provenance actions stack when horizontal space is constrained.

## Data-state honesty

Visual hierarchy never overrides provenance semantics. The UI always distinguishes live Bright Data output from cached baseline and demo preview data. A simulated resilience replay is labeled as such; it is not represented as a real Bright Data heal operation.
