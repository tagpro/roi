# ROI Analyzer

A 100% client-side webapp that ingests investment transaction CSV exports and reports return
on investment with a plain-English explanation of how the investment performed. The CSV never
leaves the browser — there is no backend and no upload.

See [`DESIGN.md`](./DESIGN.md) for the authoritative specification.

## Stack

- Vite + React + TypeScript (strict)
- PapaParse for CSV parsing
- Hand-rolled SVG charts (no chart dependency)
- Vitest for unit tests

## Architecture

```
src/
  types.ts              Normalized domain model
  providers/
    index.ts            Provider registry (one tab per provider)
    spaceship.ts        Spaceship CSV parser -> Transaction[]
  logic/
    metrics.ts          Pure functions: aggregate, ROI, XIRR (bisection)
    narrative.ts        Pure function: metrics -> explanation sentences
  components/           App shell, provider tab, tiles, charts, table
  fixtures/             Synthetic Spaceship-shaped test fixture
```

Adding a new provider (bank, broker, …) is a matter of writing one adapter module that
implements `ProviderAdapter` and appending it to the registry in `src/providers/index.ts`;
the UI renders a tab for it automatically.

## Scripts

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm test         # Vitest unit tests
```

## Notes

- Only `Paid` rows participate in the math; other rows are surfaced as excluded in the UI.
- Current value is estimated from the most recent transaction's unit price in the file — it is
  not a live valuation.
