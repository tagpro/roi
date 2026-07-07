import type { PortfolioMetrics } from '../logic/metrics';
import {
  formatCurrency,
  formatPrice,
  formatSignedCurrency,
  formatSignedPercent,
  formatUnits,
} from '../format';

type Tone = 'neutral' | 'good' | 'bad';

function Tile({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className={`tile-value tile-${tone}`}>{value}</div>
      {sub && <div className="tile-sub">{sub}</div>}
    </div>
  );
}

export function SummaryTiles({ m }: { m: PortfolioMetrics }) {
  const gainTone: Tone = m.netGain > 0 ? 'good' : m.netGain < 0 ? 'bad' : 'neutral';

  return (
    <div className="tiles">
      <Tile
        label="Invested"
        value={formatCurrency(m.totalInvested)}
        sub={
          m.totalWithdrawn > 0
            ? `${m.depositCount} deposits · ${formatCurrency(m.totalWithdrawn)} withdrawn`
            : `${m.depositCount} deposits`
        }
      />
      <Tile
        label="Estimated value"
        value={formatCurrency(m.estimatedValue)}
        sub={
          m.totalDistributions > 0
            ? `incl. ${formatCurrency(m.totalDistributions)} distributions reinvested`
            : undefined
        }
      />
      <Tile
        label="Net gain"
        value={formatSignedCurrency(m.netGain)}
        sub={m.simpleROI !== null ? `${formatSignedPercent(m.simpleROI)} simple ROI` : undefined}
        tone={gainTone}
      />
      <Tile
        label="Annualised (XIRR)"
        value={m.xirr !== null ? formatSignedPercent(m.xirr) : '—'}
        sub={m.xirr !== null ? 'money-weighted / yr' : 'period too short'}
        tone={m.xirr === null ? 'neutral' : m.xirr > 0 ? 'good' : m.xirr < 0 ? 'bad' : 'neutral'}
      />
      <Tile label="Units held" value={formatUnits(m.unitsHeld)} />
      <Tile
        label="Avg cost / unit"
        value={m.avgCostPerUnit !== null ? formatPrice(m.avgCostPerUnit) : '—'}
        sub={m.latestUnitPrice !== null ? `latest ${formatPrice(m.latestUnitPrice)}` : undefined}
      />
    </div>
  );
}
