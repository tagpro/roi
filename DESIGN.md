# ROI Analyzer — Design

A client-side TypeScript webapp that ingests investment transaction CSV exports and reports
return on investment with a plain-English explanation of how the investment performed.

## Goals

- 100% client-side: the CSV never leaves the browser. No backend, no upload.
- Provider tabs: each supported input format gets its own tab. **Spaceship** is the first
  provider; the architecture must make adding others (e.g. banks, other brokers) a matter of
  writing one new parser module.
- Explain, don't just report: alongside the metrics, generate a narrative describing *why* the
  numbers look the way they do.

## Stack

- Vite + React + TypeScript (strict), no server.
- CSV parsing: PapaParse.
- Charts: lightweight (Recharts or hand-rolled SVG). Follow the dataviz skill guidance.
- No state library needed — component state is enough.

## Architecture

```
src/
  types.ts               // Normalized domain model
  providers/
    index.ts             // Provider registry (id, label, parse)
    spaceship.ts         // Spaceship CSV parser -> Transaction[]
  logic/
    metrics.ts           // Pure functions: aggregate, ROI, XIRR
    narrative.ts         // Pure function: metrics -> explanation sentences
  components/
    App.tsx              // Tab bar (one tab per provider)
    ProviderTab.tsx      // Dropzone/file input + results
    SummaryTiles.tsx     // Stat tiles
    Charts.tsx           // Unit price + cumulative invested vs value
    TransactionsTable.tsx
```

### Normalized domain model

```ts
interface Transaction {
  transactionDate: string;   // ISO yyyy-mm-dd
  effectiveDate: string;     // ISO yyyy-mm-dd — use this for time-based math
  type: string;              // e.g. "Investment plan (weekly)"
  status: string;            // e.g. "Paid"
  amount: number;            // AUD, positive as given in file
  units: number;             // units in the transaction
  unitPrice: number;         // price per unit at the transaction
  direction: 'in' | 'out';   // derived from Unit Change Type
  portfolio: string;         // e.g. "Spaceship Universe Portfolio"
}

interface ProviderAdapter {
  id: string;                // 'spaceship'
  label: string;             // 'Spaceship'
  sampleHint: string;        // shown in the empty state, e.g. expected header row
  parse(csvText: string): ParseResult; // transactions + row-level warnings
}
```

### Spaceship parser (`providers/spaceship.ts`)

Input columns (exact header):
`Transaction Date,Transaction Type,Status,Amount,Units,Unit Price,Unit Change Type,Effective Date,Portfolio`

- Validate the header; if required columns are missing, fail with a friendly message naming
  the missing columns (this is how the app tells you a file belongs to a different provider).
- `Unit Change Type`: "Units issued" → `direction: 'in'`; anything containing
  "redeem"/"cancel" → `direction: 'out'` (defensive — this file only has buys, but real
  exports can contain withdrawals).
- Skip blank lines. Collect (not throw) warnings for unparseable rows.

## Business logic (`logic/metrics.ts`) — all pure functions

Compute per **portfolio** (a file can contain more than one), plus an overall roll-up.

Only rows with `status === 'Paid'` participate in the math; other rows are surfaced as
excluded in the UI.

Let `in` = transactions with direction 'in', `out` = direction 'out':

| Metric | Definition |
|---|---|
| `totalInvested` | Σ amount over `in` |
| `totalWithdrawn` | Σ amount over `out` |
| `unitsHeld` | Σ units over `in` − Σ units over `out` |
| `latestUnitPrice` | unitPrice of the row with the max `effectiveDate` |
| `estimatedValue` | `unitsHeld × latestUnitPrice` |
| `netGain` | `estimatedValue + totalWithdrawn − totalInvested` |
| `simpleROI` | `netGain / totalInvested` |
| `avgCostPerUnit` | `(totalInvested − totalWithdrawn) / unitsHeld` |
| `unitPriceChange` | latest price / earliest price − 1 (period price move) |
| `xirr` | money-weighted annualised return, below |

### XIRR

Cash flows: each `in` row is `−amount` at its `effectiveDate`; each `out` row is `+amount`;
terminal flow `+estimatedValue` at the latest `effectiveDate`.

`NPV(r) = Σ cf_i / (1+r)^(days_i/365)` with days measured from the earliest flow.
Solve `NPV(r) = 0` by bisection on `r ∈ (−0.99, 10)`, ~200 iterations (monotone in that
range; no Newton needed). Return `null` if the period is < 30 days or flows don't bracket a
root — the UI then hides the annualised figure rather than showing garbage.

### Validation fixture (synthetic)

Unit tests run against a fully synthetic weekly-DCA fixture (`src/fixtures/spaceshipFixture.ts`)
with a made-up price curve that dips mid-year and ends below its start, so the interesting
"unit price fell but dollar-cost averaging kept the return positive" narrative branch is
exercised. Tests must reproduce that fixture's exact metrics (documented in the fixture file):
52 transactions, invested 1500.00, units ≈ 651.111047, latest price 2.44 →
value ≈ 1588.71, net gain ≈ +88.71, ROI ≈ +5.91%, XIRR ≈ +12.35%, price change ≈ −2.40%.

Never commit real exports or rows copied from them.

## Narrative (`logic/narrative.ts`)

Generate 3–5 sentences from the metrics, e.g.:

- Headline: "You invested $X across N deposits and it's now worth ~$Y — a gain/loss of $Z
  (±P%)." Tone follows the sign (gain / loss / roughly flat, |ROI| < 0.5%).
- Annualised: "That's about ±Q% per year, money-weighted (XIRR), accounting for when each
  dollar was invested."
- Price vs DCA insight: compare `unitPriceChange` with `simpleROI`. If price fell but ROI ≥ 0:
  "The unit price actually fell P% over the period, but dollar-cost averaging — buying more
  units when prices were lower — kept your overall return positive." Cover the other three
  sign combinations analogously.
- Cost basis: "Your average cost per unit is $A vs the latest price of $B."
- Always show the caveat: "Current value is estimated from the most recent transaction's unit
  price in the file — not a live valuation."

## UI

- **Tab bar** across the top, one tab per registered provider. Spaceship is the only tab for
  now; the registry renders tabs, so new providers appear automatically.
- Per tab: empty state with a drag-and-drop zone + file picker (`.csv`) and a short "export
  this from Spaceship" hint. On parse:
  - **Summary tiles**: Invested, Est. value, Net gain ($ and %), XIRR, Units held,
    Avg cost/unit vs latest price.
  - **Narrative** panel (the explanation above).
  - **Charts**: (1) unit price over time (line), (2) cumulative invested vs estimated
    portfolio value over time (two lines — value series = running units × that row's unit
    price). X axis = effectiveDate.
  - **Transactions table**: sortable by date, shows all parsed rows incl. excluded/warned
    ones with a badge.
- Multiple portfolios in one file → a section per portfolio plus a combined summary.
- Errors (wrong file, missing columns, empty file) render as a friendly inline message, never
  a blank screen.
- Responsive; numbers formatted with `Intl.NumberFormat` (AUD currency for money, 2dp;
  percentages 2dp; units 4dp).

## Testing

- Vitest unit tests for `metrics.ts` (against the validation fixture), `narrative.ts`
  (all sign branches), and the Spaceship parser (happy path, missing column, bad row,
  redemption row, multi-portfolio).
- `npm run build` and `npm test` must pass.
